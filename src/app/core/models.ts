/** Mirrors of the NestJS API response shapes (finance-tracker-ar). */

export type Currency = 'ARS' | 'USD';
export type RateType =
  | 'OFICIAL'
  | 'TARJETA'
  | 'BLUE'
  | 'MEP'
  | 'CCL'
  | 'MAYORISTA'
  | 'CRIPTO';

export interface SessionUser {
  id: string;
  email: string;
  baseCurrency: Currency;
}

export interface AuthResult {
  accessToken: string;
  user: SessionUser;
}

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'WALLET' | 'CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: Currency;
  valuationRateType: RateType | null;
  createdAt: string;
}

export type CategoryKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  parent?: Category | null;
  /** Absent user relation = shared system default (read-only). */
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  currency: Currency;
  description: string | null;
  merchant: string | null;
  postedAt: string;
  source: 'MANUAL' | 'IMPORT' | 'EMAIL';
  category: Category | null;
  account?: Account;
  baseArsCents: number | null;
  perceptionArsCents: number | null;
  perceptionReversed: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ExchangeRate {
  id: string;
  rateType: RateType;
  date: string;
  buyCents: number;
  sellCents: number;
  source: string;
}

// ---------------------------------------------------------------- reports

export interface MonthlySummary {
  month: string;
  incomeArsCents: number;
  expenseArsCents: number;
  netArsCents: number;
}

export interface SpendByCategoryItem {
  categoryId: string | null;
  categoryName: string;
  /** Negative cents (expenses). */
  spentArsCents: number;
  sharePct: number;
}

export interface SpendByCategoryReport {
  month: string;
  totalArsCents: number;
  items: SpendByCategoryItem[];
}

export interface BudgetVsActualItem {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  budgetCents: number;
  actualCents: number;
  remainingCents: number;
  usedPct: number;
}

export interface BudgetVsActualReport {
  month: string;
  items: BudgetVsActualItem[];
}

export interface NetWorthAccount {
  accountId: string;
  name: string;
  type: AccountType;
  balances: Partial<Record<Currency, number>>;
  valueArsCents: number;
  rateUsed: { rateType: RateType; date: string; buyCents: number } | null;
}

export interface NetWorthReport {
  asOf: string;
  totalArsCents: number;
  accounts: NetWorthAccount[];
}
