/**
 * Network configurations for Celo networks
 *
 * IMPORTANT: Only networks with EIP-3009 USDC support are included
 * Celo Mainnet: ✅ EIP-3009 confirmed and tested
 * Celo Sepolia: ✅ EIP-3009 confirmed (testnet)
 */

import type { NetworkConfig } from "./types.js";

export const CELO_MAINNET: NetworkConfig = {
  chainId: 42220,
  name: "celo",
  usdcAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  usdcName: "USDC",
  rpcUrl: "https://forno.celo.org",
  blockExplorer: "https://celoscan.io",
  isTestnet: false,
};

export const CELO_SEPOLIA: NetworkConfig = {
  chainId: 11142220,
  name: "celo-sepolia",
  usdcAddress: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
  usdcName: "USDC",
  rpcUrl: "https://celo-sepolia.g.alchemy.com/v2/demo",
  blockExplorer: "https://celo-sepolia.blockscout.com",
  isTestnet: true,
};

/**
 * Network registry - map network names to configurations
 */
export const networks: Record<string, NetworkConfig> = {
  celo: CELO_MAINNET,
  "celo-mainnet": CELO_MAINNET,
  "celo-sepolia": CELO_SEPOLIA,
  "celo-testnet": CELO_SEPOLIA,
};
