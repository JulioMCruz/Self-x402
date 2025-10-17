import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, ImageIcon, Database, MessageSquare } from "lucide-react"

const services = [
  {
    id: 1,
    name: "AI Image Generator",
    description: "Generate stunning images from text prompts using state-of-the-art AI models",
    category: "Creative",
    icon: ImageIcon,
    botPrice: "$1.00",
    humanPrice: "$0.001",
    savings: "99.9%",
    rating: 4.8,
    requests: "1.2M",
  },
  {
    id: 2,
    name: "GPT-4 Chat API",
    description: "Access powerful language models for chat, completion, and analysis",
    category: "AI",
    icon: MessageSquare,
    botPrice: "$0.50",
    humanPrice: "$0.0005",
    savings: "99.9%",
    rating: 4.9,
    requests: "5.8M",
  },
  {
    id: 3,
    name: "Data Enrichment",
    description: "Enrich contact data with verified emails, phone numbers, and social profiles",
    category: "Data",
    icon: Database,
    botPrice: "$2.00",
    humanPrice: "$0.002",
    savings: "99.9%",
    rating: 4.7,
    requests: "890K",
  },
  {
    id: 4,
    name: "Voice Synthesis",
    description: "Convert text to natural-sounding speech in multiple languages and voices",
    category: "Audio",
    icon: Sparkles,
    botPrice: "$0.75",
    humanPrice: "$0.00075",
    savings: "99.9%",
    rating: 4.6,
    requests: "650K",
  },
]

export function FeaturedServices() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Services</h2>
            <p className="text-muted-foreground">Popular APIs with massive discounts for verified humans</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/catalog">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Card key={service.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Bot Price</span>
                      <span className="text-sm line-through text-muted-foreground">{service.botPrice}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Human Price</span>
                      <span className="text-lg font-bold text-primary">{service.humanPrice}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Save {service.savings}</span>
                        <span className="text-muted-foreground">{service.requests} requests</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/service/${service.id}`}>Try Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
