/**
 * Wallet client creation and management
 * Uses viem for Ethereum wallet operations
 */

import {
  createWalletClient as viemCreateWalletClient,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getViemChain } from "../networks/chains.js";
import type { WalletConfig, WalletClient } from "./types.js";

/**
 * Create a viem wallet client for x402 payment signing
 *
 * @param config - Wallet configuration with private key and network
 * @returns Wallet client with public actions (read + write)
 *
 * @example
 * ```typescript
 * import { createWalletClient } from "@selfx402/framework/wallets";
 * import { networks } from "@selfx402/framework/networks";
 *
 * const wallet = createWalletClient({
 *   privateKey: process.env.PRIVATE_KEY as `0x${string}`,
 *   network: networks.celo,
 * });
 * ```
 */
export function createWalletClient(config: WalletConfig): WalletClient {
  // Validate private key format
  if (!config.privateKey.startsWith("0x")) {
    throw new Error("Private key must start with 0x");
  }

  if (config.privateKey.length !== 66) {
    throw new Error("Private key must be 32 bytes (64 hex characters + 0x)");
  }

  // Create account from private key
  const account = privateKeyToAccount(config.privateKey);

  // Get viem chain definition
  const chain = getViemChain(config.network.chainId);

  // Use custom RPC URL if provided, otherwise use network default
  const rpcUrl = config.rpcUrl || config.network.rpcUrl;

  // Create wallet client with public actions (read + write capabilities)
  const client = viemCreateWalletClient({
    account,
    chain,
    transport: http(rpcUrl, {
      batch: true, // Enable batch requests for efficiency
      retryCount: 3, // Retry failed requests up to 3 times
      retryDelay: 1000, // 1 second between retries
    }),
  }).extend(publicActions); // Add read methods (getBlock, getBalance, etc.)

  return client as WalletClient;
}

/**
 * Validate wallet configuration before creating client
 *
 * @param config - Wallet configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateWalletConfig(config: Partial<WalletConfig>): void {
  if (!config.privateKey) {
    throw new Error("Missing required field: privateKey");
  }

  if (!config.network) {
    throw new Error("Missing required field: network");
  }

  if (!config.privateKey.startsWith("0x")) {
    throw new Error("Private key must start with 0x");
  }

  if (config.privateKey.length !== 66) {
    throw new Error("Private key must be 32 bytes (64 hex characters + 0x)");
  }

  if (config.rpcUrl && !config.rpcUrl.startsWith("http")) {
    throw new Error("RPC URL must start with http:// or https://");
  }
}
