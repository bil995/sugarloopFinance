import { useFinanceStore, filterRecords } from '../../store/useFinanceStore';
import { CATEGORIES, CATEGORY_KEYS, BILL_BRANCHES } from '../../utils/categories';

// Category tag chips with live record counts (respecting the vendor + period filter).
export default function CategoryFilter() {
  const records = useFinanceStore((s) => s.records);
  const selectedVendorId = useFinanceStore((s) => s.selectedVendorId);
  const selectedCategory = useFinanceStore((s) => s.selectedCategory);
  const setSelectedCategory = useFinanceStore((s) => s.setSelectedCategory);
  const selectedBranch = useFinanceStore((s) => s.selectedBranch);
  const setSelectedBranch = useFinanceStore((s) => s.setSelectedBranch);
  const activePeriodStart = useFinanceStore((s) => s.activePeriodStart);
  const dateRange = useFinanceStore((s) => s.dateRange);

  const from = dateRange.from || activePeriodStart || '';
  const to = dateRange.to;
  const vendorRecords = filterRecords(records, { vendorId: selectedVendorId, from, to });
  const countFor = (key) => vendorRecords.filter((r) => r.category === key).length;
  const branchRecords = vendorRecords.filter((r) => r.category === 'BRANCHES');
  const countForBranch = (branch) => branchRecords.filter((r) => r.branch === branch).length;

  const chip = (active) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
      active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'
    }`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button className={chip(selectedCategory === 'ALL')} onClick={() => setSelectedCategory('ALL')}>
          All categories <span className="opacity-70">{vendorRecords.length}</span>
        </button>
        {CATEGORY_KEYS.map((key) => {
          const { label, icon: Icon } = CATEGORIES[key];
          return (
            <button key={key} className={chip(selectedCategory === key)} onClick={() => setSelectedCategory(key)}>
              <Icon className="h-4 w-4" />
              {label} {(key !== 'BRANCHES' || countFor(key) > 0) && <span className="opacity-70">{countFor(key)}</span>}
            </button>
          );
        })}
      </div>
      {/* Branches category: pick one branch */}
      {selectedCategory === 'BRANCHES' && (
        <div className="flex flex-wrap items-center gap-2 border-l-2 border-rose-300 pl-3">
          <span className="text-xs font-medium text-slate-500">Branch</span>
          <button className={chip(selectedBranch === 'ALL')} onClick={() => setSelectedBranch('ALL')}>
            All branches {branchRecords.length > 0 && <span className="opacity-70">{branchRecords.length}</span>}
          </button>
          {BILL_BRANCHES.map((b) => (
            <button key={b} className={chip(selectedBranch === b)} onClick={() => setSelectedBranch(b)}>
              {b} {countForBranch(b) > 0 && <span className="opacity-70">{countForBranch(b)}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
