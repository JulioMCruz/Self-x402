import PaymentForm from "@/components/payment-form"
import PaymentFormMinimal from "@/components/payment-form-minimal"
import SelfVerification from "@/components/self-verification"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Tabs defaultValue="regular" className="w-full flex flex-col items-center gap-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="regular">Regular Version</TabsTrigger>
          <TabsTrigger value="minimal">Minimal Version</TabsTrigger>
          {/* <TabsTrigger value="self-verify">Self Verification</TabsTrigger> */}
        </TabsList>
        <TabsContent value="regular" className="w-full flex justify-center">
          <PaymentForm />
        </TabsContent>
        <TabsContent value="minimal" className="w-full flex justify-center">
          <PaymentFormMinimal />
        </TabsContent>
        <TabsContent value="self-verify" className="w-full flex justify-center">
          <SelfVerification />
        </TabsContent>
      </Tabs>
    </main>
  )
}
