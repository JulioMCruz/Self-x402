/**
 * Core x402 facilitator types following x402 protocol standard
 */

import type { Address } from "viem";
import type { NetworkConfig } from "../networks/types.js";
import type { WalletClient } from "../wallets/types.js";
import type { SelfVerifier } from "../self/verifier.js";

/**
 * x402 payment envelope (EIP-712 + signature)
 * Follows x402 protocol standard
 */
export interface PaymentEnvelope {
  network: string;
  authorization: {
    from: Address;
    to: Address;
    value: string; // USDC smallest unit (6 decimals)
    validAfter: number;
    validBefore: number;
    nonce: `0x${string}`;
  };
  signature: `0x${string}`;
}

/**
 * Payment verification result
 */
export interface VerificationResult {
  valid: boolean;
  recoveredAddress?: Address;
  error?: string;
}

/**
 * Payment settlement result (on-chain)
 */
export interface SettlementResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  blockNumber?: bigint;
  explorerUrl?: string;
  error?: string;
}

/**
 * Facilitator configuration
 */
export interface FacilitatorConfig {
  /** Network configuration */
  network: NetworkConfig | string;

  /** Wallet client for signing transactions */
  wallet: WalletClient;

  /** Optional Self Protocol verifier */
  selfVerifier?: SelfVerifier;

  /** Enable Self Protocol integration */
  enableSelfProtocol?: boolean;
}

/**
 * Supported payment schemes (x402 standard)
 */
export interface SupportedPaymentScheme {
  kind: "eip3009";
  network: string;
  chainId: number;
  token: Address;
  tokenName: string;
}
