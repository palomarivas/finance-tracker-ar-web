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
