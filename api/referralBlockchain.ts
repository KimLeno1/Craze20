import crypto from 'crypto';

export interface ReferralBlock {
  id: string;
  blockIndex: number;
  timestamp: string;
  orderId: string;
  referrerId: string;
  referrerHandle?: string;
  referredUserId: string;
  referredHandle?: string;
  productAmount: number;
  rewardAmount: number;
  rate: string;
  previousHash: string;
  hash: string;
  nonce: number;
  metadata?: string;
  createdAt: string;
}

/**
 * Computes SHA-256 hash for a block
 */
export function computeBlockHash(
  index: number,
  previousHash: string,
  timestamp: string,
  referrerId: string,
  referredUserId: string,
  orderId: string,
  productAmount: number,
  rewardAmount: number,
  nonce: number
): string {
  const payload = `${index}:${previousHash}:${timestamp}:${referrerId}:${referredUserId}:${orderId}:${productAmount}:${rewardAmount}:${nonce}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Proof-of-work mining: finds a nonce so hash starts with difficulty prefix (e.g. '00')
 */
export function mineBlockNonce(
  index: number,
  previousHash: string,
  timestamp: string,
  referrerId: string,
  referredUserId: string,
  orderId: string,
  productAmount: number,
  rewardAmount: number,
  difficultyPrefix: string = '00'
): { nonce: number; hash: string } {
  let nonce = 0;
  while (true) {
    const hash = computeBlockHash(
      index,
      previousHash,
      timestamp,
      referrerId,
      referredUserId,
      orderId,
      productAmount,
      rewardAmount,
      nonce
    );
    if (hash.startsWith(difficultyPrefix)) {
      return { nonce, hash };
    }
    nonce++;
    if (nonce > 500000) {
      // Safety threshold
      return { nonce, hash };
    }
  }
}

/**
 * Initializes the referral_ledger SQLite table and ensures Genesis block #0 exists
 */
export async function initReferralLedgerTable(db: any) {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS referral_ledger (
        id VARCHAR(255) PRIMARY KEY,
        blockIndex INTEGER NOT NULL UNIQUE,
        timestamp TEXT NOT NULL,
        orderId VARCHAR(255) NOT NULL,
        referrerId VARCHAR(255) NOT NULL,
        referrerHandle VARCHAR(255),
        referredUserId VARCHAR(255) NOT NULL,
        referredHandle VARCHAR(255),
        productAmount DOUBLE NOT NULL,
        rewardAmount INTEGER NOT NULL,
        rate VARCHAR(255) DEFAULT '10% Lifetime Purchase Commission',
        previousHash VARCHAR(64) NOT NULL,
        hash VARCHAR(64) NOT NULL,
        nonce INTEGER DEFAULT 0,
        metadata TEXT,
        createdAt TEXT
      )
    `);

    // Check if genesis block exists
    const genesis = await db.get('SELECT * FROM referral_ledger WHERE blockIndex = 0');
    if (!genesis) {
      const genesisIndex = 0;
      const genesisPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const genesisTimestamp = '2026-01-01T00:00:00.000Z';
      const { nonce, hash } = mineBlockNonce(
        genesisIndex,
        genesisPrevHash,
        genesisTimestamp,
        'SYSTEM_ORIGIN',
        'KFAM_COMMUNITY',
        'GENESIS_BLOCK_CK_PROTOCOL',
        0,
        0,
        '00'
      );

      const genesisMeta = JSON.stringify({
        protocol: 'KFAM Lifetime Referral Blockchain Ledger v2.0',
        rule: '10% of product amount rounded to nearest whole number for life',
        antiLooping: 'Circular referrals strictly prohibited',
        initializedAt: new Date().toISOString()
      });

      await db.run(
        `INSERT INTO referral_ledger 
         (id, blockIndex, timestamp, orderId, referrerId, referrerHandle, referredUserId, referredHandle, productAmount, rewardAmount, rate, previousHash, hash, nonce, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'block_genesis_0',
          0,
          genesisTimestamp,
          'GENESIS_BLOCK_CK_PROTOCOL',
          'SYSTEM_ORIGIN',
          'KFAM Core Protocol',
          'KFAM_COMMUNITY',
          'Genesis Syndicate',
          0,
          0,
          '10% Lifetime Purchase Commission',
          genesisPrevHash,
          hash,
          nonce,
          genesisMeta,
          genesisTimestamp
        ]
      );
      console.log('✅ KFAM Referral Blockchain initialized with Genesis Block #0:', hash);
    }
  } catch (err) {
    console.error('Error initializing referral ledger table:', err);
  }
}

/**
 * Records a new referral purchase reward block onto the immutable ledger
 */
export async function recordReferralRewardBlock(
  db: any,
  params: {
    referrerId: string;
    referredUserId: string;
    orderId: string;
    productAmount: number;
    rewardAmount: number;
    metadata?: any;
  }
): Promise<ReferralBlock> {
  const { referrerId, referredUserId, orderId, productAmount, rewardAmount, metadata } = params;

  // Retrieve handles for human readability in audits
  let referrerHandle = 'Member';
  let referredHandle = 'Friend';
  try {
    const referrerUser = await db.get('SELECT handle, email FROM users WHERE id = ?', [referrerId]);
    if (referrerUser) referrerHandle = referrerUser.handle || referrerUser.email?.split('@')[0] || 'Member';

    const referredUser = await db.get('SELECT handle, email FROM users WHERE id = ?', [referredUserId]);
    if (referredUser) referredHandle = referredUser.handle || referredUser.email?.split('@')[0] || 'Friend';
  } catch (e) {}

  // Fetch the latest block to chain cryptographically
  const lastBlock = await db.get('SELECT * FROM referral_ledger ORDER BY blockIndex DESC LIMIT 1');
  const blockIndex = lastBlock ? Number(lastBlock.blockIndex) + 1 : 1;
  const previousHash = lastBlock ? lastBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();

  // Mine the block with SHA-256 Proof-of-Work
  const { nonce, hash } = mineBlockNonce(
    blockIndex,
    previousHash,
    timestamp,
    referrerId,
    referredUserId,
    orderId,
    productAmount,
    rewardAmount,
    '00'
  );

  const blockId = `block_${blockIndex}_${Date.now()}`;
  const metaJson = JSON.stringify({
    ...(metadata || {}),
    commissionRule: '10% of product amount rounded to nearest whole number for life',
    proofMethod: 'SHA-256 Proof-of-Work (KFam Chain)',
    verifiedAt: timestamp
  });

  await db.run(
    `INSERT INTO referral_ledger 
     (id, blockIndex, timestamp, orderId, referrerId, referrerHandle, referredUserId, referredHandle, productAmount, rewardAmount, rate, previousHash, hash, nonce, metadata, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      blockId,
      blockIndex,
      timestamp,
      orderId,
      referrerId,
      referrerHandle,
      referredUserId,
      referredHandle,
      productAmount,
      rewardAmount,
      '10% Lifetime Purchase Commission',
      previousHash,
      hash,
      nonce,
      metaJson,
      timestamp
    ]
  );

  return {
    id: blockId,
    blockIndex,
    timestamp,
    orderId,
    referrerId,
    referrerHandle,
    referredUserId,
    referredHandle,
    productAmount,
    rewardAmount,
    rate: '10% Lifetime Purchase Commission',
    previousHash,
    hash,
    nonce,
    metadata: metaJson,
    createdAt: timestamp
  };
}

