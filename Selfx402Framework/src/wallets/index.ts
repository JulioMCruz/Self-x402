/**
 * @selfx402/framework/wallets
 *
 * Wallet client creation and management for x402 payments
 * Uses viem for Ethereum wallet operations
 */

export * from "./types.js";
export * from "./wallet-client.js";

// Re-export commonly used items
export { createWalletClient, validateWalletConfig } from "./wallet-client.js";
export type { WalletConfig, WalletClient } from "./types.js";
