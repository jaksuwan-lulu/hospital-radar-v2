import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import hospitalsRouter from './routes/hospitals';
import authRouter     from './routes/auth';
import favoritesRouter from './routes/favorites';
import { refreshStatuses } from './services/osm.service';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Trust Railway/Vercel proxy ────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body / Cookie parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: { error: 'Too many auth attempts' },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/auth',      authLimiter, authRouter);
app.use('/api/favorites', favoritesRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Refresh OSM status every 5 min ───────────────────────────────────────────
setInterval(refreshStatuses, 5 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏥 Hospital Radar API running on :${PORT}`);
});

export default app;
