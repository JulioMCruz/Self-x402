"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode } from "lucide-react"
import Image from "next/image"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode"
import { toast } from "sonner"

export default function PaymentFormMinimal() {
  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
  const [amount, setAmount] = useState("0.001")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [isVerified, setIsVerified] = useState(false)

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
  }, [excludedCountries, address])

  const handleVerificationSuccess = async (data?: any) => {
    console.log('Verification successful!', data)
    setIsVerified(true)
    toast.success("Verified! Human pricing active.")
  }

  const handleSign = () => {
    if (!isVerified) {
      toast.error("Please verify your identity first")
      return
    }
    console.log("[v0] Sign transaction clicked", { address, amount })
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

        {/* Payment Fields */}
        <div className="space-y-4">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-background border border-border text-foreground font-mono text-sm"
            placeholder="0xAddress"
          />

          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background border border-border text-foreground font-mono text-lg"
            placeholder="$0.001"
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
          size="lg"
          className="w-full h-12 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Click to Sign
        </Button>
      </div>
    </div>
  )
}
