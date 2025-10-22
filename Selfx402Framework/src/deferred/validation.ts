/**
 * Voucher validation utilities
 * Business logic validation beyond signature verification
 */

import type {
  PaymentVoucher,
  DeferredPaymentEnvelope,
  VoucherRecord,
} from "./types.js";

export interface VoucherValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate voucher business rules
 * Checks amount, addresses, expiration, etc.
 */
export function validateVoucher(
  voucher: PaymentVoucher
): VoucherValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check amount is positive
  if (voucher.amount <= BigInt(0)) {
    errors.push("Amount must be greater than zero");
  }

  // Check amount is reasonable (< $1000 for micro-payments)
  // USDC has 6 decimals, so 1000 * 10^6 = 1,000,000,000
  if (voucher.amount > BigInt(1_000_000_000)) {
    warnings.push(
      "Amount exceeds $1000 - consider using immediate settlement instead"
    );
  }

  // Check payer and payee are different
  if (voucher.payer.toLowerCase() === voucher.payee.toLowerCase()) {
    errors.push("Payer and payee cannot be the same address");
  }

  // Check addresses are valid (basic check - should be checksummed)
  if (!voucher.payer.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push("Invalid payer address format");
  }
  if (!voucher.payee.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push("Invalid payee address format");
  }

  // Check nonce format (32 bytes)
  if (!voucher.nonce.match(/^0x[a-fA-F0-9]{64}$/)) {
    errors.push("Invalid nonce format (must be 32 bytes)");
  }

  // Check expiration is in the future
  const now = Math.floor(Date.now() / 1000);
  if (voucher.validUntil <= now) {
    errors.push("Voucher has already expired");
  }

  // Warn if expiration is too far in the future (> 7 days)
  const maxValidityDays = 7;
  const maxValiditySeconds = maxValidityDays * 24 * 60 * 60;
  if (voucher.validUntil > now + maxValiditySeconds) {
    warnings.push(`Expiration is more than ${maxValidityDays} days in future`);
  }

  // Warn if expiration is very soon (< 5 minutes)
  const minValidityMinutes = 5;
  const minValiditySeconds = minValidityMinutes * 60;
  if (voucher.validUntil < now + minValiditySeconds) {
    warnings.push(
      `Voucher expires in less than ${minValidityMinutes} minutes`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate deferred payment envelope
 */
export function validateDeferredEnvelope(
  envelope: DeferredPaymentEnvelope
): VoucherValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check scheme
  if (envelope.scheme !== "deferred") {
    errors.push('Invalid scheme - must be "deferred"');
  }

  // Check network
  const supportedNetworks = ["celo", "celo-sepolia"];
  if (!supportedNetworks.includes(envelope.network)) {
    errors.push(
      `Unsupported network: ${envelope.network}. Supported: ${supportedNetworks.join(", ")}`
    );
  }

  // Check signature format
  if (!envelope.signature.match(/^0x[a-fA-F0-9]{130}$/)) {
    errors.push("Invalid signature format (must be 65 bytes)");
  }

  // Validate voucher
  const voucherValidation = validateVoucher(envelope.voucher);
  errors.push(...voucherValidation.errors);
  warnings.push(...voucherValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if vouchers can be aggregated
 * All vouchers must be from same payer to same payee on same network
 */
export function canAggregateVouchers(
  vouchers: VoucherRecord[]
): VoucherValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (vouchers.length === 0) {
    errors.push("No vouchers to aggregate");
    return { valid: false, errors, warnings };
  }

  if (vouchers.length === 1) {
    warnings.push("Only one voucher - aggregation not necessary");
  }

  // Check all have same payer
  const payers = new Set(vouchers.map((v) => v.payer_address.toLowerCase()));
  if (payers.size > 1) {
    errors.push("Cannot aggregate vouchers from different payers");
  }

  // Check all have same payee
  const payees = new Set(vouchers.map((v) => v.payee_address.toLowerCase()));
  if (payees.size > 1) {
    errors.push("Cannot aggregate vouchers to different payees");
  }

  // Check all on same network
  const networks = new Set(vouchers.map((v) => v.network));
  if (networks.size > 1) {
    errors.push("Cannot aggregate vouchers from different networks");
  }

  // Check none are already settled
  const alreadySettled = vouchers.filter((v) => v.settled);
  if (alreadySettled.length > 0) {
    errors.push(
      `${alreadySettled.length} voucher(s) already settled - cannot re-settle`
    );
  }

  // Check for duplicates (same nonce)
  const nonces = vouchers.map((v) => v.nonce);
  const uniqueNonces = new Set(nonces);
  if (nonces.length !== uniqueNonces.size) {
    errors.push("Duplicate vouchers detected (same nonce)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate aggregated amount from voucher records
 */
export function calculateAggregatedAmount(vouchers: VoucherRecord[]): bigint {
  return vouchers.reduce(
    (total, voucher) => total + BigInt(voucher.amount),
    BigInt(0)
  );
}

/**
 * Check if settlement is economically viable
 * Settlement should only occur when aggregated value > gas cost
 */
export function isSettlementViable(
  totalAmount: bigint,
  estimatedGasCost: bigint,
  minProfitRatio = 2 // Total amount should be at least 2x gas cost
): VoucherValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (totalAmount <= BigInt(0)) {
    errors.push("Total amount must be greater than zero");
  }

  if (estimatedGasCost <= BigInt(0)) {
    errors.push("Gas cost estimate required");
  }

  if (totalAmount <= estimatedGasCost) {
    errors.push(
      `Settlement not viable: total amount (${totalAmount}) <= gas cost (${estimatedGasCost})`
    );
  }

  const profitRatio = Number(totalAmount) / Number(estimatedGasCost);
  if (profitRatio < minProfitRatio) {
    warnings.push(
      `Low profit ratio: ${profitRatio.toFixed(
        2
      )}x (recommended: ${minProfitRatio}x)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get vouchers that should be settled (heuristic)
 * Returns vouchers meeting minimum thresholds
 */
export function getSettlementCandidates(
  vouchers: VoucherRecord[],
  minAmount: bigint = BigInt(10_000_000), // $10 in USDC (6 decimals)
  minVoucherCount = 5
): {
  shouldSettle: boolean;
  candidates: VoucherRecord[];
  reason: string;
} {
  const unsettled = vouchers.filter((v) => !v.settled);
  const totalAmount = calculateAggregatedAmount(unsettled);

  if (unsettled.length === 0) {
    return {
      shouldSettle: false,
      candidates: [],
      reason: "No unsettled vouchers",
    };
  }

  if (totalAmount >= minAmount) {
    return {
      shouldSettle: true,
      candidates: unsettled,
      reason: `Total amount (${totalAmount}) exceeds threshold (${minAmount})`,
    };
  }

  if (unsettled.length >= minVoucherCount) {
    return {
      shouldSettle: true,
      candidates: unsettled,
      reason: `Voucher count (${unsettled.length}) exceeds threshold (${minVoucherCount})`,
    };
  }

  return {
    shouldSettle: false,
    candidates: unsettled,
    reason: `Not enough value ($${Number(totalAmount) / 1_000_000}) or count (${unsettled.length}) to settle`,
  };
}
