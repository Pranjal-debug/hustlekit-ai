import { Router, Request, Response } from 'express';
import { runSalesGrowthAdvisor } from '../mastra/workflow';
import {
  saveAdvisorReportToDb,
  getAdvisorReportsFromDb,
  getLatestAdvisorReportFromDb,
} from '../db/mongo';
import { isGemmaConfigured } from '../services/gemma.service';

export const advisorRouter = Router();

// POST /api/advisor/generate - Executes Mastra sales-growth-advisor workflow
advisorRouter.post('/advisor/generate', async (req: Request, res: Response) => {
  const { workspaceId = 'default' } = req.body || {};

  if (!workspaceId || typeof workspaceId !== 'string') {
    res.status(400).json({ error: 'Valid workspaceId string is required.' });
    return;
  }

  // Ensure Gemma provider is configured
  if (!isGemmaConfigured()) {
    res.status(503).json({
      error:
        'Gemma AI inference is not configured. Please add GEMMA_API_KEY to backend/.env to run the Mastra Sales Growth Advisor.',
      code: 'GEMMA_NOT_CONFIGURED',
    });
    return;
  }

  try {
    // Run the genuine Mastra workflow graph
    const report = await runSalesGrowthAdvisor(workspaceId.trim());

    // Persist successfully generated report to MongoDB Atlas
    await saveAdvisorReportToDb(report).catch((dbErr) => {
      console.warn('[DB] Failed to persist advisor report:', dbErr.message);
    });

    res.status(200).json(report);
  } catch (err: any) {
    const rawMsg = err?.message || 'Mastra workflow execution failed.';
    console.error('[Mastra Sales Growth Advisor Error]:', rawMsg);

    // Sanitize any secrets/tokens from output
    const sanitizedMsg = rawMsg
      .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/mongodb\+srv:\/\/[^@]+@/gi, 'mongodb+srv://[REDACTED]@');

    let statusCode = 502;
    if (rawMsg.includes('authentication failed') || rawMsg.includes('401')) statusCode = 401;
    else if (rawMsg.includes('rate limit') || rawMsg.includes('429')) statusCode = 429;
    else if (rawMsg.includes('timed out') || rawMsg.includes('timeout')) statusCode = 504;
    else if (rawMsg.includes('validation') || rawMsg.includes('JSON')) statusCode = 422;

    res.status(statusCode).json({
      error: sanitizedMsg,
      workflow: 'sales-growth-advisor',
    });
  }
});

// GET /api/advisor/history - Retrieve previously generated growth reports
advisorRouter.get('/advisor/history', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 50);

  try {
    const reports = await getAdvisorReportsFromDb(workspaceId, limit);
    res.status(200).json({
      data: reports,
      count: reports.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve advisor history.' });
  }
});

// GET /api/advisor/latest - Retrieve the most recent report for workspace
advisorRouter.get('/advisor/latest', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';

  try {
    const report = await getLatestAdvisorReportFromDb(workspaceId);
    if (!report) {
      res.status(404).json({ message: 'No advisor report found for this workspace.' });
      return;
    }
    res.status(200).json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve latest advisor report.' });
  }
});
