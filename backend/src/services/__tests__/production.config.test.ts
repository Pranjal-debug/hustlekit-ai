process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../app';
import { closeDatabase, assertDatabaseReady } from '../../db/mongo';
import http from 'node:http';

describe('Production Readiness & Deployment Configuration Tests', () => {
  let server: http.Server;
  let rootUrl: string;

  before(async () => {
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
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDatabase();
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

  it('CORS allows requests from onrender.com domains and allowed localhost origins', async () => {
    const renderOrigin = 'https://my-hustlekit-client.onrender.com';
    const res = await fetch(`${rootUrl}/api/healthz`, {
      headers: { Origin: renderOrigin },
    });
    assert.equal(res.headers.get('access-control-allow-origin'), renderOrigin);
  });

  it('CORS blocks requests from unauthorized external origins', async () => {
    const unauthorizedOrigin = 'https://malicious-site.example.com';
    const res = await fetch(`${rootUrl}/api/healthz`, {
      headers: { Origin: unauthorizedOrigin },
    });
    // When rejected by CORS callback, access-control-allow-origin is NOT present
    assert.notEqual(res.headers.get('access-control-allow-origin'), unauthorizedOrigin);
  });

  it('assertDatabaseReady throws an informative error when MongoDB is configured but disconnected', async () => {
    const originalUri = process.env.MONGODB_URI;
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
      process.env.MONGODB_URI = originalUri;
    }
  });
});
