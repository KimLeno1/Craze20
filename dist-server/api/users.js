import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
// Only Admins should be able to see/manage all users
router.get('/', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const rows = await db.all('SELECT id, handle, email, archetype, rep, level, coins, gems, status, lastLogin, totalSpent, loyaltyPoints, credit, role FROM users');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
});
// Public leaderboard endpoint
router.get('/ranked', async (req, res) => {
    try {
        const rows = await db.all('SELECT id, handle, archetype, rep, level, profile_picture FROM users ORDER BY rep DESC LIMIT 100');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching ranked users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
    }
});
router.post('/', authenticate, authorize(['ADMIN']), [
    body('email').isEmail().withMessage('Valid email is required'),
    body('handle').notEmpty().withMessage('Handle is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    const { id, handle, email, password, archetype, rep, level, coins, gems, status, lastLogin, totalSpent, loyaltyPoints, credit } = req.body;
    try {
        await db.run('INSERT INTO users (`id`, `handle`, `email`, `password`, `archetype`, `rep`, `level`, `coins`, `gems`, `status`, `lastLogin`, `totalSpent`, `loyaltyPoints`, `credit`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, handle, email, password, archetype, rep, level, coins, gems, status, lastLogin, totalSpent, loyaltyPoints, credit]);
        res.status(201).json({ status: 'success', message: 'User created' });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create user' });
    }
});
router.patch('/:userId/status', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { status } = req.body;
    try {
        await db.run('UPDATE users SET `status` = ? WHERE `id` = ?', [status, req.params.userId]);
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
});
router.delete('/:userId', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        await db.run('DELETE FROM users WHERE id = ?', [req.params.userId]);
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete user' });
    }
});
router.patch('/:userId/profile-picture', authenticate, async (req, res) => {
    const { profilePicture } = req.body;
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized profile picture update' });
    }
    try {
        await db.run('UPDATE users SET `profile_picture` = ? WHERE `id` = ?', [profilePicture, req.params.userId]);
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update profile picture' });
    }
});
router.post('/:userId/rep', authenticate, async (req, res) => {
    // Allow ADMIN or the User themselves (for client-side gamification rewards)
    if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.userId) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized reputation modification' });
    }
    const { amount } = req.body;
    try {
        const user = await db.get('SELECT rep FROM users WHERE id = ?', [req.params.userId]);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const prevRep = user.rep || 0;
        await db.run('UPDATE users SET `rep` = `rep` + ? WHERE `id` = ?', [amount, req.params.userId]);
        const newRep = prevRep + amount;
        // Check for milestone
        const milestones = [1000, 5000, 10000];
        for (const milestone of milestones) {
            if (prevRep < milestone && newRep >= milestone) {
                // Milestone reached!
                const row = await db.get('SELECT achievements FROM user_stats WHERE userId = ?', [req.params.userId]);
                let achievements = row && row.achievements ? JSON.parse(row.achievements) : [];
                achievements.push({ id: `milestone_${milestone}`, name: `Milestone ${milestone} REP`, progress: 100 });
                await db.run('UPDATE user_stats SET `achievements` = ? WHERE `userId` = ?', [JSON.stringify(achievements), req.params.userId]);
            }
        }
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to add rep' });
    }
});
router.get('/:userId/reviews', authenticate, async (req, res) => {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized review access' });
    }
    try {
        const rows = await db.all('SELECT * FROM product_reviews WHERE userId = ?', [req.params.userId]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch user reviews' });
    }
});
export default router;
