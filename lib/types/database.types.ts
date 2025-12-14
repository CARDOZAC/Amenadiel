/**
 * Database Types - Generated from Supabase Schema
 * DO NOT EDIT MANUALLY - Regenerate with: supabase gen types typescript
 */

import Big from 'big.js';

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'owner' | 'accountant' | 'collector';

export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'written_off';

export type DaysheetStatus = 'draft' | 'submitted' | 'verified' | 'closed';

export type CollectionEventType =
  | 'full_payment'
  | 'partial_payment'
  | 'excess_payment'
  | 'interest_only';

export type ExpenseType = 'transport' | 'food' | 'communication' | 'other';

export type LedgerEntryType =
  | 'loan_disbursement'
  | 'principal_payment'
  | 'interest_payment'
  | 'late_fee'
  | 'expense'
  | 'adjustment';

export type ClosingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// GEOGRAPHY TYPES (PostGIS)
// ============================================================================

/**
 * GeoJSON Point: { type: 'Point', coordinates: [lon, lat] }
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * GeoJSON Polygon: { type: 'Polygon', coordinates: [[[lon, lat], ...]] }
 */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings
}

// ============================================================================
// TABLE: users
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface InsertUser {
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  is_active?: boolean;
}

// ============================================================================
// TABLE: routes
// ============================================================================

export interface Route {
  id: string;
  name: string;
  description: string | null;
  collector_id: string | null;
  coverage_area: GeoPolygon | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertRoute {
  name: string;
  description?: string | null;
  collector_id?: string | null;
  coverage_area?: GeoPolygon | null;
  is_active?: boolean;
}

// ============================================================================
// TABLE: clients
// ============================================================================

export interface Client {
  id: string;
  full_name: string;
  identity_number: string | null;
  phone: string | null;
  address: string | null;
  location: GeoPoint | null;
  route_id: string | null;
  references: PersonalReference[];
  risk_score: string; // NUMERIC(5,2) as string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalReference {
  name: string;
  relationship: string;
  phone: string;
}

export interface InsertClient {
  full_name: string;
  identity_number?: string | null;
  phone?: string | null;
  address?: string | null;
  location?: GeoPoint | null;
  route_id?: string | null;
  references?: PersonalReference[];
  risk_score?: string;
  is_active?: boolean;
}

// ============================================================================
// TABLE: loans
// ============================================================================

export interface Loan {
  id: string;
  client_id: string;
  approved_by: string | null;
  collector_id: string | null;

  // Condiciones financieras (INMUTABLES)
  principal_amount: string; // NUMERIC(18,6) as string
  daily_payment: string;
  daily_interest_rate: string; // NUMERIC(10,8)
  annual_effective_rate: string | null; // NUMERIC(8,4)

  // Saldos actuales (ACTUALIZADOS POR DLE)
  outstanding_principal: string;
  accrued_interest: string;
  total_paid_principal: string;
  total_paid_interest: string;

  // Mora
  days_overdue: number;
  late_fees: string;

  // Fechas
  disbursement_date: string; // ISO date
  first_payment_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;

  // Estado
  status: LoanStatus;

  created_at: string;
  updated_at: string;
}

export interface InsertLoan {
  client_id: string;
  approved_by?: string | null;
  collector_id?: string | null;
  principal_amount: string;
  daily_payment: string;
  daily_interest_rate: string;
  annual_effective_rate?: string | null;
  outstanding_principal: string;
  disbursement_date: string;
  first_payment_date: string;
  expected_end_date?: string | null;
  status?: LoanStatus;
}

// ============================================================================
// TABLE: installments
// ============================================================================

export interface Installment {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  expected_principal: string;
  expected_interest: string;
  expected_total: string;
  created_at: string;
}

export interface InsertInstallment {
  loan_id: string;
  installment_number: number;
  due_date: string;
  expected_principal: string;
  expected_interest: string;
  expected_total: string;
}

// ============================================================================
// TABLE: daysheets
// ============================================================================

export interface Daysheet {
  id: string;
  collector_id: string;
  route_id: string | null;
  work_date: string; // ISO date

  // Reconciliación de efectivo
  expected_cash: string;
  declared_cash: string | null;
  total_expenses: string;
  cash_variance: string;

  // Estado
  status: DaysheetStatus;

  // Timestamps de workflow
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  closed_at: string | null;

  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertDaysheet {
  collector_id: string;
  route_id?: string | null;
  work_date: string;
  expected_cash?: string;
  declared_cash?: string | null;
  total_expenses?: string;
  cash_variance?: string;
  status?: DaysheetStatus;
  notes?: string | null;
}

// ============================================================================
// TABLE: collection_events
// ============================================================================

export interface CollectionEvent {
  id: string;
  loan_id: string;
  collector_id: string;
  daysheet_id: string | null;

  // Monto y tipo
  amount: string;
  event_type: CollectionEventType;

