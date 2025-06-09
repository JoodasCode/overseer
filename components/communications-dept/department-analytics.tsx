"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Activity,
  Zap,
  Brain
} from 'lucide-react'
import { Agent } from '@/lib/types'

interface DepartmentAnalyticsProps {
  agents: Agent[]
  className?: string
}

interface DepartmentMetrics {
  totalMessages: number
  avgResponseTime: number
  collaborationCount: number
  taskCompletionRate: number
  userSatisfaction: number
  peakActivityHours: number[]
  agentPerformance: AgentPerformanceMetric[]
  collaborationNetwork: CollaborationData[]
  weeklyTrends: TrendData[]
}

interface AgentPerformanceMetric {
  agentId: string
  name: string
  messagesHandled: number
  avgResponseTime: number
  satisfactionScore: number
  toolsUsed: number
  collaborations: number
  status: 'excellent' | 'good' | 'needs_attention'
}

interface CollaborationData {
  from: string
  to: string
  count: number
  type: 'task_delegation' | 'information_sharing' | 'joint_project'
}

interface TrendData {
  date: string
  messages: number
  collaborations: number
  satisfaction: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function DepartmentAnalytics({ agents, className }: DepartmentAnalyticsProps) {
  const [metrics, setMetrics] = useState<DepartmentMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d')

  // Mock data for demonstration - in real implementation, this would come from API
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockMetrics: DepartmentMetrics = {
        totalMessages: 1247,
        avgResponseTime: 2.3,
        collaborationCount: 89,
        taskCompletionRate: 94.2,
        userSatisfaction: 4.7,
        peakActivityHours: [9, 10, 11, 14, 15, 16],
        agentPerformance: [
          {
            agentId: 'alex',
            name: 'Alex',
            messagesHandled: 324,
            avgResponseTime: 1.8,
            satisfactionScore: 4.8,
            toolsUsed: 6,
            collaborations: 23,
            status: 'excellent'
          },
          {
            agentId: 'dana',
            name: 'Dana',
            messagesHandled: 298,
            avgResponseTime: 2.1,
            satisfactionScore: 4.6,
            toolsUsed: 4,
            collaborations: 31,
            status: 'excellent'
          },
          {
            agentId: 'jamie',
            name: 'Jamie',
            messagesHandled: 267,
            avgResponseTime: 2.4,
            satisfactionScore: 4.8,
            toolsUsed: 5,
            collaborations: 19,
            status: 'good'
          },
          {
            agentId: 'riley',
            name: 'Riley',
            messagesHandled: 201,
            avgResponseTime: 3.1,
            satisfactionScore: 4.5,
            toolsUsed: 7,
            collaborations: 12,
            status: 'good'
          },
          {
            agentId: 'toby',
            name: 'Toby',
            messagesHandled: 157,
            avgResponseTime: 1.2,
            satisfactionScore: 4.9,
            toolsUsed: 5,
            collaborations: 4,
            status: 'excellent'
          }
        ],
        collaborationNetwork: [
          { from: 'Alex', to: 'Dana', count: 15, type: 'task_delegation' },
          { from: 'Alex', to: 'Jamie', count: 8, type: 'information_sharing' },
          { from: 'Dana', to: 'Riley', count: 6, type: 'joint_project' },
          { from: 'Jamie', to: 'Riley', count: 11, type: 'information_sharing' },
          { from: 'Toby', to: 'Alex', count: 3, type: 'task_delegation' }
        ],
        weeklyTrends: [
          { date: 'Mon', messages: 178, collaborations: 12, satisfaction: 4.6 },
          { date: 'Tue', messages: 192, collaborations: 15, satisfaction: 4.7 },
          { date: 'Wed', messages: 156, collaborations: 9, satisfaction: 4.5 },
          { date: 'Thu', messages: 203, collaborations: 18, satisfaction: 4.8 },
          { date: 'Fri', messages: 187, collaborations: 14, satisfaction: 4.7 },
          { date: 'Sat', messages: 98, collaborations: 7, satisfaction: 4.6 },
          { date: 'Sun', messages: 89, collaborations: 5, satisfaction: 4.5 }
        ]
      }
      
      setMetrics(mockMetrics)
      setLoading(false)
    }

    loadMetrics()
  }, [selectedTimeframe])

  if (loading || !metrics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    return current > previous ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Communications Department Analytics</h2>
          <p className="text-gray-600">Team performance and collaboration insights</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{metrics.totalMessages.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(metrics.totalMessages, 1156)}
              <span className="text-sm text-gray-600 ml-1">+7.8% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(2.5, metrics.avgResponseTime)}
              <span className="text-sm text-gray-600 ml-1">-8.0% faster</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collaborations</p>
                <p className="text-2xl font-bold">{metrics.collaborationCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(metrics.collaborationCount, 76)}
              <span className="text-sm text-gray-600 ml-1">+17.1% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold">{metrics.userSatisfaction}/5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(metrics.userSatisfaction, 4.5)}
              <span className="text-sm text-gray-600 ml-1">+4.4% improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Messages"
                />
                <Line 
                  type="monotone" 
                  dataKey="collaborations" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Collaborations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messagesHandled" fill="#8884d8" name="Messages Handled" />
                <Bar dataKey="collaborations" fill="#82ca9d" name="Collaborations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Individual Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.agentPerformance.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{agent.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{agent.messagesHandled} messages</span>
                      <span>{agent.avgResponseTime}m avg response</span>
                      <span>{agent.collaborations} collaborations</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Satisfaction</div>
                    <div className="font-semibold">{agent.satisfactionScore}/5</div>
                  </div>
                  <Badge 
                    className={getStatusBadgeColor(agent.status)}
                  >
                    {agent.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Network */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-3">Most Active Collaborations</h4>
              <div className="space-y-2">
                {metrics.collaborationNetwork
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((collab, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{collab.from} → {collab.to}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {collab.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-semibold">{collab.count}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Collaboration Types</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Task Delegation', value: 35, color: COLORS[0] },
                      { name: 'Information Sharing', value: 45, color: COLORS[1] },
                      { name: 'Joint Projects', value: 20, color: COLORS[2] }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[
                      { name: 'Task Delegation', value: 35 },
                      { name: 'Information Sharing', value: 45 },
                      { name: 'Joint Projects', value: 20 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 