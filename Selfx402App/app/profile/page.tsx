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
import { CheckCircle2, Upload, Wallet, Shield, Bell, CreditCard } from "lucide-react"

export default function UserProfilePage() {
  const [isVerified, setIsVerified] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and preferences</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Profile Sidebar */}
          <Card className="h-fit">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">John Doe</h3>
                <p className="text-sm text-muted-foreground">john.doe@example.com</p>

                {isVerified && (
                  <Badge className="mt-3 gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Human Verified
                  </Badge>
                )}

                <Button variant="outline" size="sm" className="mt-4 w-full gap-2 bg-transparent">
                  <Upload className="h-4 w-4" />
                  Change Photo
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">Jan 2025</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Services Used</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-medium">$2,450</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" placeholder="Your company name" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Human Verification
                  </CardTitle>
                  <CardDescription>Your identity verification status</CardDescription>
                </CardHeader>
                <CardContent>
                  {isVerified ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Verified Human</p>
                          <p className="text-sm text-muted-foreground">You're enjoying 1000x lower prices</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Verified on: January 15, 2025</p>
                        <p>Verification expires: January 15, 2026</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Verify your identity to unlock 1000x lower prices on all services
                      </p>
                      <Button className="gap-2">
                        <Shield className="h-4 w-4" />
                        Start Verification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">Protect your account with 2FA</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Chrome on MacOS • San Francisco, CA</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">Mobile App</p>
                        <p className="text-sm text-muted-foreground">iOS • Last active 2 hours ago</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Connected Wallet
                  </CardTitle>
                  <CardDescription>Manage your crypto wallet connection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Wallet Address</span>
                      <Badge>Connected</Badge>
                    </div>
                    <p className="font-mono text-sm">0x742d...8f3a</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Disconnect</Button>
                    <Button variant="outline">Change Wallet</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Manage your payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">USDC (Celo)</p>
                          <p className="text-sm text-muted-foreground">Balance: $1,250.00</p>
                        </div>
                      </div>
                      <Badge variant="outline">Primary</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Your recent transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { service: "GPT-4 API", amount: "-$12.50", date: "Jan 17, 2025", status: "Completed" },
                      { service: "Image Generation", amount: "-$8.00", date: "Jan 16, 2025", status: "Completed" },
                      { service: "Data Analytics API", amount: "-$25.00", date: "Jan 15, 2025", status: "Completed" },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{tx.service}</p>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tx.amount}</p>
                          <Badge variant="outline" className="text-xs">
                            {tx.status}
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
                      <p className="font-medium">Service Updates</p>
                      <p className="text-sm text-muted-foreground">Get notified about service changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Usage Alerts</p>
                      <p className="text-sm text-muted-foreground">Alerts when you reach usage limits</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment Receipts</p>
                      <p className="text-sm text-muted-foreground">Receive payment confirmations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">News and promotional content</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Push Notifications</CardTitle>
                  <CardDescription>Manage push notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                    </div>
                    <Switch />
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
