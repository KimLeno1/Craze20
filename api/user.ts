import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authenticateAny, AuthRequest, optionalAuth } from '../middleware/auth.js';
import { TIER_BENEFITS } from '../tierBenefits.js';

const router = Router();

// --- AI USAGE TRACKING ---
router.post('/ai-usage', authenticate, async (req: AuthRequest, res: any) => {
  const userId = req.user?.id;
  const { type } = req.body;
  if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

  try {
    const userStats = await db.get('SELECT aiTryOnsUsedToday, neuralStylistUsedToday FROM user_stats WHERE userId = ?', [userId]);
    const user = await db.get('SELECT level FROM users WHERE id = ?', [userId]);
    
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    // Map level to tier
    let tier = 'NOVICE';
    if (user.level >= 10) tier = 'VANGUARD';
    if (user.level >= 20) tier = 'HEIR';
    if (user.level >= 30) tier = 'VOID';
    
    const limit = TIER_BENEFITS[tier as keyof typeof TIER_BENEFITS]?.dailyUsageLimit || 1;
    const totalUsed = ((userStats?.aiTryOnsUsedToday) || 0) + ((userStats?.neuralStylistUsedToday) || 0);
    
    if (totalUsed >= limit && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Usage limit reached' });
    }

    // Log the usage
    if (type === 'tryon') {
      await db.run('UPDATE user_stats SET aiTryOnsUsedToday = aiTryOnsUsedToday + 1 WHERE userId = ?', [userId]);
    } else {
      await db.run('UPDATE user_stats SET neuralStylistUsedToday = neuralStylistUsedToday + 1 WHERE userId = ?', [userId]);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error logging AI usage:', error);
    res.status(500).json({ status: 'error', message: 'Failed to log AI usage' });
  }
});

// --- PROFILE ---
router.get('/profile/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    // Users can view their own profile, or admins can view any
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized profile access' });
    }

    const user = await db.get('SELECT id, handle, email, archetype, rep, level, coins, gems, status, lastLogin, totalSpent, loyaltyPoints, credit, role, gender FROM users WHERE id = ?', [req.params.userId]);
    if (user) {
      const stats = await db.get('SELECT * FROM user_stats WHERE userId = ?', [req.params.userId]);
      const preferences = await db.get('SELECT * FROM user_preferences WHERE userId = ?', [req.params.userId]);
      
      const response: any = { ...user };
      if (stats) {
        response.stats = {
          ...stats,
          achievements: stats.achievements ? JSON.parse(stats.achievements) : [],
          dailyQuests: stats.dailyQuests ? JSON.parse(stats.dailyQuests) : [],
          quests: stats.quests ? JSON.parse(stats.quests) : [],
          brandSubscriptions: stats.brandSubscriptions ? JSON.parse(stats.brandSubscriptions) : [],
          tagSubscriptions: stats.tagSubscriptions ? JSON.parse(stats.tagSubscriptions) : [],
        };
      } else {
        // Provide default stats if missing
        response.stats = {
          userId: user.id,
          level: user.level || 1,
          experience: 0,
          nextLevelExp: 1000,
          rank: 'Newcomer',
          totalSpent: user.totalSpent || 0,
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
      }
      
      if (preferences) {
        response.preferences = {
          ...preferences,
          preferredCategories: preferences.preferredCategories ? JSON.parse(preferences.preferredCategories) : [],
          preferredGenders: preferences.preferredGenders ? JSON.parse(preferences.preferredGenders) : [],
          styleProtocolCompleted: !!preferences.styleProtocolCompleted,
          checkoutProtocolCompleted: !!preferences.checkoutProtocolCompleted,
          tutorialFinished: !!preferences.tutorialFinished,
        };
      }
      
      res.json(response);
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
});

router.patch('/profile/:userId', authenticate, [
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  // Users can only update their own profile
  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized profile update' });
  }

  const { handle, archetype, email } = req.body;
  try {
    const updates = [];
    const params = [];
    if (handle !== undefined) { updates.push('handle = ?'); params.push(handle); }
    if (archetype !== undefined) { updates.push('archetype = ?'); params.push(archetype); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    
    if (updates.length > 0) {
      params.push(req.params.userId);
      await db.run(`UPDATE users SET ${updates.join(', ')} WHERE \`id\` = ?`, params);
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update profile' });
  }
});

// --- WISHLIST ---
router.get('/wishlist/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized wishlist access' });
    }
    const row = await db.get('SELECT wishlistedProductIds FROM user_history WHERE userId = ?', [req.params.userId]);
    if (row && row.wishlistedProductIds) {
      const ids = JSON.parse(row.wishlistedProductIds);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        const products = await db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
        res.json(products.map(p => ({
          ...p,
          details: (() => { try { const d = JSON.parse(p.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
          tags: p.tags ? JSON.parse(p.tags) : [],
          sizes: p.sizes ? JSON.parse(p.sizes) : [],
          colors: p.colors ? JSON.parse(p.colors) : [],
          colorVariants: p.colorVariants ? JSON.parse(p.colorVariants) : [],
          priceRange: p.priceRange ? JSON.parse(p.priceRange) : null,
          customizationFields: p.customizationFields ? JSON.parse(p.customizationFields) : []
        })));
        return;
      }
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch wishlist' });
  }
});

router.post('/wishlist', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('productId').notEmpty().withMessage('Product ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, productId } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized wishlist modification' });
  }
  try {
    const row = await db.get('SELECT wishlistedProductIds FROM user_history WHERE userId = ?', [userId]);
    let ids = [];
    if (row && row.wishlistedProductIds) {
      ids = JSON.parse(row.wishlistedProductIds);
    }
    if (!ids.includes(productId)) {
      ids.push(productId);
      await db.run(
        'INSERT INTO user_history (`userId`, `wishlistedProductIds`) VALUES (?, ?) ON CONFLICT(`userId`) DO UPDATE SET `wishlistedProductIds` = excluded.wishlistedProductIds',
        [userId, JSON.stringify(ids)]
      );
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add to wishlist' });
  }
});

