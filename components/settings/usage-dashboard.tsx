'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  TrendingUp, 
  Calendar, 
  Users, 
  BarChart3, 
  Crown,
  AlertTriangle,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface UsageData {
  tokensUsed: number
  tokenQuota: number
  tokensRemaining: number
  resetDate: string
  subscriptionPlan: string
  dailyUsage: Array<{ date: string; tokens: number }>
  agentBreakdown: Array<{ name: string; tokens: number; conversations: number }>
  weeklyTrend: Array<{ week: string; tokens: number }>
}

const PLAN_COLORS = {
  FREE: '#6B7280',
  PRO: '#F59E0B',
  TEAMS: '#8B5CF6',
  ENTERPRISE: '#059669'
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchUsageData()
  }, [selectedPeriod])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tokens/analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!usage) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load usage data. Please try again.
        </div>
      </Card>
    )
  }

  const usagePercentage = (usage.tokensUsed / usage.tokenQuota) * 100
  const isLow = usage.tokensRemaining < 50
  const resetDate = new Date(usage.resetDate)
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Usage Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Token Usage</CardTitle>
                <CardDescription>
                  {usage.tokensUsed.toLocaleString()} of {usage.tokenQuota.toLocaleString()} tokens used
                </CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  usage.subscriptionPlan === 'PRO' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                  usage.subscriptionPlan === 'TEAMS' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                  usage.subscriptionPlan === 'ENTERPRISE' ? 'border-green-300 text-green-700 bg-green-50' :
                  'border-gray-300 text-gray-700 bg-gray-50'
                }`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {usage.subscriptionPlan}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={usagePercentage} 
                className={`h-3 ${isLow ? 'bg-red-100' : 'bg-gray-100'}`}
              />
            </div>
            
            {isLow && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  You're running low on tokens. Consider upgrading your plan.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Next Reset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">
              {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-gray-600">
              {resetDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-500">
              Your token quota will reset to {usage.tokenQuota.toLocaleString()} tokens
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Agent Usage Breakdown
          </CardTitle>
          <CardDescription>
            Your most used agents this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.agentBreakdown.slice(0, 5).map((agent, index) => (
              <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-gray-500">
                      {agent.conversations} conversation{agent.conversations !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{agent.tokens} tokens</div>
                  <div className="text-xs text-gray-500">
                    {((agent.tokens / usage.tokensUsed) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/settings?tab=billing'}
              className="w-full"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Upgrade for More Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 