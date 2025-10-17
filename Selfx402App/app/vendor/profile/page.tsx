"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Wallet, Bell, Building2, Crown } from "lucide-react"

export default function VendorProfilePage() {
  const [membershipTier, setMembershipTier] = useState("Professional")

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Vendor Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your vendor account and business settings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Vendor Sidebar */}
          <Card className="h-fit">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">Acme Corp</h3>
                <p className="text-sm text-muted-foreground">vendor@acme.com</p>

                <Badge className="mt-3 gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                  <Crown className="h-3 w-3" />
                  {membershipTier}
                </Badge>

                <Button variant="outline" size="sm" className="mt-4 w-full gap-2 bg-transparent">
                  <Upload className="h-4 w-4" />
                  Change Logo
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">Dec 2024</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Services</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">$45,230</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">4.8 ⭐</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Content */}
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="business">Business Info</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
              <TabsTrigger value="payout">Payout</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                  <CardDescription>Update your vendor profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" defaultValue="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendorEmail">Email</Label>
                    <Input id="vendorEmail" type="email" defaultValue="vendor@acme.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="url" defaultValue="https://acme.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      defaultValue="Leading provider of AI-powered APIs for modern applications."
                    />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Person</CardTitle>
                  <CardDescription>Primary contact for your vendor account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactFirstName">First Name</Label>
                      <Input id="contactFirstName" defaultValue="Jane" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactLastName">Last Name</Label>
                      <Input id="contactLastName" defaultValue="Smith" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input id="contactPhone" type="tel" defaultValue="+1 (555) 987-6543" />
                  </div>
                  <Button>Update Contact</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Details
                  </CardTitle>
                  <CardDescription>Legal and business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Business Name</Label>
                    <Input id="legalName" defaultValue="Acme Corporation Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input id="taxId" defaultValue="12-3456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea id="businessAddress" rows={3} defaultValue="123 Tech Street, San Francisco, CA 94105" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input id="businessType" defaultValue="Corporation" />
                  </div>
                  <Button>Save Business Info</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Links to your API documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="docsUrl">Documentation URL</Label>
                    <Input id="docsUrl" type="url" defaultValue="https://docs.acme.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportUrl">Support URL</Label>
                    <Input id="supportUrl" type="url" defaultValue="https://support.acme.com" />
                  </div>
                  <Button>Update Links</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Current Membership
                  </CardTitle>
                  <CardDescription>Your current plan and benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{membershipTier} Plan</h3>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">$99/month • Renews on Feb 15, 2025</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Up to 10 services</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Advanced analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Custom branding</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline">View All Plans</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your membership payment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: "Jan 15, 2025", amount: "$99.00", status: "Paid" },
                      { date: "Dec 15, 2024", amount: "$99.00", status: "Paid" },
                      { date: "Nov 15, 2024", amount: "$99.00", status: "Paid" },
                    ].map((bill, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">Professional Plan</p>
                          <p className="text-sm text-muted-foreground">{bill.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{bill.amount}</p>
                          <Badge variant="outline" className="text-xs">
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Payout Account
                  </CardTitle>
                  <CardDescription>Manage your payout settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Wallet Address</span>
                      <Badge>Connected</Badge>
                    </div>
                    <p className="font-mono text-sm">0x8a3f...2b9c</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Available Balance</p>
                        <p className="text-2xl font-bold text-primary mt-1">$3,450.00</p>
                      </div>
                      <Button>Withdraw</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Change Payout Wallet
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                  <CardDescription>Configure automatic payouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Automatic Payouts</p>
                      <p className="text-sm text-muted-foreground">Receive payouts automatically</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutThreshold">Minimum Payout Amount</Label>
                    <Input id="payoutThreshold" type="number" defaultValue="100" />
                    <p className="text-xs text-muted-foreground">Minimum: $100</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Your recent payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: "Jan 10, 2025", amount: "$2,500.00", status: "Completed" },
                      { date: "Dec 28, 2024", amount: "$3,200.00", status: "Completed" },
                      { date: "Dec 15, 2024", amount: "$1,800.00", status: "Completed" },
                    ].map((payout, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">Payout</p>
                          <p className="text-sm text-muted-foreground">{payout.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">{payout.amount}</p>
                          <Badge variant="outline" className="text-xs">
                            {payout.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>Choose what emails you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Service Purchases</p>
                      <p className="text-sm text-muted-foreground">Get notified when someone buys your service</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Service Reviews</p>
                      <p className="text-sm text-muted-foreground">Alerts for new reviews on your services</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payout Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive payout confirmations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Platform Updates</p>
                      <p className="text-sm text-muted-foreground">News and feature announcements</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Reports</p>
                      <p className="text-sm text-muted-foreground">Weekly performance summaries</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