router.delete('/wishlist/:userId/:productId', authenticate, async (req: AuthRequest, res: any) => {
  const { userId, productId } = req.params;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized wishlist removal' });
  }
  try {
    const row = await db.get('SELECT wishlistedProductIds FROM user_history WHERE userId = ?', [userId]);
    if (row && row.wishlistedProductIds) {
      let ids = JSON.parse(row.wishlistedProductIds);
      ids = ids.filter((id: string) => id !== productId);
      await db.run(
        'UPDATE user_history SET `wishlistedProductIds` = ? WHERE `userId` = ?',
        [JSON.stringify(ids), userId]
      );
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to remove from wishlist' });
  }
});

// --- CART ---
router.get('/cart/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized cart access' });
    }
    const rows = await db.all('SELECT * FROM cart_items WHERE userId = ?', [req.params.userId]);
    res.json(rows.map(row => row.item ? JSON.parse(row.item) : null).filter(Boolean));
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch cart' });
  }
});

router.post('/cart', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, ...item } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized cart modification' });
  }
  try {
    // Stock Check
    const idToCheck = item.id || item.productId;
    if (idToCheck) {
      const product = await db.get('SELECT stockCount, inStock FROM products WHERE id = ?', [idToCheck]);
      if (!product || !product.inStock || product.stockCount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Silhouette is out of stock in the archive.' });
      }
      
      const requestedQuantity = (item.quantity || 1);
      
      // Check if user already has this in cart and calculate total count
      const rows = await db.all('SELECT item FROM cart_items WHERE userId = ?', [userId]);
      let totalInCart = 0;
      for (const row of rows) {
        const parsed = JSON.parse(row.item);
        if ((parsed.id || parsed.productId) === idToCheck) {
          totalInCart += (parsed.quantity || 1);
        }
      }

      if (totalInCart + requestedQuantity > product.stockCount) {
        return res.status(400).json({ 
          status: 'error', 
          message: "That's all in stock",
          available: product.stockCount,
          alreadyInCart: totalInCart
        });
      }
    }

    // Check if item already exists in cart
    const rows = await db.all('SELECT id, item FROM cart_items WHERE userId = ?', [userId]);
    let existingRowId = null;
    let existingItem = null;

    for (const row of rows) {
      const parsed = JSON.parse(row.item);
      const matchSize = parsed.selectedSize === item.selectedSize;
      const matchVariant = JSON.stringify(parsed.selectedColorVariant) === JSON.stringify(item.selectedColorVariant);
      const matchCustom = JSON.stringify(parsed.customizationData) === JSON.stringify(item.customizationData);

      if ((parsed.id || parsed.productId) === (item.id || item.productId) && matchSize && matchVariant && matchCustom) {
        existingRowId = row.id;
        existingItem = parsed;
        break;
      }
    }

    if (existingRowId) {
      existingItem.quantity += (item.quantity || 1);
      await db.run('UPDATE cart_items SET `item` = ? WHERE `id` = ?', [JSON.stringify(existingItem), existingRowId]);
    } else {
      await db.run(
        'INSERT INTO cart_items (`userId`, `item`) VALUES (?, ?)',
        [userId, JSON.stringify(item)]
      );
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add to cart' });
  }
});

