"use client"

import { PaymentForm, PaymentFormMinimal, type WagmiConfig } from "selfx402-pay-widget"
import SelfVerification from "@/components/self-verification"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSignTypedData, useChainId, useReadContract, useConfig } from 'wagmi'
import { useMemo } from 'react'

export default function Home() {
  // Wagmi hooks (from parent app's provider)
  const wagmiConfig = useConfig()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { signTypedDataAsync } = useSignTypedData()
  const { refetch: readContract } = useReadContract()

  // Create WagmiConfig object to pass to widget
  const wagmiConfigProp: WagmiConfig = useMemo(() => ({
    config: wagmiConfig,
    address,
    isConnected,
    chainId,
    signTypedDataAsync,
    readContract: async (args: any) => {
      const result = await readContract(args as any)
      return result.data
    }
  }), [wagmiConfig, address, isConnected, chainId, signTypedDataAsync, readContract])

  // Get vendor URL from environment or use default
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_API_URL || "http://localhost:3000"

  // Protected API endpoint to call after payment
  const apiEndpoint = "/api/demo"

  // Example: Query parameters for GET requests
  const queryParams = {
    format: "detailed",
    includeStats: true,
    limit: 10
  }

  // Example: Request body for POST/PUT requests (not used with /api/demo since it's GET)
  const requestBody = {
    filters: {
      network: "celo",
      verified: true
    },
    options: {
      sortBy: "timestamp",
      order: "desc"
    }
  }

  // Payment success callback
  const handlePaymentSuccess = (data: { txHash: string; amount: string; recipient?: string; payTo: string; apiResponse?: any }) => {
    console.log("[App] Payment successful!", data)

    // Log API response separately for better visibility
    if (data.apiResponse) {
      console.log("[App] API Response Data:", data.apiResponse)
      console.log("[App] Network:", data.apiResponse.network)
      console.log("[App] Chain ID:", data.apiResponse.chainId)
      console.log("[App] USDC Address:", data.apiResponse.usdc)
      console.log("[App] Settlement:", data.apiResponse.metadata?.settlement)
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
      <Tabs defaultValue="get-simple" className="w-full flex flex-col items-center gap-6">
        <TabsList className="bg-muted grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="get-simple">GET Simple</TabsTrigger>
          <TabsTrigger value="get-params">GET + Params</TabsTrigger>
          <TabsTrigger value="post-body">POST + Body</TabsTrigger>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
        </TabsList>

        {/* Tab 1: Simple GET request (default - /api/demo) */}
        <TabsContent value="get-simple" className="w-full flex justify-center">
          <div className="w-full max-w-6xl space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Simple GET Request</h2>
              <p className="text-muted-foreground">Standard x402 payment to /api/demo endpoint</p>
              <code className="text-sm bg-muted px-3 py-1 rounded">GET /api/demo</code>
            </div>
            <PaymentForm
              vendorUrl={vendorUrl}
              apiEndpoint={apiEndpoint}
              requestMethod="GET"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              successCallbackDelay={3000}
              showDeepLink="both"
              buttonText="Pay & Get Data"
              wagmiConfig={wagmiConfigProp}
            />
          </div>
        </TabsContent>

        {/* Tab 2: GET with query parameters */}
        <TabsContent value="get-params" className="w-full flex justify-center">
          <div className="w-full max-w-6xl space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">GET with Query Parameters</h2>
              <p className="text-muted-foreground">Demonstrates passing URL parameters with payment</p>
              <code className="text-sm bg-muted px-3 py-1 rounded block">
                GET /api/demo?format=detailed&includeStats=true&limit=10
              </code>
            </div>
            <PaymentForm
              vendorUrl={vendorUrl}
              apiEndpoint={apiEndpoint}
              requestMethod="GET"
              queryParams={queryParams}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              showDeepLink="both"
              buttonText="Pay & Search"
              wagmiConfig={wagmiConfigProp}
            />
          </div>
        </TabsContent>

        {/* Tab 3: POST with request body (example - would need matching endpoint) */}
        <TabsContent value="post-body" className="w-full flex justify-center">
          <div className="w-full max-w-6xl space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">POST with JSON Body</h2>
              <p className="text-muted-foreground">Example showing POST request with payload</p>
              <code className="text-sm bg-muted px-3 py-1 rounded block">
                POST /api/demo + JSON body
              </code>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                Note: /api/demo is GET-only. This demonstrates the capability.
              </p>
            </div>
            <PaymentForm
              vendorUrl={vendorUrl}
              apiEndpoint={apiEndpoint}
              requestMethod="POST"
              requestBody={requestBody}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              showDeepLink="both"
              buttonText="Pay & Submit"
              wagmiConfig={wagmiConfigProp}
            />
          </div>
        </TabsContent>

        {/* Tab 4: Minimal version */}
        <TabsContent value="minimal" className="w-full flex justify-center">
          <div className="w-full max-w-2xl space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Minimal Payment Form</h2>
              <p className="text-muted-foreground">Compact version with USDC balance</p>
              <code className="text-sm bg-muted px-3 py-1 rounded">GET /api/demo</code>
            </div>
            <PaymentFormMinimal
              vendorUrl={vendorUrl}
              apiEndpoint={apiEndpoint}
              requestMethod="GET"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              showDeepLink="both"
              wagmiConfig={wagmiConfigProp}
            />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
