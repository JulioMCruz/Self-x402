"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Key,
  CreditCard,
  ExternalLink,
  Copy,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

export default function UserDashboard() {
  // Mock data - in production, this would come from an API
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    verified: true,
    verifiedDate: "2024-01-15",
    memberSince: "2024-01-10",
  }

  const stats = {
    activeServices: 5,
    totalApiCalls: 124567,
    monthlySavings: 2847,
    avgResponseTime: 145,
  }

  const purchasedServices = [
    {
      id: 1,
      name: "OpenAI GPT-4 API",
      vendor: "OpenAI",
      category: "AI/ML",
      status: "active",
      apiKey: "sk_live_abc123...xyz789", // Mock API key for demo - not real
      usage: 45230,
      limit: 100000,
      humanPrice: 0.03,
      botPrice: 30.0,
      lastUsed: "2 hours ago",
      uptime: 99.9,
    },
    {
      id: 2,
      name: "Weather Data Pro",
      vendor: "WeatherAPI",
      category: "Data",
      status: "active",
      apiKey: "wa_live_def456...uvw012",
      usage: 12450,
      limit: 50000,
      humanPrice: 0.001,
      botPrice: 1.0,
      lastUsed: "5 minutes ago",
      uptime: 99.8,
    },
    {
      id: 3,
      name: "SMS Gateway",
      vendor: "Twilio",
      category: "Communication",
      status: "active",
      apiKey: "tw_live_ghi789...rst345",
      usage: 3200,
      limit: 10000,
      humanPrice: 0.05,
      botPrice: 50.0,
      lastUsed: "1 day ago",
      uptime: 99.95,
    },
    {
      id: 4,
      name: "Image Recognition",
      vendor: "Vision AI",
      category: "AI/ML",
      status: "paused",
      apiKey: "vi_live_jkl012...opq678",
      usage: 8900,
      limit: 25000,
      humanPrice: 0.02,
      botPrice: 20.0,
      lastUsed: "3 days ago",
      uptime: 99.7,
    },
    {
      id: 5,
      name: "Payment Processing",
      vendor: "Stripe Connect",
      category: "Finance",
      status: "active",
      apiKey: "st_live_mno345...lmn901",
      usage: 1567,
      limit: 5000,
      humanPrice: 0.1,
      botPrice: 100.0,
      lastUsed: "30 minutes ago",
      uptime: 99.99,
    },
  ]

  const transactions = [
    {
      id: 1,
      date: "2024-01-17",
      service: "OpenAI GPT-4 API",
      amount: 13.57,
      calls: 4523,
      status: "completed",
    },
    {
      id: 2,
      date: "2024-01-16",
      service: "Weather Data Pro",
      amount: 1.25,
      calls: 1245,
      status: "completed",
    },
    {
      id: 3,
      date: "2024-01-15",
      service: "SMS Gateway",
      amount: 16.0,
      calls: 320,
      status: "completed",
    },
    {
      id: 4,
      date: "2024-01-14",
      service: "Payment Processing",
      amount: 15.67,
      calls: 157,
      status: "completed",
    },
    {
      id: 5,
      date: "2024-01-13",
      service: "Image Recognition",
      amount: 17.8,
      calls: 890,
      status: "completed",
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.name}</p>
            </div>
            <div className="text-right">
              {user.verified ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Human Verified</div>
                    <div className="text-xs text-muted-foreground">Since {user.verifiedDate}</div>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="gap-2 bg-transparent">
                  <AlertCircle className="h-4 w-4" />
                  Verify Now
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeServices}</div>
              <p className="text-xs text-muted-foreground mt-1">Subscribed APIs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalApiCalls.toLocaleString()}</div>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">${stats.monthlySavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">vs bot pricing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground mt-1">Across all services</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            {purchasedServices.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                        <Badge
                          variant={service.status === "active" ? "default" : "secondary"}
                          className={service.status === "active" ? "bg-primary" : ""}
                        >
                          {service.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        by {service.vendor} • {service.category}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${service.humanPrice}</div>
                      <div className="text-xs text-muted-foreground line-through">${service.botPrice}</div>
                      <div className="text-xs text-primary font-semibold">
                        {Math.round((1 - service.humanPrice / service.botPrice) * 100)}% off
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Usage Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {service.usage.toLocaleString()} / {service.limit.toLocaleString()} calls
                      </span>
                    </div>
                    <Progress value={(service.usage / service.limit) * 100} />
                  </div>

                  {/* Service Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Last Used</div>
                        <div className="text-sm font-medium">{service.lastUsed}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                        <div className="text-sm font-medium">{service.uptime}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">API Key</div>
                        <div className="text-sm font-mono">{service.apiKey.slice(0, 12)}...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">This Month</div>
                        <div className="text-sm font-medium">{service.usage.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <ExternalLink className="h-4 w-4" />
                      View Docs
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <RefreshCw className="h-4 w-4" />
                      Refresh Key
                    </Button>
                    {service.status === "paused" ? (
                      <Button size="sm" className="gap-2">
                        Resume Service
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        Pause Service
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent transactions and API usage charges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.service}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.calls.toLocaleString()} API calls • {transaction.date}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${transaction.amount.toFixed(2)}</div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your API keys for all subscribed services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchasedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium mb-1">{service.name}</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-3 py-1 rounded font-mono">{service.apiKey}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(service.apiKey)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
