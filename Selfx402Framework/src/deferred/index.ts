/**
 * Deferred payment scheme module
 * x402 PR #426 - Option A: Basic deferred scheme
 *
 * Enables micro-payment aggregation through off-chain vouchers
 * that are settled in batches to reduce gas costs.
 */

// Core types
export type {
  PaymentVoucher,
  DeferredPaymentEnvelope,
  VoucherRecord,
  SettlementRecord,
  VoucherVerificationResult,
  AccumulatedBalance,
  SettlementRequest,
  SettlementResult,
} from "./types.js";

// Signing utilities
export {
  createVoucherDomain,
  voucherTypes,
  generateNonce,
  createVoucher,
  signVoucher,
  verifyVoucher,
  aggregateVouchers,
  filterExpiredVouchers,
  sortVouchersByAmount,
} from "./signing.js";

// Validation utilities
export type { VoucherValidationResult } from "./validation.js";
export {
  validateVoucher,
  validateDeferredEnvelope,
  canAggregateVouchers,
  calculateAggregatedAmount,
  isSettlementViable,
  getSettlementCandidates,
} from "./validation.js";

// Database utilities
export { VoucherDatabaseService } from "./database.js";
export type { VoucherDatabaseConfig } from "./database.js";
