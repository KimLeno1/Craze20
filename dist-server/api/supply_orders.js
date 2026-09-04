import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize(['ADMIN', 'SUPPLIER']), async (req, res) => {
    try {
        let rows;
        if (req.user?.role === 'ADMIN') {
            rows = await db.all('SELECT * FROM supply_orders');
        }
        else {
            rows = await db.all('SELECT * FROM supply_orders WHERE supplierId = ?', [req.user?.id]);
        }
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching supply orders:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch supply orders' });
    }
});
router.post('/', authenticate, [
    body('supplierId').notEmpty().withMessage('Supplier ID is required'),
    body('status').notEmpty().withMessage('Status is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    const { id, supplierId, status, timestamp } = req.body;
    if (req.user?.id !== supplierId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized supply order creation' });
    }
    try {
        await db.run('INSERT INTO supply_orders (`id`, `supplierId`, `status`, `timestamp`) VALUES (?, ?, ?, ?)', [id, supplierId, status, timestamp]);
        res.status(201).json({ status: 'success', message: 'Supply order created' });
    }
    catch (error) {
        console.error('Error creating supply order:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create supply order' });
    }
});
export default router;
