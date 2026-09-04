import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { authenticateAny, authenticateAdmin, authenticateSupplier, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();
const getPaystackSecret = () => {
  const raw = process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (raw && raw.startsWith('Ask_test_')) {
    return raw.substring(1);
  }
  return raw;
};

// Only admins can see the full list of suppliers or create/delete them
router.get('/', authenticateAdmin, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  try {
    const rows = await db.all('SELECT id, name, contactEmail, plain_password, region, status, joinedDate, commissionRate, totalRevenueYield, performanceScore, paystackSubaccountCode, bankAccount, bankCode FROM suppliers');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch suppliers' });
  }
});

// Public registration route for suppliers
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('contactEmail').isEmail().withMessage('Valid contact email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { name, contactEmail, password, region } = req.body;
  const id = `SUP-${Date.now()}`;
  const joinedDate = new Date().toISOString();
  const status = 'PENDING'; // Force PENDING status for self-registration
  const rate = 10;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO suppliers (`id`, `name`, `contactEmail`, `password`, `region`, `status`, `joinedDate`, `commissionRate`, `plain_password`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, contactEmail, hashedPassword, region || 'Neo Tokyo Central', status, joinedDate, rate, password]
    );
    res.status(201).json({ status: 'success', message: 'Supplier registration successful. Pending admin activation.', id });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'A supplier with this email already exists.' 
      });
    }
    console.error('Error registering supplier:', error);
    res.status(500).json({ status: 'error', message: 'Failed to register supplier' });
  }
});

router.post('/', authenticateAdmin, authorize(['ADMIN']), [
  body('name').notEmpty().withMessage('Name is required'),
  body('contactEmail').isEmail().withMessage('Valid contact email is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { name, contactEmail, password, region, commissionRate, bankCode, accountNumber } = req.body;
  const id = req.body.id || `SUP-${Date.now()}`;
  const joinedDate = req.body.joinedDate || new Date().toISOString();
  const status = req.body.status || 'ACTIVE';
  const rate = commissionRate || 10;
  
  let paystackSubaccountCode = null;
  
  // Initialize Split Payment Subaccount for Supplier
  const currentSecret = getPaystackSecret();
  if (bankCode && accountNumber && currentSecret) {
     try {
       const paystackRes = await axios.post('https://api.paystack.co/subaccount', {
          business_name: name,
          bank_code: bankCode,
          account_number: accountNumber,
          percentage_charge: rate
       }, {
         headers: { Authorization: `Bearer ${currentSecret}` }
       });
       
       if (paystackRes.data.status) {
         paystackSubaccountCode = paystackRes.data.data.subaccount_code;
       }
     } catch (paystackError: any) {
        console.error('Error creating Paystack subaccount:', paystackError.response?.data || paystackError.message);
        // We log the error but still proceed to create the supplier without a subaccount if it fails
     }
  }

  try {
    const hashedPassword = await bcrypt.hash(password || 'supplier123', 10);
    await db.run(
      'INSERT INTO suppliers (`id`, `name`, `contactEmail`, `password`, `region`, `status`, `joinedDate`, `commissionRate`, `bankCode`, `bankAccount`, `paystackSubaccountCode`, `plain_password`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, contactEmail, hashedPassword, region, status, joinedDate, rate, bankCode || null, accountNumber || null, paystackSubaccountCode, password || 'supplier123']
    );
    res.status(201).json({ status: 'success', message: 'Supplier created', id, paystackSubaccountCode });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'A supplier with this email already exists.' 
      });
    }
    console.error('Error creating supplier:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create supplier' });
  }
});

router.get('/:id', authenticateAny, async (req: AuthRequest, res: any) => {
  try {
    // Only ADMIN or the Supplier themselves can view details
    if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
       return res.status(403).json({ status: 'error', message: 'Unauthorized supplier access' });
    }

    const row = await db.get('SELECT id, name, contactEmail, plain_password, region, status, joinedDate, commissionRate, totalRevenueYield, performanceScore FROM suppliers WHERE id = ?', [req.params.id]);
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch supplier' });
  }
});

