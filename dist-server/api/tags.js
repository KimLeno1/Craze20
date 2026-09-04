import { Router } from 'express';
import { db } from '../server.js';
import crypto from 'crypto';
import { authenticateAdmin, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const tags = await db.all('SELECT * FROM tags');
        res.json(tags);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch tags' });
    }
});
router.post('/', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { name } = req.body;
    try {
        const id = crypto.randomUUID();
        await db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [id, name]);
        res.status(201).json({ success: true, tag: { id, name } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create tag' });
    }
});
router.delete('/:id', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM tags WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete tag' });
    }
});
export default router;
