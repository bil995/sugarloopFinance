// Sugarloop's expense categories.
export const EXPENSE_CATEGORIES = [
  'INDRIVE_LOGISTICS', // InDrive rides moving raw stock & equipment
  'FUEL_TRANSIT', // Fuel slips for warehouse -> bakery branch vehicles
  'WAREHOUSE_REPAIRS', // Maintenance, replacements, central kitchen facilities
  'RAW_PROCUREMENT', // Flour, dairy, chocolate, sugar, packaging
  'MISC_OPERATIONS', // Catch-all for future categories
  'BRANCHES', // Expenses for a bakery branch (see BILL_BRANCHES)
];

// Branches a BRANCHES bill can be charged to.
export const BILL_BRANCHES = ['DHA-1', 'DHA-2', 'BH-4', 'Nust-1', 'Nust-2'];

// Categories that carry origin/destination route details.
export const LOGISTICS_CATEGORIES = ['INDRIVE_LOGISTICS', 'FUEL_TRANSIT'];

export const STATUSES = ['PAID', 'PENDING', 'FLAGGED'];
export const CURRENCIES = ['PKR', 'USD'];
export const PAYMENT_METHODS = ['CASH', 'BANK', 'CHEQUE', 'ONLINE', 'OTHER'];

