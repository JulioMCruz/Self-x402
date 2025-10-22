/**
 * Network utility functions
 */

import type { NetworkConfig } from "./types.js";
import { networks } from "./configs.js";

/**
 * Get network configuration by name
 * @throws Error if network is not supported
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = networks[networkName.toLowerCase()];

  if (!config) {
    const supported = Object.keys(networks).join(", ");
    throw new Error(
      `Unsupported network: ${networkName}. Supported networks: ${supported}`
    );
  }

  return config;
}

/**
 * Check if network is supported
 */
export function isSupportedNetwork(networkName: string): boolean {
  return networkName.toLowerCase() in networks;
}

/**
 * Get all supported network names
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(networks);
}

/**
 * Validate network configuration
 * Ensures all required fields are present and valid
 */
export function validateNetworkConfig(config: Partial<NetworkConfig>): boolean {
  const required: (keyof NetworkConfig)[] = [
    "chainId",
    "name",
    "usdcAddress",
    "usdcName",
    "rpcUrl",
    "blockExplorer",
  ];

  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof config.chainId !== "number" || config.chainId <= 0) {
    throw new Error("Invalid chainId: must be positive number");
  }

  if (!config.usdcAddress?.startsWith("0x")) {
    throw new Error("Invalid usdcAddress: must be hex string");
  }

  if (!config.rpcUrl?.startsWith("http")) {
    throw new Error("Invalid rpcUrl: must be HTTP(S) URL");
  }

  return true;
}
