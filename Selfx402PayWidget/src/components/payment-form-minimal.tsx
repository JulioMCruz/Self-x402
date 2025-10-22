"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "./ui/button"
import { QrCode, Wallet, Loader2 } from "lucide-react"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  getUniversalLink,
  type SelfApp,
} from "@selfxyz/qrcode"
import { toast } from "sonner"
import { parseUnits, formatUnits, type TypedDataDomain, toHex, keccak256, getAddress } from 'viem'
import { PaymentSuccess } from "./payment-success"
import { DEFAULT_LOGO_URL } from '../constants'
import type { WagmiConfig } from '../types/wagmi'

const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as const

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const

// EIP-712 domain will be created dynamically using chainId from wagmiConfig

const types = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
}

export interface PaymentFormMinimalProps {
  vendorUrl?: string
  apiEndpoint?: string
  requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' // HTTP method for API request (default: GET)
  queryParams?: Record<string, string | number | boolean> // Query parameters to append to URL
  requestBody?: Record<string, any> // Request body for POST/PUT/DELETE requests
  showDeepLink?: boolean | 'both' | 'hide'
  onPaymentSuccess?: (data: { txHash: string; amount: string; payTo: string; apiResponse?: any }) => void
  onPaymentFailure?: (error: Error) => void
  logoUrl?: string
  buttonText?: string // Optional custom button text (default: "Sign Payment")
  successCallbackDelay?: number // Delay in milliseconds before calling onPaymentSuccess (default: 2000ms to show animation)
  wagmiConfig: WagmiConfig // Wagmi configuration from parent app (required)
}

