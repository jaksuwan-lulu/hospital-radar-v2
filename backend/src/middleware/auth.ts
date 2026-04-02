import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message ?? 'Invalid token' });
  }
}

// Optional auth — attach user if token present but don't block
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      (req as any).user = verifyToken(token);
    } catch (_) {}
  }
  next();
}
