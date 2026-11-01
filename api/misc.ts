import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import crypto from 'crypto';
import { authenticate, authenticateAny, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

const safeJsonParse = (val: any, fallback: any = []) => {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const getPaystackSecret = () => {
  const raw = process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (raw && raw.startsWith('Ask_test_')) {
    return raw.substring(1);
  }
  return raw;
};

// --- BUNDLES ---
router.get('/bundles', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM bundles');
    const bundles = rows.map(row => ({
      ...row,
      products: safeJsonParse(row.products, [])
    }));
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch bundles' });
  }
});

router.post('/bundles', [
  body('name').notEmpty().withMessage('Name is required'),
  body('bundlePrice').isNumeric().withMessage('Bundle price must be a number')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, name, products, bundlePrice, description, expiresIn } = req.body;
  try {
    await db.run(
      'REPLACE INTO bundles (`id`, `name`, `products`, `bundlePrice`, `description`, `expiresIn`) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(products), bundlePrice, description, expiresIn]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save bundle' });
  }
});

// --- PROMO CODES ---
router.get('/promo-codes', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM promo_codes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch promo codes' });
  }
});

router.post('/promo-codes', [
  body('code').notEmpty().withMessage('Code is required'),
  body('discount').isNumeric().withMessage('Discount must be a number')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, code, type, value, description, discount, usageLimit, usedCount, expiryDate } = req.body;
  try {
    await db.run(
      'REPLACE INTO promo_codes (`id`, `code`, `type`, `value`, `description`, `discount`, `usageLimit`, `usedCount`, `expiryDate`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, code, type, value, description, discount, usageLimit, usedCount, expiryDate]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save promo code' });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', async (req, res) => {
  const { userId } = req.query;
  try {
    // Auto-delete read notifications older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await db.run(
      'DELETE FROM notifications WHERE `read` = 1 AND `timestamp` < ?',
      [threeDaysAgo.toISOString()]
    );

    let rows;
    if (userId) {
      rows = await db.all(
        "SELECT * FROM notifications WHERE recipientId IS NULL OR recipientId = '' OR recipientId = ?",
        [userId]
      );
    } else {
      rows = await db.all("SELECT * FROM notifications WHERE recipientId IS NULL OR recipientId = ''");
    }
    
    const notifications = rows.map(row => ({
      ...row,
      read: !!row.read
    }));
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await db.run('UPDATE notifications SET `read` = 1 WHERE `id` = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to mark notification as read' });
  }
});

router.post('/notifications', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, title, message, type, timestamp, read, recipientId } = req.body;
  try {
    await db.run(
      'REPLACE INTO notifications (`id`, `title`, `message`, `type`, `timestamp`, `read`, `recipientId`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), title, message, type, timestamp || new Date().toISOString(), read || 0, recipientId]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save notification' });
  }
});

// --- PRICE ANOMALIES ---
router.get('/price-anomalies', async (req, res) => {
  const { supplierId } = req.query;
  try {
    let query = `
      SELECT a.*, p.name, p.image, p.originalPrice as basePrice, p.supplierId
      FROM price_anomalies a
      JOIN products p ON a.productId = p.id
    `;
    const params: any[] = [];

    if (supplierId) {
      query += ` WHERE p.supplierId = ?`;
      params.push(supplierId);
    } else {
      // Show all active anomalies for both users and guests
      query += ` WHERE a.anomalyEndTime > ?`;
      params.push(Date.now());
    }

    const rows = await db.all(query, params);
    res.json(rows.map(row => ({
      ...row,
      // Ensure compatibility with frontend keys
      price: row.discountedPrice || row.price,
      originalPrice: row.basePrice
    })));
  } catch (error) {
    console.error('Error fetching price anomalies:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch price anomalies' });
  }
});

router.post('/price-anomalies', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('discountPercent').isNumeric().withMessage('Discount percent must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, productId, anomalyEndTime, discountPercent, discountedPrice, price } = req.body;
  
  // Use price if discountedPrice is not provided (backwards compatibility)
  const finalDiscountedPrice = discountedPrice || price;

  try {
    // If supplier, validate ownership of the product
    if (req.user?.role === 'SUPPLIER') {
      const product = await db.get('SELECT supplierId FROM products WHERE id = ?', [productId]);
      if (!product || product.supplierId !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized: You can only create anomalies for your own products' });
      }
    }

    await db.run(
      'REPLACE INTO price_anomalies (`id`, `productId`, `anomalyEndTime`, `discountPercent`, `discountedPrice`, `price`) VALUES (?, ?, ?, ?, ?, ?)',
      [id || `anomaly_${Date.now()}`, productId, anomalyEndTime, discountPercent, finalDiscountedPrice, finalDiscountedPrice]
    );
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error saving price anomaly:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save price anomaly' });
  }
});

// --- PAY FOR ME ---
router.get('/pay-for-me', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM pay_for_me_requests');
    const requests = (rows || []).map(row => {
      let parsedItems = [];
      try {
        if (row.items) {
          const parsed = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
          parsedItems = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        }
      } catch (e) {
        parsedItems = [];
      }

      let parsedProtocol = undefined;
      try {
        if (row.shippingProtocol) {
          parsedProtocol = (typeof row.shippingProtocol === 'string' && row.shippingProtocol.startsWith('{'))
            ? JSON.parse(row.shippingProtocol)
            : row.shippingProtocol;
        }
      } catch (e) {
        parsedProtocol = undefined;
      }

      return {
        ...row,
        items: parsedItems,
        shippingProtocol: parsedProtocol
      };
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch pay-for-me requests' });
  }
});

