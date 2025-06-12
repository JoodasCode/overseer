"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CreditCard,
  BarChart3,
  Clock,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"

interface TokenUsage {
  userId: string
  tokensUsed: number
  tokenQuota: number
  tokensRemaining: number
  percentUsed: number
  lastReset: string
  resetPeriod: string
  lifetimeTokens: number
}

interface UsageAnalytics {
  dailyUsage: Array<{ date: string; tokens: number }>
  weeklyTrend: number // percentage change
  averagePerDay: number
  mostActiveDay: string
  peakUsageHour: number
}

interface UserPlan {
  user_id: string
  email: string
  subscription_plan: string
  tokens_used: number
  token_quota: number
  tokens_remaining: number
  last_reset: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("usage")
  const [userPlans, setUserPlans] = useState<UserPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  useEffect(() => {
    loadTokenUsage()
    loadAnalytics()
  }, [])

  const loadTokenUsage = async () => {
    try {
      const response = await fetch('/api/tokens/usage')
      if (response.ok) {
        const usage = await response.json()
        setTokenUsage(usage)
      }
    } catch (error) {
      console.error('Error loading token usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Mock analytics for now - will be replaced with real API
      const mockAnalytics: UsageAnalytics = {
        dailyUsage: [
          { date: '2024-01-01', tokens: 15 },
          { date: '2024-01-02', tokens: 22 },
          { date: '2024-01-03', tokens: 18 },
          { date: '2024-01-04', tokens: 31 },
          { date: '2024-01-05', tokens: 28 },
          { date: '2024-01-06', tokens: 19 },
          { date: '2024-01-07', tokens: 25 }
        ],
        weeklyTrend: 12.5,
        averagePerDay: 22.6,
        mostActiveDay: 'Thursday',
        peakUsageHour: 14
      }
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const getPlanRecommendation = () => {
    if (!tokenUsage) return null
    
    if (tokenUsage.percentUsed > 90) {
      return {
        plan: 'PRO',
        reason: 'You\'re using 90%+ of your tokens',
        benefits: ['2,000 tokens/month', 'Priority support', 'Advanced analytics']
      }
    } else if (tokenUsage.percentUsed > 70) {
      return {
        plan: 'PRO',
        reason: 'You\'re on track to exceed your quota',
        benefits: ['2,000 tokens/month', 'Priority support', 'Advanced analytics']
      }
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const recommendation = getPlanRecommendation()

  const loadAllUserPlans = async () => {
    setLoadingPlans(true)
    try {
      const { data, error } = await supabase.rpc('get_all_user_plans')
      if (error) throw error
      setUserPlans(data || [])
    } catch (error) {
      console.error('Error loading user plans:', error)
      toast({
        title: "Error",
        description: "Failed to load user plans",
        variant: "destructive"
      })
    } finally {
      setLoadingPlans(false)
    }
  }

  const upgradeUserPlan = async (userId: string, newPlan: string) => {
    try {
      const { data, error } = await supabase.rpc('upgrade_user_plan', {
        p_user_id: userId,
        p_new_plan: newPlan
      })
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: `User upgraded to ${newPlan} plan`,
      })
      
      // Reload plans
      loadAllUserPlans()
    } catch (error) {
      console.error('Error upgrading user:', error)
      toast({
        title: "Error",
        description: "Failed to upgrade user plan",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (activeTab === "admin") {
      loadAllUserPlans()
    }
  }, [activeTab])

  if (loading) {
    return (
      <SharedLayout title="Settings" description="Manage your account and usage">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading settings...</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Settings" description="Manage your account and usage">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {/* Token Usage Overview */}
            {tokenUsage && (
              <Card className={`${tokenUsage.tokensRemaining <= 50 ? 'border-orange-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Token Usage</CardTitle>
                        <CardDescription>
                          Your current usage for this {tokenUsage.resetPeriod} period
                        </CardDescription>
                      </div>
                    </div>
                    {tokenUsage.tokensRemaining <= 50 && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tokens Used</span>
                      <span className="font-medium">
                        {tokenUsage.tokensUsed.toLocaleString()} / {tokenUsage.tokenQuota.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={tokenUsage.percentUsed} 
                      className={`h-3 ${tokenUsage.percentUsed > 90 ? 'text-orange-500' : ''}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{tokenUsage.tokensRemaining.toLocaleString()} remaining</span>
                      <span>{tokenUsage.percentUsed.toFixed(1)}% used</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {tokenUsage.tokensRemaining.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {tokenUsage.lifetimeTokens.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Lifetime</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {analytics?.averagePerDay ? analytics.averagePerDay.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-xs text-muted-foreground">Daily Avg</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {analytics?.averagePerDay && analytics.averagePerDay > 0 ? Math.ceil(tokenUsage.tokensRemaining / analytics.averagePerDay) : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">Days Left</div>
                    </div>
                  </div>

                  {tokenUsage.tokensRemaining <= 50 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-800">Low Token Warning</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            You have {tokenUsage.tokensRemaining} tokens remaining. 
                            Consider upgrading your plan to continue chatting with agents.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Usage Analytics */}
            {analytics && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Usage Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weekly trend</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-500 font-medium">
                            +{analytics.weeklyTrend}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Most active day</span>
                        <span className="font-medium">{analytics.mostActiveDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak usage time</span>
                        <span className="font-medium">{analytics.peakUsageHour}:00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Daily Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.dailyUsage.slice(-7).map((day, index) => (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-12">
                            {formatDate(day.date)}
                          </span>
                          <div className="flex-1">
                            <Progress 
                              value={(day.tokens / Math.max(...analytics.dailyUsage.map(d => d.tokens))) * 100} 
                              className="h-2"
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">
                            {day.tokens}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Plan Recommendation */}
            {recommendation && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Zap className="h-5 w-5" />
                    Recommended Upgrade
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {recommendation.reason}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {recommendation.plan} Plan
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {recommendation.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-blue-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => {
                    toast({
                      title: "Upgrade Coming Soon",
                      description: "Plan upgrades will be available in the next update."
                    })
                  }}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade to {recommendation.plan}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reset Information */}
            {tokenUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Reset Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Next Reset</p>
                      <p className="text-xs text-muted-foreground">
                        Your tokens reset {tokenUsage.resetPeriod}ly
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {tokenUsage?.lastReset ? new Date(new Date(tokenUsage.lastReset).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {tokenUsage?.lastReset ? Math.ceil((new Date(new Date(tokenUsage.lastReset).getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : '—'} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Billing features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Account settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Plan Management</CardTitle>
                <CardDescription>
                  Manage user subscription plans for testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPlans ? (
                  <div className="text-center py-4">Loading user plans...</div>
                ) : (
                  <div className="space-y-4">
                    {userPlans.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.tokens_used} / {user.token_quota} tokens used
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={user.subscription_plan === 'FREE' ? 'secondary' : 'default'}>
                            {user.subscription_plan}
                          </Badge>
                          <Select
                            value={user.subscription_plan}
                            onValueChange={(newPlan) => upgradeUserPlan(user.user_id, newPlan)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FREE">FREE</SelectItem>
                              <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                              <SelectItem value="TEAM">TEAM</SelectItem>
                              <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    
                    {userPlans.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Plan Details:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div><strong>FREE:</strong> 20 tokens/month - Access all features</div>
                    <div><strong>PREMIUM:</strong> 1,000 tokens/month - Individual use</div>
                    <div><strong>TEAM:</strong> 5,000 tokens/month - Team collaboration</div>
                    <div><strong>ENTERPRISE:</strong> 15,000 tokens/month - Large organizations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SharedLayout>
  )
} 