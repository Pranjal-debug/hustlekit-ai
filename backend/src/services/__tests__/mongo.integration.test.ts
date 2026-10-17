process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDatabase,
  getDatabaseStatus,
  insertSalesRecords,
  getSalesRecords,
  clearSalesRecords,
  getProductsFromDb,
  saveProductToDb,
  getStoreSettingsFromDb,
  saveStoreSettingsToDb,
  closeDatabase,
} from '../../db/mongo';

describe('MongoDB Atlas End-to-End Persistence Tests', () => {
  before(async () => {
    await initDatabase();
  });

  after(async () => {
    // Clean up test records
    await clearSalesRecords('atlas_e2e_test');
    await closeDatabase();
  });

  it('connects to real MongoDB Atlas or reports valid status', async () => {
    const status = await getDatabaseStatus();
    assert.ok(['connected', 'in_memory_fallback'].includes(status.status));
    if (status.status === 'connected') {
      assert.equal(status.type, 'mongodb');
      assert.ok(
        status.dbName && status.dbName.toLowerCase().includes('test'),
        'Connected database must be an isolated test database'
      );
      assert.notEqual(
        status.dbName,
        'hustlekit_ai',
        'Must never connect to production database during tests'
      );
    }
  });

  it('persists and retrieves sales records with deterministic deduplication', async () => {
    await clearSalesRecords('atlas_e2e_test');

    const testRecords = [
      {
        orderId: 'E2E-1',
        date: '2026-10-15',
        productName: 'E2E Leather Desk Pad',
        quantity: 2,
        unitPrice: 45.0,
        revenue: 90.0,
        channel: 'Direct Store',
      },
      {
        orderId: 'E2E-2',
        date: '2026-10-15',
        productName: 'E2E Titanium Keyring',
        quantity: 1,
        unitPrice: 25.0,
        revenue: 25.0,
        channel: 'Instagram Shop',
      },
    ];

    const import1 = await insertSalesRecords('atlas_e2e_test', testRecords);
    assert.equal(import1.insertedCount, 2);
    assert.equal(import1.skippedDuplicatesCount, 0);

    const fetched = await getSalesRecords('atlas_e2e_test');
    assert.equal(fetched.length, 2);
    assert.equal(fetched[0].workspaceId, 'atlas_e2e_test');

    // Duplicate import test
    const import2 = await insertSalesRecords('atlas_e2e_test', testRecords);
    assert.equal(import2.insertedCount, 0, 'Duplicates must not be inserted');
    assert.equal(import2.skippedDuplicatesCount, 2, 'Both duplicate records must be skipped');

    const fetchedAfterDuplicate = await getSalesRecords('atlas_e2e_test');
    assert.equal(fetchedAfterDuplicate.length, 2, 'Total records count must not change on duplicate import');
  });

  it('persists and retrieves products in MongoDB collection', async () => {
    const newProduct = {
      id: `prod_test_${Date.now()}`,
      title: 'Atlas Verified Desk Mat',
      category: 'Workspace',
      price: 49.99,
      inventory: 25,
      status: 'active' as const,
      salesCount: 10,
      revenue: 499.9,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    await saveProductToDb('atlas_e2e_test', newProduct);

    const products = await getProductsFromDb('atlas_e2e_test');
    const match = products.find((p) => p.id === newProduct.id);
    assert.ok(match, 'Product must be persisted and retrievable');
    assert.equal(match.title, 'Atlas Verified Desk Mat');
  });

  it('persists and retrieves store settings in MongoDB collection', async () => {
    const customSettings = {
      storeName: 'Atlas Live Storefront',
      sellerName: 'Jordan Test',
      currency: 'USD ($)',
      defaultTone: 'persuasive' as const,
      targetMarket: 'Global tech creators',
      aiProviderConfigured: true,
      demoModeActive: false,
    };

    await saveStoreSettingsToDb('atlas_e2e_test', customSettings);

    const retrieved = await getStoreSettingsFromDb('atlas_e2e_test');
    assert.ok(retrieved, 'Store settings must be retrievable');
    assert.equal(retrieved.storeName, 'Atlas Live Storefront');
    assert.equal(retrieved.sellerName, 'Jordan Test');
  });
});