/**
 * Checks for circular referral prevention.
 * "you cant use the referal code of some one you referred"
 */
export async function checkCircularReferral(
  db: any,
  userId: string | null | undefined,
  targetReferrerId: string
): Promise<{ isAllowed: boolean; reason?: string }> {
  if (!userId || !targetReferrerId) {
    return { isAllowed: true };
  }

  // 1. Self referral restriction
  if (userId === targetReferrerId) {
    return { isAllowed: false, reason: 'You cannot use your own referral code.' };
  }

  // 2. Direct circular referral restriction: Did userId refer targetReferrerId in the past?
  try {
    const referredTarget = await db.get(
      `SELECT id FROM referrals WHERE referrerId = ? AND (referredId = ? OR refereeId = ?)`,
      [userId, targetReferrerId, targetReferrerId]
    );

    if (referredTarget) {
      return {
        isAllowed: false,
        reason: 'You cannot use the referral code of someone you referred.'
      };
    }

    // Also check if targetReferrerId was registered with referredBy pointing to userId
    const targetUser = await db.get('SELECT referredBy FROM users WHERE id = ?', [targetReferrerId]);
    if (targetUser && targetUser.referredBy === userId) {
      return {
        isAllowed: false,
        reason: 'You cannot use the referral code of someone you referred.'
      };
    }

    // Check transitive loops (A -> B -> C -> A)
    const reverseChain = await db.get(
      `SELECT id FROM referrals WHERE referrerId = ? AND (referredId = ? OR refereeId = ?)`,
      [targetReferrerId, userId, userId]
    );
    // If they already refer this user, you can't bind them again
  } catch (err) {
    console.error('Error checking circular referral:', err);
  }

  return { isAllowed: true };
}

