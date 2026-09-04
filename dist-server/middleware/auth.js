import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const authenticate = (req, res, next) => {
    const token = req.cookies['ck_user_token'];
    if (!token)
        return res.status(401).json({ success: false, message: 'User authentication required' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ success: false, message: 'Token issue', code });
    }
};
export const authenticateAdmin = (req, res, next) => {
    const token = req.cookies['ck_admin_token'];
    if (!token)
        return res.status(401).json({ success: false, message: 'Admin authentication required' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ success: false, message: 'Token issue', code });
    }
};
export const authenticateSupplier = (req, res, next) => {
    const token = req.cookies['ck_supplier_token'];
    if (!token)
        return res.status(401).json({ success: false, message: 'Supplier authentication required' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ success: false, message: 'Token issue', code });
    }
};
export const authenticateAny = (req, res, next) => {
    const token = req.cookies['ck_user_token'] || req.cookies['ck_admin_token'] || req.cookies['ck_supplier_token'];
    if (!token)
        return res.status(401).json({ success: false, message: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ success: false, message: 'Token issue', code });
    }
};
export const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        next();
    };
};
export const checkRole = authorize;
export const optionalAuth = (req, res, next) => {
    const token = req.cookies['ck_user_token'] || req.cookies['ck_admin_token'] || req.cookies['ck_supplier_token'];
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch (e) {
            // Ignore errors for optional auth
        }
    }
    next();
};
