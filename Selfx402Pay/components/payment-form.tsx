"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Loader2 } from "lucide-react"
import Image from "next/image"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
  countries,
  getUniversalLink,
} from "@selfxyz/qrcode"
import { toast } from "sonner"
import PaymentSuccess from "./payment-success"

export default function PaymentForm() {
  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
  const [amount, setAmount] = useState("0.001")
  const [recipient, setRecipient] = useState("Acme Corporation")
  const [description, setDescription] = useState("Premium subscription service - Monthly billing")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const excludedCountries = useMemo(() => [], [])

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Self x402 Pay",
        scope: "self-x402-facilitator",
        endpoint: "https://codalabs.ngrok.io/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: address,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: `Payment to ${recipient}`,
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
  }, [excludedCountries, address, recipient])

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

    console.log("[v0] Sign transaction clicked", { address, amount, recipient, description })
    setIsProcessing(true)

    // Simulate payment processing (3 seconds)
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentComplete(true)
      toast.success("Transaction signed successfully!")
    }, 3000)
  }

  const handleReset = () => {
    setPaymentComplete(false)
    setIsVerified(false)
    setIsProcessing(false)
  }

  // Show payment success screen
  if (paymentComplete) {
    return <PaymentSuccess amount={amount} onReset={handleReset} />
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

            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
                Amount
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-2 border-border text-foreground font-mono text-lg h-14"
                placeholder="$0.001"
              />
            </div>
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
                <h2 className="text-xl font-semibold text-foreground">Sign the transaction</h2>
              </div>

              <Button
                onClick={handleSign}
                disabled={!isVerified || isProcessing}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Click to Sign"
                )}
              </Button>
            </div>
          </div>

          {/* Transaction Details Summary */}
          <div className="pt-6 border-t border-border space-y-2 mt-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction Amount</span>
              <span className="font-mono font-semibold text-foreground">${amount}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
