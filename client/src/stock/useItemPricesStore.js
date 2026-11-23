import { create } from 'zustand';
import api from '../api/client';

const NONE = [];

// Turn the server's item-price rows for one type into store state.
const fromRows = (s, type, rows) => {
  const map = {};
  rows.forEach(({ itemName, price }) => { map[`${type}:${itemName}`] = price; });
  const custom = rows
    .filter((r) => r.custom)
    .map(({ itemName, category, price }) => ({ itemName, category, price }));
  return {
    prices: { ...s.prices, ...map },
    customItems: { ...s.customItems, [type]: custom.length ? custom : NONE },
    loaded: { ...s.loaded, [type]: true },
  };
};

// prices map: `${type}:${itemName}` -> price number
// customItems: items added from the dispatch sheet, per type: [{ itemName, category, price }]
export const useItemPricesStore = create((set, get) => ({
  prices: {},
  customItems: { perishable: NONE, nonperishable: NONE },
  loaded: { perishable: false, nonperishable: false },

  fetchPrices: async (type) => {
    if (get().loaded[type]) return;
    try {
      const { data } = await api.get('/item-prices', { params: { type } });
      set((s) => fromRows(s, type, data));
    } catch {}
  },

  getPrice: (type, itemName, fallback) => {
    const val = get().prices[`${type}:${itemName}`];
    return val !== undefined ? val : fallback;
  },

  updatePrices: async (type, priceMap) => {
    const prices = Object.entries(priceMap).map(([itemName, price]) => ({ itemName, price: Number(price) }));
    const { data } = await api.put('/item-prices', { type, prices });
    set((s) => fromRows(s, type, data));
  },

  // Save new items typed into the dispatch sheet so they join the catalog.
  addCustomItems: async (type, items) => {
    const { data } = await api.post('/item-prices/custom', { type, items });
    set((s) => fromRows(s, type, data));
  },
}));
