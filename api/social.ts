import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/social-posts', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM social_posts');
    const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
    const filtered = rows.filter((post: any) => {
      const postTime = new Date(post.timestamp).getTime();
      if (isNaN(postTime)) return true;
      return postTime >= fiveDaysAgo;
    });
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch social posts' });
  }
});

router.post('/social-posts', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userHandle').notEmpty().withMessage('User handle is required'),
  body('image').notEmpty().withMessage('Image is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { id, userId, userHandle, image, likes, dislikes, reports, timestamp, weekId } = req.body;
  
  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized social post' });
  }

  try {
    // Check if user already posted this week
    const existingPost = await db.get('SELECT id FROM social_posts WHERE userId = ? AND weekId = ?', [userId, weekId]);
    if (existingPost) {
      return res.status(400).json({ status: 'error', message: 'One post per week limit reached.' });
    }

    await db.run(
      'INSERT INTO social_posts (`id`, `userId`, `userHandle`, `image`, `likes`, `dislikes`, `reports`, `timestamp`, `weekId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        String(id), 
        String(userId), 
        String(userHandle), 
        String(image), 
        Number(likes || 0), 
        Number(dislikes || 0), 
        Number(reports || 0), 
        String(timestamp), 
        String(weekId)
      ]
    );
    res.status(201).json({ status: 'success', message: 'Post created' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create post' });
  }
});

router.get('/social-posts/:postId/comments', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM social_comments WHERE postId = ?', [req.params.postId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch comments' });
  }
});

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
    await db.run(
      'INSERT INTO social_comments (`id`, `postId`, `userId`, `userHandle`, `text`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)',
      [Date.now().toString(), req.params.postId, userId, userHandle, text, new Date().toISOString()]
    );
    res.status(201).json({ success: true, message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

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
        await db.run('UPDATE social_posts SET ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' - 1 WHERE `id` = ?', [postId]);
      } else {
        // Switch interaction
        await db.run('UPDATE social_interactions SET `type` = ? WHERE `userId` = ? AND `postId` = ?', [type, userId, postId]);
        await db.run('UPDATE social_posts SET ' + (existing.type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = ' + (existing.type === 'LIKE' ? '`likes`' : '`dislikes`') + ' - 1, ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' = ' + (type === 'LIKE' ? '`likes`' : '`dislikes`') + ' + 1 WHERE `id` = ?', [postId]);
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

router.post('/social-posts/:postId/report', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, reason } = req.body;

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

// Group chat message endpoints
router.get('/group-messages', async (req, res) => {
  try {
    // Only return messages with < 5 reports to filter out explicit content
    const rows = await db.all('SELECT * FROM group_messages WHERE reports < 5 ORDER BY timestamp ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch group messages' });
  }
});

router.post('/group-messages', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userHandle').notEmpty().withMessage('User handle is required'),
  body('text').notEmpty().withMessage('Message text is required')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  const { userId, userHandle, text } = req.body;

  if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Unauthorized group message' });
  }

  try {
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const timestamp = new Date().toISOString();
    await db.run(
      'INSERT INTO group_messages (id, userId, userHandle, text, timestamp, reports) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, userHandle, text, timestamp, 0]
    );
    res.status(201).json({ status: 'success', message: 'Message sent', id, timestamp });
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