  // Geolocalización (AUDITORÍA CRÍTICA)
  location: GeoPoint;
  collected_at: string; // ISO timestamp

  // Procesamiento DLE
  processed_by_dle: boolean;
  dle_closing_id: string | null;
  principal_applied: string | null;
  interest_applied: string | null;

  // Metadata
  notes: string | null;
  photo_url: string | null;

  created_at: string;
}

export interface InsertCollectionEvent {
  loan_id: string;
  collector_id: string;
  daysheet_id?: string | null;
  amount: string;
  event_type: CollectionEventType;
  location: GeoPoint;
  collected_at: string;
  notes?: string | null;
  photo_url?: string | null;
}

// ============================================================================
// TABLE: expense_events
// ============================================================================

export interface ExpenseEvent {
  id: string;
  collector_id: string;
  daysheet_id: string | null;
  amount: string;
  expense_type: ExpenseType;
  description: string;
  receipt_photo_url: string | null;
  expense_date: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface InsertExpenseEvent {
  collector_id: string;
  daysheet_id?: string | null;
  amount: string;
  expense_type: ExpenseType;
  description: string;
  receipt_photo_url?: string | null;
  expense_date: string;
}

// ============================================================================
// TABLE: ledger_transactions
// ============================================================================

export interface LedgerTransaction {
  id: string;
  closing_id: string | null;
  entry_type: LedgerEntryType;
  debit_account: string;
  credit_account: string;
  amount: string;
  loan_id: string | null;
  client_id: string | null;
  collection_event_id: string | null;
  description: string | null;
  transaction_date: string; // ISO date
  created_at: string;
}

export interface InsertLedgerTransaction {
  closing_id?: string | null;
  entry_type: LedgerEntryType;
  debit_account: string;
  credit_account: string;
  amount: string;
  loan_id?: string | null;
  client_id?: string | null;
  collection_event_id?: string | null;
  description?: string | null;
  transaction_date: string;
}

// ============================================================================
// TABLE: closings
// ============================================================================

export interface Closing {
  id: string;
  closing_date: string; // ISO date
  executed_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: ClosingStatus;

  // Resumen financiero
  total_collections: string;
  total_principal_collected: string;
  total_interest_collected: string;
  total_expenses: string;
  net_cash_flow: string;

  // Estadísticas de cartera
  active_loans_count: number;
  total_outstanding_principal: string;
  overdue_loans_count: number;
  collection_events_processed: number;

  error_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertClosing {
  closing_date: string;
  executed_by?: string | null;
  status?: ClosingStatus;
}

// ============================================================================
// HELPER TYPES FOR BIG.JS CONVERSION
// ============================================================================

/**
 * Convert database NUMERIC string to Big.js instance
 */
export function toBig(value: string | null | undefined): Big {
  return new Big(value || '0');
}

/**
 * Convert Big.js instance to database NUMERIC string
 */
export function fromBig(value: Big): string {
  return value.toFixed(6); // 6 decimal places
}

// ============================================================================
// VIEW TYPES (for common queries)
// ============================================================================

/**
 * Loan with client and collector information (for reports)
 */
export interface LoanWithRelations extends Loan {
  client: Client;
  collector: User | null;
  approved_by_user: User | null;
}

/**
 * Collection event with loan and client (for daysheet reconciliation)
 */
export interface CollectionEventWithRelations extends CollectionEvent {
  loan: Loan;
  client: Client;
}

/**
 * Daysheet with collector and summary (for accounting review)
 */
export interface DaysheetWithSummary extends Daysheet {
  collector: User;
  collection_events: CollectionEvent[];
  expense_events: ExpenseEvent[];
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

/**
 * Daily settlement engine (DLE) input
 */
export interface DLEInput {
  closing_date: string;
  unprocessed_events: CollectionEvent[];
}

/**
 * Daily settlement engine (DLE) output
 */
export interface DLEOutput {
  closing_id: string;
  loans_updated: number;
  total_principal_collected: string;
  total_interest_collected: string;
  ledger_entries: InsertLedgerTransaction[];
  errors: string[];
}

/**
 * Loan amortization calculation
 */
export interface AmortizationResult {
  principal_applied: string;
  interest_applied: string;
  remaining_payment: string;
  new_outstanding_principal: string;
  new_accrued_interest: string;
}

/**
 * Exception report item (for accountant review)
 */
export interface ExceptionReportItem {
  loan_id: string;
  client_name: string;
  expected_payment: string;
  actual_payment: string;
  variance: string;
  days_overdue: number;
}

/**
 * KPI Dashboard data (for owner)
 */
export interface KPIDashboard {
  net_cash_flow: string;
  effective_collection_rate: string; // TRE percentage
  total_outstanding_principal: string;
  overdue_portfolio_by_age: {
    range: string;
    count: number;
    amount: string;
  }[];
  concentration_by_collector: {
    collector_name: string;
    loan_count: number;
    outstanding_principal: string;
  }[];
}
