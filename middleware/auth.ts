import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    handle?: string;
  };
}

const extractToken = (req: Request, cookieKeys: string[]): string | undefined => {
  for (const key of cookieKeys) {
    if (req.cookies && req.cookies[key]) return req.cookies[key];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
};

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req, ['ck_user_token', 'ck_admin_token']);
  if (!token) return res.status(401).json({ success: false, message: 'User authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ success: false, message: 'Token issue', code });
  }
};

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req, ['ck_admin_token']);
  if (!token) return res.status(401).json({ success: false, message: 'Admin authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ success: false, message: 'Token issue', code });
  }
};

export const authenticateSupplier = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req, ['ck_supplier_token', 'ck_admin_token']);
  if (!token) return res.status(401).json({ success: false, message: 'Supplier authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ success: false, message: 'Token issue', code });
  }
};

export const authenticateAny = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req, ['ck_user_token', 'ck_admin_token', 'ck_supplier_token']);
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ success: false, message: 'Token issue', code });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export const checkRole = authorize;

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req, ['ck_user_token', 'ck_admin_token', 'ck_supplier_token']);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch (e) {
      // Ignore errors for optional auth
    }
  }
  next();
};
