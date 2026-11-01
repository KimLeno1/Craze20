import { Product, User, Supplier, Notification, PromoCode, Order, OrderStatus, Bundle, PayForMeRequest, PayForMeStatus, UserStats, UserPreferences, UserHistory, UserPost, SocialComment, SocialInteraction, SocialCycleInfo, Withdrawal, WaitlistEntry } from '../types';
import { toast } from 'sonner';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import { MOCK_PRODUCTS } from '../constants';

const API_BASE = '/api';
const ADMIN_API_BASE = '/api/admins';

// Client-side in-memory cache for ultra-fast navigation and 0ms view transitions
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const clientMemoryCache = new Map<string, ClientCacheEntry<any>>();

export function getClientCached<T>(key: string): T | null {
  const item = clientMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > item.ttl) {
    clientMemoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setClientCached<T>(key: string, data: T, ttlMs: number = 30000): void {
  clientMemoryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function invalidateClientCache(prefix?: string): void {
  if (!prefix) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of clientMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      clientMemoryCache.delete(key);
    }
  }
}

const handleResponse = async (response: Response) => {
  const isAuthCheck = response.url && response.url.includes('/auth/check');
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} Error`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      try {
        const text = await response.text();
        if (text && !text.trim().startsWith('<')) errorMessage = text;
      } catch {}
    }

    if (response.status === 401 || isAuthCheck) {
      if (isAuthCheck) {
        return { isUserSession: false, isAdminSession: false, isSupplierSession: false };
      }
      throw new Error(errorMessage);
    } else if (response.status === 403) {
      toast.error(errorMessage || 'You do not have permission to perform this action.');
    } else if (response.status === 404) {
      if (!isAuthCheck) console.warn('API endpoint not found:', response.url);
    } else if (response.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      console.error('JSON parse error:', e);
      return { success: false, error: 'Invalid JSON' };
    }
  }

  const text = await response.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
    if (isAuthCheck) {
      return { isUserSession: false, isAdminSession: false, isSupplierSession: false };
    }
    return { success: false, isHtmlFallback: true };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return { success: true, message: text };
  }
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  if (options.body && typeof (options.body as any).append === 'function') {
    // It's likely a FormData object, do not set Content-Type header
  } else if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    let response = await fetchWithTimeout(url, { ...options, headers, credentials: 'include' });
    
    // Automatic token refresh logic ONLY when there was a known prior session
    const hasPriorSession = typeof window !== 'undefined' && (
      localStorage.getItem('cc-auth-token') === 'true' ||
      localStorage.getItem('cc-admin-auth') === 'true' ||
      localStorage.getItem('cc-supplier-auth') === 'true'
    );

    const isAuthRoute = url.includes('/auth/check') || url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/refresh');

    if (response.status === 401 && hasPriorSession && !isAuthRoute) {
      try {
        console.log('Session might have expired, attempting refresh...');
        const refreshResponse = await fetchWithTimeout(`${API_BASE}/auth/refresh`, { 
          method: 'POST', 
          credentials: 'include',
          timeoutMs: 5000,
          maxRetries: 1
        });
        
        if (refreshResponse.ok) {
          console.log('Token refreshed successfully, retrying original request.');
          return await fetchWithTimeout(url, { ...options, headers, credentials: 'include' });
        } else {
          // Token expired and refresh failed
          localStorage.removeItem('cc-auth-token');
          localStorage.removeItem('cc-admin-auth');
          localStorage.removeItem('cc-supplier-auth');
        }
      } catch (e) {
        console.error('Refresh token attempt failed:', e);
      }
    }
    
    return response;
  } catch (error: any) {
    if (error.name === 'TypeError') {
      toast.error('Network error: Unable to connect to the server. Please check your internet connection.');
      throw new Error('Network error: Unable to connect to the server.');
    }
    throw error;
  }
};

const isGuest = (userId?: string): boolean => {
  return !userId || userId === 'guest' || userId === 'undefined' || userId === 'u1' && localStorage.getItem('cc-auth-token') !== 'true';
};

export const databaseService = {
  // --- AUTH ---
  checkAuth: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/auth/check`);
      if (response.status === 401) {
        return { isUserSession: false, isAdminSession: false, isSupplierSession: false };
      }
      return await handleResponse(response);
    } catch (e: any) {
      if (e.message && (e.message.includes('401') || e.message.includes('Not authenticated') || e.message.includes('Unauthorized'))) {
        return { isUserSession: false, isAdminSession: false, isSupplierSession: false };
      }
      throw e;
    }
  },

  login: async (data: any) => {
    const identifier = data.identifier || data.email;
    if (!identifier || !data.password) throw new Error("Credentials missing");
    const response = await fetchWithAuth(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier,
        email: identifier,
        password: data.password,
        role: data.role || 'USER'
      })
    });
    return await handleResponse(response);
  },

  signup: async (data: any) => {
    const response = await fetchWithAuth(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  refreshToken: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        timeoutMs: 5000,
        maxRetries: 1
      });
      if (response.ok) return await response.json();
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  requestPasswordReset: async (email: string) => {
    const response = await fetchWithAuth(`${API_BASE}/auth/request-reset`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return await handleResponse(response);
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetchWithAuth(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    return await handleResponse(response);
  },

  logout: async (role?: string) => {
    try {
      await fetchWithAuth(`${API_BASE}/auth/logout`, { 
        method: 'POST',
        body: JSON.stringify({ role })
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    localStorage.removeItem('cc-auth-token');
    localStorage.removeItem('cc-user-id');
    localStorage.removeItem('userId');
    localStorage.removeItem('cc-user-handle');
    localStorage.removeItem('cc-admin-id');
    localStorage.removeItem('cc-admin-auth');
    localStorage.removeItem('cc-supplier-id');
    localStorage.removeItem('cc-supplier-auth');
  },

  // --- TAGS & CATEGORIES ---
  getTags: async () => {
    const cached = getClientCached<any[]>('catalog_tags');
    if (cached) return cached;
    const response = await fetchWithAuth(`${API_BASE}/tags`);
    const data = await handleResponse(response);
    if (Array.isArray(data)) {
      setClientCached('catalog_tags', data, 60000);
    }
    return data;
  },
  addTag: async (name: string) => {
    invalidateClientCache('catalog_tags');
    const response = await fetchWithAuth(`${API_BASE}/tags`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    return await handleResponse(response);
  },
  deleteTag: async (id: string) => {
    invalidateClientCache('catalog_tags');
    const response = await fetchWithAuth(`${API_BASE}/tags/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },
  getCategories: async () => {
    const cached = getClientCached<any[]>('catalog_categories');
    if (cached) return cached;
    const response = await fetchWithAuth(`${API_BASE}/categories`);
    const data = await handleResponse(response);
    if (Array.isArray(data)) {
      setClientCached('catalog_categories', data, 60000);
    }
    return data;
  },
  addCategory: async (category: { name: string, heroImage?: string, inspiration?: string }) => {
    invalidateClientCache('catalog_categories');
    const response = await fetchWithAuth(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return await handleResponse(response);
  },
  updateCategory: async (id: string, category: { name: string, heroImage?: string, inspiration?: string }) => {
    invalidateClientCache('catalog_categories');
    const response = await fetchWithAuth(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(category)
    });
    return await handleResponse(response);
  },
  deleteCategory: async (id: string) => {
    invalidateClientCache('catalog_categories');
    const response = await fetchWithAuth(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const response = await fetchWithAuth(`${API_BASE}/users`);
    return await handleResponse(response);
  },

  getAdmins: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admins`);
    return await handleResponse(response);
  },

  updateUserStatus: async (userId: string, status: User['status']) => {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return await handleResponse(response);
  },

  deleteUser: async (userId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  getUsersRanked: async (): Promise<User[]> => {
    const response = await fetchWithAuth(`${API_BASE}/users/ranked`);
    return await handleResponse(response);
  },

  addRep: async (userId: string, amount: number) => {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/rep`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    return await handleResponse(response);
  },

  updateUserCredit: async (userId: string, amount?: number, credit?: number) => {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/credit`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, credit })
    });
    return await handleResponse(response);
  },

  calculateLevel: (rep: number) => {
    return Math.floor(Math.sqrt(rep / 100)) + 1;
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const cached = getClientCached<Product[]>('catalog_products');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
    try {
      const response = await fetchWithAuth(`${API_BASE}/products?all=true`);
      const data = await handleResponse(response);
      if (Array.isArray(data) && data.length > 0) {
        setClientCached('catalog_products', data, 20000); // 20s TTL
        return data;
      }
      return MOCK_PRODUCTS;
    } catch (error) {
      console.warn('Error fetching products, utilizing client mock fallback:', error);
      return cached || MOCK_PRODUCTS;
    }
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const cacheKey = `product_${id}`;
    const cached = getClientCached<Product>(cacheKey);
    if (cached) return cached;
    try {
      const response = await fetchWithAuth(`${API_BASE}/products/${encodeURIComponent(id)}`);
      if (!response.ok) return null;
      const data = await handleResponse(response);
      if (data) {
        setClientCached(cacheKey, data, 30000);
      }
      return data;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  saveProduct: async (product: Partial<Product>) => {
    invalidateClientCache('catalog_products');
    if (product.id) invalidateClientCache(`product_${product.id}`);
    const isUpdate = !!product.id;
    const url = isUpdate ? `${API_BASE}/products/${product.id}` : `${API_BASE}/products`;
    const method = isUpdate ? 'PATCH' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(product)
    });
    return await handleResponse(response);
  },

  saveProducts: async (products: Product[]) => {
    invalidateClientCache('catalog_products');
    for (const product of products) {
      await databaseService.saveProduct(product);
    }
  },

  deleteProduct: async (id: string) => {
    invalidateClientCache('catalog_products');
    invalidateClientCache(`product_${id}`);
    const response = await fetchWithAuth(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  updateProductHallOfFame: async (productId: string, isHallOfFame: boolean) => {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/hall-of-fame`, {
      method: 'PATCH',
      body: JSON.stringify({ isHallOfFame })
    });
    return await handleResponse(response);
  },

  getHallOfFameProducts: async (): Promise<Product[]> => {
    const response = await fetchWithAuth(`${API_BASE}/products/hall-of-fame`);
    return await handleResponse(response);
  },

  getProductReviews: async (productId: string, options?: { page?: number; limit?: number; sort?: string; rating?: string }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.rating && options.rating !== 'all') params.append('rating', options.rating);

    const url = `${API_BASE}/products/${productId}/reviews?${params.toString()}`;
    const response = await fetchWithAuth(url);
    return await handleResponse(response);
  },

  getUserReviews: async (userId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/reviews`);
    return await handleResponse(response);
  },

  addProductReview: async (productId: string, review: { rating: number; title?: string; body?: string; comment?: string; images?: string[]; userId?: string; userHandle?: string }) => {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review)
    });
    return await handleResponse(response);
  },

  toggleReviewHelpful: async (reviewId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}/helpful`, {
      method: 'POST'
    });
    return await handleResponse(response);
  },

  deleteReview: async (reviewId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    return await handleResponse(response);
  },

  // --- SUPPLIERS ---
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/suppliers`);
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },

  getSupplierById: async (id: string): Promise<Supplier | null> => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${id}`);
    return await handleResponse(response);
  },

  registerSupplier: async (supplier: Partial<Supplier>) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return await handleResponse(response);
  },

  registerSupplierPublic: async (supplier: Partial<Supplier>) => {
    const response = await fetchWithTimeout(`${API_BASE}/suppliers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier)
    });
    return await handleResponse(response);
  },

  getSupplierProducts: async (supplierId: string): Promise<Product[]> => {
    const response = await fetchWithAuth(`${API_BASE}/products?supplierId=${supplierId}`);
    return await handleResponse(response);
  },

  getSupplierOrders: async (supplierId: string): Promise<Order[]> => {
    const response = await fetchWithAuth(`${API_BASE}/orders?supplierId=${supplierId}`);
    return await handleResponse(response);
  },

  getSupplierAnomalies: async (supplierId: string): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/price-anomalies?supplierId=${supplierId}`);
    return await handleResponse(response);
  },

  saveSuppliers: async (suppliers: Supplier[]) => {
    for (const supplier of suppliers) {
      await fetchWithAuth(`${API_BASE}/suppliers`, {
        method: 'POST',
        body: JSON.stringify(supplier)
      });
    }
  },

  deleteSupplier: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  updateSupplier: async (id: string, supplierData: Partial<Supplier>) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(supplierData)
    });
    return await handleResponse(response);
  },

  updateSupplierCommission: async (supplierId: string, commissionRate: number) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${supplierId}/commission`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionRate })
    });
    return await handleResponse(response);
  },

  updateSupplierPassword: async (supplierId: string, password: string) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${supplierId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
    return await handleResponse(response);
  },

  updateSupplierStatus: async (supplierId: string, status: string) => {
    const response = await fetchWithAuth(`${API_BASE}/suppliers/${supplierId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return await handleResponse(response);
  },

  // --- WALLETS ---
  getWallet: async (id: string): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE}/wallets/${id}`);
    return await handleResponse(response);
  },

  requestPayout: async (id: string, amount: number, description: string) => {
    const response = await fetchWithAuth(`${API_BASE}/wallets/${id}/payout`, {
      method: 'POST',
      body: JSON.stringify({ amount, description })
    });
    return await handleResponse(response);
  },

  getBanks: async (type?: string) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/banks${type ? `?type=${type}` : ''}`);
    return await handleResponse(response);
  },

  resolveAccount: async (accountNumber: string, bankCode: string) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`);
    return await handleResponse(response);
  },

  withdrawFunds: async (data: { userId: string; amount: number; type: 'bank' | 'mobile_money'; bankCode: string; bankName: string; accountNumber: string; accountName: string }) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/withdraw`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getPaystackBalance: async () => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/balance`);
    return await handleResponse(response);
  },

  getWithdrawals: async (userId: string): Promise<Withdrawal[]> => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/withdrawals/${userId}`);
    return await handleResponse(response);
  },

  verifyTransfer: async (reference: string) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/transfer/verify/${reference}`);
    return await handleResponse(response);
  },

  initializePaystackTransaction: async (email: string, amount: number, metadata: any, subaccountOptions?: { subaccount?: string; transaction_charge?: number; bearer?: string; callback_url?: string }) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/initialize`, {
      method: 'POST',
      body: JSON.stringify({ email, amount, metadata, ...subaccountOptions })
    });
    return await handleResponse(response);
  },

  verifyPaystackTransaction: async (reference: string) => {
    const response = await fetchWithAuth(`${API_BASE}/paystack/verify/${reference}`);
    return await handleResponse(response);
  },

  // --- QUIZ ---
  saveQuizResults: async (userId: string, results: any) => {
    const response = await fetchWithAuth(`${API_BASE}/quiz/results`, {
      method: 'POST',
      body: JSON.stringify({ userId, results })
    });
    return await handleResponse(response);
  },

  getQuizResults: async (userId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/quiz/results/${userId}`);
    return await handleResponse(response);
  },

  // --- LOYALTY ---
  getLoyaltyPoints: async (userId: string): Promise<number> => {
    const response = await fetchWithAuth(`${API_BASE}/loyalty/points/${userId}`);
    const data = await handleResponse(response);
    return data.points;
  },

  earnLoyaltyPoints: async (userId: string, amount: number, reason: string) => {
    const response = await fetchWithAuth(`${API_BASE}/loyalty/earn`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, reason })
    });
    return await handleResponse(response);
  },

  redeemLoyaltyPoints: async (userId: string, amount: number, reason: string) => {
    const response = await fetchWithAuth(`${API_BASE}/loyalty/redeem`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, reason })
    });
    return await handleResponse(response);
  },

  getLoyaltyTransactions: async (userId: string): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/loyalty/transactions/${userId}`);
    return await handleResponse(response);
  },

  // --- NOTIFICATIONS ---
  getGlobalNotifications: async (userId?: string): Promise<Notification[]> => {
    const url = userId ? `${API_BASE}/notifications?userId=${userId}` : `${API_BASE}/notifications`;
    const response = await fetchWithAuth(url);
    return await handleResponse(response);
  },

  markNotificationRead: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    return await handleResponse(response);
  },

  saveGlobalNotification: async (notif: Notification) => {
    const response = await fetchWithAuth(`${API_BASE}/notifications`, {
      method: 'POST',
      body: JSON.stringify(notif)
    });
    return await handleResponse(response);
  },

  updateNotifications: async (notifs: Notification[]) => {
    for (const notif of notifs) {
      await fetchWithAuth(`${API_BASE}/notifications`, {
        method: 'POST',
        body: JSON.stringify(notif)
      });
    }
  },

  sendSupplierNotification: async (supplierId: string, title: string, message: string) => {
    const response = await fetchWithAuth(`${API_BASE}/notifications/supplier`, {
      method: 'POST',
      body: JSON.stringify({ supplierId, title, message })
    });
    return await handleResponse(response);
  },

  sendNotification: async (title: string, message: string, type: Notification['type'] = 'INFO', recipientId?: string | null) => {
    const response = await fetchWithAuth(`${API_BASE}/notifications`, {
      method: 'POST',
      body: JSON.stringify({ title, message, type, recipientId })
    });
    return await handleResponse(response);
  },

  // --- PROMO CODES ---
  getPromoCodes: async (): Promise<PromoCode[]> => {
    const response = await fetchWithAuth(`${API_BASE}/promo-codes`);
    return await handleResponse(response);
  },

  savePromoCodes: async (codes: PromoCode[]) => {
    for (const code of codes) {
      await fetchWithAuth(`${API_BASE}/promo-codes`, {
        method: 'POST',
        body: JSON.stringify(code)
      });
    }
  },

  deletePromoCode: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/promo-codes/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/orders`, { credentials: 'include' });
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  saveOrders: async (orders: Order[]) => {
    for (const order of orders) {
      await fetchWithAuth(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(order)
      });
    }
  },

  createOrder: async (order: any) => {
    const response = await fetchWithAuth(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return await handleResponse(response);
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    const response = await fetchWithAuth(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber })
    });
    return await handleResponse(response);
  },

  // --- PRICE ANOMALIES ---
  getPriceAnomalies: async (userId?: string, supplierId?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (supplierId) params.append('supplierId', supplierId);
    const response = await fetchWithAuth(`${API_BASE}/price-anomalies?${params.toString()}`);
    return await handleResponse(response);
  },

  createPriceAnomaly: async (anomaly: any) => {
    const response = await fetchWithAuth(`${API_BASE}/price-anomalies`, {
      method: 'POST',
      body: JSON.stringify(anomaly)
    });
    return await handleResponse(response);
  },

  deletePriceAnomaly: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/price-anomalies/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  getAnomalyConfig: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admin/anomaly-config`);
    return await handleResponse(response);
  },

  saveAnomalyConfig: async (config: { duration: number; productIds: string[]; discount: number }) => {
    const response = await fetchWithAuth(`${API_BASE}/admin/anomaly-config`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return await handleResponse(response);
  },

  getUserAnomalySession: async (userId: string) => {
    if (isGuest(userId)) return null;
    const response = await fetchWithAuth(`${API_BASE}/user/anomaly-session/${userId}`);
    return await handleResponse(response);
  },

  startUserAnomalySession: async (userId: string) => {
    if (isGuest(userId)) return null;
    const response = await fetchWithAuth(`${API_BASE}/user/anomaly-session/start`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return await handleResponse(response);
  },

  savePriceAnomalies: async (anomalies: any[]) => {
    for (const anomaly of anomalies) {
      await fetchWithAuth(`${API_BASE}/price-anomalies`, {
        method: 'POST',
        body: JSON.stringify(anomaly)
      });
    }
  },

  getSetting: async <T = any>(key: string): Promise<T | null> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/settings/${key}`);
      return await handleResponse(response);
    } catch (e) {
      console.error(`Error getting setting for ${key}:`, e);
      return null;
    }
  },

  saveSetting: async (key: string, value: any): Promise<any> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/settings/${key}`, {
        method: 'POST',
        body: JSON.stringify(value)
      });
      return await handleResponse(response);
    } catch (e) {
      console.error(`Error saving setting for ${key}:`, e);
      return null;
    }
  },

  getPriceAnomalyDuration: async (): Promise<number> => {
    const response = await fetchWithAuth(`${API_BASE}/settings/price_anomaly_duration`);
    return await handleResponse(response);
  },

  savePriceAnomalyDuration: async (hours: number) => {
    const response = await fetchWithAuth(`${API_BASE}/settings/price_anomaly_duration`, {
      method: 'POST',
      body: JSON.stringify(hours)
    });
    return await handleResponse(response);
  },

  getPriceAnomalyWindow: async (): Promise<{ startTime: number; endTime: number } | null> => {
    const response = await fetchWithAuth(`${API_BASE}/settings/price_anomaly_window`);
    return await handleResponse(response);
  },

  initializePriceAnomalyWindow: async () => {
    const duration = await databaseService.getPriceAnomalyDuration();
    const startTime = Date.now();
    const endTime = startTime + (duration * 60 * 60 * 1000);
    const window = { startTime, endTime };
    const response = await fetchWithAuth(`${API_BASE}/settings/price_anomaly_window`, {
      method: 'POST',
      body: JSON.stringify(window)
    });
    await handleResponse(response);
    return window;
  },

  // --- BUNDLES ---
  getBundles: async (): Promise<Bundle[]> => {
    const cached = getClientCached<Bundle[]>('catalog_bundles');
    if (cached) return cached;
    try {
      const response = await fetchWithAuth(`${API_BASE}/bundles`);
      const data = await handleResponse(response);
      if (Array.isArray(data)) {
        setClientCached('catalog_bundles', data, 45000);
      }
      return data;
    } catch (error) {
      console.error('Error fetching bundles:', error);
      return cached || [];
    }
  },

  saveBundles: async (bundles: Bundle[]) => {
    invalidateClientCache('catalog_bundles');
    for (const bundle of bundles) {
      await fetchWithAuth(`${API_BASE}/bundles`, {
        method: 'POST',
        body: JSON.stringify(bundle)
      });
    }
  },

  deleteBundle: async (id: string) => {
    invalidateClientCache('catalog_bundles');
    const response = await fetchWithAuth(`${API_BASE}/bundles/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  // --- PAY FOR ME ---
  getPayForMeRequests: async (): Promise<PayForMeRequest[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/pay-for-me`);
      const data = await handleResponse(response);
      if (!Array.isArray(data)) return [];
      return data.map((r: any) => ({
        ...r,
        items: Array.isArray(r.items) ? r.items : (r.items ? [r.items] : [])
      }));
    } catch (e) {
      console.error('Failed to get PayForMe requests:', e);
      return [];
    }
  },

  getPayForMeRequestById: async (requestId: string): Promise<PayForMeRequest> => {
    const response = await fetchWithTimeout(`${API_BASE}/pay-for-me/${requestId}`);
    return await handleResponse(response);
  },

  savePayForMeRequests: async (requests: PayForMeRequest[]) => {
    for (const request of requests) {
      await fetchWithAuth(`${API_BASE}/pay-for-me`, {
        method: 'POST',
        body: JSON.stringify(request)
      });
    }
  },

  createPayForMeRequest: async (request: Omit<PayForMeRequest, 'id' | 'timestamp' | 'status'>) => {
    const response = await fetchWithAuth(`${API_BASE}/pay-for-me`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return await handleResponse(response);
  },

  updatePayForMeStatus: async (requestId: string, status: PayForMeStatus) => {
    const response = await fetchWithAuth(`${API_BASE}/pay-for-me/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return await handleResponse(response);
  },

  updatePayForMeAmountPaid: async (requestId: string, amountPaid: number) => {
    const response = await fetchWithAuth(`${API_BASE}/pay-for-me/${requestId}/amount-paid`, {
      method: 'PATCH',
      body: JSON.stringify({ amountPaid })
    });
    return await handleResponse(response);
  },

  // --- SETTINGS ---
  getMaintenanceMode: async () => {
    const cached = getClientCached<{ enabled: boolean }>('setting_maintenance');
    if (cached) return cached;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/settings/maintenance_mode`, { timeoutMs: 3000 });
      if (!response.ok) return { enabled: false };
      const data = await response.json();
      const result = data || { enabled: false };
      setClientCached('setting_maintenance', result, 60000);
      return result;
    } catch {
      return { enabled: false };
    }
  },

  setMaintenanceMode: async (enabled: boolean) => {
    invalidateClientCache('setting_maintenance');
    const response = await fetchWithAuth(`${API_BASE}/settings/maintenance_mode`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
    return await handleResponse(response);
  },

  // --- SOCIAL ---
  getPanelContent: async (id: string): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE}/panel-content/${id}`);
    return await handleResponse(response);
  },

  savePanelContent: async (id: string, content: any) => {
    const response = await fetchWithAuth(`${API_BASE}/panel-content/${id}`, {
      method: 'POST',
      body: JSON.stringify(content)
    });
    return await handleResponse(response);
  },

  getFeedback: async (): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/feedback`);
    return await handleResponse(response);
  },

  submitFeedback: async (data: { userId?: string; userHandle?: string; email: string; topic: string; message: string; }) => {
    const response = await fetchWithTimeout(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  updateFeedbackStatus: async (id: string, status: string) => {
    const response = await fetchWithAuth(`${API_BASE}/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return await handleResponse(response);
  },

  deleteFeedback: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/feedback/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  getCustomRequests: async (): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/custom-requests`);
    return await handleResponse(response);
  },

  submitCustomRequest: async (data: {
    userId?: string;
    userHandle?: string;
    email?: string;
    itemName: string;
    category?: string;
    budget?: number;
    description?: string;
    referenceImage?: string;
  }) => {
    const response = await fetchWithTimeout(`${API_BASE}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  updateCustomRequest: async (id: string, update: { status?: string; adminNotes?: string; }) => {
    const response = await fetchWithAuth(`${API_BASE}/custom-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update)
    });
    return await handleResponse(response);
  },

  deleteCustomRequest: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE}/custom-requests/${id}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  getSocialPosts: async (): Promise<UserPost[]> => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts`);
    return await handleResponse(response);
  },

  getSocialCycleInfo: async (): Promise<SocialCycleInfo> => {
    const response = await fetchWithAuth(`${API_BASE}/social/cycle-info`);
    return await handleResponse(response);
  },

  forceResetSocial: async (): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE}/social/force-reset`, { method: 'POST' });
    return await handleResponse(response);
  },

  interactWithPost: async (postId: string, userId: string, type: 'LIKE' | 'DISLIKE'): Promise<UserPost> => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts/${postId}/interact`, {
      method: 'POST',
      body: JSON.stringify({ userId, type })
    });
    return await handleResponse(response);
  },

  getPostComments: async (postId: string): Promise<SocialComment[]> => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts/${postId}/comments`);
    return await handleResponse(response);
  },

  addPostComment: async (postId: string, userId: string, userHandle: string, text: string): Promise<boolean> => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, userHandle, text })
    });
    const result = await handleResponse(response);
    return result.success;
  },

  getProtocolSession: async (type: string) => {
    const response = await fetchWithAuth(`${API_BASE}/user/protocol-session/${type}`);
    return await handleResponse(response);
  },

  saveProtocolSession: async (protocolType: string, currentStep: number, sessionData: any) => {
    const response = await fetchWithAuth(`${API_BASE}/user/protocol-session`, {
      method: 'POST',
      body: JSON.stringify({ protocolType, currentStep, sessionData })
    });
    return await handleResponse(response);
  },

  deleteProtocolSession: async (type: string) => {
    const response = await fetchWithAuth(`${API_BASE}/user/protocol-session/${type}`, { method: 'DELETE' });
    return await handleResponse(response);
  },

  reportPost: async (postId: string, userId: string, reason: string): Promise<boolean> => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    });
    const result = await handleResponse(response);
    return result.success;
  },

  takeDownPost: async (postId: string): Promise<boolean> => {
    const response = await fetchWithAuth(`${ADMIN_API_BASE}/posts/${postId}`, {
      method: 'DELETE'
    });
    const result = await handleResponse(response);
    return result.status === 'success';
  },

  getUserInteractions: async (userId: string): Promise<SocialInteraction[]> => {
    const response = await fetchWithAuth(`${API_BASE}/social-interactions/${userId}`);
    return await handleResponse(response);
  },

  createSocialPost: async (post: any) => {
    const response = await fetchWithAuth(`${API_BASE}/social-posts`, {
      method: 'POST',
      body: JSON.stringify(post)
    });
    return await handleResponse(response);
  },

  getGroupMessages: async (): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/group-messages`);
    return await handleResponse(response);
  },

  sendGroupMessage: async (userId: string, userHandle: string, text: string, imageUrl?: string): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE}/group-messages`, {
      method: 'POST',
      body: JSON.stringify({ userId, userHandle, text, imageUrl })
    });
    return await handleResponse(response);
  },

  reportGroupMessage: async (messageId: string, userId: string): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE}/group-messages/${messageId}/report`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return await handleResponse(response);
  },

  // --- STATS & PREFERENCES ---
  updateAchievementProgress: async (userId: string, achievementId: string, progress: number) => {
    const response = await fetchWithAuth(`${API_BASE}/user-stats/${userId}/achievements/${achievementId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress })
    });
    return await handleResponse(response);
  },

  getUserStats: async (userId: string): Promise<UserStats> => {
    if (isGuest(userId)) {
      return { userId: 'guest', level: 1, xp: 0, orderCount: 0, spentMonthly: 0, activeStreak: 1, achievements: [] } as any;
    }
    const response = await fetchWithAuth(`${API_BASE}/user-stats/${userId}`);
    return await handleResponse(response);
  },

  updateUserStats: async (userId: string, stats: UserStats) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user-stats/${userId}`, {
      method: 'POST',
      body: JSON.stringify(stats)
    });
    return await handleResponse(response);
  },

  getUserPreferences: async (userId: string): Promise<UserPreferences | null> => {
    if (isGuest(userId)) return null;
    const response = await fetchWithAuth(`${API_BASE}/user-preferences/${userId}`);
    return await handleResponse(response);
  },

  saveUserPreferences: async (userId: string, prefs: UserPreferences) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user-preferences/${userId}`, {
      method: 'POST',
      body: JSON.stringify(prefs)
    });
    return await handleResponse(response);
  },

  getUserHistory: async (userId: string): Promise<UserHistory> => {
    if (isGuest(userId)) return { userId: 'guest', history: [] } as any;
    const response = await fetchWithAuth(`${API_BASE}/user-history/${userId}`);
    return await handleResponse(response);
  },

  saveUserHistory: async (userId: string, history: UserHistory) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user-history/${userId}`, {
      method: 'POST',
      body: JSON.stringify(history)
    });
    return await handleResponse(response);
  },

  // --- LOGISTICS ---
  getUserLogistics: async (userId: string) => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/logistics/${userId}`);
    return await handleResponse(response);
  },

  saveUserLogistics: async (userId: string, logistics: any) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/logistics/${userId}`, {
      method: 'POST',
      body: JSON.stringify(logistics)
    });
    return await handleResponse(response);
  },

  // --- RECOMMENDATIONS ---
  getRecommendations: async (userId: string): Promise<Product[]> => {
    const response = await fetchWithAuth(`${API_BASE}/recommendations/${userId}`);
    return await handleResponse(response);
  },

  trackAction: async (userId: string, productId: string, action: 'view' | 'wishlist' | 'purchase' | 'cart') => {
    if (isGuest(userId)) return { success: true, message: 'Tracking skipped for guest' };
    const response = await fetchWithAuth(`${API_BASE}/user-history/${userId}/track`, {
      method: 'POST',
      body: JSON.stringify({ productId, action })
    });
    return await handleResponse(response);
  },

  // --- ADMIN ---
  getAdminMetrics: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admin/metrics`);
    return await handleResponse(response);
  },

  resetAdminRevenue: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admin/metrics/reset-revenue`, {
      method: 'POST'
    });
    return await handleResponse(response);
  },

  resetAdminCommission: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admin/metrics/reset-commission`, {
      method: 'POST'
    });
    return await handleResponse(response);
  },

  visualSearchByImage: async (base64Image: string) => {
    const response = await fetchWithAuth(`${API_BASE}/ai/visual-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: base64Image })
    });
    return await handleResponse(response);
  },

  getSecurityStatus: async () => {
    const response = await fetchWithAuth(`${API_BASE}/admins/security`);
    return await handleResponse(response);
  },

  executeSecurityAction: async (action: string) => {
    const endpointMap: Record<string, string> = {
      'INITIATE': 'lockdown',
      'EXECUTE': 'flush-cache',
      'ROTATE': 'rotate-keys',
      'SCAN': 'audit'
    };
    const response = await fetchWithAuth(`${API_BASE}/admins/security/${endpointMap[action]}`, {
      method: 'POST'
    });
    return await handleResponse(response);
  },

  getDatabaseTables: async (): Promise<string[]> => {
    const response = await fetchWithAuth(`${API_BASE}/admins/db/tables`);
    return await handleResponse(response);
  },

  getTableData: async (tableName: string): Promise<{columns: {name: string, type: string}[], data: any[]}> => {
    const response = await fetchWithAuth(`${API_BASE}/admins/db/table/${tableName}`);
    return await handleResponse(response);
  },

  executeRawQuery: async (query: string, params?: any[]): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE}/admins/db/query`, {
      method: 'POST',
      body: JSON.stringify({ query, params })
    });
    return await handleResponse(response);
  },

  logSecurityEvent: async (event: any) => {
    const response = await fetchWithAuth(`${ADMIN_API_BASE}/security-events`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
    return await handleResponse(response);
  },

  // --- USER PANEL ---
  getUserProfile: async (userId: string) => {
    if (isGuest(userId)) return { status: 'OK', rep: 8500, credit: 0, handle: 'Guest User', stats: null };
    const response = await fetchWithAuth(`${API_BASE}/user/profile/${userId}`);
    return await handleResponse(response);
  },

  updateUserProfile: async (userId: string, data: any) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/profile/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getWishlist: async (userId: string): Promise<Product[]> => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/wishlist/${userId}`);
    return await handleResponse(response);
  },

  getOutfits: async (userId: string): Promise<any[]> => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/${userId}/outfits`);
    return await handleResponse(response);
  },

  saveOutfit: async (userId: string, outfit: { id?: string; name: string; items: any[] }): Promise<void> => {
    if (isGuest(userId)) return;
    const response = await fetchWithAuth(`${API_BASE}/user/${userId}/outfits`, {
      method: 'POST',
      body: JSON.stringify(outfit)
    });
    return await handleResponse(response);
  },

  addToWishlist: async (userId: string, productId: string) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/wishlist`, {
      method: 'POST',
      body: JSON.stringify({ userId, productId })
    });
    return await handleResponse(response);
  },

  removeFromWishlist: async (userId: string, productId: string) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/wishlist/${userId}/${productId}`, {
      method: 'DELETE'
    });
    return await handleResponse(response);
  },

  getCart: async (userId: string): Promise<any[]> => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/cart/${userId}`);
    return await handleResponse(response);
  },

  addToCart: async (userId: string, item: any) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/cart`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...item })
    });
    return await handleResponse(response);
  },

  updateCartItem: async (userId: string, item: any) => {
    const response = await fetchWithAuth(`${API_BASE}/user/cart`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...item })
    });
    return await handleResponse(response);
  },

  removeFromCart: async (userId: string, productId: string, size?: string, colorMain?: string, colorSecondary?: string) => {
    if (isGuest(userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/cart/remove`, {
      method: 'POST',
      body: JSON.stringify({ userId, productId, size, colorMain, colorSecondary })
    });
    return await handleResponse(response);
  },

  logMysteryBoxOpening: async (data: any) => {
    if (isGuest(data.userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/mystery-box/open`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getMysteryBoxHistory: async (userId: string) => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/mystery-box/history/${userId}`);
    return await handleResponse(response);
  },

  submitGameScore: async (data: any) => {
    if (isGuest(data.userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/game-scores`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getGameScores: async (userId: string) => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/game-scores/${userId}`);
    return await handleResponse(response);
  },

  saveStylistSession: async (data: any) => {
    if (isGuest(data.userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/stylist-sessions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getStylistSessions: async (userId: string) => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/stylist-sessions/${userId}`);
    return await handleResponse(response);
  },

  saveTryOn: async (data: any) => {
    if (isGuest(data.userId)) return { status: 'success' };
    const response = await fetchWithAuth(`${API_BASE}/user/try-on`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await handleResponse(response);
  },

  getTryOns: async (userId: string) => {
    if (isGuest(userId)) return [];
    const response = await fetchWithAuth(`${API_BASE}/user/try-on/${userId}`);
    return await handleResponse(response);
  },

  uploadCategoryImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetchWithAuth(`${API_BASE}/upload/category`, {
      method: 'POST',
      body: formData
    });
    return await handleResponse(response);
  },

  uploadProductImage: async (file: File, productName: string, onProgress?: (progress: number) => void) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('cc-auth-token');
      
      xhr.open('POST', `${API_BASE}/upload/product`);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || 'Upload failed'));
          } catch (e) {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      const formData = new FormData();
      formData.append('image', file);
      formData.append('productName', productName);
      
      xhr.send(formData);
    });
  },

  uploadProductVideo: async (file: File, productName: string, onProgress?: (progress: number) => void): Promise<{ status: string; url: string; meta?: any }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('cc-auth-token');
      
      xhr.open('POST', `${API_BASE}/upload/video`);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({ status: 'success', url: '' });
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || 'Video upload failed'));
          } catch (e) {
            reject(new Error('Video upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during video upload'));

      const formData = new FormData();
      formData.append('video', file);
      formData.append('productName', productName);
      
      xhr.send(formData);
    });
  },

  uploadFeedImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetchWithAuth(`${API_BASE}/upload/feed`, {
      method: 'POST',
      body: formData
    });
    return await handleResponse(response);
  },

  recordAlignment: async (alignmentId: string, decision: number) => {
    const response = await fetchWithAuth(`${API_BASE}/compliance/align`, {
      method: 'POST',
      body: JSON.stringify({ alignmentId, decision })
    });
    return await handleResponse(response);
  },

  // --- REFERRALS ---
  validateReferralCode: async (code: string) => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/validate/${encodeURIComponent(code)}`);
    return await handleResponse(response);
  },

  getMyReferralStats: async () => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/my-stats`);
    return await handleResponse(response);
  },

  trackReferral: async (referralCode: string, refereeUserId?: string, refereeEmail?: string) => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/track`, {
      method: 'POST',
      body: JSON.stringify({ referralCode, refereeUserId, refereeEmail })
    });
    return await handleResponse(response);
  },

  rewardReferral: async (refereeUserId: string, refereeOrderId?: string) => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/reward`, {
      method: 'POST',
      body: JSON.stringify({ refereeUserId, refereeOrderId })
    });
    return await handleResponse(response);
  },

  getAdminReferralStats: async () => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/admin/stats`);
    return await handleResponse(response);
  },

  getReferralStats: async (userId: string) => {
    if (isGuest(userId)) return { code: '', points: 0, referrals: [] };
    try {
      const res = await fetchWithAuth(`${API_BASE}/referrals/my-stats`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const response = await fetchWithAuth(`${API_BASE}/user/referrals/${userId}`);
    return await handleResponse(response);
  },

  bindReferralCode: async (code: string) => {
    const response = await fetchWithAuth(`${API_BASE}/user/referrals/bind`, {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return await handleResponse(response);
  },

  getReferralLedger: async () => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/ledger`);
    return await handleResponse(response);
  },

  verifyReferralBlockchain: async () => {
    const response = await fetchWithAuth(`${API_BASE}/referrals/verify-chain`);
    return await handleResponse(response);
  },

  // --- WAITLIST METHODS ---
  joinWaitlist: async (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>): Promise<WaitlistEntry> => {
    const newEntry: WaitlistEntry = {
      id: `waitlist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...entry,
      createdAt: new Date().toISOString(),
      status: 'WAITING',
    };

    // Store in local storage for instantaneous resilience
    try {
      const stored = localStorage.getItem('closet-kraze-waitlist');
      const parsed = stored ? JSON.parse(stored) : [];
      const waitlistArr: WaitlistEntry[] = Array.isArray(parsed) ? parsed : [];
      // Remove any previous duplicate for the same product and email/phone
      const filtered = waitlistArr.filter(
        item => !(item.productId === entry.productId && (item.email === entry.email || item.phone === entry.phone))
      );
      filtered.unshift(newEntry);
      localStorage.setItem('closet-kraze-waitlist', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Could not save waitlist to localStorage:', e);
    }

    // Try posting to API
    try {
      const response = await fetchWithAuth(`${API_BASE}/products/${entry.productId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (response.ok) {
        const data = await response.json();
        return data.entry || newEntry;
      }
    } catch (e) {
      // Backend optional fallback
    }

    return newEntry;
  },

  checkWaitlistStatus: (productId: string, contact?: string): boolean => {
    try {
      const stored = localStorage.getItem('closet-kraze-waitlist');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const waitlistArr: WaitlistEntry[] = Array.isArray(parsed) ? parsed : [];
      return waitlistArr.some(item => {
        if (item.productId !== productId) return false;
        if (!contact) return true;
        return item.email.toLowerCase() === contact.toLowerCase() || item.phone === contact;
      });
    } catch {
      return false;
    }
  },

  // --- UTILS ---
  getWeekId: () => {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
  },
};