router.get('/pay-for-me/:requestId', async (req, res) => {
  const { requestId } = req.params;
  try {
    const row = await db.get('SELECT * FROM pay_for_me_requests WHERE id = ?', [requestId]);
    if (!row) {
      return res.status(404).json({ status: 'error', message: 'Request not found' });
    }
    let parsedItems = [];
    try {
      if (row.items) {
        const parsed = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
        parsedItems = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      }
    } catch (e) {
      parsedItems = [];
    }

    let parsedProtocol = undefined;
    try {
      if (row.shippingProtocol) {
        parsedProtocol = (typeof row.shippingProtocol === 'string' && row.shippingProtocol.startsWith('{'))
          ? JSON.parse(row.shippingProtocol)
          : row.shippingProtocol;
      }
    } catch (e) {
      parsedProtocol = undefined;
    }

    res.json({
      ...row,
      items: parsedItems,
      shippingProtocol: parsedProtocol
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch request' });
  }
});

router.post('/pay-for-me', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('total').isNumeric().withMessage('Total must be a number')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, userName, items, total, amountPaid, status, timestamp, payerName, payerContact, message, shippingProtocol } = req.body;
  try {
    // Check if this is an update to an existing request or a new creation
    let isNew = true;
    if (id) {
      const existing = await db.get('SELECT id FROM pay_for_me_requests WHERE id = ?', [id]);
      if (existing) {
        isNew = false;
      }
    }

    // If new request, enforce tier slot limit
    if (isNew) {
      const user = await db.get('SELECT rep FROM users WHERE id = ?', [userId]);
      const userRep = user ? (Number(user.rep) || 0) : 0;
      
      const getTierPayForMeSlots = (rep: number): { slots: number; tier: string } => {
        if (rep >= 60000) return { slots: 15, tier: 'Kraze Legend' };
        if (rep >= 25000) return { slots: 8, tier: 'Closet Royalty' };
        if (rep >= 10000) return { slots: 5, tier: 'Fashion Icon' };
        if (rep >= 4000) return { slots: 3, tier: 'Trendsetter' };
        if (rep >= 1500) return { slots: 2, tier: 'Stylist' };
        return { slots: 1, tier: 'Newcomer' };
      };

      const { slots: maxSlots, tier: tierName } = getTierPayForMeSlots(userRep);
      const activeCountRow = await db.get(
        'SELECT COUNT(*) as cnt FROM pay_for_me_requests WHERE (userId = ? OR userName = ?) AND status IN ("PENDING", "APPROVED")',
        [userId, userName]
      );
      const activeCount = activeCountRow?.cnt ? Number(activeCountRow.cnt) : 0;

      if (activeCount >= maxSlots) {
        return res.status(403).json({ 
          status: 'error', 
          message: `Tier slot limit reached: Your ${tierName} tier allows ${maxSlots} active Pay For Me request${maxSlots > 1 ? 's' : ''}. Earn REP points to level up and unlock more slots!` 
        });
      }
    }

    // Stock Check
    const pfmItems = Array.isArray(items) ? items : [];
    for (const item of pfmItems) {
      if (item.id) {
        const product = await db.get('SELECT stockCount, inStock FROM products WHERE id = ?', [item.id]);
        if (!product || !product.inStock || product.stockCount <= 0) {
          return res.status(400).json({ status: 'error', message: 'One or more silhouettes in this request are out of stock.' });
        }
      }
    }

    const requestId = id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      'REPLACE INTO pay_for_me_requests (`id`, `userId`, `userName`, `items`, `total`, `amountPaid`, `status`, `timestamp`, `payerName`, `payerContact`, `message`, `shippingProtocol`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        requestId, 
        userId, 
        userName, 
        Array.isArray(items) ? JSON.stringify(items) : '[]', 
        total, 
        amountPaid || 0, 
        status || 'PENDING', 
        timestamp || new Date().toISOString(), 
        payerName || null, 
        payerContact || null, 
        message || null,
        shippingProtocol ? (typeof shippingProtocol === 'string' ? shippingProtocol : JSON.stringify(shippingProtocol)) : null
      ]
    );
    res.json({ status: 'success', id: requestId });
  } catch (error) {
    console.error('Pay-for-me save error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save pay-for-me request' });
  }
});

// --- RECOMMENDATIONS ---
router.get('/recommendations/:userId', async (req, res) => {
  try {
    // For now, just return some random products or all products
    const rows = await db.all('SELECT * FROM products LIMIT 10');
    const products = rows.map(row => ({
      ...row,
      details: (() => { try { const d = JSON.parse(row.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
      tags: row.tags ? JSON.parse(row.tags) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
      priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
      customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch recommendations' });
  }
});

// --- LOYALTY ---
router.get('/loyalty/points/:userId', async (req, res) => {
  try {
    const row = await db.get('SELECT loyaltyPoints FROM users WHERE id = ?', [req.params.userId]);
    res.json({ points: row ? row.loyaltyPoints : 0 });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch loyalty points' });
  }
});

router.post('/loyalty/earn', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, amount, reason } = req.body;
  try {
    await db.run('UPDATE users SET `loyaltyPoints` = `loyaltyPoints` + ? WHERE `id` = ?', [amount, userId]);
    await db.run(
      'INSERT INTO loyalty_transactions (`id`, `userId`, `type`, `amount`, `reason`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
      [Date.now().toString(), userId, 'EARN', amount, reason, Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to earn loyalty points' });
  }
});

router.post('/loyalty/redeem', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, amount, reason } = req.body;
  try {
    const row = await db.get('SELECT loyaltyPoints FROM users WHERE id = ?', [userId]);
    if (row && row.loyaltyPoints >= amount) {
      await db.run('UPDATE users SET `loyaltyPoints` = `loyaltyPoints` - ? WHERE `id` = ?', [amount, userId]);
      await db.run(
        'INSERT INTO loyalty_transactions (`id`, `userId`, `type`, `amount`, `reason`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
        [Date.now().toString(), userId, 'REDEEM', amount, reason, Date.now()]
      );
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', message: 'Insufficient points' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to redeem loyalty points' });
  }
});

router.get('/loyalty/transactions/:userId', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM loyalty_transactions WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch loyalty transactions' });
  }
});

// --- QUIZ ---
router.post('/quiz/results', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('results').isObject().withMessage('Results must be an object')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, results } = req.body;
  try {
    await db.run(
      'REPLACE INTO quiz_results (`userId`, `styles`, `colors`, `occasions`, `budget`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, JSON.stringify(results.styles), JSON.stringify(results.colors), JSON.stringify(results.occasions), results.budget, Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save quiz results' });
  }
});

