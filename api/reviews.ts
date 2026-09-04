import { Router } from 'express';
import { db } from '../server.js';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews/:id/helpful (Auth required, toggle helpful vote)
router.post('/:id/helpful', authenticate, async (req: AuthRequest, res: any) => {
  const reviewId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required to vote' });
  }

  try {
    const review = await db.get('SELECT id, helpfulCount FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    // Check if user already voted
    const existingVote = await db.get(
      'SELECT 1 FROM review_helpful_votes WHERE reviewId = ? AND userId = ?',
      [reviewId, userId]
    );

    let userVoted = false;
    let newHelpfulCount = review.helpfulCount || 0;

    if (existingVote) {
      // Toggle off: remove vote
      await db.run('DELETE FROM review_helpful_votes WHERE reviewId = ? AND userId = ?', [reviewId, userId]);
      newHelpfulCount = Math.max(0, newHelpfulCount - 1);
      await db.run('UPDATE reviews SET helpfulCount = ? WHERE id = ?', [newHelpfulCount, reviewId]);
      userVoted = false;
    } else {
      // Toggle on: add vote
      const nowIso = new Date().toISOString();
      await db.run(
        'INSERT INTO review_helpful_votes (reviewId, userId, createdAt) VALUES (?, ?, ?)',
        [reviewId, userId, nowIso]
      );
      newHelpfulCount = newHelpfulCount + 1;
      await db.run('UPDATE reviews SET helpfulCount = ? WHERE id = ?', [newHelpfulCount, reviewId]);
      userVoted = true;
    }

    res.json({
      status: 'success',
      helpfulCount: newHelpfulCount,
      userVoted
    });
  } catch (error) {
    console.error('Error toggling helpful vote:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update helpful vote' });
  }
});

// GET /api/reviews/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: any) => {
  const reviewId = req.params.id;
  const currentUserId = req.user?.id;

  try {
    const review = await db.get(
      `SELECT r.*, u.profile_picture as userAvatar, u.handle as uHandle
       FROM reviews r
       LEFT JOIN users u ON r.userId = u.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    let parsedImages: string[] = [];
    try {
      if (review.images) {
        parsedImages = typeof review.images === 'string' ? JSON.parse(review.images) : review.images;
      }
    } catch (e) {
      parsedImages = [];
    }

    const extraImages = await db.all('SELECT url, thumbnailUrl FROM review_images WHERE reviewId = ?', [review.id]);
    if (extraImages && extraImages.length > 0) {
      const urls = extraImages.map((img: any) => img.url).filter(Boolean);
      parsedImages = Array.from(new Set([...parsedImages, ...urls]));
    }

    let userVoted = false;
    if (currentUserId) {
      const vote = await db.get('SELECT 1 FROM review_helpful_votes WHERE reviewId = ? AND userId = ?', [reviewId, currentUserId]);
      userVoted = !!vote;
    }

    res.json({
      status: 'success',
      review: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        userHandle: review.userHandle || review.uHandle || 'Archiver',
        userName: review.userName || review.uHandle || 'Anonymous Archiver',
        userAvatar: review.userAvatar || null,
        rating: Number(review.rating) || 5,
        title: review.title || '',
        body: review.body || review.comment || '',
        comment: review.body || review.comment || '',
        images: parsedImages,
        verifiedPurchase: Boolean(review.verifiedPurchase ?? 1),
        createdAt: review.createdAt || review.timestamp || new Date().toISOString(),
        timestamp: review.createdAt || review.timestamp || new Date().toISOString(),
        helpfulCount: Number(review.helpfulCount) || 0,
        userVoted
      }
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch review' });
  }
});

// DELETE /api/reviews/:id (Owner or Admin)
router.delete('/:id', authenticate, async (req: AuthRequest, res: any) => {
  const reviewId = req.params.id;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const review = await db.get('SELECT userId FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to delete this review' });
    }

    await db.run('DELETE FROM reviews WHERE id = ?', [reviewId]);
    await db.run('DELETE FROM review_helpful_votes WHERE reviewId = ?', [reviewId]);
    await db.run('DELETE FROM review_images WHERE reviewId = ?', [reviewId]);
    try {
      await db.run('DELETE FROM product_reviews WHERE id = ?', [reviewId]);
    } catch (e) {}

    res.json({ status: 'success', message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete review' });
  }
});

export default router;
