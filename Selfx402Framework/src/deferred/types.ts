/**
 * Deferred payment scheme types
 * Based on x402 PR #426: https://github.com/coinbase/x402/pull/426
 *
 * Enables trust-minimized micro-payments through off-chain vouchers
 * that can be aggregated and settled in batches.
 */

export interface PaymentVoucher {
  /** Address paying the voucher */
  payer: `0x${string}`

  /** Address receiving the voucher */
  payee: `0x${string}`

  /** Payment amount in smallest token unit (e.g., USDC has 6 decimals) */
  amount: bigint

  /** Unique nonce to prevent replay attacks */
  nonce: `0x${string}`

  /** Unix timestamp (seconds) when voucher expires */
  validUntil: number

  /** Optional: EIP-712 signature (added after signing) */
  signature?: `0x${string}`
}

export interface DeferredPaymentEnvelope {
  /** Payment scheme identifier */
  scheme: 'deferred'

  /** Network identifier (e.g., 'celo', 'celo-sepolia') */
  network: string

  /** Signed payment voucher */
  voucher: PaymentVoucher

  /** EIP-712 signature of the voucher */
  signature: `0x${string}`
}

export interface VoucherRecord {
  /** Database record ID */
  id?: string

  /** Voucher payer address */
  payer_address: string

  /** Voucher payee address */
  payee_address: string

  /** Payment amount (as string for database storage) */
  amount: string

  /** Unique nonce */
  nonce: string

  /** EIP-712 signature */
  signature: string

  /** Expiration timestamp */
  valid_until: string // ISO 8601 timestamp

  /** Whether voucher has been settled on-chain */
  settled: boolean

  /** Network identifier */
  network: string

  /** Payment scheme: "deferred" for off-chain vouchers, "exact" for immediate settlement */
  scheme?: string // Optional for backward compatibility, defaults to "deferred"

  /** Creation timestamp */
  created_at?: string
}

export interface SettlementRecord {
  /** Database record ID */
  id?: string

  /** On-chain transaction hash */
  tx_hash: string

  /** Payee address (recipient of settlement) */
  payee_address: string

  /** Payer address (source of funds) */
  payer_address: string

  /** Total amount settled */
  total_amount: string

  /** Number of vouchers in this settlement */
  voucher_count: number

  /** Network identifier */
  network: string

  /** Payment scheme: "deferred" for voucher aggregation, "exact" for immediate settlement */
  scheme?: string // Optional for backward compatibility, defaults to "deferred"

  /** Settlement timestamp */
  settled_at?: string

  /** List of voucher IDs included in this settlement */
  voucher_ids?: string[]
}

export interface VoucherVerificationResult {
  /** Whether voucher signature is valid */
  valid: boolean

  /** Error message if invalid */
  error?: string

  /** Recovered signer address (should match payer) */
  signer?: `0x${string}`

  /** Whether voucher has expired */
  expired?: boolean

  /** Whether voucher was already used */
  duplicate?: boolean
}

export interface AccumulatedBalance {
  /** Payee address */
  payee: `0x${string}`

  /** Payer address */
  payer: `0x${string}`

  /** Total accumulated amount from pending vouchers */
  totalAmount: bigint

  /** Number of pending vouchers */
  voucherCount: number

  /** List of voucher IDs */
  voucherIds: string[]
}

export interface SettlementRequest {
  /** Payee address requesting settlement */
  payee: `0x${string}`

  /** Optional: specific payer to settle (defaults to all payers) */
  payer?: `0x${string}`

  /** Optional: minimum amount threshold for settlement */
  minAmount?: bigint

  /** Network to settle on */
  network: string
}

export interface SettlementResult {
  /** Whether settlement was successful */
  success: boolean

  /** On-chain transaction hash */
  txHash?: string

  /** Total amount settled */
  totalAmount: bigint

  /** Number of vouchers settled */
  voucherCount: number

  /** Error message if failed */
  error?: string

  /** Gas cost in native token (e.g., CELO) */
  gasCost?: bigint
}