router.put('/cart', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, ...item } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized cart modification' });
  }
  try {
    // This is a bit tricky with SQLite JSON, we'll just delete the old one and insert the new one
    // Assuming item has an id, size, and colorVariant
    const rows = await db.all('SELECT id, item FROM cart_items WHERE userId = ?', [userId]);
    for (const row of rows) {
      const parsed = JSON.parse(row.item);
      const matchSize = parsed.selectedSize === item.selectedSize;
      const matchVariant = JSON.stringify(parsed.selectedColorVariant) === JSON.stringify(item.selectedColorVariant);
      const matchCustom = JSON.stringify(parsed.customizationData) === JSON.stringify(item.customizationData);
      
      if ((parsed.id || parsed.productId) === (item.id || item.productId) && matchSize && matchVariant && matchCustom) {
        const mergedItem = { ...parsed, ...item };
        await db.run('UPDATE cart_items SET `item` = ? WHERE `id` = ?', [JSON.stringify(mergedItem), row.id]);
        break;
      }
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update cart' });
  }
});

router.post('/cart/remove', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('productId').notEmpty().withMessage('Product ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { userId, productId, size, colorMain, colorSecondary } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized cart removal' });
  }
  try {
    const rows = await db.all('SELECT id, item FROM cart_items WHERE userId = ?', [userId]);
    let deleted = false;
    for (const row of rows) {
      const parsed = JSON.parse(row.item);
      
      const paramSize = size || undefined;
      const paramColorMain = colorMain || undefined;
      const paramColorSecondary = colorSecondary || undefined;

      const variant = parsed.selectedColorVariant;
      
      const matchSize = (parsed.selectedSize || undefined) === paramSize;
      const matchColor = (variant?.main || undefined) === paramColorMain && 
                         (variant?.secondary || undefined) === paramColorSecondary;
      
      const idMatch = String(parsed.id || parsed.productId || '') === String(productId);
      
      if (idMatch && matchSize && matchColor) {
        await db.run('DELETE FROM cart_items WHERE `id` = ?', [row.id]);
        deleted = true;
        break;
      }
    }
    
    // Fallback: If no exact match (e.g. malformed metadata), delete by ID just to be safe
    if (!deleted) {
       for (const row of rows) {
          const parsed = JSON.parse(row.item);
          if (String(parsed.id || parsed.productId || '') === String(productId)) {
             await db.run('DELETE FROM cart_items WHERE `id` = ?', [row.id]);
             break;
          }
       }
    }
    
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to remove from cart' });
  }
});

// --- MYSTERY BOX ---
router.post('/mystery-box/open', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('boxId').notEmpty().withMessage('Box ID is required'),
  body('reward').notEmpty().withMessage('Reward is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, boxId, reward, timestamp } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized action' });
  }
  try {
    await db.run(
      'INSERT INTO mystery_box_history (`id`, `userId`, `boxId`, `reward`, `timestamp`) VALUES (?, ?, ?, ?, ?)',
      [id || Date.now().toString(), userId, boxId, JSON.stringify(reward), timestamp || Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to log mystery box' });
  }
});

router.get('/mystery-box/history/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }
    const rows = await db.all('SELECT * FROM mystery_box_history WHERE userId = ?', [req.params.userId]);
    res.json(rows.map(row => ({ ...row, reward: row.reward ? JSON.parse(row.reward) : null })));
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch mystery box history' });
  }
});

// --- GAME SCORES ---
router.post('/game-scores', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('gameId').notEmpty().withMessage('Game ID is required'),
  body('score').isNumeric().withMessage('Score must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, gameId, score, timestamp } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized score submission' });
  }
  try {
    await db.run(
      'INSERT INTO game_scores (`id`, `userId`, `gameId`, `score`, `timestamp`) VALUES (?, ?, ?, ?, ?)',
      [id || Date.now().toString(), userId, gameId, score, timestamp || Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to submit game score' });
  }
});

router.get('/game-scores/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }
    const rows = await db.all('SELECT * FROM game_scores WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch game scores' });
  }
});

