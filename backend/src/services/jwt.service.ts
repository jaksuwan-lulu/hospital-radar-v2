import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload } from '../types';

const SECRET       = process.env.JWT_SECRET!;
const ACCESS_TTL   = parseInt(process.env.JWT_ACCESS_TTL  ?? '900');   // 15 min default
const REFRESH_TTL  = parseInt(process.env.JWT_REFRESH_TTL ?? '2592000'); // 30 days default

// In-memory blacklist — swap to Redis for multi-instance
// key = jti, value = expiry timestamp
const blacklist = new Map<string, number>();

// Clean expired entries every hour
setInterval(() => {
  const now = Date.now() / 1000;
  for (const [jti, exp] of blacklist) {
    if (exp < now) blacklist.delete(jti);
  }
}, 60 * 60 * 1000);

// ── Generate tokens ───────────────────────────────────────────────────────────
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, SECRET, { expiresIn: ACCESS_TTL });
}

export function generateRefreshToken(userId: string): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ sub: userId, jti, type: 'refresh' }, SECRET, { expiresIn: REFRESH_TTL });
}

// ── Verify token ──────────────────────────────────────────────────────────────
export function verifyToken(token: string): JWTPayload {
  const payload = jwt.verify(token, SECRET) as JWTPayload;
  if (blacklist.has(payload.jti)) {
    throw new Error('Token has been revoked');
  }
  return payload;
}

// ── Blacklist (logout) ────────────────────────────────────────────────────────
export function blacklistToken(token: string): void {
  try {
    const payload = jwt.decode(token) as any;
    if (payload?.jti && payload?.exp) {
      blacklist.set(payload.jti, payload.exp);
    }
  } catch (_) {}
}

export function isBlacklisted(jti: string): boolean {
  return blacklist.has(jti);
}
