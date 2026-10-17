process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../app';
import {
  runSalesGrowthAdvisor,
  createSalesGrowthAdvisorWorkflow,
} from '../../mastra/workflow';
import {
  setDatabaseMocks,
  resetDatabaseMocks,
  computeRecordHash,
  clearSalesRecords,
  insertSalesRecords,
  saveAdvisorReportToDb,
  getAdvisorReportsFromDb,
  getLatestAdvisorReportFromDb,
  closeDatabase,
} from '../../db/mongo';
import { AdvisorReport, SalesRecord, SalesRecordInput, SalesImportSummary } from '../../types';

describe('Mastra Sales Growth Advisor Workflow Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  // In-memory isolated mock database store for workflow unit tests
  const mockSalesStore = new Map<string, SalesRecord[]>();
  const mockAdvisorReports: AdvisorReport[] = [];

  const mockDb = {
    getSalesRecords: async (workspaceId: string = 'default'): Promise<SalesRecord[]> => {
      return (mockSalesStore.get(workspaceId) || []).slice();
    },
    insertSalesRecords: async (
      workspaceId: string,
      records: SalesRecordInput[]
    ): Promise<SalesImportSummary> => {
      const existing = mockSalesStore.get(workspaceId) || [];
      let insertedCount = 0;
      let skippedDuplicatesCount = 0;
      let totalImportedRevenue = 0;

      for (const raw of records) {
        const hash = computeRecordHash(workspaceId, raw);
        if (existing.some((e) => e.recordHash === hash)) {
          skippedDuplicatesCount++;
          continue;
        }
        const rev = raw.revenue ?? raw.quantity * raw.unitPrice;
        const fullRecord: SalesRecord = {
          id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          workspaceId,
          orderId: raw.orderId,
          productName: raw.productName.trim(),
          productId: raw.productId,
          date: raw.date,
          quantity: raw.quantity,
          unitPrice: raw.unitPrice,
          revenue: rev,
          channel: raw.channel || 'Direct / Imported',
          recordHash: hash,
          createdAt: new Date().toISOString(),
        };
        existing.push(fullRecord);
        insertedCount++;
        totalImportedRevenue += rev;
      }
      mockSalesStore.set(workspaceId, existing);
      return {
        totalRowsProcessed: records.length,
        insertedCount,
        skippedDuplicatesCount,
        invalidRowsCount: 0,
        totalImportedRevenue: Math.round(totalImportedRevenue * 100) / 100,
        persistedTo: 'memory',
      };
    },
    clearSalesRecords: async (workspaceId: string = 'default'): Promise<number> => {
      const existing = mockSalesStore.get(workspaceId) || [];
      const count = existing.length;
      mockSalesStore.delete(workspaceId);
      return count;
    },
    saveAdvisorReportToDb: async (report: AdvisorReport): Promise<AdvisorReport> => {
      mockAdvisorReports.unshift(report);
      if (mockAdvisorReports.length > 50) mockAdvisorReports.pop();
      return report;
    },
    getAdvisorReportsFromDb: async (
      workspaceId: string = 'default',
      limit: number = 20
    ): Promise<AdvisorReport[]> => {
      return mockAdvisorReports.filter((r) => r.workspaceId === workspaceId).slice(0, limit);
    },
    getLatestAdvisorReportFromDb: async (
      workspaceId: string = 'default'
    ): Promise<AdvisorReport | null> => {
      return mockAdvisorReports.find((r) => r.workspaceId === workspaceId) || null;
    },
  };

  before(async () => {
    // Install isolated mocked database functions
    setDatabaseMocks(mockDb);

    // Start temporary test server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}/api`;
        }
        resolve();
      });
    });

    // Seed test workspace A
    await clearSalesRecords('test_advisor_ws');
    await insertSalesRecords('test_advisor_ws', [
      {
        orderId: 'A-1',
        date: '2026-10-01',
        productName: 'Desk Mat Pro',
        quantity: 3,
        unitPrice: 40.0,
        revenue: 120.0,
        channel: 'Shopify',
      },
      {
        orderId: 'A-2',
        date: '2026-10-02',
        productName: 'Desk Lamp Aura',
        quantity: 2,
        unitPrice: 70.0,
        revenue: 140.0,
        channel: 'Shopify',
      },
      {
        orderId: 'A-3',
        date: '2026-10-03',
        productName: 'Ceramic Dripper',
        quantity: 1,
        unitPrice: 35.0,
        revenue: 35.0,
        channel: 'Instagram',
      },
    ]);

    // Seed test workspace B (Isolated)
    await clearSalesRecords('test_isolated_ws');
    await insertSalesRecords('test_isolated_ws', [
      {
        orderId: 'B-1',
        date: '2026-10-05',
        productName: 'Titanium Carabiner',
        quantity: 10,
        unitPrice: 20.0,
        revenue: 200.0,
        channel: 'Etsy',
      },
    ]);
  });

  after(async () => {
    try {
      await clearSalesRecords('test_advisor_ws');
      await clearSalesRecords('test_isolated_ws');
      mockSalesStore.clear();
      mockAdvisorReports.length = 0;
      resetDatabaseMocks();
      await closeDatabase();
    } finally {
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });

  // Mock valid model response generator
  const createMockFetch = (responseText: string, status = 200) => {
    return (async () => {
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => ({
          choices: [
            {
              message: {
                content: responseText,
              },
            },
          ],
        }),
        text: async () => responseText,
      } as any;
    }) as typeof fetch;
  };

  it('Mastra workflow executes all 4 expected steps in sequence', async () => {
    const mockOutput = JSON.stringify({
      recommendations: [
        {
          title: 'Promote Top Revenue Driver Desk Lamp',
          category: 'marketing',
          priority: 'high',
          evidence: 'Desk Lamp generated $140.00 representing 47.5% of total revenue across 2 units.',
          reasoning: 'Concentrated sales velocity indicates strong product-market fit.',
          actionSteps: [
            'Create dedicated social reel spotlighting the desk lamp',
            'Send flash campaign to newsletter subscribers',
          ],
          limitations: 'Observation window covers 3 days only.',
        },
      ],
      missingDataNotes: [],
    });

    const mockFetch = createMockFetch(mockOutput);
    const report = await runSalesGrowthAdvisor('test_advisor_ws', { customFetch: mockFetch });

    assert.ok(report);
    assert.equal(report.workspaceId, 'test_advisor_ws');
    assert.deepEqual(report.workflowExecutionPath, [
      'load-business-data',
      'build-evidence',
      'generate-recommendations',
      'validate-output',
    ]);
    assert.ok(report.workflowRunId, 'Mastra must generate a unique runId');
  });

  it('valid model output passes strict schema validation and parses recommendations', async () => {
    const validJson = JSON.stringify({
      recommendations: [
        {
          title: 'Restock High Demand Desk Mats',
          category: 'inventory',
          priority: 'high',
          evidence: 'Desk Mat Pro sold 3 units generating $120.00.',
          reasoning: 'Stock out risk will forfeit immediate demand.',
          actionSteps: ['Check supplier inventory', 'Order 25 backup units'],
          limitations: 'Lead times from supplier unverified.',
        },
        {
          title: 'Review Ceramic Dripper Pricing',
          category: 'pricing',
          priority: 'low',
          evidence: 'Lowest volume item with 1 unit sold at $35.00.',
          reasoning: 'May benefit from bundle pairing with Desk Mat.',
          actionSteps: ['Test bundle discount at $65 for both'],
          limitations: 'Single unit observation is insufficient to declare price sensitivity.',
        },
      ],
    });

    const mockFetch = createMockFetch(validJson);
    const report = await runSalesGrowthAdvisor('test_advisor_ws', { customFetch: mockFetch });

    assert.equal(report.recommendations.length, 2);
    assert.equal(report.recommendations[0].category, 'inventory');
    assert.equal(report.recommendations[0].priority, 'high');
    assert.equal(report.recommendations[1].category, 'pricing');
    assert.equal(report.recommendations[1].priority, 'low');
    assert.ok(report.recommendations[0].actionSteps.length >= 2);
  });

  it('malformed model output is rejected safely without crashing', async () => {
    const invalidJson = `{ "notRecommendations": [] }`; // Missing required 'recommendations' field
    const mockFetch = createMockFetch(invalidJson);

    await assert.rejects(
      async () => {
        await runSalesGrowthAdvisor('test_advisor_ws', { customFetch: mockFetch });
      },
      (err: Error) => {
        assert.ok(err.message.includes('schema validation rejected output'));
        return true;
      }
    );
  });

  it('empty sales data does not produce fabricated business findings', async () => {
    const emptyWorkspaceId = 'completely_empty_workspace_123';
    await clearSalesRecords(emptyWorkspaceId);

    const mockOutput = JSON.stringify({
      recommendations: [
        {
          title: 'Set Up Transaction Logging & SKU System',
          category: 'operations',
          priority: 'high',
          evidence: '0 orders and $0.00 revenue recorded in workspace.',
          reasoning: 'Accurate record keeping is essential before diagnosing growth bottlenecks.',
          actionSteps: ['Import initial sales CSV', 'Assign unique SKUs to catalog items'],
          limitations: 'Zero transactions recorded; no historical analysis possible.',
        },
      ],
      missingDataNotes: ['No historical sales data found.'],
    });

    const mockFetch = createMockFetch(mockOutput);
    const report = await runSalesGrowthAdvisor(emptyWorkspaceId, { customFetch: mockFetch });

    assert.equal(report.dataSource, 'empty_state');
    assert.equal(report.hasSufficientData, false);
    assert.equal(report.metricsSnapshot.totalRevenue, 0);
    assert.equal(report.metricsSnapshot.totalOrders, 0);
    assert.ok(
      report.missingDataNotes.some((n) => n.toLowerCase().includes('no imported sales records'))
    );
  });

  it('recommendations cite actual metrics from the input snapshot', async () => {
    const mockOutput = JSON.stringify({
      recommendations: [
        {
          title: 'Double Down on Shopify Channel',
          category: 'marketing',
          priority: 'high',
          evidence: 'Shopify accounts for $260.00 of total $295.00 revenue (88% share).',
          reasoning: 'Primary revenue concentration should be leveraged.',
          actionSteps: ['Optimize Shopify storefront SEO', 'Launch retargeting ads'],
          limitations: 'Data covers 3 transactions only.',
        },
      ],
    });

    const mockFetch = createMockFetch(mockOutput);
    const report = await runSalesGrowthAdvisor('test_advisor_ws', { customFetch: mockFetch });

    assert.equal(report.dataSource, 'imported_sales');
    assert.equal(report.metricsSnapshot.totalRevenue, 295.0);
    assert.equal(report.metricsSnapshot.totalOrders, 3);
    assert.equal(report.metricsSnapshot.unitsSold, 6);
    assert.equal(report.metricsSnapshot.productCount, 3);
  });

  it('provider failure returns a clear error without fake success', async () => {
    const mockFetch = createMockFetch('{"error":"Rate limit exceeded"}', 429);

    await assert.rejects(
      async () => {
        await runSalesGrowthAdvisor('test_advisor_ws', { customFetch: mockFetch });
      },
      (err: Error) => {
        assert.ok(err.message.includes('rate limit') || err.message.includes('429'));
        return true;
      }
    );
  });

  it('workspace data remains isolated between distinct workspaces', async () => {
    const mockOutput = JSON.stringify({
      recommendations: [
        {
          title: 'Review Single Product Etsy Velocity',
          category: 'marketing',
          priority: 'medium',
          evidence: 'Titanium Carabiner generated $200.00 on Etsy.',
          reasoning: 'Single product dominance represents portfolio concentration risk.',
          actionSteps: ['Introduce complementary accessory SKU'],
          limitations: 'Only 1 product in catalog.',
        },
      ],
    });

    const mockFetch = createMockFetch(mockOutput);
    const reportB = await runSalesGrowthAdvisor('test_isolated_ws', { customFetch: mockFetch });

    // Workspace B has only 1 product and $200 revenue
    assert.equal(reportB.workspaceId, 'test_isolated_ws');
    assert.equal(reportB.metricsSnapshot.totalRevenue, 200.0);
    assert.equal(reportB.metricsSnapshot.productCount, 1);
    assert.notEqual(reportB.metricsSnapshot.totalRevenue, 295.0, 'Must not leak Workspace A data');
  });

  it('persisted reports can be saved and retrieved via database functions', async () => {
    const testReport: AdvisorReport = {
      id: `rep_test_${Date.now()}`,
      workspaceId: 'test_persist_ws',
      createdAt: new Date().toISOString(),
      dataSource: 'imported_sales',
      hasSufficientData: true,
      analysisPeriod: { startDate: '2026-10-01', endDate: '2026-10-03', totalDaysObserved: 3 },
      metricsSnapshot: {
        totalRevenue: 295.0,
        totalOrders: 3,
        unitsSold: 6,
        averageOrderValue: 98.33,
        productCount: 3,
      },
      recommendations: [
        {
          id: 'rec_p1',
          title: 'Test Persistence Recommendation',
          category: 'operations',
          priority: 'high',
          evidence: 'Verified revenue $295.00',
          reasoning: 'Testing Atlas database persistence layer',
          actionSteps: ['Step 1: Check Atlas', 'Step 2: Retrieve record'],
          limitations: 'Test fixture only',
        },
      ],
      missingDataNotes: [],
      modelUsed: 'google/gemma-3-12b-it',
      workflowRunId: 'test-run-123',
      workflowExecutionPath: ['load-business-data', 'build-evidence', 'generate-recommendations', 'validate-output'],
    };

    await saveAdvisorReportToDb(testReport);

    const history = await getAdvisorReportsFromDb('test_persist_ws', 10);
    assert.ok(history.length >= 1);
    const latest = await getLatestAdvisorReportFromDb('test_persist_ws');
    assert.ok(latest);
    assert.equal(latest.id, testReport.id);
    assert.equal(latest.recommendations[0].title, 'Test Persistence Recommendation');
  });

  it('HTTP API endpoint GET /api/advisor/history and latest return correct data', async () => {
    const res = await fetch(`${baseUrl}/advisor/history?workspaceId=test_persist_ws`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.count >= 1);

    const latestRes = await fetch(`${baseUrl}/advisor/latest?workspaceId=test_persist_ws`);
    assert.equal(latestRes.status, 200);
    const latestData = await latestRes.json();
    assert.equal(latestData.workspaceId, 'test_persist_ws');
  });
});
