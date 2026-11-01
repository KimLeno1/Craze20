import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authenticateAny, AuthRequest } from '../middleware/auth.js';

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

// --- USER STATS ---
router.get('/user-stats/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized stats access' });
    }
    const row = await db.get('SELECT * FROM user_stats WHERE userId = ?', [req.params.userId]);
    if (row) {
      res.json({
        ...row,
        achievements: safeJsonParse(row.achievements, []),
        dailyQuests: safeJsonParse(row.dailyQuests, []),
        quests: safeJsonParse(row.quests, []),
        brandSubscriptions: safeJsonParse(row.brandSubscriptions, []),
        tagSubscriptions: safeJsonParse(row.tagSubscriptions, []),
        neuralStylistUsedToday: row.neuralStylistUsedToday || 0,
      });
    } else {
      // Return default stats and insert them
      const defaultStats = {
        userId: req.params.userId,
        level: 1,
        experience: 0,
        nextLevelExp: 100,
        rank: 'Newcomer',
        totalSpent: 0,
        itemsOwned: 0,
        achievements: [],
        dailyQuests: [],
        aiTryOnsUsedToday: 0,
        neuralStylistUsedToday: 0,
        quests: [],
        selectedPath: null,
        brandSubscriptions: [],
        tagSubscriptions: []
      };
      
      await db.run(
        `INSERT OR IGNORE INTO user_stats (\`userId\`, \`achievements\`, \`dailyQuests\`, \`quests\`, \`brandSubscriptions\`, \`tagSubscriptions\`, \`aiTryOnsUsedToday\`, \`neuralStylistUsedToday\`) VALUES (?, '[]', '[]', '[]', '[]', '[]', 0, 0)`,
        [req.params.userId]
      );
      
      res.json(defaultStats);
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
});

