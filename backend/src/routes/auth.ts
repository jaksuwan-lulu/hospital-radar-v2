import { Router } from 'express';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  blacklistToken,
} from '../services/jwt.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const LINE_TOKEN_URL   = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';
const LINE_VERIFY_URL  = 'https://api.line.me/oauth2/v2.1/verify';

// POST /api/auth/line
// Body: { code, redirectUri } — frontend sends LINE auth code
router.post('/line', async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'code and redirectUri required' });
  }

  try {
    // 1. Exchange code for LINE access token
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'LINE token exchange failed', detail: tokenData });
    }

    // 2. Get user profile from LINE
    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${(tokenData as any).access_token}` },
    });
    const profileRaw = await profileRes.json();
    const profile = profileRaw as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };
    if (!profile.userId) {
      return res.status(401).json({ error: 'Could not fetch LINE profile' });
    }

    // 3. Issue our own JWT
    const accessToken  = generateAccessToken({
      sub:     profile.userId,
      name:    profile.displayName,
      picture: profile.pictureUrl ?? '',
    });
    const refreshToken = generateRefreshToken(profile.userId);

    // 4. Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000,
      path:     '/api/auth/refresh',
    });

    res.json({
      access_token: accessToken,
      user: {
        id:      profile.userId,
        name:    profile.displayName,
        picture: profile.pictureUrl ?? '',
      },
    });
  } catch (err: any) {
    console.error('[auth/line]', err.message);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// POST /api/auth/refresh
// Uses httpOnly cookie to issue new access token
router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const payload = verifyToken(refreshToken);
    const accessToken = generateAccessToken({
      sub:     payload.sub,
      name:    payload.name,
      picture: payload.picture,
    });
    res.json({ access_token: accessToken });
  } catch (err: any) {
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
// Blacklist current access token + clear refresh cookie
router.post('/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) blacklistToken(token);

  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) blacklistToken(refreshToken);

  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ success: true });
});

export default router;
