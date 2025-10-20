import PaymentFormWithWallet from "@/components/payment-form-with-wallet"
import PaymentForm from "@/components/payment-form"
import PaymentFormMinimal from "@/components/payment-form-minimal"
import SelfVerification from "@/components/self-verification"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  // Get vendor URL from environment or use default
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_API_URL || "http://localhost:3000"

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Tabs defaultValue="wallet" className="w-full flex flex-col items-center gap-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="wallet">With Wallet</TabsTrigger>
          {/* <TabsTrigger value="regular">Simulated</TabsTrigger> */}
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet" className="w-full flex justify-center">
          <PaymentFormWithWallet vendorUrl={vendorUrl} />
        </TabsContent>
        <TabsContent value="regular" className="w-full flex justify-center">
          <PaymentForm />
        </TabsContent>
        <TabsContent value="minimal" className="w-full flex justify-center">
          <PaymentFormMinimal />
        </TabsContent>
      </Tabs>
    </main>
  )
}