router.delete('/:id', authenticateAdmin, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  try {
    const supplierId = req.params.id;

    // 1. Get all products belonging to this supplier
    const products = await db.all('SELECT id FROM products WHERE supplierId = ?', [supplierId]);
    const productIds = products.map(p => p.id);

    if (productIds.length > 0) {
      // 2. Identify and delete orders that contain these products
      const allOrders = await db.all('SELECT id, items FROM orders');
      const ordersToDelete = allOrders.filter(order => {
        try {
          const items = JSON.parse(order.items || '[]');
          return items.some((item: any) => productIds.includes(item.id));
        } catch (e) {
          return false;
        }
      }).map(o => o.id);

      if (ordersToDelete.length > 0) {
        const orderPlaceholders = ordersToDelete.map(() => '?').join(',');
        await db.run(`DELETE FROM orders WHERE id IN (${orderPlaceholders})`, ordersToDelete);
      }

      // 3. Delete dependent records for products
      const pIdPlaceholders = productIds.map(() => '?').join(',');
      await db.run(`DELETE FROM price_anomalies WHERE productId IN (${pIdPlaceholders})`, productIds);
      await db.run(`DELETE FROM product_reviews WHERE productId IN (${pIdPlaceholders})`, productIds);
      await db.run(`DELETE FROM try_ons WHERE productId IN (${pIdPlaceholders})`, productIds);
      
      // Clear from cart_items
      const allCartItems = await db.all('SELECT id, item FROM cart_items');
      const cartItemsToDelete = allCartItems.filter(cartItem => {
        try {
          const item = JSON.parse(cartItem.item || '{}');
          return productIds.includes(item.id);
        } catch (e) {
          return false;
        }
      }).map(ci => ci.id);

      if (cartItemsToDelete.length > 0) {
        const cartPlaceholders = cartItemsToDelete.map(() => '?').join(',');
        await db.run(`DELETE FROM cart_items WHERE id IN (${cartPlaceholders})`, cartItemsToDelete);
      }
      
      // Delete products themselves
      await db.run(`DELETE FROM products WHERE id IN (${pIdPlaceholders})`, productIds);
    }

    // 4. Delete supply orders and wallet for supplier
    await db.run('DELETE FROM supply_orders WHERE supplierId = ?', [supplierId]);
    await db.run('DELETE FROM wallets WHERE id = ?', [supplierId]);

    // 5. Delete the supplier itself
    await db.run('DELETE FROM suppliers WHERE id = ?', [supplierId]);

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete supplier' });
  }
});

router.patch('/:id', authenticateAny, [
  body('name').optional({ nullable: true, checkFalsy: true }).notEmpty().withMessage('Name cannot be empty'),
  body('contactEmail').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid contact email is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  // Only ADMIN or the Supplier themselves
  if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
     return res.status(403).json({ status: 'error', message: 'Unauthorized supplier update' });
  }

  const { name, contactEmail, region } = req.body;
  try {
    const updates = [];
    const params = [];
    if (name !== undefined) {
      updates.push('`name` = ?');
      params.push(name);
    }
    if (contactEmail !== undefined) {
      updates.push('`contactEmail` = ?');
      params.push(contactEmail);
    }
    if (region !== undefined) {
      updates.push('`region` = ?');
      params.push(region);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields to update' });
    }
    
    params.push(req.params.id);
    await db.run(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ status: 'success', message: 'Supplier updated' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update supplier' });
  }
});

router.patch('/:id/commission', authenticateAdmin, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  const { commissionRate } = req.body;
  try {
    await db.run('UPDATE suppliers SET `commissionRate` = ? WHERE `id` = ?', [commissionRate, req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update commission' });
  }
});

router.patch('/:id/password', authenticateAny, async (req: AuthRequest, res: any) => {
  const { password } = req.body;
  
  // Only ADMIN or the Supplier themselves
  if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
     return res.status(403).json({ status: 'error', message: 'Unauthorized password update' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('UPDATE suppliers SET `password` = ?, `plain_password` = ? WHERE `id` = ?', [hashedPassword, password, req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update password' });
  }
});

router.patch('/:id/status', authenticateAdmin, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  const { status } = req.body;
  try {
    await db.run('UPDATE suppliers SET `status` = ? WHERE `id` = ?', [status, req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update status' });
  }
});

export default router;
