import { useEffect, useMemo } from 'react';
import { useItemPricesStore } from '../useItemPricesStore';
import { SALEOUT_CATALOG } from './saleOutCatalog';
import { NP_CATALOG } from './nonPerishableCatalog';

const BASE = { perishable: SALEOUT_CATALOG, nonperishable: NP_CATALOG };

// Built-in catalog plus the items added from the dispatch sheet (stored on the server).
export const buildCatalog = (base, custom) => {
  const catalog = base.map((cat) => ({ ...cat, items: [...cat.items] }));
  for (const it of custom) {
    let cat = catalog.find((c) => c.category === it.category);
    if (!cat) {
      cat = { category: it.category, colorClass: '', headerClass: 'bg-gray-600 text-white', items: [] };
      catalog.push(cat);
    }
    if (!cat.items.some((x) => x.name.toLowerCase() === it.itemName.toLowerCase())) {
      cat.items.push({ name: it.itemName, price: it.price, custom: true });
    }
  }
  const allItems = catalog.flatMap((cat) =>
    cat.items.map((item) => ({ category: cat.category, name: item.name, price: item.price, unit: 'per' }))
  );
  return { catalog, allItems };
};

// { catalog, allItems } for 'perishable' or 'nonperishable', including added items.
export const useCatalog = (type) => {
  const custom = useItemPricesStore((s) => s.customItems[type]);
  const fetchPrices = useItemPricesStore((s) => s.fetchPrices);
  useEffect(() => { fetchPrices(type); }, [type, fetchPrices]);
  return useMemo(() => buildCatalog(BASE[type], custom), [type, custom]);
};
