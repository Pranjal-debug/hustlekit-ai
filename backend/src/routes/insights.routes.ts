import { Router, Request, Response } from 'express';
import { SalesInsightsData } from '../types';
import {
  parseAndValidateSalesCsv,
  calculateRealInsights,
  SAMPLE_SALES_CSV,
} from '../services/sales.service';
import {
  insertSalesRecords,
  getSalesRecords,
  clearSalesRecords,
} from '../db/mongo';

export const insightsRouter = Router();

const realisticDemoInsights: SalesInsightsData = {
  isDemo: true,
  dataSource: 'demo_simulation',
  summary: {
    totalRevenue: 19668.14,
    revenueChangePercentage: 23.4,
    totalOrders: 508,
    ordersChangePercentage: 14.8,
    averageOrderValue: 38.71,
    aovChangePercentage: 7.5,
    conversionRate: 3.42,
    conversionChangePercentage: -0.6,
    unitsSold: 642,
  },
  chartData: [
    { date: '2026-10-01', day: 'Mon', revenue: 1250, orders: 32, projectedRevenue: 1200 },
    { date: '2026-10-03', day: 'Wed', revenue: 1680, orders: 44, projectedRevenue: 1450 },
    { date: '2026-10-05', day: 'Fri', revenue: 2190, orders: 58, projectedRevenue: 1900 },
    { date: '2026-10-07', day: 'Sun', revenue: 2840, orders: 74, projectedRevenue: 2400 },
    { date: '2026-10-09', day: 'Tue', revenue: 2310, orders: 60, projectedRevenue: 2200 },
    { date: '2026-10-11', day: 'Thu', revenue: 3420, orders: 88, projectedRevenue: 2900 },
    { date: '2026-10-13', day: 'Sat', revenue: 3980, orders: 104, projectedRevenue: 3400 },
    { date: '2026-10-15', day: 'Mon', revenue: 1988, orders: 48, projectedRevenue: 3600 },
  ],
  forecast: {
    nextMonthEstimatedRevenue: 26400,
    estimatedGrowthRate: 28.5,
    confidenceScore: 87,
    insightsSummary:
      'Based on Q3 seasonal pickup and current conversion momentum in Desk Accessories, revenue is trending towards $26.4k next month.',
    hasEnoughData: true,
  },
  channels: [
    { channel: 'Shopify Direct', sharePercentage: 54, revenue: 10620.80, growth: 18.2 },
    { channel: 'Instagram Shop & Reels', sharePercentage: 28, revenue: 5507.08, growth: 34.6 },
    { channel: 'Etsy Marketplace', sharePercentage: 14, revenue: 2753.54, growth: -4.1 },
    { channel: 'Email Newsletter Campaigns', sharePercentage: 4, revenue: 786.72, growth: 12.0 },
  ],
  recommendedActions: [
    {
      id: 'rec_1',
      priority: 'high',
      category: 'inventory',
      title: 'Restock "Titanium EDC Carabiner Keyring"',
      description:
        'Stock is down to 5 units while sales velocity increased by 42% over the past 7 days. Replenish immediately to prevent lost orders.',
      expectedImpact: 'Save ~$1,200 in potential lost revenue this month',
      suggestedActionLabel: 'Review Supplier Order',
    },
    {
      id: 'rec_2',
      priority: 'high',
      category: 'marketing',
      title: 'Launch Weekend Promo for "AuraFocus Desk Lamp"',
      description:
        'High page-view traffic with lower conversion (2.1%). A limited 10% flash bundle promotion could boost checkouts by an estimated 35%.',
      expectedImpact: '+ $1,800 estimated incremental revenue',
      suggestedActionLabel: 'Generate Promo Copy in Studio',
    },
    {
      id: 'rec_3',
      priority: 'medium',
      category: 'seo',
      title: 'Refresh SEO Meta Tags on "Minimalist Desk Mat Pro"',
      description:
        'Search impressions for "leather desk mat" surged by 65%. Updating your SEO title and description can capture higher organic search intent.',
      expectedImpact: '+22% organic search click-through rate',
      suggestedActionLabel: 'Create SEO Title in Studio',
    },
    {
      id: 'rec_4',
      priority: 'low',
      category: 'pricing',
      title: 'Test Price Elasticity on Lifestyle Ceramics',
      description:
        'Margin analysis suggests a $4.00 price increase on premium ceramic drippers will not negatively impact current conversion velocity.',
      expectedImpact: '+$420 pure margin expansion',
      suggestedActionLabel: 'Adjust Product Price',
    },
  ],
};

// GET /api/insights
insightsRouter.get('/insights', async (req: Request, res: Response) => {
  try {
    const rawWorkspaceId = req.query.workspaceId;
    const workspaceId =
      typeof rawWorkspaceId === 'string' && rawWorkspaceId.trim() !== ''
        ? rawWorkspaceId.trim()
        : 'default';

    const records = await getSalesRecords(workspaceId);
    if (records.length > 0) {
      const realInsights = calculateRealInsights(records);
      res.status(200).json(realInsights);
      return;
    }
    // Return demo dataset if no imported sales exist
    res.status(200).json(realisticDemoInsights);
  } catch (err: any) {
    console.error('[Insights Error]:', err.message);
    res.status(500).json({ error: 'Failed to retrieve sales telemetry' });
  }
});

// POST /api/sales/validate-csv
insightsRouter.post('/sales/validate-csv', (req: Request, res: Response) => {
  const { csvContent } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({ error: 'CSV content string is required for validation.' });
    return;
  }

  // File size limit: 5MB
  if (Buffer.byteLength(csvContent, 'utf8') > 5 * 1024 * 1024) {
    res.status(413).json({ error: 'CSV file exceeds maximum allowed size of 5MB.' });
    return;
  }

  try {
    const result = parseAndValidateSalesCsv(csvContent);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'CSV validation failed' });
  }
});

// POST /api/sales/import
insightsRouter.post('/sales/import', async (req: Request, res: Response) => {
  const { csvContent, workspaceId = 'default' } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({ error: 'Valid CSV content is required for import.' });
    return;
  }

  try {
    const parseResult = parseAndValidateSalesCsv(csvContent);
    if (parseResult.validRows.length === 0) {
      res.status(400).json({
        error: 'No valid rows found in CSV. Please fix the highlighted errors before importing.',
        errors: parseResult.errors,
      });
      return;
    }

    const summary = await insertSalesRecords(workspaceId, parseResult.validRows);

    res.status(200).json({
      message: `Successfully imported ${summary.insertedCount} sales records (${summary.skippedDuplicatesCount} duplicates skipped).`,
      summary: {
        ...summary,
        invalidRowsCount: parseResult.errors.length,
        sampleErrors: parseResult.errors.slice(0, 5),
      },
    });
  } catch (err: any) {
    console.error('[CSV Import Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to process CSV import.' });
  }
});

// GET /api/sales/sample-csv
insightsRouter.get('/sales/sample-csv', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hustlekit_sales_sample.csv"');
  res.status(200).send(SAMPLE_SALES_CSV);
});

// GET /api/sales/records
insightsRouter.get('/sales/records', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';
  const records = await getSalesRecords(workspaceId);
  res.status(200).json({
    data: records,
    count: records.length,
  });
});

// DELETE /api/sales/records
insightsRouter.delete('/sales/records', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';
  const deleted = await clearSalesRecords(workspaceId);
  res.status(200).json({
    message: `Cleared ${deleted} imported sales records. Insights reset to demo simulation.`,
    deletedCount: deleted,
  });
});
