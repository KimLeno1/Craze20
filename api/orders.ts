import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import { authenticate, authenticateAny, AuthRequest, authorize } from '../middleware/auth.js';
import { recordReferralRewardBlock } from './referralBlockchain.js';

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

router.get('/', authenticateAny, async (req: AuthRequest, res: any) => {
  try {
    let rows;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const querySupplierId = req.query.supplierId as string;

    if (userRole === 'ADMIN') {
      rows = await db.all('SELECT * FROM orders');
    } else if (userRole === 'SUPPLIER') {
      // If a supplier is logged in, they should only see their own orders unless requested otherwise (but still limited to their products)
      const effectiveSupplierId = userId;
      rows = await db.all('SELECT * FROM orders');
    } else {
      rows = await db.all('SELECT * FROM orders WHERE userId = ?', [userId]);
    }

    let orders = rows.map(row => ({
      ...row,
      items: safeJsonParse(row.items, [])
    }));

    // If filtering by supplier is needed (either logged in supplier or admin filtering)
    const filterBySupplierId = userRole === 'SUPPLIER' ? userId : querySupplierId;

    if (filterBySupplierId) {
      const supplierProducts = await db.all('SELECT id FROM products WHERE supplierId = ?', [filterBySupplierId]);
      const supplierProductIds = new Set(supplierProducts.map(p => p.id));
      
      orders = orders.filter(o => 
        Array.isArray(o.items) && o.items.some((item: any) => supplierProductIds.has(item.id))
      ).map(o => ({
        ...o,
        // Only show items that belong to this supplier
        items: Array.isArray(o.items) ? o.items.filter((item: any) => supplierProductIds.has(item.id)) : []
      }));
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
  }
});

export async function createVerifiedOrder(payload: any) {
  const { id, userId, userName, items, total, status, timestamp, trackingNumber, deliveryAddress, phone, creditUsed } = payload;
  
  // 1. Check stock for each item before proceeding
  for (const item of items) {
    if (item.id) {
      if (item.id.toString().startsWith('bundle_')) {
        const bundle = await db.get('SELECT * FROM bundles WHERE id = ?', [item.id]);
        if (!bundle) {
          throw new Error(`Bundle ${item.id} not found`);
        }
        // Optionally check products within bundle
        const bundleProducts = safeJsonParse(bundle.products, []);
        for (const bp of bundleProducts) {
            const product = await db.get('SELECT stockCount, name FROM products WHERE id = ?', [bp.id || bp]);
            if (product && product.stockCount < (item.quantity || 1)) {
              throw new Error(`One or more items in the bundle "${bundle.name}" is out of stock`);
            }
        }
      } else {
        const product = await db.get('SELECT stockCount, name FROM products WHERE id = ?', [item.id]);
        if (!product) {
          throw new Error(`Product ${item.id} not found`);
        }
        if (product.stockCount < (item.quantity || 1)) {
          throw new Error("That's all in stock");
        }
      }
    }
  }

  // Check if this is the user's first order before we insert it
  const orderCountRes = await db.get('SELECT COUNT(*) as count FROM orders WHERE userId = ?', [userId]);
  const isFirstPurchase = (orderCountRes?.count || 0) === 0;

  // 2. Insert Order
  await db.run(
    'INSERT INTO orders (`id`, `userId`, `userName`, `items`, `total`, `status`, `timestamp`, `trackingNumber`, `deliveryAddress`, `phone`, `creditUsed`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, userName, JSON.stringify(items), total, status, timestamp, trackingNumber, deliveryAddress, phone, creditUsed]
  );

  // KFAM Lifetime Referral Program:
  // "if the person they referred makes a purchase they get 10% of the product amount as credit round to the nearest whole number for life and you cant use the referal code of some one you referred, make sure to keep track of everything use blockchain method if you have to just let it work"
  try {
    const referral = await db.get('SELECT * FROM referrals WHERE (referredId = ? OR refereeId = ?)', [userId, userId]);
    let referrerId = referral?.referrerId;
    if (!referrerId) {
      const userRow = await db.get('SELECT referredBy FROM users WHERE id = ?', [userId]);
      referrerId = userRow?.referredBy;
    }

    if (referrerId && referrerId !== userId && referrerId !== 'guest' && referrerId !== 'undefined' && referrerId !== 'null') {
      // Calculate product amount (sum of product prices * quantities)
      let productAmount = 0;
      if (Array.isArray(items) && items.length > 0) {
        productAmount = items.reduce((sum: number, it: any) => {
          const p = Number(it.price) || 0;
          const q = Number(it.quantity) || 1;
          return sum + (p * q);
        }, 0);
      } else {
        productAmount = Number(total) || 0;
      }

      // 10% of the product amount rounded to the nearest whole number
      const bonusCredit = Math.round(productAmount * 0.10);

      if (bonusCredit > 0) {
        // Prevent duplicate ledger entry for the same order
        const existingBlock = await db.get('SELECT id FROM referral_ledger WHERE orderId = ?', [id]);
        if (!existingBlock) {
          // Record on immutable blockchain ledger
          const newBlock = await recordReferralRewardBlock(db, {
            referrerId,
            referredUserId: userId,
            orderId: id,
            productAmount,
            rewardAmount: bonusCredit,
            metadata: {
              itemsCount: Array.isArray(items) ? items.length : 1,
              orderTotal: total,
              buyerName: userName || 'Friend'
            }
          });

          // Update referrals record
          if (referral) {
            await db.run(
              `UPDATE referrals SET rewardAmount = rewardAmount + ?, status = 'completed', completedAt = ? WHERE id = ?`,
              [bonusCredit, new Date().toISOString(), referral.id]
            );
          } else {
            const refId = `ref_auto_${Date.now()}`;
            await db.run(
              `INSERT INTO referrals (id, referrerId, refereeId, referredId, code, status, rewardAmount, createdAt, completedAt)
               VALUES (?, ?, ?, ?, 'AUTO_LIFETIME', 'completed', ?, ?, ?)`,
              [refId, referrerId, userId, userId, bonusCredit, new Date().toISOString(), new Date().toISOString()]
            );
          }

          // Credit referrer with store credit
          const referrer = await db.get('SELECT credit, rep FROM users WHERE id = ?', [referrerId]);
          if (referrer) {
            const newReferrerCredit = (referrer.credit || 0) + bonusCredit;
            await db.run('UPDATE users SET credit = ? WHERE id = ?', [newReferrerCredit, referrerId]);
            await db.run('UPDATE user_stats SET storeCredit = ? WHERE userId = ?', [newReferrerCredit, referrerId]);

            // Notification for referrer with blockchain verification details
            const notificationId = `notif_ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const buyerName = userName || 'A referred friend';
            await db.run(
              'INSERT INTO notifications (id, title, message, type, timestamp, read, recipientId) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                notificationId,
                'KFAM Lifetime Referral Reward! 🎉',
                `Your friend ${buyerName} made a purchase of GH₵${productAmount}! You earned GH₵${bonusCredit} store credit (10% lifetime commission, rounded to nearest whole number). Verified on Blockchain Block #${newBlock.blockIndex} [${newBlock.hash.slice(0, 10)}...].`,
                'ALERT',
                new Date().toISOString(),
                0,
                referrerId
              ]
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing lifetime referral reward:', err);
  }

  // 3. Deduct stock and handle out-of-stock Pay For Me, AND Update Supplier Revenues
  // Ensure accurate revenue tracking
  const supplierRev: Record<string, number> = {};
  
  for (const item of items) {
    if (item.id) {
      const itemsToUpdate = [];
      if (item.id.toString().startsWith('bundle_')) {
        const bundle = await db.get('SELECT products FROM bundles WHERE id = ?', [item.id]);
        if (bundle) {
          const bundleProducts = safeJsonParse(bundle.products, []);
          for (const bp of bundleProducts) {
              itemsToUpdate.push({ id: bp.id || bp, quantity: item.quantity || 1 });
          }
        }
      } else {
        itemsToUpdate.push({ id: item.id, quantity: item.quantity || 1, price: item.price });
      }

      for (const target of itemsToUpdate) {
        // Update stock
        await db.run('UPDATE products SET stockCount = MAX(0, stockCount - ?) WHERE id = ?', [target.quantity, target.id]);
        
        // Get product for supplier tracking
        const p = await db.get('SELECT supplierId, price FROM products WHERE id = ?', [target.id]);
        if (p && p.supplierId) {
          const itemRevenue = (target.price || p.price) * (target.quantity || 1);
          supplierRev[p.supplierId] = (supplierRev[p.supplierId] || 0) + itemRevenue;
        }

        // Check if now out of stock
        const updatedProduct = await db.get('SELECT stockCount FROM products WHERE id = ?', [target.id]);
        if (updatedProduct && updatedProduct.stockCount <= 0) {
          await db.run('UPDATE products SET inStock = 0 WHERE id = ?', [target.id]);
          
          // Find Pay For Me requests containing this product
          const pfmRequests = await db.all("SELECT * FROM pay_for_me_requests WHERE status IN ('PENDING', 'APPROVED')");
          for (const pfm of pfmRequests) {
            const pfmItems = safeJsonParse(pfm.items, []);
            const hasProduct = Array.isArray(pfmItems) && pfmItems.some((pi: any) => pi.id === target.id);
            
            if (hasProduct) {
              // Close request
              await db.run('UPDATE pay_for_me_requests SET status = "CANCELLED_OUT_OF_STOCK" WHERE id = ?', [pfm.id]);
              
              // Refund amountPaid as Store Credit
              if (pfm.amountPaid > 0) {
                await db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [pfm.amountPaid, pfm.userId]);
                
                // Notify user
                if (pfm.userId && pfm.userId !== 'guest' && pfm.userId !== 'undefined' && pfm.userId !== 'null') {
                  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                  await db.run(
                    'INSERT INTO notifications (id, title, message, type, timestamp, read, recipientId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                      notificationId,
                      'Pay For Me Cancelled',
                      `Your Pay For Me request for an item that is now out of stock has been cancelled. Contributed balance of ${pfm.amountPaid} has been added to your store credit.`,
                      'ALERT',
                      new Date().toISOString(),
                      0,
                      pfm.userId
                    ]
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  // Apply revenue yield to suppliers and track wallets
  for (const [sId, totalItemRevenue] of Object.entries(supplierRev)) {
      // Fetch supplier for commission rate
      const supplier = await db.get('SELECT commissionRate FROM suppliers WHERE id = ?', [sId]);
      const rate = supplier ? (supplier.commissionRate / 100) : 0.1; // fallback to 10%
      
      const commission = totalItemRevenue * rate;
      const amountAfterCommission = totalItemRevenue - commission;

      await db.run('UPDATE suppliers SET totalRevenueYield = totalRevenueYield + ? WHERE id = ?', [amountAfterCommission, sId]);
      
      // Update Supplier Wallet (Net Amount)
      const supplierWallet = await db.get('SELECT * FROM wallets WHERE id = ?', [sId]) || { id: sId, balance: 0, transactions: '[]' };
      const supplierTxns = safeJsonParse(supplierWallet.transactions, []);
      supplierTxns.push({
        id: Date.now().toString() + sId,
        type: 'EARNING',
        amount: amountAfterCommission,
        description: `Revenue from Order ${id}`,
        timestamp: new Date().toISOString()
      });
      await db.run(
        'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
        [sId, supplierWallet.balance + amountAfterCommission, JSON.stringify(supplierTxns)]
      );

      // Update Admin Wallet (Commission)
      const adminWallet = await db.get('SELECT * FROM wallets WHERE id = ?', ['ADMIN_WALLET']) || { id: 'ADMIN_WALLET', balance: 0, transactions: '[]' };
      const adminTxns = safeJsonParse(adminWallet.transactions, []);
      adminTxns.push({
        id: Date.now().toString() + 'ADMIN',
        type: 'COMMISSION',
        amount: commission,
        description: `Commission from Order ${id} (Supplier: ${sId})`,
        timestamp: new Date().toISOString()
      });
      await db.run(
        'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
        ['ADMIN_WALLET', adminWallet.balance + commission, JSON.stringify(adminTxns)]
      );
  }

  // 4. Deduct used store credit
  if (creditUsed && creditUsed > 0 && userId !== 'guest') {
    await db.run('UPDATE users SET credit = MAX(0, credit - ?) WHERE id = ?', [creditUsed, userId]);
    await db.run('UPDATE user_stats SET storeCredit = MAX(0, storeCredit - ?) WHERE userId = ?', [creditUsed, userId]);
  }

  // 5. Send order confirmation notification to the buyer
  if (userId && userId !== 'guest' && userId !== 'undefined' && userId !== 'null' && userId !== '') {
    const userNotificationId = `notif_${Date.now()}_buyer_${Math.random().toString(36).substr(2, 5)}`;
    await db.run(
      'INSERT INTO notifications (id, title, message, type, timestamp, read, recipientId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userNotificationId,
        'Order Placed Successfully',
        `Your order #${id} was placed successfully. Total: GH₵${total}. We are preparing your shipment!`,
        'INFO',
        new Date().toISOString(),
        0,
        userId
      ]
    );
  }
}

router.post('/', authenticateAny, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('total').isNumeric().withMessage('Total must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const payload = req.body;
  const { userId, total, creditUsed, paystackReference } = payload;
  
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized order creation' });
  }

  const expectedPayment = total; // `total` is the out-of-pocket amount since checkout already applies credit to it.

  // Require Paystack verification if there's any out-of-pocket balance
  if (expectedPayment > 0) {
      if (!paystackReference) {
          return res.status(400).json({ status: 'error', message: 'Payment reference required for this order.' });
      }
      
      const currentSecret = getPaystackSecret();
      if (currentSecret) {
          try {
              const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${paystackReference}`, {
                 headers: { Authorization: `Bearer ${currentSecret}` }
              });
              
              if (verifyResponse.data.data.status !== 'success') {
                 return res.status(400).json({ status: 'error', message: 'Payment verification failed. Cannot add order.' });
              }
              
              // Verify amount matches
              const paidAmount = verifyResponse.data.data.amount / 100;
              if (paidAmount < expectedPayment) {
                  return res.status(400).json({ status: 'error', message: 'Insufficient payment amount' });
              }
          } catch (e: any) {
             console.error("Paystack validation failed:", e.response?.data || e.message);
             return res.status(500).json({ status: 'error', message: 'Payment verification service error.' });
          }
      }
  }

  // Check if order already exists (could happen via concurrent webhook)
  const existingOrder = await db.get('SELECT id FROM orders WHERE id = ?', [payload.id]);
  if (existingOrder) {
      return res.status(200).json({ status: 'success', message: 'Order already created' });
  }

  try {
    await createVerifiedOrder(payload);
    res.status(201).json({ status: 'success', message: 'Order created' });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(400).json({ status: 'error', message: error.message || 'Failed to create order' });
  }
});

router.patch('/:orderId/status', authenticateAny, async (req: AuthRequest, res: any) => {
  const { status, trackingNumber } = req.body;
  
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.orderId]);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    // Only Admin or the Person who made the order can update status?
    // Actually, status update is usually for Admins/Suppliers.
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPPLIER' && req.user?.id !== order.userId) {
       return res.status(403).json({ status: 'error', message: 'Unauthorized status update' });
    }

    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const refundAmount = order.total;
      
      const userWallet = await db.get('SELECT * FROM wallets WHERE id = ?', [order.userId]) || { id: order.userId, balance: 0, transactions: '[]' };
      const userTxns = safeJsonParse(userWallet.transactions, []);
      
      userTxns.push({
        id: Date.now().toString() + 'REFUND',
        type: 'REFUND',
        amount: refundAmount,
        description: `Refund for Cancelled Order ${order.id}`,
        timestamp: new Date().toISOString()
      });
      
      await db.run(
        'REPLACE INTO wallets (id, balance, transactions) VALUES (?, ?, ?)',
        [order.userId, userWallet.balance + refundAmount, JSON.stringify(userTxns)]
      );
    }

    if (trackingNumber !== undefined) {
      await db.run('UPDATE orders SET `status` = ?, `trackingNumber` = ? WHERE `id` = ?', [status, trackingNumber, req.params.orderId]);
    } else {
      await db.run('UPDATE orders SET `status` = ? WHERE `id` = ?', [status, req.params.orderId]);
    }

    // If status changed to DELIVERED, reward referrer if applicable
    if (status && status.toUpperCase() === 'DELIVERED') {
      try {
        const referral = await db.get(
          `SELECT * FROM referrals WHERE (refereeId = ? OR referredId = ?) AND LOWER(status) = 'pending'`,
          [order.userId, order.userId]
        );
        if (referral) {
          const nowIso = new Date().toISOString();
          const rewardAmount = Number(referral.rewardAmount) || 20;
          await db.run(
            `UPDATE referrals SET status = 'completed', refereeOrderId = ?, completedAt = ? WHERE id = ?`,
            [order.id, nowIso, referral.id]
          );
          await db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [rewardAmount, referral.referrerId]);
          await db.run('UPDATE user_stats SET storeCredit = storeCredit + ? WHERE userId = ?', [rewardAmount, referral.referrerId]);
        }
      } catch (e) {
        console.error("Error rewarding referral on delivery:", e);
      }
    }

    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
});

export default router;
