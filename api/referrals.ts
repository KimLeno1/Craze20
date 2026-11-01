import { Router } from 'express';
import { db } from '../server.js';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../middleware/auth.js';
import {
  checkCircularReferral,
  getUserLedgerBlocks,
  verifyLedgerChain,
  recordReferralRewardBlock
} from './referralBlockchain.js';

const router = Router();

export function generateReferralCode(nameOrHandle: string): string {
  const clean = (nameOrHandle || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = clean.length >= 4 ? clean.substring(0, 4) : (clean + 'CKXX').substring(0, 4);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `CK-${prefix}${randNum}`;
}

// GET /api/referrals/validate/:code - Validate if referral code exists
router.get('/validate/:code', optionalAuth, async (req: AuthRequest, res: any) => {
  const rawCode = String(req.params.code || '').trim().toUpperCase();
  const currentUserId = req.user?.id || (req.query.userId as string);

  if (!rawCode) {
    return res.status(400).json({ valid: false, message: 'Referral code is required' });
  }

  try {
    // Find referrer by referralCode, or handle match
    const cleanHandle = rawCode.startsWith('KRAZE_') ? rawCode.substring(6) : rawCode;
    const referrer = await db.get(
      'SELECT id, handle, email, referralCode FROM users WHERE UPPER(referralCode) = ? OR UPPER(handle) = ?',
      [rawCode, cleanHandle]
    );

    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    // Check circular referral constraint: "you cant use the referal code of some one you referred"
    if (currentUserId) {
      const circCheck = await checkCircularReferral(db, currentUserId, referrer.id);
      if (!circCheck.isAllowed) {
        return res.status(400).json({
          valid: false,
          message: circCheck.reason || 'You cannot use the referral code of someone you referred.'
        });
      }
    }

    const referrerName = referrer.handle || referrer.email?.split('@')[0] || 'A Kraze Member';

    return res.json({
      valid: true,
      code: rawCode,
      referrerId: referrer.id,
      referrerName,
      discountAmount: 20,
      minOrderAmount: 100,
      message: `Valid code from @${referrerName}! Get GH₵20 off orders over GH₵100 and earn them 10% credit for life.`
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

    const ledger = await getUserLedgerBlocks(db, userId);
    const ledgerEarned = ledger
      .filter((b: any) => b.referrerId === userId)
      .reduce((s: number, b: any) => s + (Number(b.rewardAmount) || 0), 0);
    if (ledgerEarned > 0) {
      totalEarned = Math.max(totalEarned, ledgerEarned);
    }

    return res.json({
      status: 'success',
      referralCode: user.referralCode,
      storeCredit,
      commissionRate: 0.10,
      lifetimeCommissionRate: '10%',
      roundingRule: 'nearest whole number',
      stats: {
        totalInvited,
        completedCount,
        pendingCount,
        totalEarned,
        commissionRate: 0.10
      },
      referrals: formattedReferrals,
      ledger
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch referral stats' });
  }
});

// GET /api/referrals/ledger - Fetch user's blockchain ledger blocks
router.get('/ledger', authenticate, async (req: AuthRequest, res: any) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  try {
    const blocks = await getUserLedgerBlocks(db, userId);
    return res.json({ status: 'success', blocks });
  } catch (error) {
    console.error('Error fetching referral ledger:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch referral ledger' });
  }
});

// GET /api/referrals/verify-chain - Cryptographic verification of all blockchain blocks
router.get('/verify-chain', async (req, res: any) => {
  try {
    const verification = await verifyLedgerChain(db);
    return res.json({ status: 'success', verification });
  } catch (error) {
    console.error('Error verifying referral chain:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to verify chain' });
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
    const cleanHandle = code.startsWith('KRAZE_') ? code.substring(6) : code;
    const referrer = await db.get(
      'SELECT id, handle, email FROM users WHERE UPPER(referralCode) = ? OR UPPER(handle) = ?',
      [code, cleanHandle]
    );

    if (!referrer) {
      return res.status(404).json({ status: 'error', message: 'Referral code not found' });
    }

    if (currentUserId) {
      const circCheck = await checkCircularReferral(db, currentUserId, referrer.id);
      if (!circCheck.isAllowed) {
        return res.status(400).json({
          status: 'error',
          message: circCheck.reason || 'You cannot use the referral code of someone you referred.'
        });
      }
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
           VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
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

// POST /api/referrals/reward - Rewarding purchase for referred friend
router.post('/reward', authenticate, async (req: AuthRequest, res: any) => {
  const { refereeUserId, refereeOrderId, productAmount } = req.body;

  try {
    const refereeId = refereeUserId || req.user?.id;
    if (!refereeId) {
      return res.status(400).json({ status: 'error', message: 'Referee User ID required' });
    }

    // Find referral link
    const referral = await db.get(
      `SELECT * FROM referrals WHERE (refereeId = ? OR referredId = ?)`,
      [refereeId, refereeId]
    );

    if (!referral) {
      return res.json({ status: 'info', message: 'No referral connection found' });
    }

    // Check if order was already ledgered
    if (refereeOrderId) {
      const existingBlock = await db.get('SELECT id FROM referral_ledger WHERE orderId = ?', [refereeOrderId]);
      if (existingBlock) {
        return res.json({ status: 'info', message: 'Order reward already mined on blockchain ledger' });
      }
    }

    const nowIso = new Date().toISOString();
    // 10% of product amount rounded to nearest whole number
    const prodAmt = Number(productAmount) || 100;
    const rewardAmount = Math.round(prodAmt * 0.10);

    if (rewardAmount <= 0) {
      return res.json({ status: 'info', message: 'Reward amount calculates to 0' });
    }

    // 1. Record on blockchain ledger
    const block = await recordReferralRewardBlock(db, {
      referrerId: referral.referrerId,
      referredUserId: refereeId,
      orderId: refereeOrderId || `MANUAL_${Date.now()}`,
      productAmount: prodAmt,
      rewardAmount,
      metadata: { source: 'api_reward_endpoint' }
    });

    // 2. Update referral status
    await db.run(
      `UPDATE referrals SET status = 'completed', rewardAmount = rewardAmount + ?, refereeOrderId = ?, completedAt = ? WHERE id = ?`,
      [rewardAmount, refereeOrderId || null, nowIso, referral.id]
    );

    // 3. Credit referrer store credit
    await db.run(
      'UPDATE users SET credit = credit + ? WHERE id = ?',
      [rewardAmount, referral.referrerId]
    );

    await db.run(
      'UPDATE user_stats SET storeCredit = storeCredit + ? WHERE userId = ?',
      [rewardAmount, referral.referrerId]
    );

    // Create notification for referrer
    try {
      const notifId = `notif_${Date.now()}`;
      await db.run(
        `INSERT INTO notifications (id, title, message, type, timestamp, read, recipientId)
         VALUES (?, 'KFAM Referral Reward! 🎉', ?, 'REWARD', ?, 0, ?)`,
        [
          notifId,
          `Your friend made a purchase of GH₵${prodAmt}! You received GH₵${rewardAmount} store credit (10% lifetime commission). Block #${block.blockIndex} mined.`,
          nowIso,
          referral.referrerId
        ]
      );
    } catch (e) {}

    return res.json({
      status: 'success',
      message: 'Referral reward credited and block mined successfully',
      rewardAmount,
      block
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
