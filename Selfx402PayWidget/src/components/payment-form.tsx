"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { QrCode, Loader2, Wallet } from "lucide-react"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  getUniversalLink,
  type SelfApp,
} from "@selfxyz/qrcode"
import { toast } from "sonner"
import { PaymentSuccess } from "./payment-success"
import { parseUnits, type TypedDataDomain, toHex, keccak256, getAddress } from 'viem'
import { DEFAULT_LOGO_URL } from '../constants'
import type { WagmiConfig } from '../types/wagmi'

// USDC contract on Celo
const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C'

// Types for x402 service discovery
interface X402ServiceDiscovery {
  payTo: string
  service?: string
  payment: {
    protocol: string
    price: string
    network: string
    gasless: boolean
    facilitator: string
  }
  verification?: {
    required: boolean
    protocol: string
    price: string
    description?: string
    requirements?: {
      minimumAge?: number
      excludedCountries?: string[]
      ofac?: boolean
      name?: boolean
      issuing_state?: boolean
      nationality?: boolean
      date_of_birth?: boolean
      passport_number?: boolean
      gender?: boolean
      expiry_date?: boolean
    }
  }
  routes?: Record<string, {
    price: string
    network: string
    description: string
  }>
}

export interface PaymentFormProps {
  vendorUrl?: string
  apiEndpoint?: string
  requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' // HTTP method for API request (default: GET)
  queryParams?: Record<string, string | number | boolean> // Query parameters to append to URL
  requestBody?: Record<string, any> // Request body for POST/PUT/DELETE requests
  showDeepLink?: boolean | 'both' | 'hide' // false = QR only, true = deep link only, 'both' = show both, 'hide' = QR hidden (in DOM) + deep link buttons
  onPaymentSuccess?: (data: { txHash: string; amount: string; recipient: string; payTo: string; apiResponse?: any }) => void
  onPaymentFailure?: (error: Error) => void
  logoUrl?: string // Optional custom logo URL
  buttonText?: string // Optional custom button text (default: "Sign Payment")
  successCallbackDelay?: number // Delay in milliseconds before calling onPaymentSuccess (default: 2000ms to show animation)
  wagmiConfig: WagmiConfig // Wagmi configuration from parent app (required)
}

// EIP-712 domain for USDC transferWithAuthorization
// Note: chainId will be set dynamically from wagmiConfig

// EIP-712 types for transferWithAuthorization
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

