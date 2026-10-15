import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types';
import { isGemmaConfigured, getGemmaConfig } from '../services/gemma.service';
import { getDatabaseStatus } from '../db/mongo';

export const healthRouter = Router();

// Lightweight health check for Render / load balancers
healthRouter.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const hasGemmaKey = isGemmaConfigured();
  const config = getGemmaConfig();
  const dbStatus = await getDatabaseStatus();

  // If MongoDB URI is configured but connection failed, report degraded
  const isDbDegraded = Boolean(process.env.MONGODB_URI && dbStatus.status === 'error');
  const overallStatus = isDbDegraded ? 'degraded' : 'ok';

  const response: HealthResponse = {
    status: overallStatus,
    service: 'HustleKit AI Backend Service',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0-hackathon',
    environment: process.env.NODE_ENV || 'development',
    aiEngineStatus: hasGemmaKey ? 'live_provider' : 'demo_template_engine',
  };

  res.status(200).json({
    ...response,
    gemma: {
      configured: hasGemmaKey,
      model: config.model,
      endpoint: config.baseUrl,
      mockFallbackEnabled: config.enableMockFallback,
    },
    database: {
      type: dbStatus.type,
      status: dbStatus.status,
      dbName: dbStatus.dbName,
      error: dbStatus.error,
    },
    mastra: {
      workflow: 'sales-growth-advisor',
      ready: true,
    },
  });
});
