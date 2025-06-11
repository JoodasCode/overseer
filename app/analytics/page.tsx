"use client"

import { useState } from "react"
import { SharedLayout } from '@/components/shared/SharedLayout'
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Download,
  Target,
  Cpu,
  Timer
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts"

// Analytics data
const performanceData = [
  { month: "Jan", alex: 92, toby: 85, riley: 78, jamie: 96, dana: 65 },
  { month: "Feb", alex: 88, toby: 89, riley: 82, jamie: 94, dana: 58 },
  { month: "Mar", alex: 94, toby: 87, riley: 76, jamie: 98, dana: 45 },
  { month: "Apr", alex: 91, toby: 92, riley: 85, jamie: 97, dana: 52 },
  { month: "May", alex: 96, toby: 88, riley: 79, jamie: 99, dana: 48 },
  { month: "Jun", alex: 94, toby: 89, riley: 76, jamie: 98, dana: 45 }
]

const taskCompletionData = [
  { date: "Mon", completed: 45, failed: 5, pending: 12 },
  { date: "Tue", completed: 52, failed: 3, pending: 8 },
  { date: "Wed", completed: 48, failed: 7, pending: 15 },
  { date: "Thu", completed: 61, failed: 2, pending: 6 },
  { date: "Fri", completed: 55, failed: 4, pending: 9 },
  { date: "Sat", completed: 38, failed: 1, pending: 5 },
  { date: "Sun", completed: 42, failed: 2, pending: 7 }
]

const departmentData = [
  { department: "Analytics", tasks: 245, performance: 94, color: "#3b82f6" },
  { department: "Support", tasks: 189, performance: 89, color: "#8b5cf6" },
  { department: "Marketing", tasks: 156, performance: 76, color: "#ec4899" },
  { department: "Security", tasks: 312, performance: 98, color: "#f97316" },
  { department: "Operations", tasks: 98, performance: 45, color: "#06b6d4" }
]

const systemMetricsData = [
  { time: "00:00", cpu: 45, memory: 62, network: 78 },
  { time: "04:00", cpu: 52, memory: 58, network: 82 },
  { time: "08:00", cpu: 78, memory: 72, network: 95 },
  { time: "12:00", cpu: 85, memory: 79, network: 88 },
  { time: "16:00", cpu: 92, memory: 85, network: 91 },
  { time: "20:00", cpu: 68, memory: 71, network: 85 }
]

const chartConfig = {
  alex: { label: "Alex", color: "#3b82f6" },
  toby: { label: "Toby", color: "#8b5cf6" },
  riley: { label: "Riley", color: "#ec4899" },
  jamie: { label: "Jamie", color: "#f97316" },
  dana: { label: "Dana", color: "#06b6d4" },
  completed: { label: "Completed", color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
  pending: { label: "Pending", color: "#f59e0b" },
  cpu: { label: "CPU Usage", color: "#3b82f6" },
  memory: { label: "Memory", color: "#8b5cf6" },
  network: { label: "Network", color: "#10b981" }
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")

  return (
    <SharedLayout title="Analytics" description="Monitor performance and gain insights into your AI operations">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-muted-foreground">
              -0.5% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Performance Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Charts Grid - 2x2 Layout */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Agent Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Performance Trends</CardTitle>
            <CardDescription>Performance scores over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="alex" 
                    stroke={chartConfig.alex.color} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="toby" 
                    stroke={chartConfig.toby.color} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="riley" 
                    stroke={chartConfig.riley.color} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="jamie" 
                    stroke={chartConfig.jamie.color} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="dana" 
                    stroke={chartConfig.dana.color} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Task Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Task Completion</CardTitle>
            <CardDescription>Task completion status over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar 
                    dataKey="completed" 
                    stackId="a" 
                    fill={chartConfig.completed.color}
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar 
                    dataKey="failed" 
                    stackId="a" 
                    fill={chartConfig.failed.color}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="pending" 
                    stackId="a" 
                    fill={chartConfig.pending.color}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Performance</CardTitle>
            <CardDescription>Performance comparison across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="department" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="performance" 
                    fill="#8884d8"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* System Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Resource Usage</CardTitle>
            <CardDescription>Resource utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke={chartConfig.cpu.color}
                    fill={chartConfig.cpu.color}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="1"
                    stroke={chartConfig.memory.color}
                    fill={chartConfig.memory.color}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="network"
                    stackId="1"
                    stroke={chartConfig.network.color}
                    fill={chartConfig.network.color}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  )
} 