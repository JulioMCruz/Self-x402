"use client"

import PaymentForm from "@/components/payment-form"
import PaymentFormMinimal from "@/components/payment-form-minimal"
import SelfVerification from "@/components/self-verification"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Home() {
  // Get vendor URL from environment or use default
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_API_URL || "http://localhost:3000"

  // Protected API endpoint to call after payment
  const apiEndpoint = "/api/demo"

  // Payment success callback
  const handlePaymentSuccess = (data: { txHash: string; amount: string; recipient?: string; payTo: string; apiResponse?: any }) => {
    console.log("[App] Payment successful!", data)

    // Log API response separately for better visibility
    if (data.apiResponse) {
      console.log("[App] API Response Data:", data.apiResponse)
    }

    // You can add custom logic here:
    // - Analytics tracking
    // - Database updates
    // - Webhook notifications
    // - Navigate to success page
  }

  // Payment failure callback
  const handlePaymentFailure = (error: Error) => {
    console.error("[App] Payment failed!", error)
    // You can add custom logic here:
    // - Error logging to external service
    // - Show custom error UI
    // - Send alert notifications
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Wallet Connection - Global Header */}
      <div className="w-full max-w-6xl flex justify-end mb-6">
        <ConnectButton />
      </div>

      {/* Payment Forms */}
      <Tabs defaultValue="regular" className="w-full flex flex-col items-center gap-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
        </TabsList>
        <TabsContent value="regular" className="w-full flex justify-center">
          <PaymentForm
            vendorUrl={vendorUrl}
            apiEndpoint={apiEndpoint}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        </TabsContent>
        <TabsContent value="minimal" className="w-full flex justify-center">
          <PaymentFormMinimal
            vendorUrl={vendorUrl}
            apiEndpoint={apiEndpoint}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