router.post('/user-stats/:userId', authenticate, [
  body('level').optional().isNumeric().withMessage('Level must be a number'),
  body('experience').optional().isNumeric().withMessage('Experience must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized stats update' });
  }

  const { level, experience, nextLevelExp, rank, totalSpent, storeCredit, itemsOwned, achievements, dailyQuests, aiTryOnsUsedToday, neuralStylistUsedToday, quests, selectedPath, brandSubscriptions, tagSubscriptions } = req.body;
  try {
    await db.run(
      `REPLACE INTO user_stats 
      (\`userId\`, \`level\`, \`experience\`, \`nextLevelExp\`, \`rank\`, \`totalSpent\`, \`storeCredit\`, \`itemsOwned\`, \`achievements\`, \`dailyQuests\`, \`aiTryOnsUsedToday\`, \`neuralStylistUsedToday\`, \`quests\`, \`selectedPath\`, \`brandSubscriptions\`, \`tagSubscriptions\`) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.userId, level, experience, nextLevelExp, rank, totalSpent, storeCredit || 0, itemsOwned, JSON.stringify(achievements), JSON.stringify(dailyQuests), aiTryOnsUsedToday, neuralStylistUsedToday, JSON.stringify(quests), selectedPath, JSON.stringify(brandSubscriptions), JSON.stringify(tagSubscriptions)]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update stats' });
  }
});

router.patch('/user-stats/:userId/achievements/:achievementId', authenticate, [
  body('progress').isNumeric().withMessage('Progress must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized achievement update' });
  }

  const { progress } = req.body;
  try {
    const row = await db.get('SELECT achievements FROM user_stats WHERE userId = ?', [req.params.userId]);
    if (row && row.achievements) {
      const achievements = safeJsonParse(row.achievements, []);
      const index = Array.isArray(achievements) ? achievements.findIndex((a: any) => a.id === req.params.achievementId) : -1;
      if (index !== -1) {
        achievements[index].progress = progress;
        await db.run('UPDATE user_stats SET `achievements` = ? WHERE `userId` = ?', [JSON.stringify(achievements), req.params.userId]);
      }
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update achievement' });
  }
});

router.post('/:userId/subscriptions', authenticate, async (req: AuthRequest, res: any) => {
  const { brandSubscriptions, tagSubscriptions } = req.body;
  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized subscriptions update' });
  }
  try {
    await db.run('UPDATE user_stats SET `brandSubscriptions` = ?, `tagSubscriptions` = ? WHERE `userId` = ?', [JSON.stringify(brandSubscriptions), JSON.stringify(tagSubscriptions), req.params.userId]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save subscriptions' });
  }
});

// --- USER PREFERENCES ---
router.get('/user-preferences/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized preferences access' });
    }
    const row = await db.get('SELECT * FROM user_preferences WHERE userId = ?', [req.params.userId]);
    if (row) {
      res.json({
        ...row,
        preferredCategories: safeJsonParse(row.preferredCategories, []),
        preferredGenders: safeJsonParse(row.preferredGenders, []),
        colorPreferences: safeJsonParse(row.colorPreferences, []),
        priceRange: safeJsonParse(row.priceRange, null),
        styleProtocolCompleted: !!row.styleProtocolCompleted,
        checkoutProtocolCompleted: !!row.checkoutProtocolCompleted,
        tutorialFinished: !!row.tutorialFinished
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch preferences' });
  }
});

router.post('/user-preferences/:userId', authenticate, [
  body('preferredCategories').optional().isArray().withMessage('Preferred categories must be an array'),
  body('preferredGenders').optional().isArray().withMessage('Preferred genders must be an array')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  
  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized preferences update' });
  }

  const { preferredCategories, preferredGenders, styleArchetype, colorPreferences, priceRange, styleProtocolCompleted, checkoutProtocolCompleted, tutorialFinished } = req.body;
  try {
    await db.run(
      `REPLACE INTO user_preferences 
      (\`userId\`, \`preferredCategories\`, \`preferredGenders\`, \`styleArchetype\`, \`colorPreferences\`, \`priceRange\`, \`styleProtocolCompleted\`, \`checkoutProtocolCompleted\`, \`tutorialFinished\`) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.userId, JSON.stringify(preferredCategories), JSON.stringify(preferredGenders), styleArchetype, JSON.stringify(colorPreferences), JSON.stringify(priceRange), styleProtocolCompleted ? 1 : 0, checkoutProtocolCompleted ? 1 : 0, tutorialFinished ? 1 : 0]
    );
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update preferences' });
  }
});

// --- USER HISTORY ---
router.get('/user-history/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized history access' });
    }
    const row = await db.get('SELECT * FROM user_history WHERE userId = ?', [req.params.userId]);
    if (row) {
      res.json({
        ...row,
        viewedProductIds: safeJsonParse(row.viewedProductIds, []),
        wishlistedProductIds: safeJsonParse(row.wishlistedProductIds, []),
        purchasedProductIds: safeJsonParse(row.purchasedProductIds, []),
        cartedProductIds: safeJsonParse(row.cartedProductIds, []),
      });
    } else {
      res.json({ viewedProductIds: [], wishlistedProductIds: [], purchasedProductIds: [], cartedProductIds: [] });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch history' });
  }
});

router.post('/user-history/:userId', authenticate, [
  body('viewedProductIds').optional().isArray().withMessage('Viewed product IDs must be an array')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized history update' });
  }

  const { viewedProductIds, wishlistedProductIds, purchasedProductIds, cartedProductIds } = req.body;
  try {
    await db.run(
      `REPLACE INTO user_history 
      (\`userId\`, \`viewedProductIds\`, \`wishlistedProductIds\`, \`purchasedProductIds\`, \`cartedProductIds\`) 
      VALUES (?, ?, ?, ?, ?)`,
      [req.params.userId, JSON.stringify(viewedProductIds || []), JSON.stringify(wishlistedProductIds || []), JSON.stringify(purchasedProductIds || []), JSON.stringify(cartedProductIds || [])]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update history' });
  }
});

router.post('/user-history/:userId/track', authenticate, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('action').notEmpty().withMessage('Action is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized tracking' });
  }

  const { productId, action } = req.body;
  try {
    const row = await db.get('SELECT * FROM user_history WHERE userId = ?', [req.params.userId]);
    let viewed = row && row.viewedProductIds ? safeJsonParse(row.viewedProductIds, []) : [];
    let wishlisted = row && row.wishlistedProductIds ? safeJsonParse(row.wishlistedProductIds, []) : [];
    let purchased = row && row.purchasedProductIds ? safeJsonParse(row.purchasedProductIds, []) : [];
    let carted = row && row.cartedProductIds ? safeJsonParse(row.cartedProductIds, []) : [];

    if (action === 'view' && !viewed.includes(productId)) viewed.push(productId);
    if (action === 'wishlist' && !wishlisted.includes(productId)) wishlisted.push(productId);
    if (action === 'purchase' && !purchased.includes(productId)) purchased.push(productId);
    if (action === 'cart' && !carted.includes(productId)) carted.push(productId);

    await db.run(
      `REPLACE INTO user_history 
      (\`userId\`, \`viewedProductIds\`, \`wishlistedProductIds\`, \`purchasedProductIds\`, \`cartedProductIds\`) 
      VALUES (?, ?, ?, ?, ?)`,
      [req.params.userId, JSON.stringify(viewed), JSON.stringify(wishlisted), JSON.stringify(purchased), JSON.stringify(carted)]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to track action' });
  }
});

// --- AI USAGE TRACKING (VTON & Neural Stylist) ---
router.post('/ai-usage', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const { type } = req.body;
    if (type === 'tryon') {
      await db.run('UPDATE user_stats SET aiTryOnsUsedToday = COALESCE(aiTryOnsUsedToday, 0) + 1 WHERE userId = ?', [userId]);
    } else {
      await db.run('UPDATE user_stats SET neuralStylistUsedToday = COALESCE(neuralStylistUsedToday, 0) + 1 WHERE userId = ?', [userId]);
    }
    const updated = await db.get('SELECT aiTryOnsUsedToday, neuralStylistUsedToday FROM user_stats WHERE userId = ?', [userId]);
    res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error recording AI usage:', error);
    res.status(500).json({ status: 'error', message: 'Failed to record usage' });
  }
});

export default router;
