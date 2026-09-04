import { Router } from 'express';
import { db } from '../server.js';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

export function generateReferralCode(nameOrHandle: string): string {
  const clean = (nameOrHandle || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = clean.length >= 4 ? clean.substring(0, 4) : (clean + 'CKXX').substring(0, 4);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `CK-${prefix}${randNum}`;
}

// GET /api/referrals/validate/:code - Validate if referral code exists
router.get('/validate/:code', async (req, res: any) => {
  const rawCode = (req.params.code || '').trim().toUpperCase();
  if (!rawCode) {
    return res.status(400).json({ valid: false, message: 'Referral code is required' });
  }

  try {
    const referrer = await db.get(
      'SELECT id, handle, email FROM users WHERE UPPER(referralCode) = ?',
      [rawCode]
    );

    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    const referrerName = referrer.handle || referrer.email?.split('@')[0] || 'A Kraze Member';

    return res.json({
      valid: true,
      code: rawCode,
      referrerId: referrer.id,
      referrerName,
      discountAmount: 20,
      minOrderAmount: 100,
      message: `Valid code from @${referrerName}! Get GH₵20 off orders over GH₵100.`
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({ valid: false, message: 'Failed to validate referral code' });
  }
});

// GET /api/users/me/referrals OR GET /api/referrals/my-stats
router.get('/my-stats', authenticate, async (req: AuthRequest, res: any) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  try {
    let user = await db.get(
      'SELECT id, handle, email, referralCode, credit, phone FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Ensure user has a referral code
    if (!user.referralCode) {
      const newCode = generateReferralCode(user.handle || user.email);
      await db.run('UPDATE users SET referralCode = ? WHERE id = ?', [newCode, userId]);
      user.referralCode = newCode;
    }

    // Fetch store credit balance
    const storeCredit = user.credit || 0;

    // Fetch all referrals where user is the referrer
    const referrals = await db.all(
      `SELECT r.*, u.handle as refereeHandle, u.email as refereeEmail, u.profile_picture as refereeAvatar, u.createdAt as refereeJoinedAt
       FROM referrals r
       LEFT JOIN users u ON (r.refereeId = u.id OR r.referredId = u.id)
       WHERE r.referrerId = ?
       ORDER BY r.createdAt DESC`,
      [userId]
    );

    const totalInvited = referrals.length;
    let completedCount = 0;
    let pendingCount = 0;
    let totalEarned = 0;

    const formattedReferrals = referrals.map((ref: any) => {
      const isCompleted = (ref.status || '').toLowerCase() === 'completed';
      if (isCompleted) {
        completedCount++;
        totalEarned += Number(ref.rewardAmount) || 20;
      } else {
        pendingCount++;
      }

      return {
        id: ref.id,
        refereeId: ref.refereeId || ref.referredId,
        refereeName: ref.refereeHandle || ref.refereeEmail?.split('@')[0] || 'Invited Friend',
        refereeAvatar: ref.refereeAvatar || null,
        status: (ref.status || 'pending').toLowerCase(),
        rewardAmount: Number(ref.rewardAmount) || 20,
        createdAt: ref.createdAt,
        completedAt: ref.completedAt || null
      };
    });

    return res.json({
      status: 'success',
      referralCode: user.referralCode,
      storeCredit,
      stats: {
        totalInvited,
        completedCount,
        pendingCount,
        totalEarned
      },
      referrals: formattedReferrals
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch referral stats' });
  }
});

// POST /api/referrals/track - Called on signup or code application
router.post('/track', optionalAuth, async (req: AuthRequest, res: any) => {
  const { referralCode, refereeUserId, refereeEmail } = req.body;
  const currentUserId = req.user?.id || refereeUserId;

  const code = (referralCode || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ status: 'error', message: 'Referral code required' });
  }

  try {
    const referrer = await db.get(
      'SELECT id, handle, email FROM users WHERE UPPER(referralCode) = ?',
      [code]
    );

    if (!referrer) {
      return res.status(404).json({ status: 'error', message: 'Referral code not found' });
    }

    if (currentUserId && referrer.id === currentUserId) {
      return res.status(400).json({ status: 'error', message: 'Cannot refer yourself' });
    }

    let refereeId = currentUserId;
    if (!refereeId && refereeEmail) {
      const refereeUser = await db.get('SELECT id FROM users WHERE email = ?', [refereeEmail]);
      if (refereeUser) refereeId = refereeUser.id;
    }

    if (refereeId) {
      // Check existing referral record
      const existing = await db.get(
        'SELECT id FROM referrals WHERE (refereeId = ? OR referredId = ?)',
        [refereeId, refereeId]
      );

      if (!existing) {
        const refId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const nowIso = new Date().toISOString();

        await db.run(
          `INSERT INTO referrals (id, referrerId, refereeId, referredId, code, status, rewardAmount, createdAt)
           VALUES (?, ?, ?, ?, ?, 'pending', 20, ?)`,
          [refId, referrer.id, refereeId, refereeId, code, nowIso]
        );

        // Update referee's referredBy column
        await db.run('UPDATE users SET referredBy = ? WHERE id = ?', [referrer.id, refereeId]);
      }
    }

    return res.json({
      status: 'success',
      message: `Referral tracked from @${referrer.handle || 'User'}`,
      referrerName: referrer.handle || referrer.email?.split('@')[0],
      discountAmount: 20
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to track referral' });
  }
});

// POST /api/referrals/reward - On referee first order delivery, credit both parties
router.post('/reward', authenticate, async (req: AuthRequest, res: any) => {
  const { refereeUserId, refereeOrderId } = req.body;

  try {
    const refereeId = refereeUserId || req.user?.id;
    if (!refereeId) {
      return res.status(400).json({ status: 'error', message: 'Referee User ID required' });
    }

    // Find pending referral
    const referral = await db.get(
      `SELECT * FROM referrals WHERE (refereeId = ? OR referredId = ?) AND LOWER(status) = 'pending'`,
      [refereeId, refereeId]
    );

    if (!referral) {
      return res.json({ status: 'info', message: 'No pending referral found or already rewarded' });
    }

    const nowIso = new Date().toISOString();
    const rewardAmount = Number(referral.rewardAmount) || 20;

    // 1. Update referral status to completed
    await db.run(
      `UPDATE referrals SET status = 'completed', refereeOrderId = ?, completedAt = ? WHERE id = ?`,
      [refereeOrderId || null, nowIso, referral.id]
    );

    // 2. Credit referrer GH₵20 store credit
    await db.run(
      'UPDATE users SET credit = credit + ? WHERE id = ?',
      [rewardAmount, referral.referrerId]
    );

    // Also sync to user_stats storeCredit
    await db.run(
      'UPDATE user_stats SET storeCredit = storeCredit + ? WHERE userId = ?',
      [rewardAmount, referral.referrerId]
    );

    // Create a notification for referrer
    try {
      const notifId = `notif_${Date.now()}`;
      await db.run(
        `INSERT INTO notifications (id, title, message, type, timestamp, read, recipientId)
         VALUES (?, 'KFAM Referral Reward! 🎉', 'Your friend completed their first order! GH₵20 store credit has been added to your balance.', 'REWARD', ?, 0, ?)`,
        [notifId, nowIso, referral.referrerId]
      );
    } catch (e) {}

    return res.json({
      status: 'success',
      message: 'Referral reward credited successfully',
      rewardAmount
    });
  } catch (error) {
    console.error('Error rewarding referral:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to reward referral' });
  }
});

// GET /api/referrals/admin/stats - Admin dashboard referral metrics & fraud detection
router.get('/admin/stats', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  try {
    // 1. Total referrals issued
    const totalIssuedRes = await db.get('SELECT COUNT(*) as count FROM referrals');
    const totalIssued = totalIssuedRes?.count || 0;

    // 2. Completed referrals
    const completedRes = await db.get("SELECT COUNT(*) as count FROM referrals WHERE LOWER(status) = 'completed'");
    const completedCount = completedRes?.count || 0;

    // 3. Pending referrals
    const pendingRes = await db.get("SELECT COUNT(*) as count FROM referrals WHERE LOWER(status) = 'pending'");
    const pendingCount = pendingRes?.count || 0;

    // 4. Conversion rate
    const conversionRate = totalIssued > 0 ? Number(((completedCount / totalIssued) * 100).toFixed(1)) : 0;

    // 5. Total payouts
    const totalPayoutsRes = await db.get("SELECT SUM(rewardAmount) as total FROM referrals WHERE LOWER(status) = 'completed'");
    const totalPayouts = totalPayoutsRes?.total || (completedCount * 20);

    // 6. Top Referrers Leaderboard
    const topReferrers = await db.all(
      `SELECT r.referrerId, u.handle, u.email, u.phone,
              COUNT(r.id) as totalReferred,
              SUM(CASE WHEN LOWER(r.status) = 'completed' THEN 1 ELSE 0 END) as completedReferred,
              SUM(CASE WHEN LOWER(r.status) = 'completed' THEN COALESCE(r.rewardAmount, 20) ELSE 0 END) as totalEarned
       FROM referrals r
       JOIN users u ON r.referrerId = u.id
       GROUP BY r.referrerId
       ORDER BY completedReferred DESC, totalReferred DESC
       LIMIT 10`
    );

    // 7. Fraud Detection Matrix
    // Look for duplicate emails, phones, or rapid signups sharing referrer/referee similarities
    const duplicatePhones = await db.all(
      `SELECT phone, COUNT(*) as count, GROUP_CONCAT(handle) as users
       FROM users
       WHERE phone IS NOT NULL AND phone != ''
       GROUP BY phone
       HAVING count > 1`
    );

    const sameIPOrDomainAlerts = await db.all(
      `SELECT r.id, r.referrerId, r.refereeId, r.createdAt,
              u1.handle as referrerName, u1.email as referrerEmail,
              u2.handle as refereeName, u2.email as refereeEmail
       FROM referrals r
       JOIN users u1 ON r.referrerId = u1.id
       JOIN users u2 ON (r.refereeId = u2.id OR r.referredId = u2.id)
       WHERE SUBSTR(u1.email, INSTR(u1.email, '@')) = SUBSTR(u2.email, INSTR(u2.email, '@'))`
    );

    return res.json({
      status: 'success',
      metrics: {
        totalIssued,
        completedCount,
        pendingCount,
        conversionRate,
        totalPayouts
      },
      topReferrers: topReferrers.map((tr: any) => ({
        referrerId: tr.referrerId,
        handle: tr.handle || tr.email?.split('@')[0] || 'Archiver',
        email: tr.email,
        phone: tr.phone,
        totalReferred: tr.totalReferred,
        completedReferred: tr.completedReferred,
        totalEarned: tr.totalEarned
      })),
      fraudAlerts: {
        duplicatePhonesCount: duplicatePhones.length,
        duplicatePhonesList: duplicatePhones,
        matchingDomainReferrals: sameIPOrDomainAlerts.map((a: any) => ({
          id: a.id,
          referrerName: a.referrerName,
          refereeName: a.refereeName,
          createdAt: a.createdAt,
          reason: 'Matching email domain between referrer and referee'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin referral stats:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch admin referral stats' });
  }
});

export default router;