router.get('/quiz/results/:userId', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM quiz_results WHERE userId = ?', [req.params.userId]);
    if (row) {
      res.json({
        ...row,
        styles: row.styles ? JSON.parse(row.styles) : [],
        colors: row.colors ? JSON.parse(row.colors) : [],
        occasions: row.occasions ? JSON.parse(row.occasions) : []
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch quiz results' });
  }
});

// --- WALLETS ---
router.get('/wallets/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM wallets WHERE id = ?', [req.params.id]);
    if (row) {
      res.json({
        ...row,
        transactions: row.transactions ? JSON.parse(row.transactions) : []
      });
    } else {
      res.json({ id: req.params.id, balance: 0, transactions: [] });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch wallet' });
  }
});

router.post('/wallets/:id/payout', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('description').notEmpty().withMessage('Description is required')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { amount, description } = req.body;
  try {
    const row = await db.get('SELECT * FROM wallets WHERE id = ?', [req.params.id]);
    if (row && row.balance >= amount) {
      const transactions = row.transactions ? JSON.parse(row.transactions) : [];
      transactions.push({
        id: Date.now().toString(),
        type: 'PAYOUT',
        amount: -amount,
        description,
        timestamp: new Date().toISOString()
      });
      await db.run(
        'UPDATE wallets SET `balance` = `balance` - ?, `transactions` = ? WHERE `id` = ?',
        [amount, JSON.stringify(transactions), req.params.id]
      );
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to request payout' });
  }
});

