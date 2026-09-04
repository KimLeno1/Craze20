import { Router } from 'express';
import { db } from '../server.js';
import crypto from 'crypto';
import { authenticateAdmin, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM categories');
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});
router.post('/', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { name, heroImage, inspiration } = req.body;
    try {
        const id = crypto.randomUUID();
        await db.run('INSERT INTO categories (id, name, heroImage, inspiration) VALUES (?, ?, ?, ?)', [id, name, heroImage, inspiration]);
        res.status(201).json({ success: true, category: { id, name, heroImage, inspiration } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create category' });
    }
});
router.patch('/:id', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { name, heroImage, inspiration } = req.body;
    try {
        await db.run('UPDATE categories SET name = ?, heroImage = ?, inspiration = ? WHERE id = ?', [name, heroImage, inspiration, id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update category' });
    }
});
router.delete('/:id', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
});
export default router;
