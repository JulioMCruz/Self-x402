"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, Wallet, ExternalLink, Copy, Check } from "lucide-react"
import Image from "next/image"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode"
import { toast } from "sonner"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { celo } from 'wagmi/chains'

// USDC contract on Celo mainnet
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

export default function PaymentFormMinimal() {
  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
  const [amount, setAmount] = useState("0.001")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const { address: walletAddress, isConnected } = useAccount()
  const chainId = useChainId()

  // Read USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    chainId: celo.id,
  })

  const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : '0.00'

  const excludedCountries = useMemo(() => [], [])

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
        userDefinedData: "Minimal payment form",
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
  }, [excludedCountries, address, walletAddress])

  const copyUSDCAddress = () => {
    navigator.clipboard.writeText(USDC_ADDRESS)
    setCopiedAddress(true)
    toast.success("USDC contract address copied!")
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleVerificationSuccess = async (data?: any) => {
    console.log('Verification successful!', data)
    setIsVerified(true)
    toast.success("Verified! Human pricing active.")
  }

  const handleSign = () => {
    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet first")
      return
    }

    if (chainId !== celo.id) {
      toast.error("Please switch to Celo network")
      return
    }

    if (!isVerified) {
      toast.error("Please verify your identity first")
      return
    }

    console.log("[Minimal] Sign transaction clicked", { address, amount, walletAddress })
    toast.success("Transaction signed!")
    // Transaction signing logic would go here
  }

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-center">
          <Image src="/logoBanner.png" alt="Self x Pay" width={200} height={80} className="h-22 w-auto" />
        </div>

        {/* Wallet Connection */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground text-center">
            Connect Wallet
          </div>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>

        {/* USDC Balance & Info */}
        {isConnected && (
          <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">USDC Balance</span>
              <span className="font-mono font-semibold text-lg">
                {isLoadingBalance ? '...' : formattedBalance} USDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className={`text-sm font-medium ${chainId === celo.id ? 'text-green-600' : 'text-orange-600'}`}>
                {chainId === celo.id ? '✓ Celo Mainnet' : '⚠️ Wrong Network'}
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">USDC Contract</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                    {USDC_ADDRESS.slice(0, 6)}...{USDC_ADDRESS.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={copyUSDCAddress}
                  >
                    {copiedAddress ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <a
                    href={`https://celoscan.io/address/${USDC_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-6 w-6 p-0 inline-flex items-center justify-center hover:bg-accent rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Fields */}
        <div className="space-y-4">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-background border border-border text-foreground font-mono text-sm"
            placeholder="Vendor Address: 0x..."
          />

          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background border border-border text-foreground font-mono text-lg"
            placeholder="Amount: 0.001"
          />
        </div>

        {/* QR Code */}
        <div className="flex items-center justify-center py-4">
          {selfApp ? (
            <div className="bg-background border border-border rounded-xl p-2">
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
            <div className="w-40 h-40 bg-background border border-border rounded-xl flex items-center justify-center">
              <QrCode className="w-24 h-24 text-muted-foreground animate-pulse" />
            </div>
          )}
        </div>

        {/* Verification Status */}
        {isVerified && (
          <div className="text-center text-sm text-green-600 dark:text-green-400 font-semibold">
            ✓ Identity Verified - Human Pricing Active
          </div>
        )}

        {/* Sign Button */}
        <Button
          onClick={handleSign}
          disabled={!isConnected || !isVerified || chainId !== celo.id}
          size="lg"
          className="w-full h-12 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="mr-2 h-5 w-5" />
          Click to Sign
        </Button>
      </div>
    </div>
  )
}
