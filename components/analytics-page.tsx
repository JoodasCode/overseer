"use client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, BarChart3, Clock, Target, Star, Zap, Users, Loader2 } from "lucide-react"
import { useAnalytics } from "@/lib/hooks/use-api"
import type { Agent } from "@/lib/types"

interface AnalyticsPageProps {
  agents: Agent[]
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

  // Calculate real metrics from agents data
  const totalTasks = agents.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0);
  const completedTasks = agents.reduce((sum, agent) => 
    sum + (agent.tasks?.filter(t => t.status === "completed").length || 0), 0
  );
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalXP = agents.reduce((sum, agent) => sum + (agent.level * 250), 0);
  
  // Use real analytics data or calculate from agents
  const weeklyData = analytics?.weeklyData || [
    { day: "Mon", tasks: Math.floor(totalTasks * 0.12), xp: Math.floor(totalXP * 0.08) },
    { day: "Tue", tasks: Math.floor(totalTasks * 0.15), xp: Math.floor(totalXP * 0.12) },
    { day: "Wed", tasks: Math.floor(totalTasks * 0.18), xp: Math.floor(totalXP * 0.16) },
    { day: "Thu", tasks: Math.floor(totalTasks * 0.14), xp: Math.floor(totalXP * 0.14) },
    { day: "Fri", tasks: Math.floor(totalTasks * 0.20), xp: Math.floor(totalXP * 0.18) },
    { day: "Sat", tasks: Math.floor(totalTasks * 0.11), xp: Math.floor(totalXP * 0.16) },
    { day: "Sun", tasks: Math.floor(totalTasks * 0.10), xp: Math.floor(totalXP * 0.16) },
  ];

  const maxTasks = Math.max(...weeklyData.map((d: any) => d.tasks), 1);
  const maxXP = Math.max(...weeklyData.map((d: any) => d.xp), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-pixel text-2xl text-primary">Analytics Command</h1>
        <p className="text-muted-foreground font-clean">Performance metrics and insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="font-pixel">
          <TabsTrigger value="overview" className="text-xs">
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-xs">
            AGENTS
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">
            TASKS
          </TabsTrigger>
          <TabsTrigger value="growth" className="text-xs">
            GROWTH
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pixel-card p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="font-pixel text-xs text-primary">Weekly Tasks</h3>
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-pixel text-foreground">{totalTasks}</div>
              <div className="flex items-center text-xs text-green-600 font-clean">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total tasks
              </div>
            </div>

            <div className="pixel-card p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="font-pixel text-xs text-primary">Active Agents</h3>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-pixel text-foreground">{agents.filter(a => a.status === 'active').length}</div>
              <div className="flex items-center text-xs text-green-600 font-clean">
                <TrendingUp className="w-3 h-3 mr-1" />
                Agents online
              </div>
            </div>

            <div className="pixel-card p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="font-pixel text-xs text-primary">Success Rate</h3>
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-pixel text-foreground">{successRate}%</div>
              <div className="flex items-center text-xs text-green-600 font-clean">
                <TrendingUp className="w-3 h-3 mr-1" />
                Completion rate
              </div>
            </div>

            <div className="pixel-card p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="font-pixel text-xs text-primary">Team XP</h3>
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-pixel text-foreground">{totalXP.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 font-clean">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total experience
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <h3 className="font-pixel text-sm text-primary mb-4">Weekly Task Volume</h3>
              <div className="space-y-3">
                {weeklyData.map((day) => (
                  <div key={day.day} className="flex items-center space-x-3">
                    <div className="w-8 text-xs font-pixel">{day.day}</div>
                    <div className="flex-1">
                      <div className="xp-bar-pixel">
                        <div className="xp-progress-pixel" style={{ width: `${(day.tasks / maxTasks) * 100}%` }} />
                      </div>
                    </div>
                    <div className="w-8 text-xs font-pixel text-right">{day.tasks}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pixel-card p-6">
              <h3 className="font-pixel text-sm text-primary mb-4">Weekly XP Earned</h3>
              <div className="space-y-3">
                {weeklyData.map((day) => (
                  <div key={day.day} className="flex items-center space-x-3">
                    <div className="w-8 text-xs font-pixel">{day.day}</div>
                    <div className="flex-1">
                      <div className="xp-bar-pixel">
                        <div className="xp-progress-pixel" style={{ width: `${(day.xp / maxXP) * 100}%` }} />
                      </div>
                    </div>
                    <div className="w-12 text-xs font-pixel text-right">{day.xp}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const completedTasks = agent.tasks.filter((t) => t.status === "completed").length
              const inProgressTasks = agent.tasks.filter((t) => t.status === "in-progress").length
              const pendingTasks = agent.tasks.filter((t) => t.status === "pending").length
              const totalTasks = agent.tasks.length
              const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <div key={agent.id} className="pixel-card p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-lg">{agent.avatar}</span>
                    <div>
                      <h3 className="font-pixel text-sm text-primary">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground font-clean">{agent.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div>
                      <div className="text-lg font-pixel text-foreground">{agent.level}</div>
                      <div className="text-xs text-muted-foreground font-clean">Level</div>
                    </div>
                    <div>
                      <div className="text-lg font-pixel text-foreground">{agent.level * 250}</div>
                      <div className="text-xs text-muted-foreground font-clean">XP</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-clean">
                      <span>Efficiency</span>
                      <span className="font-pixel">{efficiency}%</span>
                    </div>
                    <div className="xp-bar-pixel">
                      <div className="xp-progress-pixel" style={{ width: `${efficiency}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-clean mb-4">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-pixel text-green-600">{completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Progress:</span>
                      <span className="font-pixel text-yellow-600">{inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-pixel text-red-600">{pendingTasks}</span>
                    </div>
                  </div>

                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className="w-full justify-center font-pixel text-xs"
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <h3 className="font-pixel text-sm text-primary mb-4">Task Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-clean mb-2">
                    <span>Marketing (65%)</span>
                    <span className="font-pixel text-xs">Jamie - 48%, Mel - 17%</span>
                  </div>
                  <div className="xp-bar-pixel">
                    <div className="xp-progress-pixel" style={{ width: "65%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-clean mb-2">
                    <span>PR (25%)</span>
                    <span className="font-pixel text-xs">Mel - 25%</span>
                  </div>
                  <div className="xp-bar-pixel">
                    <div className="xp-progress-pixel" style={{ width: "25%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-clean mb-2">
                    <span>HR (10%)</span>
                    <span className="font-pixel text-xs">Tara - 10%</span>
                  </div>
                  <div className="xp-bar-pixel">
                    <div className="xp-progress-pixel" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pixel-card p-6">
              <h3 className="font-pixel text-sm text-primary mb-4">Priority Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-clean">High Priority</span>
                  </div>
                  <span className="text-xs font-pixel">8 tasks</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-clean">Medium Priority</span>
                  </div>
                  <span className="text-xs font-pixel">12 tasks</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-clean">Low Priority</span>
                  </div>
                  <span className="text-xs font-pixel">5 tasks</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="pixel-card p-4">
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Team Growth</h3>
              </div>
              <div className="text-2xl font-pixel text-foreground mb-2">3</div>
              <p className="text-xs text-muted-foreground font-clean">Active agents</p>
              <div className="mt-4 text-xs text-green-600 font-clean">+1 agent this month</div>
            </div>

            <div className="pixel-card p-4">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Skill Unlocks</h3>
              </div>
              <div className="text-2xl font-pixel text-foreground mb-2">7</div>
              <p className="text-xs text-muted-foreground font-clean">New skills learned</p>
              <div className="mt-4 text-xs text-green-600 font-clean">+3 skills this week</div>
            </div>

            <div className="pixel-card p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Productivity</h3>
              </div>
              <div className="text-2xl font-pixel text-foreground mb-2">+23%</div>
              <p className="text-xs text-muted-foreground font-clean">vs last month</p>
              <div className="mt-4 text-xs text-green-600 font-clean">Trending upward</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
