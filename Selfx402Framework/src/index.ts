/**
 * @selfx402/framework
 *
 * Framework for building x402 facilitator servers and Self Protocol validators
 * Inspired by thirdweb SDK architecture
 *
 * @example Basic usage
 * ```typescript
 * import { Facilitator } from "@selfx402/framework";
 * import { networks } from "@selfx402/framework/networks";
 * import { createWalletClient } from "@selfx402/framework/wallets";
 *
 * const facilitator = new Facilitator({
 *   network: networks.celo,
 *   wallet: createWalletClient({
 *     privateKey: process.env.PRIVATE_KEY,
 *     network: networks.celo,
 *   }),
 * });
 * ```
 */

// Core exports
export { Facilitator } from "./core/facilitator.js";
export type {
  PaymentEnvelope,
  VerificationResult,
  SettlementResult,
  FacilitatorConfig,
} from "./core/types.js";

// Network exports
export { networks, getNetworkConfig, CELO_MAINNET, CELO_SEPOLIA } from "./networks/index.js";
export type { NetworkConfig } from "./networks/types.js";

// Wallet exports
export { createWalletClient } from "./wallets/index.js";
export type { WalletConfig, WalletClient } from "./wallets/types.js";

// Self Protocol exports
export { SelfVerifier, DatabaseService } from "./self/index.js";
export type { SelfRequirements, SelfVerificationResult, DatabaseConfig } from "./self/types.js";

// Deferred payment exports (x402 PR #426 - Option A)
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
  validateVoucher,
  validateDeferredEnvelope,
  canAggregateVouchers,
  calculateAggregatedAmount,
  isSettlementViable,
  getSettlementCandidates,
  VoucherDatabaseService,
} from "./deferred/index.js";

export type {
  PaymentVoucher,
  DeferredPaymentEnvelope,
  VoucherRecord,
  SettlementRecord,
  VoucherVerificationResult,
  AccumulatedBalance,
  SettlementRequest,
  SettlementResult as DeferredSettlementResult,
  VoucherValidationResult,
} from "./deferred/index.js";

// Version
export const VERSION = "1.0.0";
