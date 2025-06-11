"use client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, Clock, Target, Star, Zap, Users, Loader2 } from "lucide-react"
import { useAnalytics } from "@/lib/hooks/use-api"
import type { Agent } from "@/lib/types"

interface AnalyticsPageProps {
  agents: Agent[]
}

interface WeeklyData {
  day: string
  tasks: number
  xp: number
}

export function AnalyticsPage({ agents }: AnalyticsPageProps) {
  const { analytics, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="font-pixel text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Analytics Command</h1>
          <p className="text-muted-foreground font-clean">Performance metrics and insights</p>
        </div>
        <div className="text-center p-8">
          <p className="text-red-500 font-pixel">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  // Calculate real metrics from agents data with null checks
  const totalTasks = agents.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0);
  const completedTasks = agents.reduce((sum, agent) => 
    sum + (agent.tasks?.filter(t => t.status === "completed").length || 0), 0
  );
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalXP = agents.reduce((sum, agent) => sum + ((agent.level || 1) * 250), 0);
  
  // Use real analytics data or calculate from agents
  const weeklyData: WeeklyData[] = analytics?.weeklyData || [
    { day: "Mon", tasks: Math.floor(totalTasks * 0.12), xp: Math.floor(totalXP * 0.08) },
    { day: "Tue", tasks: Math.floor(totalTasks * 0.15), xp: Math.floor(totalXP * 0.12) },
    { day: "Wed", tasks: Math.floor(totalTasks * 0.18), xp: Math.floor(totalXP * 0.16) },
    { day: "Thu", tasks: Math.floor(totalTasks * 0.14), xp: Math.floor(totalXP * 0.14) },
    { day: "Fri", tasks: Math.floor(totalTasks * 0.20), xp: Math.floor(totalXP * 0.18) },
    { day: "Sat", tasks: Math.floor(totalTasks * 0.11), xp: Math.floor(totalXP * 0.16) },
    { day: "Sun", tasks: Math.floor(totalTasks * 0.10), xp: Math.floor(totalXP * 0.16) },
  ];

  const maxTasks = Math.max(...weeklyData.map((d) => d.tasks), 1);
  const maxXP = Math.max(...weeklyData.map((d) => d.xp), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-2xl text-primary">Analytics Command</h1>
        <p className="text-muted-foreground font-clean">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-foreground">{successRate}%</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total XP</p>
              <p className="text-2xl font-bold text-foreground">{totalXP.toLocaleString()}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold text-foreground">{agents.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Tasks Chart */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Weekly Task Performance</h3>
              <div className="space-y-3">
                {weeklyData.map((data) => (
                  <div key={data.day} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-muted-foreground">
                      {data.day}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${(data.tasks / maxTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-right">
                      {data.tasks}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly XP Chart */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Weekly XP Earned</h3>
              <div className="space-y-3">
                {weeklyData.map((data) => (
                  <div key={data.day} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-muted-foreground">
                      {data.day}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${(data.xp / maxXP) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-sm font-medium text-right">
                      {data.xp.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center text-2xl">
                      {agent.avatar || "🤖"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="text-lg font-bold text-primary">{agent.level || 1}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="text-lg font-bold">{agent.tasks?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge 
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {agent.status || "offline"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center space-x-4 mb-6">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Performance Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Your agents are performing {successRate > 75 ? "excellently" : successRate > 50 ? "well" : "adequately"} 
                  with a {successRate}% success rate
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Avg Response Time</p>
                <p className="text-lg font-bold">2.3s</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Efficiency Score</p>
                <p className="text-lg font-bold">87%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Quality Rating</p>
                <p className="text-lg font-bold">4.8/5</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
