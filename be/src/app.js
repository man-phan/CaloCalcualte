import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';
import prisma from './config/database.js';

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Global rate limit ───────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  })
);

// ─── Stricter rate limit for AI analyze endpoint ──────────────────────────────
app.use(
  '/api/meals/analyze',
  rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 10,
    message: { error: 'Too many AI analysis requests. Please wait a moment.' },
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Central error handler ────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
