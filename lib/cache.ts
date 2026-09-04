import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

let redisClient: Redis | null = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      lazyConnect: true,
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('✅ Connected to Redis cache instance');
    }).catch((err) => {
      console.warn('⚠️ Redis connection failed, falling back to in-memory LRU cache:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
    });
    redisClient.on('connect', () => {
      isRedisConnected = true;
    });
  } catch (err) {
    console.warn('⚠️ Could not initialize Redis client, using in-memory cache fallback');
  }
}

/**
 * Get a value from Redis or in-memory cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (err) {
      console.warn(`Redis GET failed for key ${key}, checking in-memory cache fallback`);
    }
  }

  // Fallback to in-memory cache
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Set a value in Redis or in-memory cache with TTL (in seconds, default 300s = 5 mins)
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`Redis SET failed for key ${key}`);
    }
  }

  // Always keep in-memory cache synced
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Limit memoryCache size to prevent memory bloat (max 500 keys)
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

/**
 * Delete a specific key
 */
export async function cacheDel(key: string): Promise<void> {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`Redis DEL failed for key ${key}`);
    }
  }
  memoryCache.delete(key);
}

/**
 * Invalidate all keys matching a prefix (e.g. "products:", "categories:")
 */
export async function cacheInvalidatePattern(prefix: string): Promise<void> {
  if (isRedisConnected && redisClient) {
    try {
      const keys = await redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.warn(`Redis pattern deletion failed for prefix ${prefix}`);
    }
  }

  // Clear from memoryCache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