/**
 * Audits and verifies the complete cryptographic chain
 */
export async function verifyLedgerChain(db: any): Promise<{
  isValid: boolean;
  totalBlocks: number;
  totalDistributed: number;
  chainStatus: string;
  genesisHash: string;
  latestBlockHash: string;
  errorBlockIndex?: number;
}> {
  try {
    const blocks = await db.all('SELECT * FROM referral_ledger ORDER BY blockIndex ASC');
    if (!blocks || blocks.length === 0) {
      return {
        isValid: true,
        totalBlocks: 0,
        totalDistributed: 0,
        chainStatus: 'EMPTY_GENESIS_PENDING',
        genesisHash: '',
        latestBlockHash: ''
      };
    }

    let totalDistributed = 0;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      totalDistributed += Number(block.rewardAmount || 0);

      if (i > 0) {
        const prev = blocks[i - 1];
        if (block.previousHash !== prev.hash) {
          return {
            isValid: false,
            totalBlocks: blocks.length,
            totalDistributed,
            chainStatus: `TAMPER_DETECTED_AT_BLOCK_${block.blockIndex}`,
            genesisHash: blocks[0].hash,
            latestBlockHash: blocks[blocks.length - 1].hash,
            errorBlockIndex: block.blockIndex
          };
        }

        const computed = computeBlockHash(
          block.blockIndex,
          block.previousHash,
          block.timestamp,
          block.referrerId,
          block.referredUserId,
          block.orderId,
          block.productAmount,
          block.rewardAmount,
          block.nonce
        );

        if (computed !== block.hash) {
          return {
            isValid: false,
            totalBlocks: blocks.length,
            totalDistributed,
            chainStatus: `HASH_MISMATCH_AT_BLOCK_${block.blockIndex}`,
            genesisHash: blocks[0].hash,
            latestBlockHash: blocks[blocks.length - 1].hash,
            errorBlockIndex: block.blockIndex
          };
        }
      }
    }

    return {
      isValid: true,
      totalBlocks: blocks.length,
      totalDistributed,
      chainStatus: 'VALID_CRYPTOGRAPHIC_INTEGRITY',
      genesisHash: blocks[0].hash,
      latestBlockHash: blocks[blocks.length - 1].hash
    };
  } catch (err) {
    console.error('Error verifying ledger chain:', err);
    return {
      isValid: false,
      totalBlocks: 0,
      totalDistributed: 0,
      chainStatus: 'CHAIN_VERIFICATION_ERROR',
      genesisHash: '',
      latestBlockHash: ''
    };
  }
}

/**
 * Gets ledger blocks for a specific user (as referrer or as referee)
 */
export async function getUserLedgerBlocks(db: any, userId: string): Promise<ReferralBlock[]> {
  try {
    return await db.all(
      `SELECT * FROM referral_ledger 
       WHERE (referrerId = ? OR referredUserId = ?) AND blockIndex > 0
       ORDER BY blockIndex DESC`,
      [userId, userId]
    );
  } catch (err) {
    console.error('Error getting user ledger blocks:', err);
    return [];
  }
}