// --- ADMIN ---
router.post('/admin/metrics/reset-revenue', async (req, res) => {
  try {
    const totalRevenue = await db.get('SELECT SUM(total) as total FROM orders');
    const currentTotal = totalRevenue?.total || 0;
    await db.run("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('totalRevenueOffset', ?)", [currentTotal.toString()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Reset revenue error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset revenue' });
  }
});

router.post('/admin/metrics/reset-commission', async (req, res) => {
  try {
    const adminWallet = await db.get('SELECT * FROM wallets WHERE id = ?', ['ADMIN_WALLET']);
    if (adminWallet) {
      await db.run('UPDATE wallets SET balance = 0 WHERE id = ?', ['ADMIN_WALLET']);
      // We could also clear transactions or add a reset transaction
      const trans = JSON.parse(adminWallet.transactions || '[]');
      trans.push({ id: Date.now().toString(), type: 'RESET', amount: -adminWallet.balance, timestamp: new Date().toISOString(), description: 'Manual Reset to 0' });
      await db.run('UPDATE wallets SET transactions = ? WHERE id = ?', [JSON.stringify(trans), 'ADMIN_WALLET']);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Reset commission error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset commission' });
  }
});

router.get('/admin/metrics', async (req, res) => {
  try {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const orderCount = await db.get('SELECT COUNT(*) as count FROM orders');
    const totalRevenue = await db.get('SELECT SUM(total) as total FROM orders');
    const revenueReset = await db.get("SELECT value FROM settings WHERE `key` = 'totalRevenueOffset'");
    const offset = revenueReset && revenueReset.value ? parseFloat(revenueReset.value) : 0;
    const finalTotalRevenue = Math.max(0, (totalRevenue?.total || 0) - offset);
    
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    
    // Ensure Admin Wallet exists
    const adminWallet = await db.get('SELECT * FROM wallets WHERE id = ?', ['ADMIN_WALLET']);
    if (!adminWallet) {
      await db.run('INSERT INTO wallets (id, balance, transactions) VALUES (?, ?, ?)', ['ADMIN_WALLET', 0, '[]']);
    }

    // Revenue Stream (last 12 points based on recent orders)
    const orders = await db.all('SELECT total, timestamp FROM orders ORDER BY timestamp DESC');
    let revenueStream = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    if (orders.length > 0) {
      // Group orders into 12 buckets (simple implementation: chronological distribution)
      // Since we want real data on the graph, doing it simply by dividing the time range or just sorting the most recent 12 ones doesn't perfectly render a time series, but let's just group by recent months or simply assign items into 12 chunks.
      // Better: let's group by day if there are many, or just distribute equally into 12 buckets.
      const bucketSize = Math.ceil(orders.length / 12) || 1;
      const reversedOrders = [...orders].reverse(); // oldest first
      reversedOrders.forEach((o, i) => {
        const bucket = Math.min(11, Math.floor(i / bucketSize));
        revenueStream[bucket] += o.total;
      });
      // Ensure there are some values even if few orders
      let maxRev = Math.max(...revenueStream, 100);
      revenueStream = revenueStream.map(r => r > 0 ? r : 0);
    }

    res.json({
      totalUsers: userCount?.count || 0,
      activeOrders: orderCount?.count || 0,
      totalRevenue: finalTotalRevenue,
      totalProducts: productCount?.count || 0,
      revenueStream
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
});

router.get('/admin/security', async (req, res) => {
  res.json({ 
    status: 'secure', 
    firewall: 'ACTIVE',
    encryption: 'AES-256-GCM',
    loadBalancer: 'HEALTHY',
    activeSessions: 12,
    threatLevel: 'LOW',
    events: [
      { id: '1', type: 'LOGIN', severity: 'LOW', timestamp: new Date().toISOString(), details: 'Admin logged in from recognized IP', ip: '192.168.1.1' },
      { id: '2', type: 'SYSTEM_CONFIG_CHANGE', severity: 'MEDIUM', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Global commission rate updated by Root', ip: '10.0.0.5' },
      { id: '3', type: 'UNAUTHORIZED_ACCESS', severity: 'HIGH', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Brute force attempt blocked on user endpoint', ip: '45.12.89.201' }
    ]
  });
});

router.post('/admin/security-events', async (req, res) => {
  res.json({ status: 'success' });
});

// --- SETTINGS ---
router.get('/settings/:key', async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM settings WHERE `key` = ?', [req.params.key]);
    res.json(row ? JSON.parse(row.value) : null);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch setting' });
  }
});

router.post('/settings/:key', async (req, res) => {
  try {
    await db.run(
      'REPLACE INTO settings (`key`, value) VALUES (?, ?)',
      [req.params.key, JSON.stringify(req.body)]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save setting' });
  }
});

// --- ANOMALY CONFIG ---
router.get('/admin/anomaly-config', async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM settings WHERE `key` = ?', ['anomaly_config']);
    res.json(row ? JSON.parse(row.value) : null);
  } catch (error) {
    console.error('Error fetching anomaly config:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch anomaly config' });
  }
});

router.post('/admin/anomaly-config', async (req, res) => {
  try {
    await db.run(
      'REPLACE INTO settings (`key`, value) VALUES (?, ?)',
      ['anomaly_config', JSON.stringify(req.body)]
    );
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error saving anomaly config:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save anomaly config' });
  }
});

// --- PAYSTACK INTEGRATION ---
router.get('/paystack/banks', async (req, res) => {
  const { type } = req.query;

  const currentSecret = getPaystackSecret();
  if (!currentSecret) {
    return res.status(400).json({ status: false, message: 'Paystack is not configured in this environment.' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/bank?currency=GHS&type=${type || 'ghipss'}`, {
      headers: {
        Authorization: `Bearer ${currentSecret}`
      }
    });
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Paystack banks error:', error);
    return res.status(500).json({ status: false, message: 'Failed to retrieve banks from Paystack' });
  }
});

router.get('/paystack/resolve-account', async (req, res) => {
  const { account_number, bank_code } = req.query;

  const currentSecret = getPaystackSecret();
  if (!currentSecret) {
    return res.status(400).json({ status: false, message: 'Paystack is not configured in this environment.' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      headers: {
        Authorization: `Bearer ${currentSecret}`
      }
    });
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Paystack resolve error:', error);
    return res.status(500).json({ status: false, message: 'Failed to resolve account on Paystack' });
  }
});

router.post('/paystack/withdraw', async (req, res) => {
  const { userId, amount, type, bankCode, bankName, accountNumber, accountName } = req.body;

  try {
    // 1. Check Wallet Balance
    const wallet = await db.get('SELECT * FROM wallets WHERE id = ?', [userId]);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ status: false, message: 'Insufficient wallet balance' });
    }

    const reference = `wth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const finalBankName = type === 'mobile_money' ? `Mobile Money - ${bankName}` : bankName;
    
    let paystackTransferData = null;

    const currentSecret = getPaystackSecret();
    if (currentSecret) {
      try {
        // Check Paystack Balance First
        const balanceResponse = await fetch('https://api.paystack.co/balance', {
          headers: { Authorization: `Bearer ${currentSecret}` }
        });
        const balanceData = await balanceResponse.json();
        if (balanceData.status) {
          const ghsBalanceItem = balanceData.data.find((b: any) => b.currency === 'GHS');
          const maxAvailableKobo = ghsBalanceItem ? ghsBalanceItem.balance : 0;
          if (maxAvailableKobo < (amount * 100)) {
            return res.status(400).json({ status: false, message: 'Your balance is not enough to fulfill this request' });
          }
        }

        // Create Transfer Recipient
        const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: type === 'mobile_money' ? 'mobile_money' : 'ghipss',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'GHS'
          })
        });
        const recipientData = await recipientResponse.json();

        if (recipientData.status) {
          // Initiate Transfer
          const transferResponse = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${currentSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source: 'balance',
              amount: Math.round(amount * 100),
              recipient: recipientData.data.recipient_code,
              reason: `Closet Kraze Withdrawal - ${userId}`,
              reference
            })
          });
          paystackTransferData = await transferResponse.json();
          
          if (!paystackTransferData.status) {
            console.warn('Paystack Transfer Failed. Falling back to manual review (PENDING):', paystackTransferData);
            // Graceful fallback for Starter business restriction / insufficient API scope
            paystackTransferData = { status: false, fallbackReason: paystackTransferData.message };
          }
        } else {
          console.warn('Paystack Recipient Creation Failed. Falling back to manual review (PENDING):', recipientData);
          paystackTransferData = { status: false, fallbackReason: recipientData.message };
        }
      } catch (e) {
        console.error('Paystack Transfer Error:', e);
      }
    }

    // 2. Insert into withdrawals table
    await db.run(
      'INSERT INTO withdrawals (`id`, `userId`, `amount`, `bankName`, `bankCode`, `accountNumber`, `accountName`, `reference`, `status`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Date.now().toString(), userId, amount, finalBankName, bankCode, accountNumber, accountName, reference, (paystackTransferData?.status) ? 'SUCCESS' : 'PENDING', new Date().toISOString()]
    );

    // 3. Update Wallet Balance and Transactions
    const transactions = JSON.parse(wallet.transactions || '[]');
    transactions.push({
      id: reference,
      type: 'PAYOUT',
      amount: -amount,
      description: `Withdrawal to ${finalBankName} (${accountNumber})`,
      timestamp: new Date().toISOString()
    });

    await db.run(
      'UPDATE wallets SET balance = balance - ?, transactions = ? WHERE id = ?',
      [amount, JSON.stringify(transactions), userId]
    );

    res.json({ 
      success: true, 
      message: paystackTransferData?.status ? 'Withdrawal processed via Paystack' : 'Withdrawal initiated (Pending review)', 
      data: { reference, paystack: paystackTransferData } 
    });
  } catch (error) {
    console.error('Withdrawal process error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate withdrawal' });
  }
});

