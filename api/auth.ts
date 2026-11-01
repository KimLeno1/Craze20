import { Router } from 'express';
import { db } from '../server.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from './referrals.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
};

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_NAMES = {
  USER: 'ck_user_token',
  SUPPLIER: 'ck_supplier_token',
  ADMIN: 'ck_admin_token',
  REFRESH: 'ck_refresh_token'
};

const getCookieName = (role: string) => {
  switch (role) {
    case 'ADMIN': return COOKIE_NAMES.ADMIN;
    case 'SUPPLIER': return COOKIE_NAMES.SUPPLIER;
    default: return COOKIE_NAMES.USER;
  }
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

const generateAccessTokens = (user: any) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email || user.contactEmail, 
      role: user.role,
      handle: user.handle || user.name || user.handle,
      jti: crypto.randomUUID()
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role: user.role, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

router.post('/login', [
  body('identifier').notEmpty().withMessage('Identifier is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { identifier, email, password, role } = req.body;
  const loginIdentifier = String(identifier || email || '').trim();
  const cleanId = loginIdentifier.toLowerCase();
  
  try {
    let user;
    if (role === 'SUPPLIER') {
      user = await db.get('SELECT * FROM suppliers WHERE (LOWER(TRIM(name)) = ? OR LOWER(TRIM(contactEmail)) = ?)', [cleanId, cleanId]);
      if (user) user.role = 'SUPPLIER';
    } else if (role === 'ADMIN') {
      user = await db.get('SELECT * FROM admins WHERE (LOWER(TRIM(email)) = ? OR LOWER(TRIM(handle)) = ?)', [cleanId, cleanId]);
      if (user) user.role = 'ADMIN';
    } else {
      user = await db.get('SELECT * FROM users WHERE (LOWER(TRIM(email)) = ? OR LOWER(TRIM(handle)) = ?)', [cleanId, cleanId]);
      if (user && !user.role) user.role = 'USER';
    }
    
    let isPasswordValid = false;
    if (user && user.password) {
      if (user.password === password) {
        isPasswordValid = true;
      } else {
        try {
          isPasswordValid = await bcrypt.compare(password, user.password);
        } catch {
          isPasswordValid = false;
        }
      }
    }
    
    if (user && isPasswordValid) {
      const accessToken = generateAccessTokens(user);
      const refreshToken = generateRefreshToken(user);
      
      // Store refresh token
      await db.run(
        'INSERT OR REPLACE INTO refresh_tokens (id, userId, token, expiresAt, role, userAgent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), user.id, refreshToken, Date.now() + REFRESH_TOKEN_MAX_AGE, user.role, req.get('User-Agent') || null, req.ip || null]
      );
      
      res.cookie(getCookieName(user.role), accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie(COOKIE_NAMES.REFRESH, refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email || user.contactEmail, role: user.role, handle: user.handle || user.name },
        userId: user.id, 
        handle: user.handle || user.name 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error?.message });
  }
});

router.post('/signup', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { id, handle, email, password, phone, gender, referralCode: incomingRefCode, ref } = req.body;
  const userId = id || Date.now().toString();
  const hashedPassword = await bcrypt.hash(password, 10);
  const generatedHandle = handle || email.split('@')[0] + Math.floor(Math.random() * 1000);
  const myReferralCode = generateReferralCode(generatedHandle);
  const nowIso = new Date().toISOString();

  let referrerId: string | null = null;
  const targetCode = (incomingRefCode || ref || '').trim().toUpperCase();

  if (targetCode) {
    try {
      const referrerUser = await db.get('SELECT id FROM users WHERE UPPER(referralCode) = ?', [targetCode]);
      if (referrerUser && referrerUser.id !== userId) {
        referrerId = referrerUser.id;
      }
    } catch (e) {}
  }

  try {
    await db.run(
      'INSERT INTO users (id, handle, email, password, phone, role, gender, referralCode, referredBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, generatedHandle, email, hashedPassword, phone, 'USER', gender || null, myReferralCode, referrerId, nowIso]
    );

    // If referred by someone, record pending referral
    if (referrerId) {
      try {
        const refId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db.run(
          `INSERT INTO referrals (id, referrerId, refereeId, referredId, code, status, rewardAmount, createdAt)
           VALUES (?, ?, ?, ?, ?, 'pending', 20, ?)`,
          [refId, referrerId, userId, userId, targetCode, nowIso]
        );
      } catch (e) {
        console.error("Error creating pending referral record:", e);
      }
    }
    
    // Initialize user stats
    await db.run(
      `INSERT OR IGNORE INTO user_stats (userId, achievements, dailyQuests, quests, brandSubscriptions, tagSubscriptions) VALUES (?, '[]', '[]', '[]', '[]', '[]')`,
      [userId]
    );

    const user = { id: userId, email, role: 'USER' };
    const accessToken = generateAccessTokens(user);
    const refreshToken = generateRefreshToken(user);

    await db.run(
      'INSERT INTO refresh_tokens (id, userId, token, expiresAt, role, userAgent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, refreshToken, Date.now() + REFRESH_TOKEN_MAX_AGE, 'USER', req.get('User-Agent'), req.ip]
    );

    res.cookie(COOKIE_NAMES.USER, accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie(COOKIE_NAMES.REFRESH, refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
    
    res.status(201).json({ success: true, message: 'User created', userId, handle: generatedHandle });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

router.post(['/refresh', '/refresh-token'], async (req, res) => {
  const refreshToken = req.cookies[COOKIE_NAMES.REFRESH];
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token missing' });

  try {
    const savedToken = await db.get('SELECT * FROM refresh_tokens WHERE token = ? AND expiresAt > ?', [refreshToken, Date.now()]);
    if (!savedToken) return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });

    jwt.verify(refreshToken, REFRESH_SECRET, async (err: any, payload: any) => {
      if (err) {
        await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        return res.status(403).json({ success: false, message: 'Invalid refresh token signature' });
      }

      let user;
      if (payload.role === 'SUPPLIER') {
        user = await db.get('SELECT * FROM suppliers WHERE id = ?', [payload.id]);
        if (user) user.role = 'SUPPLIER';
      } else if (payload.role === 'ADMIN') {
        user = await db.get('SELECT * FROM admins WHERE id = ?', [payload.id]);
        if (user) user.role = 'ADMIN';
      } else {
        user = await db.get('SELECT * FROM users WHERE id = ?', [payload.id]);
        if (user && !user.role) user.role = 'USER';
      }

      if (!user) return res.status(403).json({ success: false, message: 'User not found' });

      const newAccessToken = generateAccessTokens(user);
      
      res.cookie(getCookieName(payload.role), newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.json({ success: true, message: 'Token refreshed' });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
});

router.get('/check', async (req: any, res: any) => {
  const userToken = req.cookies[COOKIE_NAMES.USER];
  const supplierToken = req.cookies[COOKIE_NAMES.SUPPLIER];
  const adminToken = req.cookies[COOKIE_NAMES.ADMIN];
  
  const sessions: any = {};
  
  if (adminToken) {
    try {
      sessions.ADMIN = jwt.verify(adminToken, JWT_SECRET);
    } catch(e) {}
  }
  if (supplierToken) {
    try {
      sessions.SUPPLIER = jwt.verify(supplierToken, JWT_SECRET);
    } catch(e) {}
  }
  if (userToken) {
    try {
      sessions.USER = jwt.verify(userToken, JWT_SECRET);
    } catch(e) {}
  }

  if (Object.keys(sessions).length === 0) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Determine primary session based on hierarchy or requested context if needed
  const activeRole = sessions.ADMIN ? 'ADMIN' : (sessions.SUPPLIER ? 'SUPPLIER' : 'USER');
  const decoded = sessions[activeRole];

  res.json({ 
    success: true, 
    user: decoded,
    userId: decoded.id,
    role: decoded.role,
    activeSessions: Object.keys(sessions),
    isUserSession: !!sessions.USER,
    isAdminSession: !!sessions.ADMIN,
    isSupplierSession: !!sessions.SUPPLIER
  });
});

router.post('/logout', async (req: any, res: any) => {
  const { role } = req.body;
  const refreshToken = req.cookies[COOKIE_NAMES.REFRESH];
  
  if (role) {
    // Terminate only specific role session
    res.clearCookie(getCookieName(role), COOKIE_OPTIONS);
  } else {
    // Global logout
    if (refreshToken) {
      await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    res.clearCookie(COOKIE_NAMES.USER, COOKIE_OPTIONS);
    res.clearCookie(COOKIE_NAMES.SUPPLIER, COOKIE_OPTIONS);
    res.clearCookie(COOKIE_NAMES.ADMIN, COOKIE_OPTIONS);
    res.clearCookie(COOKIE_NAMES.REFRESH, COOKIE_OPTIONS);
  }
  
  res.json({ success: true, message: 'Logged out' });
});

router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000;
    await db.run(
      'INSERT INTO password_reset_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [Date.now().toString(), user.id, token, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    try {
      const fromEmail = process.env.SMTP_USER || 'admin@closetkraze.top';
      await transporter.sendMail({
        from: `"ClosetKraze" <${fromEmail}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 1 hour.</p>`
      });
    } catch (e) {
      console.error('Email error:', e);
      return res.json({ success: true, message: 'Link sent (simulated).', mockToken: token });
    }
    
    res.json({ success: true, message: 'Success if account exists.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetToken = await db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expiresAt > ?', [token, Date.now()]);
    if (!resetToken) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetToken.userId]);
    await db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;