// --- STYLIST SESSIONS ---
router.post('/stylist-sessions', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('mood').notEmpty().withMessage('Mood is required'),
  body('occasion').notEmpty().withMessage('Occasion is required'),
  body('advice').notEmpty().withMessage('Advice is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, mood, occasion, advice, timestamp } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized session' });
  }
  try {
    await db.run(
      'INSERT INTO stylist_sessions (`id`, `userId`, `mood`, `occasion`, `advice`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), userId, mood, occasion, advice, timestamp || Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save stylist session' });
  }
});

router.get('/stylist-sessions/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }
    const rows = await db.all('SELECT * FROM stylist_sessions WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch stylist sessions' });
  }
});

// --- TRY ONS ---
router.post('/try-on', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('image').notEmpty().withMessage('Image is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, productId, image, timestamp } = req.body;
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized try-on' });
  }
  try {
    await db.run(
      'INSERT INTO try_ons (`id`, `userId`, `productId`, `image`, `timestamp`) VALUES (?, ?, ?, ?, ?)',
      [id || Date.now().toString(), userId, productId, image, timestamp || Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save try on' });
  }
});

router.get('/try-on/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }
    const rows = await db.all('SELECT * FROM try_ons WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch try ons' });
  }
});

// --- ANOMALY SESSION ---
router.get('/anomaly-session/:userId', optionalAuth, async (req: AuthRequest, res: any) => {
  try {
    const row = await db.get('SELECT value FROM settings WHERE `key` = ?', [`anomaly_session_${req.params.userId}`]);
    res.json(row ? JSON.parse(row.value) : null);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch anomaly session' });
  }
});

router.post('/anomaly-session/start', optionalAuth, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId } = req.body;
  try {
    const session = { startTime: Date.now() };
    await db.run(
      'REPLACE INTO settings (`key`, value) VALUES (?, ?)',
      [`anomaly_session_${userId}`, JSON.stringify(session)]
    );
    res.json(session);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to start anomaly session' });
  }
});

// --- PROTOCOL SESSIONS ---
router.get('/protocol-session/:type', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { type } = req.params;
    const session = await db.get('SELECT * FROM protocol_sessions WHERE userId = ? AND protocolType = ?', [userId, type]);
    if (session) {
      res.json({
        ...session,
        sessionData: session.sessionData ? JSON.parse(session.sessionData) : {}
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch session' });
  }
});

router.post('/protocol-session', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { protocolType, currentStep, sessionData } = req.body;
    await db.run(
      'INSERT INTO protocol_sessions (userId, protocolType, currentStep, sessionData, lastUpdated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, protocolType) DO UPDATE SET currentStep = excluded.currentStep, sessionData = excluded.sessionData, lastUpdated = excluded.lastUpdated',
      [userId, protocolType, currentStep, JSON.stringify(sessionData), Date.now()]
    );
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save session' });
  }
});

router.delete('/protocol-session/:type', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { type } = req.params;
    await db.run('DELETE FROM protocol_sessions WHERE userId = ? AND protocolType = ?', [userId, type]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to clear session' });
  }
});

// --- LOGISTICS ---
router.get('/logistics/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized logistics access' });
    }
    const row = await db.get('SELECT logistics FROM users WHERE id = ?', [req.params.userId]);
    const protocols = row && row.logistics ? JSON.parse(row.logistics) : [];
    // Ensure it returns an array even if it was saved as a single object before
    res.json(Array.isArray(protocols) ? protocols : [protocols]);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch logistics' });
  }
});

router.post('/logistics/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized logistics update' });
    }
    const protocols = Array.isArray(req.body) ? req.body.slice(0, 3) : [req.body].slice(0, 3);
    await db.run('UPDATE users SET logistics = ? WHERE id = ?', [JSON.stringify(protocols), req.params.userId]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save logistics' });
  }
});