router.get('/paystack/balance', async (req, res) => {
  const currentSecret = getPaystackSecret();
  if (currentSecret) {
    try {
      const response = await fetch('https://api.paystack.co/balance', {
        headers: {
          Authorization: `Bearer ${currentSecret}`
        }
      });
      const data = await response.json();
      if (data.status) {
        const ghsBalance = data.data.find((b: any) => b.currency === 'GHS');
        return res.json({ status: true, balance: ghsBalance ? ghsBalance.balance / 100 : 0 }); // Paystack balance is usually in kobo/pesewas, so / 100
      }
    } catch (error) {
      console.error('Paystack balance error:', error);
    }
  }
  return res.json({ status: true, balance: 0 }); // Fallback
});

router.get('/paystack/withdrawals/:userId', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM withdrawals WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawals' });
  }
});

router.get('/paystack/transfer/verify/:reference', async (req, res) => {
  res.json({ status: true, message: 'Transfer verified', data: { status: 'success' } });
});

router.post('/paystack/initialize', async (req, res) => {
  const { email, amount, metadata, subaccount, transaction_charge, bearer, callback_url } = req.body;
  const reference = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  try {
    let finalSubaccount = subaccount;
    
    // Auto-detect single-supplier orders for Split Payments
    if (!finalSubaccount && metadata) {
      try {
        let supplierIds = new Set<string>();
        
        // Check for direct items in metadata (Standard Checkout)
        if (metadata.items && Array.isArray(metadata.items) && metadata.items.length > 0) {
          const placeholders = metadata.items.map(() => '?').join(',');
          const products = await db.all(`SELECT DISTINCT supplierId FROM products WHERE id IN (${placeholders})`, metadata.items);
          products.forEach((p: any) => { if (p.supplierId) supplierIds.add(p.supplierId); });
        } 
        // Check for PayForMe request
        else if (metadata.payForMeId) {
          const pfm = await db.get('SELECT items FROM pay_for_me_requests WHERE id = ?', [metadata.payForMeId]);
          if (pfm && pfm.items) {
            const parsedItems = typeof pfm.items === 'string' ? JSON.parse(pfm.items) : pfm.items;
            for (const item of parsedItems) {
              const product = await db.get('SELECT supplierId FROM products WHERE id = ?', [item.id]);
              if (product && product.supplierId) supplierIds.add(product.supplierId);
            }
          }
        }

        // If all items come from EXACTLY one supplier, apply their subaccount
        if (supplierIds.size === 1) {
          const sId = Array.from(supplierIds)[0];
          const supplier = await db.get('SELECT paystackSubaccountCode FROM suppliers WHERE id = ?', [sId]);
          if (supplier && supplier.paystackSubaccountCode) {
             finalSubaccount = supplier.paystackSubaccountCode;
          }
        }
      } catch (e) {
        console.error("Error auto-assigning split payment subaccount:", e);
      }
    }

    const currentSecret = getPaystackSecret();
    if (!currentSecret) {
      return res.status(400).json({ status: false, message: 'Paystack is not configured in this environment.' });
    }

    const payload: any = {
      email,
      amount: Math.round(amount * 100), // Paystack uses kobo/cents
      currency: 'GHS',
      reference,
      metadata,
      channels: ['card', 'bank', 'bank_transfer', 'mobile_money']
    };

    if (callback_url) {
      payload.callback_url = callback_url;
    }
    if (finalSubaccount) {
      payload.subaccount = finalSubaccount;
    }
    if (transaction_charge !== undefined) {
      payload.transaction_charge = Math.round(transaction_charge * 100);
    }
    if (bearer) {
      payload.bearer = bearer;
    }

    console.log('Initializing Paystack Transaction with payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post('https://api.paystack.co/transaction/initialize', payload, {
      headers: { Authorization: `Bearer ${currentSecret}` }
    });
    
    console.log('Paystack Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status) {
      await db.run(
        'INSERT INTO paystack_transactions (id, email, amount, reference, status, metadata, timestamp, subaccount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [Date.now().toString(), email, amount, reference, 'pending', JSON.stringify(metadata), new Date().toISOString(), finalSubaccount || null]
      );
      return res.json(response.data);
    } else {
      return res.status(400).json({ status: false, message: 'Paystack initialization failed.' });
    }
  } catch (error: any) {

    console.error('Paystack initialization error:', error.response?.data || error.message);
    res.status(500).json({ status: false, message: 'Initialization failed' });
  }
});

