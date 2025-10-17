"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ImageIcon,
  Database,
  MessageSquare,
  Mail,
  Globe,
  Code,
  Zap,
  Brain,
  FileText,
  Video,
  Music,
  Shield,
  TrendingUp,
  Star,
} from "lucide-react"
import Link from "next/link"

const allServices = [
  {
    id: 1,
    name: "AI Image Generator",
    description:
      "Generate stunning images from text prompts using state-of-the-art AI models like DALL-E and Stable Diffusion",
    category: "Creative",
    icon: ImageIcon,
    botPrice: 1.0,
    humanPrice: 0.001,
    rating: 4.8,
    requests: "1.2M",
    responseTime: "2.5s",
    uptime: "99.9%",
    vendor: "ImageAI Labs",
  },
  {
    id: 2,
    name: "GPT-4 Chat API",
    description: "Access powerful language models for chat, completion, and analysis with advanced reasoning",
    category: "AI",
    icon: MessageSquare,
    botPrice: 0.5,
    humanPrice: 0.0005,
    rating: 4.9,
    requests: "5.8M",
    responseTime: "1.2s",
    uptime: "99.95%",
    vendor: "OpenMind AI",
  },
  {
    id: 3,
    name: "Data Enrichment",
    description: "Enrich contact data with verified emails, phone numbers, and social profiles from multiple sources",
    category: "Data",
    icon: Database,
    botPrice: 2.0,
    humanPrice: 0.002,
    rating: 4.7,
    requests: "890K",
    responseTime: "0.8s",
    uptime: "99.8%",
    vendor: "DataFlow Inc",
  },
  {
    id: 4,
    name: "Voice Synthesis",
    description: "Convert text to natural-sounding speech in 50+ languages and 200+ voices",
    category: "Audio",
    icon: Sparkles,
    botPrice: 0.75,
    humanPrice: 0.00075,
    rating: 4.6,
    requests: "650K",
    responseTime: "1.5s",
    uptime: "99.7%",
    vendor: "VoiceTech",
  },
  {
    id: 5,
    name: "Email Validation",
    description: "Verify email addresses in real-time with deliverability checks and spam trap detection",
    category: "Communication",
    icon: Mail,
    botPrice: 0.3,
    humanPrice: 0.0003,
    rating: 4.5,
    requests: "2.1M",
    responseTime: "0.5s",
    uptime: "99.9%",
    vendor: "MailVerify",
  },
  {
    id: 6,
    name: "Web Scraping API",
    description: "Extract structured data from any website with JavaScript rendering and proxy rotation",
    category: "Data",
    icon: Globe,
    botPrice: 1.5,
    humanPrice: 0.0015,
    rating: 4.4,
    requests: "1.5M",
    responseTime: "3.2s",
    uptime: "99.5%",
    vendor: "ScrapeMaster",
  },
  {
    id: 7,
    name: "Code Completion",
    description: "AI-powered code suggestions and completions for 30+ programming languages",
    category: "Developer",
    icon: Code,
    botPrice: 0.4,
    humanPrice: 0.0004,
    rating: 4.7,
    requests: "3.2M",
    responseTime: "0.9s",
    uptime: "99.9%",
    vendor: "CodeAI",
  },
  {
    id: 8,
    name: "Sentiment Analysis",
    description: "Analyze text sentiment, emotions, and intent with advanced NLP models",
    category: "AI",
    icon: Brain,
    botPrice: 0.25,
    humanPrice: 0.00025,
    rating: 4.6,
    requests: "980K",
    responseTime: "0.6s",
    uptime: "99.8%",
    vendor: "SentimentPro",
  },
  {
    id: 9,
    name: "Document OCR",
    description: "Extract text from images and PDFs with 99% accuracy in 100+ languages",
    category: "Document",
    icon: FileText,
    botPrice: 0.8,
    humanPrice: 0.0008,
    rating: 4.5,
    requests: "720K",
    responseTime: "2.1s",
    uptime: "99.6%",
    vendor: "OCRTech",
  },
  {
    id: 10,
    name: "Video Transcription",
    description: "Transcribe video and audio files with speaker identification and timestamps",
    category: "Audio",
    icon: Video,
    botPrice: 1.2,
    humanPrice: 0.0012,
    rating: 4.8,
    requests: "450K",
    responseTime: "5.5s",
    uptime: "99.7%",
    vendor: "TranscribeAI",
  },
  {
    id: 11,
    name: "Music Generation",
    description: "Create original music tracks from text descriptions in any genre or style",
    category: "Creative",
    icon: Music,
    botPrice: 2.5,
    humanPrice: 0.0025,
    rating: 4.4,
    requests: "320K",
    responseTime: "8.2s",
    uptime: "99.5%",
    vendor: "SoundForge",
  },
  {
    id: 12,
    name: "Fraud Detection",
    description: "Real-time fraud detection and risk scoring for transactions and user behavior",
    category: "Security",
    icon: Shield,
    botPrice: 0.6,
    humanPrice: 0.0006,
    rating: 4.9,
    requests: "1.8M",
    responseTime: "0.4s",
    uptime: "99.95%",
    vendor: "SecureGuard",
  },
]

const categories = ["All", "AI", "Creative", "Data", "Audio", "Communication", "Developer", "Document", "Security"]

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("popular")

  const filteredServices = allServices
    .filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || service.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "popular") return Number.parseInt(b.requests) - Number.parseInt(a.requests)
      if (sortBy === "price-low") return a.humanPrice - b.humanPrice
      if (sortBy === "price-high") return b.humanPrice - a.humanPrice
      if (sortBy === "rating") return b.rating - a.rating
      return 0
    })

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="py-12 border-b border-border/40">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Service Catalog</h1>
            <p className="text-lg text-muted-foreground">
              Browse {allServices.length} premium APIs. Verified humans save up to 99.9% on every request.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>All prices shown are for verified humans</span>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const Icon = service.icon
                const savings = ((1 - service.humanPrice / service.botPrice) * 100).toFixed(1)
                return (
                  <Card
                    key={service.id}
                    className="flex flex-col hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {service.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{service.name}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {/* Pricing */}
                      <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">Bot Price</span>
                          <span className="text-sm line-through text-muted-foreground">
                            ${service.botPrice.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-medium">Human Price</span>
                          <span className="text-xl font-bold text-primary">${service.humanPrice.toFixed(4)}</span>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <Badge
                            variant="outline"
                            className="w-full justify-center bg-primary/5 text-primary border-primary/20"
                          >
                            Save {savings}%
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{service.rating}</span>
                        </div>
                        <div className="text-muted-foreground">{service.requests} requests</div>
                        <div className="text-muted-foreground">
                          <Zap className="h-3.5 w-3.5 inline mr-1 text-primary" />
                          {service.responseTime}
                        </div>
                        <div className="text-muted-foreground">{service.uptime} uptime</div>
                      </div>

                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        by {service.vendor}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button asChild className="flex-1" size="sm">
                        <Link href={`/service/${service.id}`}>View Details</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/service/${service.id}/try`}>Try Now</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to start saving?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get verified once and unlock massive discounts on all services forever
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/verify">Get Verified Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/for-vendors">List Your API</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
