process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../app';
import {
  closeDatabase,
  assertDatabaseReady,
  insertSalesRecords,
  clearSalesRecords,
} from '../../db/mongo';
import { aiRateLimiter, resetAiRateLimiter } from '../../middleware/rateLimiter';
import http from 'node:http';

describe('Production Readiness & Deployment Configuration Tests', () => {
  let server: http.Server;
  let rootUrl: string;

  before(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.TEST_MONGODB_URI;
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          rootUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.TEST_MONGODB_URI;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDatabase();
    await resetAiRateLimiter();
  });

  it('GET /healthz returns 200 and alive status for Render load balancers', async () => {
    const res = await fetch(`${rootUrl}/healthz`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'alive');
    assert.ok(typeof data.uptime === 'number');
    assert.ok(data.timestamp);
  });

  it('GET /api/healthz returns 200 and alive status under the /api namespace', async () => {
    const res = await fetch(`${rootUrl}/api/healthz`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'alive');
    assert.ok(typeof data.uptime === 'number');
  });

  it('GET /api/health reports service, gemma, database, and mastra metadata without leaking credentials', async () => {
    const res = await fetch(`${rootUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(['ok', 'degraded'].includes(data.status));
    assert.ok(data.service);
    assert.ok(data.gemma);
    assert.ok(data.database);
    assert.ok(data.mastra);

    // Verify no sensitive keys, passwords, or connection strings leaked in response
    const jsonStr = JSON.stringify(data);
    assert.ok(!jsonStr.includes('mongodb+srv://'));
    assert.ok(!jsonStr.includes('sk-or-'));
  });

  // Fix F-01: Insights workspace scoping regression test
  it('Fix F-01: GET /api/insights respects non-default workspaceId query parameter and falls back to default', async () => {
    const customWorkspace = 'workspace_audit_f01';
    await clearSalesRecords(customWorkspace);

    // 1. When absent or empty, falls back to default workspace
    const defaultRes = await fetch(`${rootUrl}/api/insights`);
    assert.equal(defaultRes.status, 200);
    const defaultData = await defaultRes.json();
    assert.ok(defaultData.summary, 'Default workspace returns insights data');

    const emptyQueryRes = await fetch(`${rootUrl}/api/insights?workspaceId=   `);
    assert.equal(emptyQueryRes.status, 200);
    const emptyQueryData = await emptyQueryRes.json();
    assert.equal(emptyQueryData.dataSource, defaultData.dataSource);

    // 2. Insert records specifically into the custom workspace
    await insertSalesRecords(customWorkspace, [
      {
        orderId: 'ORD-F01-1',
        date: '2026-10-01',
        productName: 'Scoped Keyboard Rest',
        quantity: 2,
        unitPrice: 45.0,
        revenue: 90.0,
        channel: 'Direct Shopify',
      },
    ]);

    // 3. Querying with workspaceId returns the custom workspace's genuine records
    const scopedRes = await fetch(`${rootUrl}/api/insights?workspaceId=${customWorkspace}`);
    assert.equal(scopedRes.status, 200);
    const scopedData = await scopedRes.json();
    assert.equal(scopedData.isDemo, false);
    assert.equal(scopedData.dataSource, 'imported_sales');
    assert.equal(scopedData.summary.totalRevenue, 90.0);
    assert.equal(scopedData.summary.totalOrders, 1);
    assert.equal(scopedData.summary.unitsSold, 2);

    // Cleanup
    await clearSalesRecords(customWorkspace);
  });

  // Fix F-02: CORS origin restrictions
  it('Fix F-02: CORS allows requests from the production origin https://hustlekit-ai.onrender.com', async () => {
    const prodOrigin = 'https://hustlekit-ai.onrender.com';
    const res = await fetch(`${rootUrl}/api/healthz`, {
      headers: { Origin: prodOrigin },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), prodOrigin);
  });

  it('Fix F-02: CORS allows requests from explicitly configured CLIENT_URL origin', async () => {
    const customClient = 'https://portal.custom-client.com';
    const originalClientUrl = process.env.CLIENT_URL;
    process.env.CLIENT_URL = `https://other.com, ${customClient}`;

    try {
      const res = await fetch(`${rootUrl}/api/healthz`, {
        headers: { Origin: customClient },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), customClient);
    } finally {
      process.env.CLIENT_URL = originalClientUrl;
    }
  });

  it('Fix F-02: CORS rejects unauthorized arbitrary *.onrender.com origins', async () => {
    const unauthorizedRenderOrigin = 'https://unauthorized-attacker.onrender.com';
    const res = await fetch(`${rootUrl}/api/healthz`, {
      headers: { Origin: unauthorizedRenderOrigin },
    });
    // Access-Control-Allow-Origin header must NOT be present
    assert.notEqual(res.headers.get('access-control-allow-origin'), unauthorizedRenderOrigin);
  });

  it('Fix F-02: CORS preserves development localhost origins in non-production environments', async () => {
    const localhostOrigin = 'http://localhost:5173';
    const res = await fetch(`${rootUrl}/api/healthz`, {
      headers: { Origin: localhostOrigin },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), localhostOrigin);
  });

  it('Fix F-02: Requests omitting the Origin header succeed without error (curl, load balancers)', async () => {
    const res = await fetch(`${rootUrl}/healthz`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'alive');
  });

  // Fix F-03: AI endpoint rate limiting
  it('Fix F-03: Rate limiter triggers HTTP 429 on AI generation endpoints and leaves unrelated endpoints unaffected', async () => {
    await resetAiRateLimiter();

    // 20 requests allowed within the 5-minute window
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${rootUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.notEqual(
        res.status,
        429,
        `Request #${i + 1} should be accepted by rate limiter (got status ${res.status})`
      );
      assert.ok(
        res.headers.get('ratelimit-limit'),
        'Response must include standard RateLimit-Limit header'
      );
    }

    // 21st request must trigger HTTP 429
    const limitedRes = await fetch(`${rootUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productTitle: 'Premium Keyboard Mat' }),
    });

    assert.equal(limitedRes.status, 429, '21st AI generation request must return HTTP 429');
    const limitedData = await limitedRes.json();
    assert.equal(limitedData.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(limitedRes.headers.get('ratelimit-limit'), 'Must include standard RateLimit-Limit header');
    assert.equal(
      limitedRes.headers.get('ratelimit-remaining'),
      '0',
      'Remaining quota must be 0 after exceeding limit'
    );

    // Unrelated endpoints must remain completely unaffected
    const healthRes = await fetch(`${rootUrl}/api/healthz`);
    assert.equal(healthRes.status, 200, 'Unrelated health endpoint must not be rate limited');

    const insightsRes = await fetch(`${rootUrl}/api/insights`);
    assert.equal(insightsRes.status, 200, 'Unrelated insights endpoint must not be rate limited');

    // Clean up rate limiter state for subsequent tests
    await resetAiRateLimiter();
  });

  it('assertDatabaseReady throws an informative error when MongoDB is configured but disconnected', async () => {
    try {
      // Disconnect DB to simulate connection failure with MONGODB_URI set
      await closeDatabase();
      process.env.MONGODB_URI = 'mongodb+srv://dummy:dummy@cluster.mongodb.net/test';

      assert.throws(
        () => assertDatabaseReady('writeRecord'),
        (err: Error) => {
          return err.message.includes('MongoDB Atlas is configured but not connected');
        }
      );
    } finally {
      delete process.env.MONGODB_URI;
    }
  });
});
