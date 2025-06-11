"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Save, User, Lock, Bell, Palette, Globe, Download, Trash2, Check, Crown, Zap, Plus, BarChart3, CreditCard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample invoice data
const invoices = [
  {
    id: "INV001",
    date: "2024-01-15",
    amount: "$29.00",
    status: "Paid",
    description: "Pro Plan - January 2024"
  },
  {
    id: "INV002", 
    date: "2023-12-15",
    amount: "$29.00",
    status: "Paid",
    description: "Pro Plan - December 2023"
  },
  {
    id: "INV003",
    date: "2023-11-15", 
    amount: "$29.00",
    status: "Paid",
    description: "Pro Plan - November 2023"
  }
]

// Usage data
const usageData = [
  {
    resource: "AI Agents",
    used: 5,
    limit: 25,
    percentage: 20
  },
  {
    resource: "API Calls",
    used: 2847,
    limit: 10000,
    percentage: 28
  },
  {
    resource: "Storage",
    used: "1.2 GB",
    limit: "10 GB", 
    percentage: 12
  },
  {
    resource: "Team Members",
    used: 3,
    limit: 10,
    percentage: 30
  }
]

export default function SettingsPage() {
  return (
    <SharedLayout title="Settings" description="Configure your account and system preferences">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                  <Input id="email" type="email" defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us about yourself..." />
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agent Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when agents go offline or encounter errors
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Completions</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when tasks are completed
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly performance summaries
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
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
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  You&apos;re currently on the Pro Plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      Pro Plan
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Current
                      </Badge>
                    </h3>
                    <p className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    <p className="text-sm text-muted-foreground">Next billing: February 15, 2024</p>
                  </div>
                  <div className="text-right space-y-2">
                    <Button variant="outline" size="sm">
                      Manage Plan
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full">
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Overview
                </CardTitle>
                <CardDescription>
                  Current usage for your billing period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {usageData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.resource}</span>
                        <span className="text-sm text-muted-foreground">
                          {typeof item.used === 'number' ? item.used : item.used} / {item.limit}
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Manage your billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                  <CardDescription>
                    Your invoice billing address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">John Doe</p>
                    <p className="text-muted-foreground">123 Business Ave</p>
                    <p className="text-muted-foreground">Suite 100</p>
                    <p className="text-muted-foreground">San Francisco, CA 94105</p>
                    <p className="text-muted-foreground">United States</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Update Address
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>
                  Your billing history and downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'Paid' ? 'secondary' : 'destructive'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{invoice.amount}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Upgrade Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Upgrade Your Plan
                </CardTitle>
                <CardDescription>
                  Get more features and higher limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Starter Plan */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Starter</h3>
                      <p className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        5 AI Agents
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        1,000 API Calls
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        1 Team Member
                      </li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full">
                      Downgrade
                    </Button>
                  </div>

                  {/* Current Pro Plan */}
                  <div className="border-2 border-blue-500 rounded-lg p-4 space-y-3 relative">
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Current Plan
                    </Badge>
                    <div className="space-y-1">
                      <h3 className="font-semibold">Pro</h3>
                      <p className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        25 AI Agents
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        10,000 API Calls
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        10 Team Members
                      </li>
                    </ul>
                    <Button size="sm" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Enterprise</h3>
                      <p className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        Unlimited Agents
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        100,000 API Calls
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        Unlimited Team Members
                      </li>
                    </ul>
                    <Button size="sm" className="w-full">
                      Upgrade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  About Overseer
                </CardTitle>
                <CardDescription>
                  System information and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <p className="text-sm">1.0.0</p>
                </div>
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <p className="text-sm">January 15, 2024</p>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SharedLayout>
  )
} 