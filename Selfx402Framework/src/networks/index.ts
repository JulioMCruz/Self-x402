/**
 * @selfx402/framework/networks
 *
 * Network configurations and utilities for x402 facilitator
 * Supports Celo Mainnet and Celo Sepolia testnet
 */

export * from "./types.js";
export * from "./configs.js";
export * from "./chains.js";
export * from "./utils.js";

// Re-export commonly used items
export { CELO_MAINNET, CELO_SEPOLIA, networks } from "./configs.js";
export { celo, celoSepolia, getViemChain } from "./chains.js";
export { getNetworkConfig, isSupportedNetwork, getSupportedNetworks } from "./utils.js";
