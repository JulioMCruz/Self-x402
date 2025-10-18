"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  Eye,
  MoreVertical,
  Plus,
  Download,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Mock data for charts
const revenueData = [
  { date: "Jan", revenue: 4200, calls: 12500 },
  { date: "Feb", revenue: 5800, calls: 18200 },
  { date: "Mar", revenue: 7200, calls: 22100 },
  { date: "Apr", revenue: 6500, calls: 19800 },
  { date: "May", revenue: 8900, calls: 28400 },
  { date: "Jun", revenue: 12400, calls: 38200 },
]

const trafficData = [
  { type: "Human", count: 85420, percentage: 78 },
  { type: "Bot", count: 24180, percentage: 22 },
]

// Mock services data
const services = [
  {
    id: 1,
    name: "GPT-4 Vision API",
    category: "AI/ML",
    status: "active",
    calls: 38200,
    revenue: 4280,
    uptime: 99.9,
    avgResponse: 245,
    humanPrice: 0.002,
    botPrice: 2.0,
  },
  {
    id: 2,
    name: "Real-time Translation",
    category: "Language",
    status: "active",
    calls: 24100,
    revenue: 2890,
    uptime: 99.7,
    avgResponse: 180,
    humanPrice: 0.001,
    botPrice: 1.0,
  },
  {
    id: 3,
    name: "Weather Forecast API",
    category: "Data",
    status: "paused",
    calls: 15800,
    revenue: 1620,
    uptime: 99.5,
    avgResponse: 120,
    humanPrice: 0.0005,
    botPrice: 0.5,
  },
]

export default function VendorDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const stats = [
    {
      title: "Total Revenue",
      value: "$12,428",
      change: "+18.2%",
      trend: "up",
      icon: DollarSign,
      description: "vs last month",
    },
    {
      title: "API Calls",
      value: "109.5K",
      change: "+24.5%",
      trend: "up",
      icon: Activity,
      description: "Total requests",
    },
    {
      title: "Active Services",
      value: "8",
      change: "+2",
      trend: "up",
      icon: TrendingUp,
      description: "Live endpoints",
    },
    {
      title: "Human Traffic",
      value: "78%",
      change: "+5.2%",
      trend: "up",
      icon: Users,
      description: "Verified users",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/" className="flex items-center gap-2">
                <img src="/images/selfx402-logo.png" alt="Selfx402" className="h-7 md:h-8" />
              </Link>
              <nav className="hidden lg:flex items-center gap-6">
                <Link href="/vendor/dashboard" className="text-sm font-medium text-foreground">
                  Dashboard
                </Link>
                <Link
                  href="/vendor/services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/vendor/analytics"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/vendor/payouts"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Payouts
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
              <Button size="sm" asChild className="hidden sm:flex">
                <Link href="/vendor/services/new">
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Add Service</span>
                </Link>
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link
                      href="/vendor/dashboard"
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/vendor/services"
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Services
                    </Link>
                    <Link
                      href="/vendor/analytics"
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      href="/vendor/payouts"
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Payouts
                    </Link>
                    <div className="pt-4 border-t border-border space-y-2">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/vendor/services/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Link>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-balance">Vendor Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Monitor your API services performance and revenue
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className={stat.trend === "up" ? "text-primary" : "text-destructive"}>{stat.change}</span>
                  <span className="text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6 md:mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue and API calls</CardDescription>
                </div>
                <Tabs value={timeRange} onValueChange={setTimeRange}>
                  <TabsList>
                    <TabsTrigger value="7d">7D</TabsTrigger>
                    <TabsTrigger value="30d">30D</TabsTrigger>
                    <TabsTrigger value="90d">90D</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px] md:h-[300px]"
              >
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Traffic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Distribution</CardTitle>
              <CardDescription>Human vs Bot API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Calls",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px] md:h-[300px]"
              >
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="type" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="mt-6 space-y-3">
                {trafficData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.type === "Human" ? "bg-primary" : "bg-muted"}`} />
                      <span className="text-sm font-medium">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{item.count.toLocaleString()} calls</span>
                      <Badge variant="secondary">{item.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Your Services</CardTitle>
                <CardDescription>Manage and monitor your API services</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/vendor/services">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{service.name}</h3>
                        <Badge variant={service.status === "active" ? "default" : "secondary"}>{service.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>

                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                      <div className="text-center">
                        <div className="text-sm font-medium">{service.calls.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">${service.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{service.uptime}%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{service.avgResponse}ms</div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Service</DropdownMenuItem>
                      <DropdownMenuItem>{service.status === "active" ? "Pause" : "Activate"}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete Service</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Balance
                </CardTitle>
                <CardDescription>Available for withdrawal</CardDescription>
              </div>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl md:text-4xl font-bold">$12,428.50</span>
              <span className="text-muted-foreground">USDC</span>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Pending</div>
                <div className="text-xl font-semibold">$1,240.00</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">This Month</div>
                <div className="text-xl font-semibold">$8,920.00</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">All Time</div>
                <div className="text-xl font-semibold">$48,250.00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
