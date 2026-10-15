import { Router, Request, Response } from 'express';
import { ProductItem } from '../types';
import { getProductsFromDb, saveProductToDb } from '../db/mongo';

export const productsRouter = Router();

// GET /api/products
productsRouter.get('/products', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';
  try {
    const products = await getProductsFromDb(workspaceId);
    res.status(200).json({
      data: products,
      total: products.length,
      isDemo: products.every((p) => p.isDemo),
      message: 'Store inventory loaded',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// POST /api/products
productsRouter.post('/products', async (req: Request, res: Response) => {
  const { title, category, price, inventory, workspaceId = 'default' } = req.body;
  if (!title || !category) {
    res.status(400).json({ error: 'Product title and category are required.' });
    return;
  }

  const newProduct: ProductItem = {
    id: `prod_${Date.now()}`,
    title: String(title),
    category: String(category),
    price: Number(price) || 0,
    inventory: Number(inventory) || 10,
    status: Number(inventory) > 0 ? 'active' : 'draft',
    salesCount: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
    isDemo: false,
  };

  try {
    const saved = await saveProductToDb(workspaceId, newProduct);
    res.status(201).json({ data: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save product to database' });
  }
});
