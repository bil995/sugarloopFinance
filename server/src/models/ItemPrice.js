import mongoose from 'mongoose';

// Sale Out item prices. Built-in catalog items (client/src/stock/catalog) only
// store a price override here; items added from the dispatch sheet are stored
// here in full (custom: true, with their category) so they show up everywhere.
const itemPriceSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['perishable', 'nonperishable'], required: true },
    price: { type: Number, required: true, min: 0 },
    category: String, // set for custom items
    custom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

itemPriceSchema.index({ itemName: 1, type: 1 }, { unique: true });

export default mongoose.model('ItemPrice', itemPriceSchema);
