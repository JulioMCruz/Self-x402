/**
 * Wagmi configuration types for dependency injection
 * Allows parent app to control Wagmi instance and avoid provider conflicts
 */

import type { Config } from 'wagmi'

export interface WagmiConfig {
  /** Wagmi config instance from parent app */
  config: Config

  /** Connected wallet address */
  address?: `0x${string}`

  /** Whether wallet is connected */
  isConnected: boolean

  /** Current chain ID */
  chainId?: number

  /** Sign typed data function */
  signTypedDataAsync: (args: {
    domain: any
    types: any
    primaryType: string
    message: any
  }) => Promise<`0x${string}`>

  /** Read contract function (for USDC balance) */
  readContract?: (args: {
    address: `0x${string}`
    abi: any
    functionName: string
    args?: any[]
  }) => Promise<any>
}
