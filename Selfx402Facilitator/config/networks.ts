import { type Address } from "viem";

export interface NetworkConfig {
  chainId: number;
  name: string;
  usdcAddress: Address;
  usdcName: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const CELO_MAINNET: NetworkConfig = {
  chainId: 42220,
  name: "celo",
  usdcAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  usdcName: "USDC", // CRITICAL: Must match USDC contract's EIP-712 domain name
  rpcUrl: "https://forno.celo.org",
  blockExplorer: "https://celoscan.io",
  isTestnet: false,
};

export const CELO_SEPOLIA: NetworkConfig = {
  chainId: 11142220,
  name: "celo-sepolia",
  usdcAddress: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
  usdcName: "USDC", // CRITICAL: Must match USDC contract's EIP-712 domain name
  rpcUrl: "https://celo-sepolia.g.alchemy.com",
  blockExplorer: "https://celo-sepolia.blockscout.com",
  isTestnet: true,
};

export const SUPPORTED_NETWORKS = {
  [CELO_MAINNET.chainId]: CELO_MAINNET,
  [CELO_SEPOLIA.chainId]: CELO_SEPOLIA,
} as const;

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
}

export function isSupportedNetwork(chainId: number): boolean {
  return chainId in SUPPORTED_NETWORKS;
}
