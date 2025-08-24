import { verifyToken } from '../utils/jwt';
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, email: payload.email };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
