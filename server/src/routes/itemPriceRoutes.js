import { Router } from 'express';
import ItemPrice from '../models/ItemPrice.js';
import { requireManager } from '../middleware/auth.js';

const router = Router();

// GET /api/item-prices?type=perishable
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  res.json(await ItemPrice.find(filter).lean());
});

// POST /api/item-prices/custom — add new items from the dispatch sheet (any role).
// Body: { type, items: [{ category, itemName, price }] }. Items that already
// exist are left unchanged (prices are changed on the Edit Prices page).
router.post('/custom', async (req, res) => {
  const { type, items } = req.body;
  if (!['perishable', 'nonperishable'].includes(type) || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'type and items array required' });
  }
  const clean = items.map(({ category, itemName, price }) => ({
    category: String(category ?? '').trim(),
    itemName: String(itemName ?? '').trim(),
    price: Number(price),
  }));
  const bad = clean.find((it) => !it.category || !it.itemName || !(it.price >= 0));
  if (bad) return res.status(400).json({ message: `Each new item needs a name and a price${bad.itemName ? ` (${bad.itemName})` : ''}` });

  await ItemPrice.bulkWrite(
    clean.map(({ category, itemName, price }) => ({
      updateOne: {
        filter: { itemName, type },
        update: { $setOnInsert: { itemName, type, price, category, custom: true } },
        upsert: true,
      },
    }))
  );
  res.status(201).json(await ItemPrice.find({ type }).lean());
});

// PUT /api/item-prices  — bulk upsert, manager+
router.put('/', requireManager, async (req, res) => {
  const { type, prices } = req.body;
  if (!type || !Array.isArray(prices) || !prices.length)
    return res.status(400).json({ message: 'type and prices array required' });

  const ops = prices.map(({ itemName, price }) => ({
    updateOne: {
      filter: { itemName, type },
      update: { $set: { price } },
      upsert: true,
    },
  }));
  await ItemPrice.bulkWrite(ops);
  res.json(await ItemPrice.find({ type }).lean());
});

export default router;
