import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Zap, Shield, DollarSign } from "lucide-react"

const steps = [
  {
    icon: Smartphone,
    title: "Verify Once",
    description: "Scan your passport with the Self mobile app. Takes 30 seconds, lasts 90 days.",
  },
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "Zero-knowledge proofs mean vendors never see your passport data.",
  },
  {
    icon: Zap,
    title: "Pay Instantly",
    description: "Connect your wallet and pay per request. Settlements in 2-5 seconds.",
  },
  {
    icon: DollarSign,
    title: "Save 1000x",
    description: "Access the same APIs at a fraction of the cost. No subscriptions needed.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Prove you're human once, then enjoy massive discounts on every API request forever
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
