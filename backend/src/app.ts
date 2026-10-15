import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { healthRouter } from './routes/health.routes';
import { contentRouter } from './routes/content.routes';
import { productsRouter } from './routes/products.routes';
import { insightsRouter } from './routes/insights.routes';
import { settingsRouter } from './routes/settings.routes';
import { advisorRouter } from './routes/advisor.routes';

dotenv.config();

export const app = express();

// Parse and configure allowed CORS origins
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

export const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin, server-to-server)
      if (!origin) return callback(null, true);
      // Allow explicitly configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow Render preview and production domains (*.onrender.com)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.onrender.com')) return callback(null, true);
      } catch {
        // invalid URL format, ignore
      }
      // In non-production, allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Request logging middleware (skip during test)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
  next();
});

// Root-level health check for Render load balancer
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', healthRouter);
app.use('/api', contentRouter);
app.use('/api', productsRouter);
app.use('/api', insightsRouter);
app.use('/api', settingsRouter);
app.use('/api', advisorRouter);

// Discover built frontend assets for single-service deployment
const candidateDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
];

const frontendDist = candidateDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (frontendDist && process.env.NODE_ENV !== 'test') {
  console.log(`[Static] Serving frontend SPA from ${frontendDist}`);
  app.use(express.static(frontendDist));

  // SPA fallback for non-API routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path === '/healthz') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root informational endpoint if frontend is not served by Express
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'HustleKit AI Backend API',
      status: 'online',
      version: '1.0.0-hackathon',
      docs: {
        health: '/api/health',
        healthz: '/healthz',
        products: '/api/products',
        insights: '/api/insights',
        generate: 'POST /api/generate',
        settings: '/api/settings',
        advisor: 'POST /api/advisor/generate',
      },
    });
  });
}

// 404 Not Found Handler (only reached for unmatched /api routes or when static frontend is absent)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route Not Found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sanitizedMessage = (err?.message || 'Internal Server Error')
    .replace(/mongodb\+srv:\/\/[^@]+@/gi, 'mongodb+srv://[REDACTED]@')
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]');

  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', sanitizedMessage);
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: isProd ? 'An unexpected server error occurred.' : sanitizedMessage,
  });
});

export default app;
