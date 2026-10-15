import { MongoClient, Db } from 'mongodb';
import crypto from 'crypto';
import {
  SalesRecord,
  ProductItem,
  ContentGenerationResponse,
  SalesImportSummary,
  StoreSettings,
  AdvisorReport,
} from '../types';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let lastConnectionError: string | null = null;
const memoryAdvisorReports: AdvisorReport[] = [];

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_1',
    title: 'Minimalist Desk Mat Pro (Leatherette)',
    category: 'Workspace & Ergonomics',
    price: 38.0,
    inventory: 42,
    status: 'active',
    salesCount: 148,
    revenue: 5624.0,
    createdAt: '2026-10-01T10:00:00Z',
    isDemo: true,
  },
  {
    id: 'prod_2',
    title: 'AuraFocus Ambient Desk Lamp',
    category: 'Home & Office',
    price: 69.99,
    inventory: 19,
    status: 'active',
    salesCount: 86,
    revenue: 6019.14,
    createdAt: '2026-10-04T14:30:00Z',
    isDemo: true,
  },
  {
    id: 'prod_3',
    title: 'Titanium EDC Carabiner Keyring',
    category: 'Accessories & EDC',
    price: 24.5,
    inventory: 5,
    status: 'low_stock',
    salesCount: 210,
    revenue: 5145.0,
    createdAt: '2026-10-08T09:15:00Z',
    isDemo: true,
  },
  {
    id: 'prod_4',
    title: 'FocusFlow Time-Block Planner 2026',
    category: 'Stationery & Productivity',
    price: 29.0,
    inventory: 0,
    status: 'draft',
    salesCount: 0,
    revenue: 0,
    createdAt: '2026-10-12T16:45:00Z',
    isDemo: true,
  },
  {
    id: 'prod_5',
    title: 'Artisan Pour-Over Ceramic Dripper',
    category: 'Kitchen & Lifestyle',
    price: 45.0,
    inventory: 28,
    status: 'active',
    salesCount: 64,
    revenue: 2880.0,
    createdAt: '2026-10-14T11:20:00Z',
    isDemo: true,
  },
];

// In-memory fallback stores
const memorySales: SalesRecord[] = [];
let memoryProducts: ProductItem[] = [...DEFAULT_PRODUCTS];
const memoryContentHistory: ContentGenerationResponse[] = [];
let memorySettings: StoreSettings | null = null;

export interface DatabaseTelemetry {
  type: 'mongodb' | 'memory';
  status: 'connected' | 'disconnected' | 'error' | 'in_memory_fallback';
  dbName?: string;
  recordCount: number;
  productsCount: number;
  contentHistoryCount: number;
  error?: string;
}

export const initDatabase = async (): Promise<DatabaseTelemetry> => {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'hustlekit_ai';

  if (!uri) {
    lastConnectionError = null;
    return {
      type: 'memory',
      status: 'in_memory_fallback',
      dbName,
      recordCount: memorySales.length,
      productsCount: memoryProducts.length,
      contentHistoryCount: memoryContentHistory.length,
    };
  }

  try {
    const newClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 6000,
    });

    await newClient.connect();
    const newDb = newClient.db(dbName);

    // Create indexes for high performance & deterministic deduplication
    const salesCol = newDb.collection<SalesRecord>('sales_records');
    await salesCol.createIndex({ workspaceId: 1, recordHash: 1 }, { unique: true }).catch(() => {});
    await salesCol.createIndex({ workspaceId: 1, date: -1 }).catch(() => {});

    const productsCol = newDb.collection<any>('products');
    await productsCol.createIndex({ workspaceId: 1, id: 1 }, { unique: true }).catch(() => {});

    // Seed default products in Atlas if collection is empty
    const existingProductsCount = await productsCol.countDocuments({ workspaceId: 'default' });
    if (existingProductsCount === 0) {
      await productsCol.insertMany(
        DEFAULT_PRODUCTS.map((p) => ({ ...p, workspaceId: 'default' }))
      );
    }

    const contentCol = newDb.collection<any>('generated_content');
    await contentCol.createIndex({ workspaceId: 1, createdAt: -1 }).catch(() => {});

    const settingsCol = newDb.collection<any>('store_settings');
    await settingsCol.createIndex({ workspaceId: 1 }, { unique: true }).catch(() => {});

    const advisorCol = newDb.collection<any>('advisor_reports');
    await advisorCol.createIndex({ workspaceId: 1, createdAt: -1 }).catch(() => {});

    client = newClient;
    db = newDb;
    isConnected = true;
    lastConnectionError = null;

    console.log(`[Database] Successfully connected to MongoDB Atlas database: ${dbName}`);
    return {
      type: 'mongodb',
      status: 'connected',
      dbName,
      recordCount: await salesCol.countDocuments(),
      productsCount: await productsCol.countDocuments(),
      contentHistoryCount: await contentCol.countDocuments(),
    };
  } catch (err: any) {
    // Sanitize error message to ensure no credentials or sensitive tokens are printed
    const sanitizedError = (err?.message || 'Connection failed')
      .replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://[REDACTED]@')
      .replace(/mongodb:\/\/[^@]+@/, 'mongodb://[REDACTED]@');

    console.warn(`[Database] MongoDB Atlas connection error: ${sanitizedError}`);
    isConnected = false;
    lastConnectionError = sanitizedError;

    return {
      type: 'mongodb',
      status: 'error',
      dbName,
      recordCount: memorySales.length,
      productsCount: memoryProducts.length,
      contentHistoryCount: memoryContentHistory.length,
      error: sanitizedError,
    };
  }
};

