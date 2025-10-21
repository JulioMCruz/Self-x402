"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Loader2, Wallet, RefreshCw } from "lucide-react"
import Image from "next/image"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode"
import { toast } from "sonner"
import PaymentSuccess from "./payment-success"
import { useAccount, useSignTypedData, useChainId } from 'wagmi'
import { parseUnits, type TypedDataDomain, toHex, hexToBytes, keccak256, getAddress } from 'viem'
import { celo } from 'wagmi/chains'

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

interface PaymentFormProps {
  vendorUrl?: string
  apiEndpoint?: string
  onPaymentSuccess?: (data: { txHash: string; amount: string; recipient: string; payTo: string; apiResponse?: any }) => void
  onPaymentFailure?: (error: Error) => void
}

// EIP-712 domain for USDC transferWithAuthorization
// CRITICAL: These values must match the USDC contract's EIP-712 domain on Celo
// For USDC on Celo mainnet (0xcebA9300f2b948710d2653dD7B07f33A8B32118C):
// - name: "USDC" (not "USD Coin")
// - version: "2"
const domain: TypedDataDomain = {
  name: 'USDC',
  version: '2',
  chainId: celo.id,
  verifyingContract: USDC_ADDRESS as `0x${string}`,
}

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

export default function PaymentForm({ vendorUrl, apiEndpoint, onPaymentSuccess, onPaymentFailure }: PaymentFormProps = {}) {
  const defaultVendorUrl = vendorUrl || process.env.NEXT_PUBLIC_VENDOR_API_URL || "http://localhost:3000"
  const defaultApiEndpoint = apiEndpoint || "/api/demo"

  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
  const [amount, setAmount] = useState("0.001")
  const [recipient, setRecipient] = useState("Acme Corporation")
  const [description, setDescription] = useState("Premium subscription service - Monthly billing")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [apiResponse, setApiResponse] = useState<any>(null)

  // X402 Service Discovery
  const [serviceDiscovery, setServiceDiscovery] = useState<X402ServiceDiscovery | null>(null)
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false)
  const [currentVendorUrl, setCurrentVendorUrl] = useState(defaultVendorUrl)

  const { address: walletAddress, isConnected } = useAccount()
  const chainId = useChainId()
  const { signTypedDataAsync } = useSignTypedData()

  const excludedCountries = useMemo(() => [], [])

  // Fetch x402 service discovery
  const fetchServiceDiscovery = async (url: string) => {
    setIsLoadingDiscovery(true)
    try {
      const discoveryUrl = `${url}/.well-known/x402`
      console.log("[Discovery] Fetching from:", discoveryUrl)

      const response = await fetch(discoveryUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch service discovery: ${response.statusText}`)
      }

      const data: X402ServiceDiscovery = await response.json()
      console.log("[Discovery] Received:", data)

      setServiceDiscovery(data)

      // Auto-populate form fields from discovery
      if (data.payTo) {
        setAddress(data.payTo)
      }
      if (data.payment?.price) {
        // Remove $ symbol if present
        const price = data.payment.price.replace('$', '')
        setAmount(price)
      }
      if (data.service) {
        setRecipient(data.service || "Vendor")
      }
      if (data.routes) {
        const firstRoute = Object.values(data.routes)[0]
        if (firstRoute?.description) {
          setDescription(firstRoute.description)
        }
      }

      toast.success("Service information loaded!")
    } catch (error) {
      console.error("[Discovery] Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load service information")
    } finally {
      setIsLoadingDiscovery(false)
    }
  }

  // Fetch service discovery on mount and when vendor URL changes
  useEffect(() => {
    fetchServiceDiscovery(currentVendorUrl)
  }, [currentVendorUrl])

  useEffect(() => {
    try {
      const selfEndpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://codalabs.ngrok.io/api/verify"
      const selfAppName = process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self x402 Pay"
      const selfScope = process.env.NEXT_PUBLIC_SELF_SCOPE || "self-x402-facilitator"

      const app = new SelfAppBuilder({
        version: 2,
        appName: selfAppName,
        scope: selfScope,
        endpoint: selfEndpoint,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: walletAddress || address,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: currentVendorUrl, // Pass vendor URL so facilitator can fetch /.well-known/x402
        disclosures: {
          minimumAge: 18,
          ofac: false,
          excludedCountries: [],
        }
      }).build()

      setSelfApp(app)
    } catch (error) {
      console.error("Failed to initialize Self app:", error)
    }
  }, [excludedCountries, address, recipient, walletAddress, currentVendorUrl])

  const handleVerificationSuccess = async (data?: any) => {
    console.log('Verification successful!', data)
    setIsVerified(true)
    toast.success("Identity verified! You qualify for human pricing (1000x cheaper).")
  }

  const handleSign = async () => {
    if (!isVerified) {
      toast.error("Please verify your identity first (Step 1)")
      return
    }

    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet")
      return
    }

    if (chainId !== celo.id) {
      toast.error("Please switch to Celo network")
      return
    }

    try {
      setIsProcessing(true)
      console.log("[Payment] Starting payment flow", { walletAddress, amount, address })

      // Convert amount to USDC smallest unit (6 decimals)
      const amountInUSDC = parseUnits(amount, 6)

      // Generate random nonce (32 bytes)
      const nonce = keccak256(toHex(Date.now().toString() + Math.random().toString())) as `0x${string}`

      // Create authorization valid for 1 hour
      const now = Math.floor(Date.now() / 1000)
      console.log("[Payment] Current timestamp:", now, "Date:", new Date(now * 1000).toISOString())

      const authorization = {
        from: walletAddress,
        to: getAddress(address), // Ensure proper checksum
        value: amountInUSDC,
        validAfter: BigInt(0),
        validBefore: BigInt(now + 3600), // 1 hour from now
        nonce: nonce,
      }

      console.log("[Payment] Authorization created:", {
        ...authorization,
        value: authorization.value.toString(),
        validAfter: authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        validBeforeDate: new Date((now + 3600) * 1000).toISOString()
      })

      // Sign EIP-712 typed data
      toast.info("Please sign the payment authorization in your wallet...")
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message: authorization,
      })

      console.log("[Payment] Signature obtained:", signature)

      // Call protected API endpoint with X-Payment header
      // The vendor middleware will verify and settle the payment
      toast.info("Processing payment and calling API...")
      console.log(`[Payment] Calling ${currentVendorUrl}${defaultApiEndpoint}`)

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

      const apiCallResponse = await fetch(`${currentVendorUrl}${defaultApiEndpoint}`, {
        method: 'GET',
        headers: {
          'X-Payment': JSON.stringify(paymentEnvelope),
          'Content-Type': 'application/json',
        },
      })

      if (!apiCallResponse.ok) {
        const errorData = await apiCallResponse.json()
        throw new Error(errorData.error || errorData.message || 'API call failed')
      }

      const apiData = await apiCallResponse.json()
      console.log("[Payment] API response:", apiData)
      setApiResponse(apiData)

      // Extract transaction hash from API response's settlement data
      const txHashValue = (apiData as any).metadata?.settlement?.transaction ||
                         (apiData as any).settlementData?.transaction ||
                         (apiData as any).transaction ||
                         ''

      setTxHash(txHashValue)
      setPaymentComplete(true)
      toast.success("Payment completed and data received!")

      // Call success callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess({
          txHash: txHashValue,
          amount,
          recipient,
          payTo: address,
          apiResponse: apiData
        })
      }

    } catch (error: any) {
      console.error("[Payment] Error:", error)

      // Call failure callback if provided
      if (onPaymentFailure) {
        onPaymentFailure(error)
      }

      if (error.message?.includes('User rejected')) {
        toast.error("Payment cancelled by user")
      } else if (error.message?.includes('insufficient funds')) {
        toast.error("Insufficient USDC balance")
      } else {
        toast.error(error.message || "Payment failed. Please try again.")
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

  // Show payment success screen
  if (paymentComplete) {
    return (
      <PaymentSuccess
        amount={amount}
        onReset={handleReset}
        txHash={txHash}
        recipient={recipient}
        payTo={address}
        apiResponse={apiResponse}
      />
    )
  }

  return (
    <Card className="w-full max-w-6xl bg-card border-2 border-border rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-0 lg:min-h-[600px]">
        {/* Left Section - Payment Information */}
        <div className="p-8 lg:p-12 space-y-8 lg:border-r border-border">
          <div className="space-y-2">
            <Image src="/logo.png" alt="Self x Pay" width={200} height={60} className="mb-4" />
          </div>

          <div className="space-y-6">
            {/* Vendor URL Input */}
            {/* <div className="space-y-2">
              <Label htmlFor="vendorUrl" className="text-sm font-medium text-muted-foreground">
                Vendor API URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="vendorUrl"
                  value={currentVendorUrl}
                  onChange={(e) => setCurrentVendorUrl(e.target.value)}
                  className="bg-background border-2 border-border text-foreground font-mono h-12 flex-1"
                  placeholder="http://localhost:3000"
                />
                <Button
                  onClick={() => fetchServiceDiscovery(currentVendorUrl)}
                  disabled={isLoadingDiscovery}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoadingDiscovery ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {serviceDiscovery && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Loaded: {serviceDiscovery.service || 'Service'} - {serviceDiscovery.payment.network}
                </p>
              )}
            </div> */}

            {/* Disclosure Requirements */}
            {serviceDiscovery?.verification?.requirements && (
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <Label className="text-sm font-semibold text-foreground">
                    Required Disclosures
                  </Label>
                </div>

                <div className="space-y-2 text-sm">
                  {serviceDiscovery.verification.requirements.minimumAge && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Minimum age: {serviceDiscovery.verification.requirements.minimumAge}+</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.ofac && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>OFAC compliance verification</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Name disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.issuing_state && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Issuing state disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.nationality && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Nationality disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.date_of_birth && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Date of birth disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.passport_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Passport number disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.gender && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Gender disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.expiry_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span>Passport expiry date disclosure</span>
                    </div>
                  )}

                  {serviceDiscovery.verification.requirements.excludedCountries &&
                   serviceDiscovery.verification.requirements.excludedCountries.length > 0 && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-orange-500 mt-0.5">⚠</span>
                      <div>
                        <span>Excluded countries: </span>
                        <span className="font-mono text-xs">
                          {serviceDiscovery.verification.requirements.excludedCountries.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  Your passport data stays on your device. Only zero-knowledge proofs are shared.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium text-muted-foreground">
                Seller
              </Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-background border-2 border-border text-foreground font-mono h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                Service
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-2 border-border text-foreground h-12"
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-muted-foreground">
                Vendor Wallet Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-background border-2 border-border text-foreground font-mono h-12"
                placeholder="0xAddress"
              />
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
                Amount (USDC)
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-2 border-border text-foreground font-mono text-lg h-14"
                placeholder="0.001"
              />
            </div> */}
          </div>
        </div>

        {/* Right Section - Verification & Signing */}
        <div className="p-8 lg:p-12 bg-muted/30 flex flex-col justify-center">
          <div className="space-y-8">
            {/* Step 1: Scan QR */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  isVerified ? 'bg-green-500 text-white' : 'bg-accent text-accent-foreground'
                }`}>
                  {isVerified ? '✓' : '1'}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isVerified ? 'Verified ✓' : 'Scan QR to verify'}
                </h2>
              </div>

              <div className="flex items-center justify-center">
                {selfApp ? (
                  <div className="bg-background border-2 border-border rounded-3xl p-4">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleVerificationSuccess}
                      onError={(e) => {
                        console.error("Failed to verify identity:", e)
                        toast.error("Verification failed")
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-background border-2 border-border rounded-3xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <QrCode className="w-32 h-32 mx-auto text-muted-foreground animate-pulse" />
                      <p className="text-sm text-muted-foreground font-mono">Loading QR...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Sign Transaction */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-semibold text-foreground">Sign the payment</h2>
              </div>

              <Button
                onClick={handleSign}
                disabled={!isVerified || !isConnected || isProcessing}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Sign Payment
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Transaction Details Summary */}
          <div className="pt-6 border-t border-border space-y-2 mt-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold text-foreground">${amount} USDC</span>
            </div>
            {isConnected && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono text-foreground">
                  {chainId === celo.id ? '✓ Celo' : '⚠️ Wrong network'}
                </span>
              </div>
            )}
            {serviceDiscovery && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Protocol</span>
                  <span className="text-xs text-foreground">{serviceDiscovery.payment.protocol}</span>
                </div>
                {/* {serviceDiscovery.verification && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Human Price</span>
                    <span className="text-xs text-green-600 font-semibold">
                      ${serviceDiscovery.verification.price} (1000x cheaper)
                    </span>
                  </div>
                )} */}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
