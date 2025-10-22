/**
 * EIP-712 voucher signing and verification utilities
 * Follows x402 deferred payment scheme specification
 */

import {
  type TypedDataDomain,
  type Hex,
  recoverTypedDataAddress,
  keccak256,
  toHex,
} from "viem";
import type { PaymentVoucher, VoucherVerificationResult } from "./types.js";

/**
 * EIP-712 domain for payment vouchers
 * Separate from USDC domain to allow flexibility
 */
export function createVoucherDomain(
  chainId: number,
  verifyingContract: `0x${string}`
): TypedDataDomain {
  return {
    name: "Selfx402 Deferred Payment",
    version: "1",
    chainId,
    verifyingContract,
  };
}

/**
 * EIP-712 typed data structure for payment vouchers
 */
export const voucherTypes = {
  PaymentVoucher: [
    { name: "payer", type: "address" },
    { name: "payee", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "bytes32" },
    { name: "validUntil", type: "uint256" },
  ],
} as const;

/**
 * Generate a unique nonce for voucher
 * Uses timestamp + random value to ensure uniqueness
 */
export function generateNonce(): Hex {
  const timestamp = Date.now().toString();
  const random = Math.random().toString();
  return keccak256(toHex(timestamp + random));
}

/**
 * Create a payment voucher (unsigned)
 */
export function createVoucher(params: {
  payer: `0x${string}`;
  payee: `0x${string}`;
  amount: bigint;
  validityDuration?: number; // seconds (default: 1 hour)
}): PaymentVoucher {
  const { payer, payee, amount, validityDuration = 3600 } = params;

  return {
    payer,
    payee,
    amount,
    nonce: generateNonce(),
    validUntil: Math.floor(Date.now() / 1000) + validityDuration,
  };
}

/**
 * Sign a payment voucher using EIP-712
 * This should be called on the client side with user's wallet
 *
 * @param voucher - Unsigned payment voucher
 * @param domain - EIP-712 domain
 * @param signTypedData - Wallet signing function (from wagmi/viem)
 * @returns Signature hex string
 */
export async function signVoucher(
  voucher: PaymentVoucher,
  domain: TypedDataDomain,
  signTypedData: (args: {
    domain: TypedDataDomain;
    types: typeof voucherTypes;
    primaryType: "PaymentVoucher";
    message: PaymentVoucher;
  }) => Promise<Hex>
): Promise<Hex> {
  return await signTypedData({
    domain,
    types: voucherTypes,
    primaryType: "PaymentVoucher",
    message: voucher,
  });
}

/**
 * Verify a signed voucher (server-side)
 * Checks signature validity and expiration
 *
 * @param voucher - Payment voucher
 * @param signature - EIP-712 signature
 * @param domain - EIP-712 domain
 * @returns Verification result
 */
export async function verifyVoucher(
  voucher: PaymentVoucher,
  signature: Hex,
  domain: TypedDataDomain
): Promise<VoucherVerificationResult> {
  try {
    // Recover signer address from signature
    // Note: viem expects validUntil as bigint for EIP-712 signing
    const signer = await recoverTypedDataAddress({
      domain,
      types: voucherTypes,
      primaryType: "PaymentVoucher",
      message: {
        ...voucher,
        validUntil: BigInt(voucher.validUntil),
      },
      signature,
    });

    // Verify signer matches payer
    if (signer.toLowerCase() !== voucher.payer.toLowerCase()) {
      return {
        valid: false,
        error: "Signature does not match payer address",
        signer,
      };
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (voucher.validUntil < now) {
      return {
        valid: false,
        error: "Voucher has expired",
        signer,
        expired: true,
      };
    }

    return {
      valid: true,
      signer,
      expired: false,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calculate total amount from multiple vouchers
 */
export function aggregateVouchers(vouchers: PaymentVoucher[]): bigint {
  return vouchers.reduce((total, voucher) => total + voucher.amount, BigInt(0));
}

/**
 * Filter expired vouchers
 */
export function filterExpiredVouchers(
  vouchers: PaymentVoucher[]
): PaymentVoucher[] {
  const now = Math.floor(Date.now() / 1000);
  return vouchers.filter((v) => v.validUntil >= now);
}

/**
 * Sort vouchers by amount (for priority settlement)
 */
export function sortVouchersByAmount(
  vouchers: PaymentVoucher[],
  descending = true
): PaymentVoucher[] {
  return [...vouchers].sort((a, b) => {
    const diff = a.amount - b.amount;
    return descending ? (diff > 0 ? -1 : 1) : diff > 0 ? 1 : -1;
  });
}