export const getDatabaseStatus = async (): Promise<DatabaseTelemetry> => {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'hustlekit_ai';

  if (!uri) {
    return {
      type: 'memory',
      status: 'in_memory_fallback',
      dbName,
      recordCount: memorySales.length,
      productsCount: memoryProducts.length,
      contentHistoryCount: memoryContentHistory.length,
    };
  }

  if (isConnected && db) {
    try {
      const [salesCount, productsCount, contentCount] = await Promise.all([
        db.collection('sales_records').countDocuments(),
        db.collection('products').countDocuments(),
        db.collection('generated_content').countDocuments(),
      ]);

      return {
        type: 'mongodb',
        status: 'connected',
        dbName,
        recordCount: salesCount,
        productsCount,
        contentHistoryCount: contentCount,
      };
    } catch (err: any) {
      return {
        type: 'mongodb',
        status: 'error',
        dbName,
        recordCount: 0,
        productsCount: 0,
        contentHistoryCount: 0,
        error: 'Lost connection to MongoDB Atlas',
      };
    }
  }

  return {
    type: 'mongodb',
    status: lastConnectionError ? 'error' : 'disconnected',
    dbName,
    recordCount: memorySales.length,
    productsCount: memoryProducts.length,
    contentHistoryCount: memoryContentHistory.length,
    error: lastConnectionError || 'MongoDB Atlas is not connected',
  };
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close().catch(() => {});
    client = null;
    db = null;
    isConnected = false;
  }
};

/**
 * Validates that database is operational if MONGODB_URI was configured.
 * Prevents silent fallback to in-memory store when production database is unreachable.
 */
export const assertDatabaseReady = (operation?: string): void => {
  if (process.env.MONGODB_URI?.trim() && (!isConnected || !db)) {
    const opPrefix = operation ? ` Operation '${operation}' aborted.` : '';
    throw new Error(
      `MongoDB Atlas is configured but not connected (${
        lastConnectionError || 'connection offline'
      }). Database operations are blocked to prevent silent data loss in memory.${opPrefix}`
    );
  }
};

/**
 * Computes deterministic row hash for duplicate prevention
 */
