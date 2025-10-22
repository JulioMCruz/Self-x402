/**
 * Network configuration types for x402 facilitator
 * Follows x402 protocol standard for multi-network support
 */

import type { Address } from "viem";

export interface NetworkConfig {
  /** Chain ID (e.g., 42220 for Celo Mainnet) */
  chainId: number;

  /** Network name (e.g., "celo", "celo-sepolia") */
  name: string;

  /** USDC contract address (must support EIP-3009) */
  usdcAddress: Address;

  /** USDC token name (e.g., "USDC") */
  usdcName: string;

  /** RPC endpoint URL */
  rpcUrl: string;

  /** Block explorer base URL */
  blockExplorer: string;

  /** Whether this is a testnet */
  isTestnet: boolean;
}

export type SupportedNetwork = "celo" | "celo-sepolia";
