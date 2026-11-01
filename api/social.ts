import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Calculates the UTC timestamp of the most recent Friday at 00:00:00 UTC.
 * If right now is Friday after 00:00:00 UTC, returns today's Friday 00:00:00 UTC.
 * If right now is Saturday-Thursday, returns the immediately preceding Friday at 00:00:00 UTC.
 */
export function getLastFridayReset(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const daysSinceFriday = (day >= 5) ? (day - 5) : (day + 2);
  const lastFriday = new Date(now);
  lastFriday.setUTCDate(now.getUTCDate() - daysSinceFriday);
  lastFriday.setUTCHours(0, 0, 0, 0);
  return lastFriday;
}

export function getNextFridayReset(): Date {
  const lastFriday = getLastFridayReset();
  const nextFriday = new Date(lastFriday.getTime() + 7 * 24 * 60 * 60 * 1000);
  return nextFriday;
}

export function getFridayWeekId(): string {
  const lastFriday = getLastFridayReset();
  const yyyy = lastFriday.getUTCFullYear();
  const mm = String(lastFriday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(lastFriday.getUTCDate()).padStart(2, '0');
  return `friday_${yyyy}-${mm}-${dd}`;
}

let schemaInitialized = false;
async function ensureSocialSchema() {
  if (schemaInitialized) return;
  try {
    await db.exec(`CREATE TABLE IF NOT EXISTS social_posts (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
      userHandle TEXT,
      image TEXT,
      styleTitle TEXT,
      caption TEXT,
      tags TEXT,
      likes INT DEFAULT 0,
      dislikes INT DEFAULT 0,
      reports INT DEFAULT 0,
      timestamp TEXT,
      weekId TEXT
    )`);

    const alterCols = [
      'ALTER TABLE social_posts ADD COLUMN styleTitle TEXT',
      'ALTER TABLE social_posts ADD COLUMN caption TEXT',
      'ALTER TABLE social_posts ADD COLUMN tags TEXT'
    ];
    for (const q of alterCols) {
      try {
        await db.exec(q);
      } catch (e) {
        // ignore duplicate column error
      }
    }
    schemaInitialized = true;
  } catch (e) {
    console.error('Error ensuring social schema:', e);
  }
}

/**
 * Purges community posts, comments, interactions, and chat messages from prior Friday cycles.
 */
export async function performFridayCleanup() {
  try {
    await ensureSocialSchema();
    const lastFriday = getLastFridayReset();
    const cutoffIso = lastFriday.toISOString();

    // 1. Delete old social posts from before last Friday reset
    await db.run('DELETE FROM social_posts WHERE timestamp < ?', [cutoffIso]);

    // 2. Delete old comments or orphaned comments
    await db.run('DELETE FROM social_comments WHERE timestamp < ? OR postId NOT IN (SELECT id FROM social_posts)', [cutoffIso]);

    // 3. Delete old interactions or orphaned interactions
    await db.run('DELETE FROM social_interactions WHERE postId NOT IN (SELECT id FROM social_posts)');

    // 4. Delete old group chat messages from before last Friday reset
    await db.run('DELETE FROM group_messages WHERE timestamp < ?', [cutoffIso]);
  } catch (err) {
    console.error('Error during Friday community cleanup:', err);
  }
}

// Automatically trigger cleanup periodically
setInterval(() => {
  performFridayCleanup().catch(err => console.error('Periodic Friday cleanup error:', err));
}, 15 * 60 * 1000); // Every 15 minutes

// Cycle Info Endpoint
router.get('/social/cycle-info', async (req, res) => {
  try {
    await performFridayCleanup();
    const lastFriday = getLastFridayReset();
    const nextFriday = getNextFridayReset();
    const now = new Date();
    const currentWeekId = getFridayWeekId();
    const isResetDay = now.getUTCDay() === 5;
    const timeRemainingMs = Math.max(0, nextFriday.getTime() - now.getTime());

    const postCountRow = await db.get('SELECT COUNT(*) as count FROM social_posts');
    const msgCountRow = await db.get('SELECT COUNT(*) as count FROM group_messages WHERE reports < 5');

    res.json({
      lastReset: lastFriday.toISOString(),
      nextReset: nextFriday.toISOString(),
      currentWeekId,
      timeRemainingMs,
      isResetDay,
      activePostsCount: postCountRow?.count || 0,
      activeMessagesCount: msgCountRow?.count || 0
    });
  } catch (error) {
    console.error('Error fetching cycle info:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch cycle info' });
  }
});

