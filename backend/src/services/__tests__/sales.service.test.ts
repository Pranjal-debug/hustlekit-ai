import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAndValidateSalesCsv,
  calculateRealInsights,
  SAMPLE_SALES_CSV,
} from '../sales.service';
import {
  computeRecordHash,
  insertSalesRecords,
  clearSalesRecords,
  getSalesRecords,
  closeDatabase,
} from '../../db/mongo';

describe('Sales CSV & Analytics Unit Tests', () => {
  after(async () => {
    await closeDatabase();
  });
  it('successfully parses and validates sample CSV', () => {
    const result = parseAndValidateSalesCsv(SAMPLE_SALES_CSV);
    assert.equal(result.errors.length, 0, 'Sample CSV must have 0 validation errors');
    assert.equal(result.validRows.length, 15, 'Sample CSV has 15 data rows');
    assert.ok(result.previewSummary.estimatedTotalRevenue > 1000);
    assert.ok(result.previewSummary.productsCount >= 4);
  });

  it('detects and flags missing required columns', () => {
    const invalidCsv = `product_name,quantity\nDesk Mat,2\n`;
    assert.throws(
      () => {
        parseAndValidateSalesCsv(invalidCsv);
      },
      (err: Error) => {
        assert.ok(err.message.includes('missing required columns'));
        assert.ok(err.message.includes('date'));
        return true;
      }
    );
  });

  it('catches invalid row formats and isolates erroneous rows', () => {
    const badRowsCsv = `date,product_name,quantity,unit_price
2026-10-01,Valid Product,2,30.00
not-a-date,Bad Date Product,1,20.00
2026-10-03,Negative Qty,-5,20.00
2026-10-04,Bad Price,2,invalid_price
2026-10-05,,3,15.00
`;
    const result = parseAndValidateSalesCsv(badRowsCsv);
    assert.equal(result.validRows.length, 1, 'Only 1 row is completely valid');
    assert.equal(result.errors.length, 4, '4 rows have errors');
    assert.ok(result.errors.some((e) => e.row === 3 && e.error.includes('date')));
    assert.ok(result.errors.some((e) => e.row === 4 && e.error.includes('Quantity')));
    assert.ok(result.errors.some((e) => e.row === 5 && e.error.includes('Price')));
    assert.ok(result.errors.some((e) => e.row === 6 && e.error.includes('product name')));
  });

  it('supports original "quantity" header and parses correctly', () => {
    const csv = `date,product_name,quantity,unit_price\n2026-10-01,Desk Mat,5,20.00`;
    const result = parseAndValidateSalesCsv(csv);
    assert.equal(result.validRows.length, 1);
    assert.equal(result.validRows[0].quantity, 5);
    assert.equal(result.validRows[0].revenue, 100.00);
  });

  it('supports "units_sold" alias and calculates revenue correctly', () => {
    const csv = `date,product_name,units_sold,unit_price\n2026-10-01,Desk Mat,4,25.00`;
    const result = parseAndValidateSalesCsv(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.validRows.length, 1);
    assert.equal(result.validRows[0].quantity, 4);
    assert.equal(result.validRows[0].revenue, 100.00);
  });

  it('supports "units sold" alias and calculates revenue correctly', () => {
    const csv = `date,product_name,units sold,unit_price\n2026-10-01,Desk Mat,3,30.00`;
    const result = parseAndValidateSalesCsv(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.validRows.length, 1);
    assert.equal(result.validRows[0].quantity, 3);
    assert.equal(result.validRows[0].revenue, 90.00);
  });

  it('supports "items_sold", "item_qty", and "line_item_quantity" aliases', () => {
    const csv1 = `date,product_name,items_sold,unit_price\n2026-10-01,Item A,2,10.00`;
    const csv2 = `date,product_name,item_qty,unit_price\n2026-10-01,Item B,6,5.00`;
    const csv3 = `date,product_name,line_item_quantity,unit_price\n2026-10-01,Item C,1,50.00`;

    const r1 = parseAndValidateSalesCsv(csv1);
    const r2 = parseAndValidateSalesCsv(csv2);
    const r3 = parseAndValidateSalesCsv(csv3);

    assert.equal(r1.validRows[0].quantity, 2);
    assert.equal(r2.validRows[0].quantity, 6);
    assert.equal(r3.validRows[0].quantity, 1);
  });

  it('handles header case and surrounding whitespace in aliases', () => {
    const csv = `  DATE  , " Product Name " ,  "  UNITS SOLD  " , "Unit_Price"\n2026-10-01,Desk Mat,10,15.00`;
    const result = parseAndValidateSalesCsv(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.validRows.length, 1);
    assert.equal(result.validRows[0].productName, 'Desk Mat');
    assert.equal(result.validRows[0].quantity, 10);
    assert.equal(result.validRows[0].revenue, 150.00);
  });

  it('still rejects invalid or missing quantity values under new aliases', () => {
    const csv = `date,product_name,units_sold,unit_price
2026-10-01,Desk Mat,not-a-number,20.00
2026-10-02,Desk Mat,-3,20.00
2026-10-03,Desk Mat,0,20.00
2026-10-04,Valid Item,5,20.00`;

    const result = parseAndValidateSalesCsv(csv);
    assert.equal(result.validRows.length, 1);
    assert.equal(result.errors.length, 3);
    assert.ok(result.errors.some((e) => e.row === 2 && e.error.includes('Quantity must be a positive integer')));
    assert.ok(result.errors.some((e) => e.row === 3 && e.error.includes('Quantity must be a positive integer')));
    assert.ok(result.errors.some((e) => e.row === 4 && e.error.includes('Quantity must be a positive integer')));
  });

  it('preserves deduplication and revenue calculation when importing with new aliases', () => {
    const csvA = `order_id,date,product_name,quantity,unit_price\nORD-1,2026-10-01,Lamp,2,50.00`;
    const csvB = `order_id,date,product_name,units_sold,unit_price\nORD-1,2026-10-01,Lamp,2,50.00`;

    const parsedA = parseAndValidateSalesCsv(csvA);
    const parsedB = parseAndValidateSalesCsv(csvB);

    assert.equal(parsedA.validRows[0].revenue, 100.00);
    assert.equal(parsedB.validRows[0].revenue, 100.00);

    const hashA = computeRecordHash('default', parsedA.validRows[0]);
    const hashB = computeRecordHash('default', parsedB.validRows[0]);
    assert.equal(hashA, hashB, 'Hashes must be identical regardless of whether quantity or units_sold was the header');
  });

  it('computes deterministic hashes for deduplication', () => {
    const row1 = {
      orderId: 'ORD-101',
      date: '2026-10-01',
      productName: 'Desk Mat',
      quantity: 2,
      unitPrice: 38.0,
    };
    const row2 = {
      orderId: 'ORD-101',
      date: '2026-10-01',
      productName: 'desk mat ',
      quantity: 2,
      unitPrice: 38.0,
    };
    const row3 = {
      orderId: 'ORD-102',
      date: '2026-10-01',
      productName: 'Desk Mat',
      quantity: 2,
      unitPrice: 38.0,
    };

    const hash1 = computeRecordHash('default', row1);
    const hash2 = computeRecordHash('default', row2);
    const hash3 = computeRecordHash('default', row3);

    assert.equal(hash1, hash2, 'Identical transaction must produce identical hash despite case/spacing');
    assert.notEqual(hash1, hash3, 'Different order IDs must produce different hashes');
  });

  it('deduplicates rows on import and prevents double counting', async () => {
    await clearSalesRecords('test_workspace');

    const sampleRows = [
      {
        orderId: 'T-1',
        date: '2026-10-01',
        productName: 'Lamp',
        quantity: 1,
        unitPrice: 70.0,
        revenue: 70.0,
      },
      {
        orderId: 'T-2',
        date: '2026-10-02',
        productName: 'Mat',
        quantity: 2,
        unitPrice: 35.0,
        revenue: 70.0,
      },
    ];

    // First import
    const summary1 = await insertSalesRecords('test_workspace', sampleRows);
    assert.equal(summary1.insertedCount, 2);
    assert.equal(summary1.skippedDuplicatesCount, 0);

    // Second import of same rows
    const summary2 = await insertSalesRecords('test_workspace', sampleRows);
    assert.equal(summary2.insertedCount, 0, 'No rows should be inserted twice');
    assert.equal(summary2.skippedDuplicatesCount, 2, 'Both duplicate rows must be skipped');

    const stored = await getSalesRecords('test_workspace');
    assert.equal(stored.length, 2, 'Total stored records must remain 2');
  });

  it('accurately calculates real sales insights and product rankings', () => {
    const records = [
      {
        id: '1',
        workspaceId: 'default',
        orderId: 'O1',
        productName: 'Keyring',
        date: '2026-10-01',
        quantity: 5,
        unitPrice: 20,
        revenue: 100,
        channel: 'Shopify',
        recordHash: 'h1',
        createdAt: '2026-10-01T00:00:00Z',
      },
      {
        id: '2',
        workspaceId: 'default',
        orderId: 'O2',
        productName: 'Desk Mat',
        date: '2026-10-01',
        quantity: 2,
        unitPrice: 50,
        revenue: 100,
        channel: 'Shopify',
        recordHash: 'h2',
        createdAt: '2026-10-01T00:00:00Z',
      },
      {
        id: '3',
        workspaceId: 'default',
        orderId: 'O3',
        productName: 'Desk Mat',
        date: '2026-10-02',
        quantity: 1,
        unitPrice: 50,
        revenue: 50,
        channel: 'Etsy',
        recordHash: 'h3',
        createdAt: '2026-10-02T00:00:00Z',
      },
    ];

    const insights = calculateRealInsights(records);

    assert.equal(insights.summary.totalRevenue, 250);
    assert.equal(insights.summary.totalOrders, 3);
    assert.equal(insights.summary.averageOrderValue, Math.round((250 / 3) * 100) / 100);
    assert.equal(insights.summary.unitsSold, 8);
    assert.equal(insights.isDemo, false);
    assert.equal(insights.dataSource, 'imported_sales');

    // Product performance ranking: Desk Mat ($150) should be #1, Keyring ($100) #2
    assert.ok(insights.topProducts);
    assert.equal(insights.topProducts[0].productName, 'Desk Mat');
    assert.equal(insights.topProducts[0].revenue, 150);
    assert.equal(insights.topProducts[1].productName, 'Keyring');
    assert.equal(insights.topProducts[1].unitsSold, 5);

    // Chart daily grouping
    assert.equal(insights.chartData.length, 2, 'Grouped into 2 distinct dates');
    assert.equal(insights.chartData[0].revenue, 200); // 2026-10-01
    assert.equal(insights.chartData[1].revenue, 50); // 2026-10-02

    // Insufficient sequential data (< 7 days) check
    assert.equal(insights.forecast.hasEnoughData, false, 'Must not claim high-confidence forecast on only 2 days of data');

    // Fix F-04: Verify no hardcoded/fabricated comparative metrics when no prior period exists
    assert.equal(insights.summary.revenueChangePercentage, undefined);
    assert.equal(insights.summary.ordersChangePercentage, undefined);
    assert.equal(insights.summary.aovChangePercentage, undefined);
    assert.equal(insights.summary.conversionRate, undefined);
    assert.equal(insights.summary.conversionChangePercentage, undefined);
    for (const channel of insights.channels) {
      assert.equal(channel.growth, undefined, 'Channel comparative growth must not be fabricated');
    }
  });

  it('Fix F-04: imported records without prior comparison period produce no fabricated growth percentages', () => {
    const singleRecord = [
      {
        id: 'rec_100',
        workspaceId: 'workspace_test',
        productName: 'Focus Lamp',
        date: '2026-10-05',
        quantity: 3,
        unitPrice: 45,
        revenue: 135,
        channel: 'Direct Store',
        recordHash: 'hash_single',
        createdAt: '2026-10-05T00:00:00Z',
      },
    ];

    const result = calculateRealInsights(singleRecord);

    // Legitimate metrics calculated strictly from the actual record
    assert.equal(result.summary.totalRevenue, 135);
    assert.equal(result.summary.totalOrders, 1);
    assert.equal(result.summary.averageOrderValue, 135);
    assert.equal(result.summary.unitsSold, 3);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].channel, 'Direct Store');
    assert.equal(result.channels[0].revenue, 135);
    assert.equal(result.channels[0].sharePercentage, 100);

    // Ungrounded comparative percentages must be omitted
    assert.equal(result.summary.revenueChangePercentage, undefined);
    assert.equal(result.summary.ordersChangePercentage, undefined);
    assert.equal(result.summary.aovChangePercentage, undefined);
    assert.equal(result.summary.conversionRate, undefined);
    assert.equal(result.summary.conversionChangePercentage, undefined);
    assert.equal(result.channels[0].growth, undefined);
  });
});