export function PaymentFormMinimal({
  vendorUrl,
  apiEndpoint,
  requestMethod = 'GET',
  queryParams,
  requestBody,
  showDeepLink = false,
  onPaymentSuccess,
  onPaymentFailure,
  logoUrl = DEFAULT_LOGO_URL,
  buttonText = "Sign Payment",
  successCallbackDelay = 2000,
  wagmiConfig
}: PaymentFormMinimalProps) {
  const defaultVendorUrl = vendorUrl || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VENDOR_API_URL : undefined) || "http://localhost:3000"
  const defaultApiEndpoint = apiEndpoint || "/api/demo"

  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
  const [amount, setAmount] = useState("0.001")
  const [recipient, setRecipient] = useState("Vendor")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [apiResponse, setApiResponse] = useState<any>(null)

  // Destructure Wagmi config from props
  const { address: walletAddress, isConnected, chainId, signTypedDataAsync, readContract } = wagmiConfig

  // Read USDC balance using readContract from wagmiConfig
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  useEffect(() => {
    if (!walletAddress || !readContract) return

    setIsLoadingBalance(true)
    readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    })
      .then((balance) => setUsdcBalance(balance as bigint))
      .catch((err) => console.error('Failed to read USDC balance:', err))
      .finally(() => setIsLoadingBalance(false))
  }, [walletAddress, readContract])

  const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : '0.00'

  const excludedCountries = useMemo(() => [], [])

  useEffect(() => {
    const fetchServiceDiscovery = async () => {
      try {
        const discoveryUrl = `${defaultVendorUrl}/.well-known/x402`
        const response = await fetch(discoveryUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.payTo) setAddress(data.payTo)
          if (data.payment?.price) setAmount(data.payment.price.replace('$', ''))
          if (data.service) setRecipient(data.service)
        }
      } catch (error) {
        console.error('Failed to fetch service discovery:', error)
      }
    }
    fetchServiceDiscovery()
  }, [defaultVendorUrl])

  useEffect(() => {
    try {
      const selfEndpoint = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SELF_ENDPOINT : undefined) || "https://facilitator.selfx402.xyz/api/verify"
      const selfAppName = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SELF_APP_NAME : undefined) || "Self x402 Pay"
      const selfScope = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SELF_SCOPE : undefined) || "self-x402-facilitator"

      const app = new SelfAppBuilder({
        version: 2,
        appName: selfAppName,
        scope: selfScope,
        endpoint: selfEndpoint,
        logoBase64: logoUrl || "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: walletAddress || address,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: "Minimal payment form",
        disclosures: {
          minimumAge: 18,
          ofac: false,
          excludedCountries: [],
        }
      }).build()

      setSelfApp(app)
      setUniversalLink(getUniversalLink(app))
    } catch (error) {
      console.error("Failed to initialize Self app:", error)
    }
  }, [excludedCountries, address, walletAddress, logoUrl])

  const handleVerificationSuccess = async () => {
    setIsVerified(true)
    toast.success("Verified!")
  }

  const handleSign = async () => {
    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet")
      return
    }

    if (chainId !== 42220) { // Celo mainnet
      toast.error("Please switch to Celo network")
      return
    }

    if (!isVerified) {
      toast.error("Please verify your identity first")
      return
    }

    try {
      setIsProcessing(true)

      const amountInUSDC = parseUnits(amount, 6)
      const nonce = keccak256(toHex(Date.now().toString() + Math.random().toString())) as `0x${string}`
      const now = Math.floor(Date.now() / 1000)

      const authorization = {
        from: walletAddress,
        to: getAddress(address),
        value: amountInUSDC,
        validAfter: BigInt(0),
        validBefore: BigInt(now + 3600),
        nonce: nonce,
      }

      // Create EIP-712 domain dynamically with chainId from wagmiConfig
      const domain: TypedDataDomain = {
        name: 'USDC',
        version: '2',
        chainId,
        verifyingContract: USDC_ADDRESS as `0x${string}`,
      }

      toast.info("Please sign the payment...")
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message: authorization,
      })

      toast.info("Processing payment...")

      const paymentEnvelope = {
        network: 'celo',
        authorization: {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: Number(authorization.validAfter),
          validBefore: Number(authorization.validBefore),
          nonce: authorization.nonce,
        },
        signature,
      }

      // Build URL with query parameters
      const baseUrl = `${defaultVendorUrl}${defaultApiEndpoint}`
      const url = new URL(baseUrl)

      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      // Prepare fetch configuration
      const fetchConfig: RequestInit = {
        method: requestMethod,
        headers: {
          'X-Payment': JSON.stringify(paymentEnvelope),
          'Content-Type': 'application/json',
        },
      }

      // Add request body for POST, PUT, DELETE methods
      if (requestBody && requestMethod !== 'GET') {
        fetchConfig.body = JSON.stringify(requestBody)
      }

      const apiCallResponse = await fetch(url.toString(), fetchConfig)

      if (!apiCallResponse.ok) {
        const errorData = await apiCallResponse.json()
        throw new Error(errorData.error || errorData.message || 'API call failed')
      }

      const apiData = await apiCallResponse.json()
      setApiResponse(apiData)

      const txHashValue = (apiData as any).metadata?.settlement?.transaction ||
                         (apiData as any).settlementData?.transaction ||
                         (apiData as any).transaction || ''

      setTxHash(txHashValue)
      setPaymentComplete(true)
      toast.success("Payment completed!")

      // Delay the callback to allow user to see the success animation
      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess({
            txHash: txHashValue,
            amount,
            payTo: address,
            apiResponse: apiData
          })
        }, successCallbackDelay)
      }

    } catch (error: any) {
      if (onPaymentFailure) {
        onPaymentFailure(error)
      }

      if (error.message?.includes('User rejected')) {
        toast.error("Payment cancelled")
      } else if (error.message?.includes('insufficient funds')) {
        toast.error("Insufficient USDC balance")
      } else {
        toast.error(error.message || "Payment failed")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setPaymentComplete(false)
    setIsVerified(false)
    setIsProcessing(false)
    setTxHash("")
    setApiResponse(null)
  }

  if (paymentComplete) {
    return (
      <PaymentSuccess
        amount={amount}
        onClose={handleReset}
        txHash={txHash}
        recipient={recipient}
        payTo={address}
        apiResponse={apiResponse}
        logoUrl={logoUrl}
      />
    )
  }

  return (
    <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 space-y-6">
      {logoUrl && (
        <div className="flex justify-center">
          <img src={logoUrl} alt="Logo" className="h-24" />
        </div>
      )}

      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Pay ${amount} USDC</h2>
          <p className="text-sm text-muted-foreground">to {recipient}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isVerified ? 'bg-green-500 text-white' : 'bg-accent text-accent-foreground'
            }`}>
              {isVerified ? '✓' : '1'}
            </div>
            <span className="font-semibold">{isVerified ? 'Verified' : 'Verify Identity'}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={showDeepLink === 'hide' ? 'hidden' : ''}>
              {(showDeepLink === false || showDeepLink === 'both' || showDeepLink === 'hide') && (
                selfApp ? (
                  <div className="bg-background border-2 rounded-2xl p-3">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleVerificationSuccess}
                      onError={() => toast.error("Verification failed")}
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-background border-2 rounded-2xl flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-muted-foreground animate-pulse" />
                  </div>
                )
              )}
            </div>

            {(showDeepLink === true || showDeepLink === 'both' || showDeepLink === 'hide') && (
              <Button
                onClick={() => universalLink && window.open(universalLink, "_blank")}
                disabled={!universalLink}
                size="lg"
                className="w-full"
              >
                Open Self App
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-accent text-accent-foreground">
              2
            </div>
            <span className="font-semibold">{buttonText}</span>
          </div>

          <Button
            onClick={handleSign}
            disabled={!isVerified || !isConnected || isProcessing}
            size="lg"
            className="w-full h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Sign
              </>
            )}
          </Button>
        </div>

        <div className="pt-2 border-t space-y-1">
          <div className="text-xs text-center text-muted-foreground">
            {isConnected && chainId === 42220 ? '✓ Connected to Celo' : '⚠️ Connect wallet'}
          </div>
          {isConnected && (
            <div className="text-xs text-center text-muted-foreground">
              Balance: {isLoadingBalance ? '...' : `${formattedBalance} USDC`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
