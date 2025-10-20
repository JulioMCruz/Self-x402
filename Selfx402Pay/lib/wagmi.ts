import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Self x402 Pay',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [celo],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