// Force Reset Endpoint (for admin / dev testing)
router.post('/social/force-reset', authenticate, async (req: AuthRequest, res: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Admin access required' });
  }
  try {
    await db.run('DELETE FROM social_posts');
    await db.run('DELETE FROM social_comments');
    await db.run('DELETE FROM social_interactions');
    await db.run('DELETE FROM group_messages');
    res.json({ status: 'success', message: 'All community fits and chat messages wiped clean.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to force reset' });
  }
});

// GET Social Posts (Filtered by current Friday cycle)
router.get('/social-posts', async (req, res) => {
  try {
    await performFridayCleanup();
    const rows = await db.all('SELECT * FROM social_posts WHERE reports < 5 ORDER BY timestamp DESC');
    
    // Parse tags if stored as JSON string or string array
    const parsed = rows.map((post: any) => {
      let tags: string[] = [];
      if (post.tags) {
        try {
          tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
        } catch {
          tags = [post.tags];
        }
      }
      return {
        ...post,
        tags
      };
    });

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching social posts:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch social posts' });
  }
});

// POST New Social Post / Fit Showcase
router.post('/social-posts', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userHandle').notEmpty().withMessage('User handle is required'),
  body('image').notEmpty().withMessage('Image is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, userHandle, image, styleTitle, caption, tags, likes, dislikes, reports } = req.body;
  
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized social post' });
  }

  try {
    await performFridayCleanup();
    const currentWeekId = getFridayWeekId();
    const timestamp = new Date().toISOString();
    const postId = id || 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Limit to 1 showcase post per user per Friday cycle, or update existing
    const existingPost = await db.get('SELECT id FROM social_posts WHERE userId = ?', [userId]);
    if (existingPost) {
      // Update their post for this week's Friday cycle
      await db.run(
        'UPDATE social_posts SET `image` = ?, `styleTitle` = ?, `caption` = ?, `tags` = ?, `timestamp` = ? WHERE `id` = ?',
        [
          String(image),
          styleTitle ? String(styleTitle) : '',
          caption ? String(caption) : '',
          tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : '[]',
          timestamp,
          existingPost.id
        ]
      );
      return res.status(200).json({ status: 'success', message: 'Your Friday showcase post was updated!', id: existingPost.id });
    }

    await db.run(
      'INSERT INTO social_posts (`id`, `userId`, `userHandle`, `image`, `styleTitle`, `caption`, `tags`, `likes`, `dislikes`, `reports`, `timestamp`, `weekId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        String(postId), 
        String(userId), 
        String(userHandle), 
        String(image), 
        styleTitle ? String(styleTitle) : '',
        caption ? String(caption) : '',
        tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : '[]',
        Number(likes || 0), 
        Number(dislikes || 0), 
        Number(reports || 0), 
        timestamp, 
        currentWeekId
      ]
    );
    res.status(201).json({ status: 'success', message: 'Post created', id: postId });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create post' });
  }
});

// GET Comments for a post
router.get('/social-posts/:postId/comments', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM social_comments WHERE postId = ? ORDER BY timestamp ASC', [req.params.postId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch comments' });
  }
});