export function PaymentForm({
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
}: PaymentFormProps) {
  const defaultVendorUrl = vendorUrl || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VENDOR_API_URL : undefined) || "http://localhost:3000"
  const defaultApiEndpoint = apiEndpoint || "/api/demo"

  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
  const [amount, setAmount] = useState("0.001")
  const [recipient, setRecipient] = useState("Acme Corporation")
  const [description, setDescription] = useState("Premium subscription service")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [serviceDiscovery, setServiceDiscovery] = useState<X402ServiceDiscovery | null>(null)
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false)
  const [currentVendorUrl] = useState(defaultVendorUrl)

  // Destructure Wagmi config from props
  const { address: walletAddress, isConnected, chainId, signTypedDataAsync } = wagmiConfig

  const excludedCountries = useMemo(() => [], [])

  // Fetch x402 service discovery
  const fetchServiceDiscovery = async (url: string) => {
    setIsLoadingDiscovery(true)
    try {
      const discoveryUrl = `${url}/.well-known/x402`
      const response = await fetch(discoveryUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch service discovery: ${response.statusText}`)
      }

      const data: X402ServiceDiscovery = await response.json()
      setServiceDiscovery(data)

      if (data.payTo) setAddress(data.payTo)
      if (data.payment?.price) setAmount(data.payment.price.replace('$', ''))
      if (data.service) setRecipient(data.service)
      if (data.routes) {
        const firstRoute = Object.values(data.routes)[0]
        if (firstRoute?.description) setDescription(firstRoute.description)
      }

      toast.success("Service information loaded!")
    } catch (error) {
      console.error("[Discovery] Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load service information")
    } finally {
      setIsLoadingDiscovery(false)
    }
  }

  useEffect(() => {
    fetchServiceDiscovery(currentVendorUrl)
  }, [currentVendorUrl])

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
        userDefinedData: currentVendorUrl,
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
  }, [excludedCountries, address, walletAddress, currentVendorUrl, logoUrl])

  const handleVerificationSuccess = async () => {
    setIsVerified(true)
    toast.success("Identity verified!")
  }

  const handleSign = async () => {
    if (!isVerified) {
      toast.error("Please verify your identity first")
      return
    }

    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet")
      return
    }

    if (chainId !== 42220) { // Celo mainnet
      toast.error("Please switch to Celo network")
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

      toast.info("Please sign the payment authorization...")
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
      const baseUrl = `${currentVendorUrl}${defaultApiEndpoint}`
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
            recipient,
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
      />
    )
  }

  return (
    <Card className="w-full max-w-6xl bg-card border-2 border-border rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-6 lg:min-h-[600px]">
        {/* Left Section */}
        <div className="p-8 lg:p-12 space-y-8 lg:border-r border-border">
          <div className="space-y-2 flex justify-center">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-24 mb-4" />}
          </div>

          <div className="space-y-6">
            {serviceDiscovery?.verification?.requirements && (
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <Label className="text-sm font-semibold">Required Disclosures</Label>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {serviceDiscovery.verification.requirements.minimumAge && (
                    <div>✓ Minimum age: {serviceDiscovery.verification.requirements.minimumAge}+</div>
                  )}
                  {serviceDiscovery.verification.requirements.ofac && (
                    <div>✓ OFAC compliance</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm">Seller</Label>
              <div className="bg-background border-2 rounded-lg px-4 py-3">
                <p className="font-mono">{recipient}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Service</Label>
              <div className="bg-background border-2 rounded-lg px-4 py-3">
                <p className="text-sm">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-8 lg:p-12 bg-muted/30 flex flex-col justify-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  isVerified ? 'bg-green-500 text-white' : 'bg-accent text-accent-foreground'
                }`}>
                  {isVerified ? '✓' : '1'}
                </div>
                <h2 className="text-xl font-semibold">
                  {isVerified ? 'Verified ✓' : 'Scan QR to verify'}
                </h2>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <div className={showDeepLink === 'hide' ? 'hidden' : ''}>
                  {(showDeepLink === false || showDeepLink === 'both' || showDeepLink === 'hide') && (
                    selfApp ? (
                      <div className="bg-background border-2 rounded-3xl p-4">
                        <SelfQRcodeWrapper
                          selfApp={selfApp}
                          onSuccess={handleVerificationSuccess}
                          onError={() => toast.error("Verification failed")}
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-background border-2 rounded-3xl flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-muted-foreground animate-pulse" />
                      </div>
                    )
                  )}
                </div>

                {(showDeepLink === true || showDeepLink === 'both' || showDeepLink === 'hide') && (
                  <div className="w-full space-y-3">
                    <Button
                      onClick={() => universalLink && window.open(universalLink, "_blank")}
                      disabled={!universalLink}
                      size="lg"
                      className="w-full h-14 text-lg"
                    >
                      Open Self App
                    </Button>
                    <Button
                      onClick={() => {
                        if (universalLink) {
                          navigator.clipboard.writeText(universalLink)
                          toast.success("Link copied!")
                        }
                      }}
                      disabled={!universalLink}
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                    >
                      Copy Universal Link
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-semibold">Sign the payment</h2>
              </div>

              <Button
                onClick={handleSign}
                disabled={!isVerified || !isConnected || isProcessing}
                size="lg"
                className="w-full h-14 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    {buttonText}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-2 mt-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold">${amount} USDC</span>
            </div>
            {isConnected && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono">
                  {chainId === 42220 ? '✓ Celo' : '⚠️ Wrong network'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