// --- REFERRALS ---
router.get('/referrals/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized referrals access' });
    }
    const userId = req.params.userId;
    const user = await db.get('SELECT handle, credit, rep FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const referralCode = `KRAZE_${user.handle.toUpperCase()}`;

    // Get list of users referred by this user
    const referredUsers = await db.all(
      `SELECT r.referredId, r.status, r.rewardAmount, r.createdAt, u.handle 
       FROM referrals r 
       JOIN users u ON r.referredId = u.id 
       WHERE r.referrerId = ? 
       ORDER BY r.createdAt DESC`, 
      [userId]
    );

    // Get who referred this user (if any)
    const referrer = await db.get(
      `SELECT r.referrerId, u.handle 
       FROM referrals r 
       JOIN users u ON r.referrerId = u.id 
       WHERE r.referredId = ?`, 
      [userId]
    );

    // Calculate total earned
    const totalEarnings = referredUsers
      .filter((r: any) => r.status === 'COMPLETED' || r.status === 'ACTIVE')
      .reduce((sum: number, r: any) => sum + r.rewardAmount, 0);

    res.json({
      status: 'success',
      data: {
        referralCode,
        referredUsers,
        referrer: referrer ? { id: referrer.referrerId, handle: referrer.handle } : null,
        totalEarnings,
        repGain: referredUsers.length * 200 // Give 200 REP per active referral
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch referrals' });
  }
});

router.post('/referrals/bind', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ status: 'error', message: 'Referral code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if user is trying to refer themselves
    const currUser = await db.get('SELECT handle, credit, rep FROM users WHERE id = ?', [userId]);
    if (!currUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const selfCode = `KRAZE_${currUser.handle.toUpperCase()}`;
    if (cleanCode === selfCode) {
      return res.status(400).json({ status: 'error', message: 'You cannot refer yourself.' });
    }

    // Check if already referred by someone
    const existingReferral = await db.get('SELECT id FROM referrals WHERE referredId = ?', [userId]);
    if (existingReferral) {
      return res.status(400).json({ status: 'error', message: 'You have already applied a referral code.' });
    }

    // Find the referrer by matching their code
    let referrerHandle = '';
    if (cleanCode.startsWith('KRAZE_')) {
      referrerHandle = cleanCode.substring(6);
    } else {
      referrerHandle = cleanCode;
    }

    const referrer = await db.get('SELECT id, credit, rep FROM users WHERE UPPER(handle) = ?', [referrerHandle]);
    if (!referrer) {
      return res.status(404).json({ status: 'error', message: 'Invalid referral code or handle.' });
    }

    if (referrer.id === userId) {
      return res.status(400).json({ status: 'error', message: 'You cannot refer yourself.' });
    }

    // Insert new referral record
    const referralId = `ref_${Date.now()}`;
    const rewardForReferrer = 0.0; // Inviter gets 10% of total cart on first purchase instead of GH₵10 upfront
    const rewardForReferred = 5.0; // GH₵5 reward for the referred user as sign-up/link bonus!

    await db.run(
      'INSERT INTO referrals (id, referrerId, referredId, code, status, rewardAmount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [referralId, referrer.id, userId, cleanCode, 'COMPLETED', rewardForReferrer, new Date().toISOString()]
    );

    // Update referrer and referred users' store credits & rep!
    const newReferrerCredit = (referrer.credit || 0) + rewardForReferrer;
    const newReferrerRep = (referrer.rep || 0) + 200; // Still give +200 REP on bind
    await db.run('UPDATE users SET credit = ?, rep = ? WHERE id = ?', [newReferrerCredit, newReferrerRep, referrer.id]);

    const newReferredCredit = (currUser.credit || 0) + rewardForReferred;
    const newReferredRep = (currUser.rep || 0) + 50;
    await db.run('UPDATE users SET credit = ?, rep = ? WHERE id = ?', [newReferredCredit, newReferredRep, userId]);

    // Update stats store credit if needed
    await db.run('UPDATE user_stats SET storeCredit = ? WHERE userId = ?', [newReferrerCredit, referrer.id]);
    await db.run('UPDATE user_stats SET storeCredit = ? WHERE userId = ?', [newReferredCredit, userId]);

    res.json({
      status: 'success',
      message: `Referral applied: You received GH₵${rewardForReferred} store credit & +50 REP. Referrer received +200 REP and will receive 10% of your first purchase as credit.`,
      data: {
        referrerHandle: referrer.handle
      }
    });

  } catch (error) {
    console.error('Error binding referral:', error);
    res.status(500).json({ status: 'error', message: 'Failed to bind referral' });
  }
});

router.get('/:userId/outfits', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized outfits access' });
    }
    const rows = await db.all('SELECT * FROM outfits WHERE userId = ? ORDER BY timestamp DESC', [req.params.userId]);
    const outfits = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
    res.json(outfits);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch outfits' });
  }
});

router.post('/:userId/outfits', authenticate, async (req: AuthRequest, res: any) => {
  if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized outfits update' });
  }
  const { id, name, items } = req.body;
  try {
    await db.run(
      'INSERT INTO outfits (id, userId, name, items, timestamp) VALUES (?, ?, ?, ?, ?)',
      [id || Date.now().toString(), req.params.userId, name, JSON.stringify(items), new Date().toISOString()]
    );
    res.status(201).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to save outfit' });
  }
});

export default router;
