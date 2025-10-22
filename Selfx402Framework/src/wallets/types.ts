/**
 * Wallet configuration types
 */

import type { WalletClient as ViemWalletClient } from "viem";
import type { NetworkConfig } from "../networks/types.js";

export interface WalletConfig {
  /** Private key for wallet (must start with 0x) */
  privateKey: `0x${string}`;

  /** Network configuration */
  network: NetworkConfig;

  /** Optional custom RPC URL (overrides network default) */
  rpcUrl?: string;
}

/** Extended viem wallet client with public actions */
export type WalletClient = ViemWalletClient;