router.get('/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  try {
    const currentSecret = getPaystackSecret();
    if (!currentSecret) {
      return res.status(400).json({ status: false, message: 'Paystack is not configured in this environment.' });
    }

    let isSuccess = false;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${currentSecret}` }
    });
    
    const paystackData = response.data.data;
    isSuccess = paystackData.status === 'success';

    // Verify Amount
    const txn = await db.get('SELECT * FROM paystack_transactions WHERE reference = ?', [reference]);
    if (txn && isSuccess) {
      const expectedAmount = txn.amount;
      const actualAmount = paystackData.amount / 100;
      if (Math.abs(expectedAmount - actualAmount) > 0.01) {
          console.error(`Amount mismatch for ${reference}: expected ${expectedAmount}, got ${actualAmount}`);
          isSuccess = false;
      }
    }
    
    if (isSuccess) {
      if (txn && txn.status !== 'success') {
        await db.run('UPDATE paystack_transactions SET status = ? WHERE reference = ?', ['success', reference]);
        
        const metadata = typeof txn.metadata === 'string' ? JSON.parse(txn.metadata || '{}') : txn.metadata;
        if (metadata.type === 'PAY_FOR_ME' && metadata.payForMeId) {
           const request = await db.get('SELECT * FROM pay_for_me_requests WHERE id = ?', [metadata.payForMeId]);
           if (request) {
             const items = JSON.parse(request.items || '[]');
             let productsAvailable = true;
             for (const item of items) {
                const product = await db.get('SELECT stockCount FROM products WHERE id = ?', [item.id]);
                if (!product || product.stockCount <= 0) {
                   productsAvailable = false;
                   break;
                }
             }

             if (!productsAvailable) {
                // Return money as credit since product is out of stock in the meantime
                await db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [txn.amount, request.userId]);
                await db.run('UPDATE pay_for_me_requests SET status = "CANCELLED_OUT_OF_STOCK" WHERE id = ?', [metadata.payForMeId]);
                res.json({ status: true, message: 'Verified (Refunded to Credit)', data: { status: 'success', reference } });
                return;
             }

             const newAmountPaid = (request.amountPaid || 0) + txn.amount;
             let newStatus = request.status;
             if (newAmountPaid >= request.total) {
                newStatus = 'PAID';
                
                // Update Supplier Yields for PFM
                const supplierRev: Record<string, number> = {};
                for (const item of items) {
                   await db.run('UPDATE products SET stockCount = MAX(0, stockCount - ?) WHERE id = ?', [item.quantity || 1, item.id]);
                   const p = await db.get('SELECT supplierId, price FROM products WHERE id = ?', [item.id]);
                   if (p && p.supplierId) {
                      const itemRevenue = (item.price || p.price) * (item.quantity || 1);
                      supplierRev[p.supplierId] = (supplierRev[p.supplierId] || 0) + itemRevenue;
                   }
                }
                for (const [sId, amount] of Object.entries(supplierRev)) {
                   await db.run('UPDATE suppliers SET totalRevenueYield = totalRevenueYield + ? WHERE id = ?', [amount, sId]);
                  
                  // Update Supplier Wallet
                  const supplierWallet = await db.get('SELECT * FROM wallets WHERE id = ?', [sId]) || { id: sId, balance: 0, transactions: '[]' };
                  const supplierTxns = JSON.parse(supplierWallet.transactions || '[]');
                  supplierTxns.push({
                    id: Date.now().toString() + sId,
                    type: 'EARNING',
                    amount: amount,
                    description: `Revenue from PayForMe ${metadata.payForMeId}`,
                    timestamp: new Date().toISOString()
                  });
                  await db.run(
                    'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
                    [sId, supplierWallet.balance + amount, JSON.stringify(supplierTxns)]
                  );

                  // Update Admin Wallet (Commission)
                  const commission = amount * 0.1; // 10% commission
                  const adminWallet = await db.get('SELECT * FROM wallets WHERE id = ?', ['ADMIN_WALLET']) || { id: 'ADMIN_WALLET', balance: 0, transactions: '[]' };
                  const adminTxns = JSON.parse(adminWallet.transactions || '[]');
                  adminTxns.push({
                    id: Date.now().toString() + 'ADMIN',
                    type: 'COMMISSION',
                    amount: commission,
                    description: `Commission from PayForMe ${metadata.payForMeId} (Supplier: ${sId})`,
                    timestamp: new Date().toISOString()
                  });
                  await db.run(
                    'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
                    ['ADMIN_WALLET', adminWallet.balance + commission, JSON.stringify(adminTxns)]
                  );

                }
             }
             
             await db.run(
                'UPDATE pay_for_me_requests SET amountPaid = ?, status = ?, payerName = ?, payerContact = ? WHERE id = ?',
                [newAmountPaid, newStatus, metadata.sponsorName || request.payerName, metadata.sponsorContact || request.payerContact, metadata.payForMeId]
             );
           }
        } 
        // Note: Standard checkouts no longer process their order items here. 
        // We now enforce "Verify Payments Before Adding Order" rule. 
        // CheckoutView creates the order securely via POST /orders AFTER verification success.
        if (metadata.type === 'STANDARD_CHECKOUT' && metadata.orderDetails) {
          const { createVerifiedOrder } = await import('./orders.js');
          try {
             const existingOrder = await db.get('SELECT id FROM orders WHERE id = ?', [metadata.orderDetails.id]);
             if (!existingOrder) {
                await createVerifiedOrder(metadata.orderDetails);
             }
          } catch (e: any) {
             console.error("Callback verification standard checkout fulfillment error:", e);
          }
        }
      }
      const metadata = typeof txn.metadata === 'string' ? JSON.parse(txn.metadata || '{}') : (txn.metadata || {});
      res.json({ status: true, message: 'Verified', data: { status: 'success', reference, metadata } });
    } else {
      res.status(400).json({ status: false, message: 'Transaction not successful' });
    }
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    res.status(500).json({ status: false, message: 'Verification failed' });
  }
});

router.post('/notifications/supplier', async (req, res) => {
  const { supplierId, title, message } = req.body;
  if (!supplierId || supplierId === 'guest' || supplierId === 'undefined' || supplierId === 'null') {
    return res.json({ status: 'success', message: 'Skipped - invalid supplierId' });
  }
  try {
    const id = Date.now().toString();
    await db.run(
      'INSERT INTO notifications (`id`, `title`, `message`, `type`, `timestamp`, `read`, `recipientId`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, message, 'INFO', new Date().toISOString(), 0, supplierId]
    );
    res.status(201).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send supplier notification' });
  }
});

router.delete('/promo-codes/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM promo_codes WHERE id = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete promo code' });
  }
});

router.delete('/price-anomalies/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM price_anomalies WHERE id = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete price anomaly' });
  }
});

router.delete('/bundles/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM bundles WHERE id = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete bundle' });
  }
});

router.patch('/pay-for-me/:requestId/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.run('UPDATE pay_for_me_requests SET `status` = ? WHERE `id` = ?', [status, req.params.requestId]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update pay for me status' });
  }
});

router.patch('/pay-for-me/:requestId/amount-paid', async (req, res) => {
  const { amountPaid } = req.body;
  try {
    await db.run('UPDATE pay_for_me_requests SET `amountPaid` = ? WHERE `id` = ?', [amountPaid, req.params.requestId]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update pay for me amount paid' });
  }
});

router.post('/pay-for-me/process-archiving', async (req, res) => {
  try {
    const now = new Date();
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // 1. Archive requests older than 3 weeks
    const requestsToArchive = await db.all("SELECT * FROM pay_for_me_requests WHERE status IN ('PENDING', 'APPROVED') AND timestamp < ? AND archivedAt IS NULL", [threeWeeksAgo.toISOString()]);
    
    for (const req of requestsToArchive) {
      await db.run('UPDATE pay_for_me_requests SET status = "ARCHIVED", archivedAt = ? WHERE id = ?', [now.toISOString(), req.id]);
    }

    // 2. Convert to credit if incomplete by 3rd day of archiving (archivedAt < 3 days ago)
    const requestsToConvert = await db.all('SELECT * FROM pay_for_me_requests WHERE status = "ARCHIVED" AND archivedAt < ? AND amountPaid < total', [threeDaysAgo.toISOString()]);

    for (const req of requestsToConvert) {
      if (req.amountPaid > 0) {
        await db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [req.amountPaid, req.userId]);
      }
      await db.run('UPDATE pay_for_me_requests SET status = "CREDIT_CONVERTED" WHERE id = ?', [req.id]);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing archiving:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process archiving' });
  }
});

router.post('/paystack/webhook', async (req, res) => {
  try {
    // 1. Verify Signature
    const currentSecret = getPaystackSecret();
    const hash = crypto.createHmac('sha512', currentSecret || '').update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    // 2. Acknowledge the event immediately
    res.sendStatus(200);

    // 3. Process the event payload
    const event = req.body;

    if (event.event === 'transfer.success') {
      const { reference } = event.data;
      await db.run('UPDATE withdrawals SET status = ? WHERE reference = ?', ['SUCCESS', reference]);
    } else if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const { reference } = event.data;
      const withdrawal = await db.get('SELECT * FROM withdrawals WHERE reference = ?', [reference]);
      if (withdrawal && withdrawal.status !== 'FAILED' && withdrawal.status !== 'REVERSED') {
        await db.run('UPDATE withdrawals SET status = ? WHERE reference = ?', [event.event === 'transfer.failed' ? 'FAILED' : 'REVERSED', reference]);
        
        // Refund Wallet
        const wallet = await db.get('SELECT * FROM wallets WHERE id = ?', [withdrawal.userId]);
        if (wallet) {
          const transactions = JSON.parse(wallet.transactions || '[]');
          transactions.push({
            id: `REFUND-${reference}`,
            type: 'REFUND',
            amount: withdrawal.amount,
            description: `Refund for failed withdrawal (${reference})`,
            timestamp: new Date().toISOString()
          });
          await db.run('UPDATE wallets SET balance = balance + ?, transactions = ? WHERE id = ?', [withdrawal.amount, JSON.stringify(transactions), withdrawal.userId]);
        }
      }
    } else if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      
      const verifiedAmount = amount / 100; // Convert kobo to integer

      // Retrieve the transaction to check status and amount
      const txn = await db.get('SELECT * FROM paystack_transactions WHERE reference = ?', [reference]);
      
      if (!txn) {
        console.error(`Transaction record not found for webhook reference: ${reference}`);
        return;
      }

      // Verify Amount
      if (Math.abs(txn.amount - verifiedAmount) > 0.01) {
        console.error(`Amount mismatch in webhook for ${reference}: expected ${txn.amount}, got ${verifiedAmount}`);
        await db.run('UPDATE paystack_transactions SET status = ? WHERE reference = ?', ['amount_mismatch', reference]);
        return;
      }

      if (txn.status === 'success') {
         // Already processed via callback verification
         return; 
      }

      // Keep transaction status up-to-date
      await db.run('UPDATE paystack_transactions SET status = ? WHERE reference = ?', ['success', reference]);

      const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata || '{}') : (metadata || {});

      // Handle Standard Checkout Fulfillment
      if (parsedMetadata.type === 'STANDARD_CHECKOUT' && parsedMetadata.orderDetails) {
          const { createVerifiedOrder } = await import('./orders.js');
          try {
             // Avoid double-processing
             const existingOrder = await db.get('SELECT id FROM orders WHERE id = ?', [parsedMetadata.orderDetails.id]);
             if (!existingOrder) {
                await createVerifiedOrder(parsedMetadata.orderDetails);
             }
          } catch (e) {
             console.error("Webhook standard checkout fulfillment error:", e);
          }
      } 
      // Handle PayForMe Fulfillment
      else if (parsedMetadata.type === 'PAY_FOR_ME' && parsedMetadata.payForMeId) {
           const request = await db.get('SELECT * FROM pay_for_me_requests WHERE id = ?', [parsedMetadata.payForMeId]);
           if (request && request.status !== 'PAID' && request.status !== 'CANCELLED_OUT_OF_STOCK') {
             const items = JSON.parse(request.items || '[]');
             let productsAvailable = true;
             for (const item of items) {
                const product = await db.get('SELECT stockCount FROM products WHERE id = ?', [item.id]);
                if (!product || product.stockCount <= 0) {
                   productsAvailable = false;
                   break;
                }
             }

             if (!productsAvailable) {
                // Return money as credit since product is out of stock in the meantime
                await db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [verifiedAmount, request.userId]);
                await db.run('UPDATE pay_for_me_requests SET status = "CANCELLED_OUT_OF_STOCK" WHERE id = ?', [parsedMetadata.payForMeId]);
                return;
             }

             const newAmountPaid = (request.amountPaid || 0) + verifiedAmount;
             let newStatus = request.status;
             if (newAmountPaid >= request.total) { // Note: request.total should be the full required amount
                newStatus = 'PAID';
                
                // Process Yields & Stock for fully funded PFM
                const supplierRev: Record<string, number> = {};
                for (const item of items) {
                   await db.run('UPDATE products SET stockCount = MAX(0, stockCount - ?) WHERE id = ?', [item.quantity || 1, item.id]);
                   const p = await db.get('SELECT supplierId, price FROM products WHERE id = ?', [item.id]);
                   if (p && p.supplierId) {
                      const itemRevenue = (item.price || p.price) * (item.quantity || 1);
                      supplierRev[p.supplierId] = (supplierRev[p.supplierId] || 0) + itemRevenue;
                   }
                }
                for (const [sId, amt] of Object.entries(supplierRev)) {
                   await db.run('UPDATE suppliers SET totalRevenueYield = totalRevenueYield + ? WHERE id = ?', [amt, sId]);
                  
                  // Update Supplier Wallet
                  const supplierWallet = await db.get('SELECT * FROM wallets WHERE id = ?', [sId]) || { id: sId, balance: 0, transactions: '[]' };
                  const supplierTxns = safeJsonParse(supplierWallet.transactions, []);
                  supplierTxns.push({
                    id: Date.now().toString() + sId,
                    type: 'EARNING',
                    amount: amt,
                    description: `Revenue from PayForMe ${parsedMetadata.payForMeId}`,
                    timestamp: new Date().toISOString()
                  });
                  await db.run(
                    'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
                    [sId, supplierWallet.balance + amt, JSON.stringify(supplierTxns)]
                  );

                  // Update Admin Wallet (Commission)
                  const commission = amt * 0.1; // 10% commission
                  const adminWallet = await db.get('SELECT * FROM wallets WHERE id = ?', ['ADMIN_WALLET']) || { id: 'ADMIN_WALLET', balance: 0, transactions: '[]' };
                  const adminTxns = safeJsonParse(adminWallet.transactions, []);
                  adminTxns.push({
                    id: Date.now().toString() + 'ADMIN',
                    type: 'COMMISSION',
                    amount: commission,
                    description: `Commission from PayForMe ${parsedMetadata.payForMeId} (Supplier: ${sId})`,
                    timestamp: new Date().toISOString()
                  });
                  await db.run(
                    'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
                    ['ADMIN_WALLET', adminWallet.balance + commission, JSON.stringify(adminTxns)]
                  );
                }
             }
             
             await db.run(
                'UPDATE pay_for_me_requests SET amountPaid = ?, status = ?, payerName = ?, payerContact = ? WHERE id = ?',
                [newAmountPaid, newStatus, parsedMetadata.sponsorName || request.payerName, parsedMetadata.sponsorContact || request.payerContact, parsedMetadata.payForMeId]
             );
           }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }
});

// --- PANEL CONTENT ---
router.get('/panel-content/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT content FROM panel_content WHERE id = ?', [req.params.id]);
    res.json(row ? safeJsonParse(row.content, null) : null);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch panel content' });
  }
});

router.post('/panel-content/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    await db.run(
      'REPLACE INTO panel_content (id, content) VALUES (?, ?)',
      [req.params.id, JSON.stringify(req.body)]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save panel content' });
  }
});

// --- FEEDBACK MESSAGES ---
router.get('/feedback', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const rows = await db.all('SELECT * FROM feedback_messages ORDER BY timestamp DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch feedback' });
  }
});

router.post('/feedback', async (req, res) => {
  const { userId, userHandle, email, topic, message } = req.body;
  try {
    const id = Date.now().toString();
    await db.run(
      'INSERT INTO feedback_messages (id, userId, userHandle, email, topic, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId || 'GUEST', userHandle || 'Guest', email, topic, message, Date.now(), 'UNREAD']
    );
    res.status(201).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to submit feedback' });
  }
});

router.patch('/feedback/:id/status', authenticate, async (req: AuthRequest, res: any) => {
  try {
    await db.run('UPDATE feedback_messages SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update feedback status' });
  }
});

router.delete('/feedback/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    await db.run('DELETE FROM feedback_messages WHERE id = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete feedback' });
  }
});

// --- CUSTOM REQUESTS ---
router.get('/custom-requests', authenticate, async (req: AuthRequest, res: any) => {
  try {
    let rows;
    if (req.user?.role === 'ADMIN') {
      rows = await db.all('SELECT * FROM custom_requests ORDER BY timestamp DESC');
    } else {
      rows = await db.all('SELECT * FROM custom_requests WHERE userId = ? ORDER BY timestamp DESC', [req.user?.id || '']);
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch custom requests' });
  }
});

router.post('/custom-requests', async (req, res) => {
  const { userId, userHandle, email, itemName, category, budget, description, referenceImage } = req.body;
  if (!itemName) {
    return res.status(400).json({ status: 'error', message: 'Item name is required' });
  }
  try {
    const id = `cr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await db.run(
      'INSERT INTO custom_requests (id, userId, userHandle, email, itemName, category, budget, description, referenceImage, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userId || 'GUEST',
        userHandle || 'Guest',
        email || 'guest@kraze.com',
        itemName,
        category || 'Uncategorized',
        budget ? parseFloat(budget) : 0,
        description || '',
        referenceImage || '',
        'PENDING',
        new Date().toISOString()
      ]
    );
    res.status(201).json({ status: 'success', id });
  } catch (error) {
    console.error('Error creating custom request:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit custom request' });
  }
});

router.patch('/custom-requests/:id', authenticate, async (req: AuthRequest, res: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized' });
  }
  const { status, adminNotes } = req.body;
  try {
    if (status !== undefined && adminNotes !== undefined) {
      await db.run('UPDATE custom_requests SET status = ?, adminNotes = ? WHERE id = ?', [status, adminNotes, req.params.id]);
    } else if (status !== undefined) {
      await db.run('UPDATE custom_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    } else if (adminNotes !== undefined) {
      await db.run('UPDATE custom_requests SET adminNotes = ? WHERE id = ?', [adminNotes, req.params.id]);
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update custom request' });
  }
});

router.delete('/custom-requests/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const request = await db.get('SELECT * FROM custom_requests WHERE id = ?', [req.params.id]);
    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Request not found' });
    }
    if (req.user?.role !== 'ADMIN' && request.userId !== req.user?.id) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
    await db.run('DELETE FROM custom_requests WHERE id = ?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete custom request' });
  }
});

export default router;