export const computeRecordHash = (
  workspaceId: string,
  record: {
    orderId?: string;
    productName: string;
    date: string;
    quantity: number;
    unitPrice: number;
  }
): string => {
  const seed = `${workspaceId}|${(record.orderId || '').trim().toLowerCase()}|${record.date.trim()}|${record.productName.trim().toLowerCase()}|${record.quantity}|${record.unitPrice.toFixed(2)}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
};

/**
 * Bulk saves sales records with deduplication
 */
export const insertSalesRecords = async (
  workspaceId: string,
  records: Omit<SalesRecord, 'id' | 'workspaceId' | 'recordHash' | 'createdAt'>[]
): Promise<SalesImportSummary> => {
  assertDatabaseReady();
  let insertedCount = 0;
  let skippedDuplicatesCount = 0;
  let totalImportedRevenue = 0;

  const recordsToInsert: SalesRecord[] = [];

  for (const raw of records) {
    const hash = computeRecordHash(workspaceId, raw);
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

    recordsToInsert.push(fullRecord);
  }

  // MongoDB persistence path
  if (isConnected && db) {
    const col = db.collection<SalesRecord>('sales_records');
    for (const item of recordsToInsert) {
      try {
        await col.insertOne(item);
        insertedCount++;
        totalImportedRevenue += item.revenue;
      } catch (err: any) {
        if (err.code === 11000 || err.message?.includes('duplicate key')) {
          skippedDuplicatesCount++;
        } else {
          throw err;
        }
      }
    }

    return {
      totalRowsProcessed: records.length,
      insertedCount,
      skippedDuplicatesCount,
      invalidRowsCount: 0,
      totalImportedRevenue: Math.round(totalImportedRevenue * 100) / 100,
      persistedTo: 'mongodb',
    };
  }

  // In-Memory fallback path
  for (const item of recordsToInsert) {
    const exists = memorySales.some(
      (m) => m.workspaceId === workspaceId && m.recordHash === item.recordHash
    );
    if (exists) {
      skippedDuplicatesCount++;
    } else {
      memorySales.push(item);
      insertedCount++;
      totalImportedRevenue += item.revenue;
    }
  }

  return {
    totalRowsProcessed: records.length,
    insertedCount,
    skippedDuplicatesCount,
    invalidRowsCount: 0,
    totalImportedRevenue: Math.round(totalImportedRevenue * 100) / 100,
    persistedTo: 'memory',
  };
};

/**
 * Retrieve all imported sales records
 */
export const getSalesRecords = async (workspaceId: string = 'default'): Promise<SalesRecord[]> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const raw = await db
      .collection<SalesRecord>('sales_records')
      .find({ workspaceId }, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();
    return raw;
  }
  return memorySales
    .filter((s) => s.workspaceId === workspaceId)
    .sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Clear imported sales records (allows resetting data)
 */
export const clearSalesRecords = async (workspaceId: string = 'default'): Promise<number> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const res = await db.collection('sales_records').deleteMany({ workspaceId });
    return res.deletedCount || 0;
  }
  const prevCount = memorySales.length;
  memorySales.length = 0;
  return prevCount;
};

/**
 * Products CRUD with Atlas persistence
 */
export const getProductsFromDb = async (workspaceId: string = 'default'): Promise<ProductItem[]> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const docs = await db
      .collection<ProductItem>('products')
      .find({ workspaceId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs;
  }
  return memoryProducts;
};

export const saveProductToDb = async (
  workspaceId: string = 'default',
  product: ProductItem
): Promise<ProductItem> => {
  assertDatabaseReady();
  const record = { ...product, workspaceId };
  if (isConnected && db) {
    await db.collection('products').insertOne(record);
    return product;
  }
  memoryProducts.unshift(product);
  return product;
};

/**
 * Persist generated content history
 */
export const saveGeneratedContent = async (
  workspaceId: string,
  content: ContentGenerationResponse
): Promise<void> => {
  assertDatabaseReady();
  const document = {
    ...content,
    workspaceId,
    savedAt: new Date().toISOString(),
  };

  if (isConnected && db) {
    await db.collection('generated_content').insertOne(document);
    return;
  }

  memoryContentHistory.unshift(content);
  if (memoryContentHistory.length > 50) memoryContentHistory.pop();
};

/**
 * Retrieve content generation history
 */
export const getGeneratedContentHistory = async (
  workspaceId: string = 'default'
): Promise<ContentGenerationResponse[]> => {
  assertDatabaseReady();
  if (isConnected && db) {
    return (await db
      .collection('generated_content')
      .find({ workspaceId }, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray()) as any;
  }
  return memoryContentHistory;
};

/**
 * Store settings persistence in MongoDB
 */
export const getStoreSettingsFromDb = async (
  workspaceId: string = 'default'
): Promise<StoreSettings | null> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const doc = await db
      .collection('store_settings')
      .findOne({ workspaceId }, { projection: { _id: 0 } });
    return doc as StoreSettings | null;
  }
  return memorySettings;
};

export const saveStoreSettingsToDb = async (
  workspaceId: string = 'default',
  settings: StoreSettings
): Promise<void> => {
  assertDatabaseReady();
  if (isConnected && db) {
    await db
      .collection('store_settings')
      .updateOne({ workspaceId }, { $set: { ...settings, workspaceId } }, { upsert: true });
    return;
  }
  memorySettings = settings;
};

/**
 * Persist Sales Growth Advisor reports
 */
export const saveAdvisorReportToDb = async (report: AdvisorReport): Promise<AdvisorReport> => {
  assertDatabaseReady();
  if (isConnected && db) {
    await db.collection('advisor_reports').insertOne({ ...report });
    return report;
  }
  memoryAdvisorReports.unshift(report);
  if (memoryAdvisorReports.length > 50) memoryAdvisorReports.pop();
  return report;
};

/**
 * Retrieve Advisor reports for a workspace
 */
export const getAdvisorReportsFromDb = async (
  workspaceId: string = 'default',
  limit: number = 20
): Promise<AdvisorReport[]> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const docs = await db
      .collection<AdvisorReport>('advisor_reports')
      .find({ workspaceId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs;
  }
  return memoryAdvisorReports
    .filter((r) => r.workspaceId === workspaceId)
    .slice(0, limit);
};

/**
 * Retrieve the latest Advisor report for a workspace
 */
export const getLatestAdvisorReportFromDb = async (
  workspaceId: string = 'default'
): Promise<AdvisorReport | null> => {
  assertDatabaseReady();
  if (isConnected && db) {
    const doc = await db
      .collection<AdvisorReport>('advisor_reports')
      .findOne({ workspaceId }, { projection: { _id: 0 }, sort: { createdAt: -1 } });
    return doc;
  }
  return memoryAdvisorReports.find((r) => r.workspaceId === workspaceId) || null;
};


