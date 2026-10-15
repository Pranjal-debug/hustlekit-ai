process.env.NODE_ENV = 'test';
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../app';
import { closeDatabase } from '../../db/mongo';
import http from 'node:http';

describe('Content Routes Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  after(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Start temporary test server on random port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}/api`;
        }
        resolve();
      });
    });
  });

  it('returns 400 if productTitle is missing', async () => {
    try {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Workspace' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('Product title is required'));
    } finally {
      server.close();
    }
  });

  it('returns 503 when Gemma is not configured and ENABLE_MOCK_FALLBACK is false', async () => {
    delete process.env.GEMMA_API_KEY;
    process.env.ENABLE_MOCK_FALLBACK = 'false';

    try {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: 'Leather Desk Pad',
          category: 'Workspace',
          contentType: 'product_description',
        }),
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.ok(data.error.includes('Gemma AI inference is not configured'));
    } finally {
      server.close();
    }
  });

  it('returns 200 with isDemo: true only when ENABLE_MOCK_FALLBACK is explicitly true', async () => {
    delete process.env.GEMMA_API_KEY;
    process.env.ENABLE_MOCK_FALLBACK = 'true';

    try {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: 'Leather Desk Pad',
          category: 'Workspace',
          contentType: 'product_description',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isDemo, true);
      assert.ok(data.modelNotice.includes('Demo Template Engine'));
    } finally {
      server.close();
    }
  });
});
