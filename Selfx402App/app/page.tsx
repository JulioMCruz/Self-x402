import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatsSection } from "@/components/stats-section"
import { FeaturedServices } from "@/components/featured-services"
import { HowItWorks } from "@/components/how-it-works"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              50,000+ Verified Humans Saving Money
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              Verify once, pay instantly, <span className="text-primary">access everything</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              The API marketplace where verified humans pay 1000x less than bots. One passport scan unlocks massive
              discounts forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/catalog">
                  Browse Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/verify">Verify Now</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No subscriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Instant payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Privacy protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <FeaturedServices />
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to save 1000x on API costs?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of verified humans accessing premium APIs at a fraction of the cost
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/verify">Get Verified</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/for-vendors">I'm a Vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/catalog" className="hover:text-foreground transition-colors">
                    Service Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Vendors</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/for-vendors" className="hover:text-foreground transition-colors">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/signup" className="hover:text-foreground transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/docs" className="hover:text-foreground transition-colors">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Selfx402. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
