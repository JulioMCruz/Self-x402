import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, TrendingUp, Zap, Shield, DollarSign, Users, BarChart3, Rocket } from "lucide-react"

export default function ForVendorsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">For API Vendors</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Monetize Your APIs with <span className="text-primary">Human-First Pricing</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground text-balance leading-relaxed">
              Join the marketplace that rewards real users. Charge bots premium rates while offering verified humans
              massive discounts. Instant crypto payouts, zero chargebacks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                <Link href="/vendor/onboard">
                  <Rocket className="h-4 w-4" />
                  Start Selling
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/vendor/dashboard">View Dashboard Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/40 bg-muted/30">
        <div className="container py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">$2.4M+</div>
              <div className="text-sm text-muted-foreground">Paid to Vendors</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">850+</div>
              <div className="text-sm text-muted-foreground">Active APIs</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">45K+</div>
              <div className="text-sm text-muted-foreground">Verified Humans</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">99.8%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance">Why Vendors Choose Selfx402</h2>
          <p className="text-lg text-muted-foreground text-balance">
            The only marketplace built for the human-first economy
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Instant Crypto Payouts</CardTitle>
              <CardDescription>
                Get paid in USDC on Celo blockchain. No waiting periods, no chargebacks, no payment processor fees.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Premium Bot Pricing</CardTitle>
              <CardDescription>
                Charge bots 1000x more than humans. Maximize revenue from automated traffic while staying competitive
                for real users.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Zero-Knowledge Verification</CardTitle>
              <CardDescription>
                Users verify once with passport. Privacy-preserving proofs protect user identity while confirming
                humanity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Track revenue, API calls, human vs bot traffic, and performance metrics in a beautiful dashboard.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>5-Minute Setup</CardTitle>
              <CardDescription>
                List your API in minutes. Simple REST integration, automatic documentation, and instant go-live.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Grow Your Revenue</CardTitle>
              <CardDescription>
                Access 45K+ verified humans actively looking for APIs. Featured placement and marketing support
                included.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="border-y border-border/40 bg-muted/30 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance">Vendor Membership Tiers</h2>
            <p className="text-lg text-muted-foreground text-balance">Choose the plan that fits your business</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Starter Tier */}
            <Card className="border-border/40 bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-2">Perfect for individual developers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Up to 3 API services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">100K API calls/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Basic analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">5% platform fee</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent" variant="outline" asChild>
                  <Link href="/vendor/onboard?tier=starter">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Tier */}
            <Card className="relative border-primary bg-card shadow-lg shadow-primary/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-2">For growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Up to 10 API services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">1M API calls/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Advanced analytics & insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">3% platform fee</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Featured placement</span>
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                  <Link href="/vendor/onboard?tier=professional">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-border/40 bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$499</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-2">For large-scale operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited API services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited API calls</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Custom analytics & reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">1% platform fee</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Premium featured placement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">White-label options</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent" variant="outline" asChild>
                  <Link href="/vendor/onboard?tier=enterprise">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance">Start Selling in 3 Simple Steps</h2>
          <p className="text-lg text-muted-foreground text-balance">From signup to first sale in under 10 minutes</p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          <div className="relative">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              1
            </div>
            <h3 className="mb-2 text-xl font-semibold">Create Your Account</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sign up, choose your membership tier, and connect your crypto wallet for instant payouts.
            </p>
          </div>

          <div className="relative">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              2
            </div>
            <h3 className="mb-2 text-xl font-semibold">List Your APIs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Add your API endpoints, set bot and human pricing, and configure rate limits. We handle the rest.
            </p>
          </div>

          <div className="relative">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="mb-2 text-xl font-semibold">Get Paid Instantly</h3>
            <p className="text-muted-foreground leading-relaxed">
              Watch your revenue grow in real-time. Automatic payouts to your wallet every 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Ready to Monetize Your APIs?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-balance leading-relaxed">
              Join hundreds of vendors already earning on Selfx402. No setup fees, no hidden costs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                <Link href="/vendor/onboard">
                  <Rocket className="h-4 w-4" />
                  Start Selling Today
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/catalog">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