// POST Comment on a post
router.post('/social-posts/:postId/comments', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userHandle').notEmpty().withMessage('User handle is required'),
  body('text').notEmpty().withMessage('Text is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, userHandle, text } = req.body;

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized comment' });
  }

  try {
    const commentId = 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const timestamp = new Date().toISOString();
    await db.run(
      'INSERT INTO social_comments (`id`, `postId`, `userId`, `userHandle`, `text`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
      [commentId, req.params.postId, userId, userHandle, text, timestamp]
    );
    res.status(201).json({ success: true, message: 'Comment added', id: commentId, timestamp });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Like / Dislike interaction
router.post('/social-posts/:postId/interact', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('type').isIn(['LIKE', 'DISLIKE']).withMessage('Type must be LIKE or DISLIKE')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, type } = req.body;
  const postId = req.params.postId;

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized interaction' });
  }

  try {
    const existing = await db.get('SELECT type FROM social_interactions WHERE userId = ? AND postId = ?', [userId, postId]);
    
    if (existing) {
      if (existing.type === type) {
        // Remove interaction
        await db.run('DELETE FROM social_interactions WHERE `userId` = ? AND `postId` = ?', [userId, postId]);
        await db.run('UPDATE social_posts SET ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = MAX(0, ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' - 1) WHERE `id` = ?', [postId]);
      } else {
        // Switch interaction
        await db.run('UPDATE social_interactions SET `type` = ? WHERE `userId` = ? AND `postId` = ?', [type, userId, postId]);
        await db.run('UPDATE social_posts SET ' + (existing.type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = MAX(0, ' + (existing.type === 'LIKE' ? '`likes`' : '`dislikes`') + ' - 1), ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' + 1 WHERE `id` = ?', [postId]);
      }
    } else {
      // Add interaction
      await db.run('INSERT INTO social_interactions (`userId`, `postId`, `type`) VALUES (?, ?, ?)', [userId, postId, type]);
      await db.run('UPDATE social_posts SET ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' + 1 WHERE `id` = ?', [postId]);
    }
    
    const post = await db.get('SELECT * FROM social_posts WHERE id = ?', [postId]);
    res.json(post);
  } catch (error) {
    console.error('Error interacting:', error);
    res.status(500).json({ status: 'error', message: 'Failed to interact' });
  }
});

// Report a post
router.post('/social-posts/:postId/report', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId } = req.body;

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized report' });
  }

  try {
    await db.run('UPDATE social_posts SET `reports` = `reports` + 1 WHERE `id` = ?', [req.params.postId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to report post' });
  }
});

// User interactions list
router.get('/social-interactions/:userId', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized interactions access' });
    }
    const rows = await db.all('SELECT * FROM social_interactions WHERE userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch interactions' });
  }
});

// Group chat message endpoints (Cleaned on Fridays)
router.get('/group-messages', async (req, res) => {
  try {
    await performFridayCleanup();
    // Only return messages with < 5 reports to filter out explicit content
    const rows = await db.all('SELECT * FROM group_messages WHERE reports < 5 ORDER BY timestamp ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch group messages' });
  }
});

router.post('/group-messages', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userHandle').notEmpty().withMessage('User handle is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, userHandle, text, imageUrl } = req.body;

  if (!text?.trim() && !imageUrl?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Message text or image is required' });
  }

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized group message' });
  }

  try {
    await performFridayCleanup();
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const timestamp = new Date().toISOString();
    await db.run(
      'INSERT INTO group_messages (id, userId, userHandle, text, imageUrl, timestamp, reports) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, userHandle, text ? text.trim() : '', imageUrl ? imageUrl.trim() : null, timestamp, 0]
    );
    res.status(201).json({ status: 'success', message: 'Message sent', id, timestamp, imageUrl });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send group message' });
  }
});

router.post('/group-messages/:messageId/report', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId } = req.body;
  const { messageId } = req.params;

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized report' });
  }

  try {
    await db.run('UPDATE group_messages SET reports = reports + 1 WHERE id = ?', [messageId]);
    res.json({ success: true, message: 'Message reported successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to report message' });
  }
});

export default router;
