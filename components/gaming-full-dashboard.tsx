'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home,
  Users,
  MessageSquare, 
  BarChart3, 
  Settings, 
  Activity,
  Clock,
  Zap,
  Bell,
  Search,
  ChevronRight,
  Dot,
  Play,
  Download,
  TrendingUp,
  Shield,
  Gamepad2,
  Target,
  Cpu,
  Database,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'collaborating' | 'idle' | 'offline';
  efficiency: number;
  level: number;
  tasksCompleted: number;
  hoursPlayed: number;
  department: string;
}

interface Mission {
  id: string;
  title: string;
  progress: number;
  status: 'active' | 'completed' | 'pending';
  agent: string;
}

interface Activity {
  id: string;
  action: string;
  agent: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

const SAMPLE_AGENTS: Agent[] = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Strategic Coordinator',
    avatar: '🧑‍💼',
    status: 'active',
    efficiency: 94,
    level: 15,
    tasksCompleted: 247,
    hoursPlayed: 89,
    department: 'Communications'
  },
  {
    id: 'dana',
    name: 'Dana',
    role: 'Creative Assistant',
    avatar: '👽',
    status: 'collaborating',
    efficiency: 87,
    level: 12,
    tasksCompleted: 189,
    hoursPlayed: 67,
    department: 'Communications'
  },
  {
    id: 'jamie',
    name: 'Jamie',
    role: 'Team Coordinator',
    avatar: '🛸',
    status: 'active',
    efficiency: 91,
    level: 14,
    tasksCompleted: 203,
    hoursPlayed: 78,
    department: 'Communications'
  },
  {
    id: 'riley',
    name: 'Riley',
    role: 'Data Analyst',
    avatar: '🤖',
    status: 'active',
    efficiency: 96,
    level: 18,
    tasksCompleted: 312,
    hoursPlayed: 95,
    department: 'Communications'
  },
  {
    id: 'sam',
    name: 'Sam',
    role: 'Finance Lead',
    avatar: '💰',
    status: 'idle',
    efficiency: 89,
    level: 16,
    tasksCompleted: 267,
    hoursPlayed: 82,
    department: 'Finance'
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'HR Specialist',
    avatar: '👩‍💼',
    status: 'active',
    efficiency: 93,
    level: 13,
    tasksCompleted: 195,
    hoursPlayed: 71,
    department: 'HR'
  }
];

const ACTIVE_MISSIONS: Mission[] = [
  { id: '1', title: 'Q2 Campaign Launch', progress: 73, status: 'active', agent: 'Alex' },
  { id: '2', title: 'Brand Refresh Project', progress: 45, status: 'active', agent: 'Dana' },
  { id: '3', title: 'Team Onboarding', progress: 89, status: 'active', agent: 'Maya' },
  { id: '4', title: 'Budget Analysis', progress: 100, status: 'completed', agent: 'Sam' }
];

const RECENT_ACTIVITIES: Activity[] = [
  { id: '1', action: 'Completed email campaign draft', agent: 'Alex', time: '2m ago', type: 'success' },
  { id: '2', action: 'Started collaborating with Dana', agent: 'Alex', time: '5m ago', type: 'info' },
  { id: '3', action: 'Uploaded new design concepts', agent: 'Dana', time: '8m ago', type: 'success' },
  { id: '4', action: 'System maintenance required', agent: 'System', time: '12m ago', type: 'warning' },
  { id: '5', action: 'Generated performance report', agent: 'Riley', time: '15m ago', type: 'success' }
];

const SIDEBAR_ITEMS = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: Users, label: 'Agents', count: 6 },
  { icon: Target, label: 'Missions', count: 3 },
  { icon: BarChart3, label: 'Analytics' },
  { icon: MessageSquare, label: 'Chat', count: 2 },
  { icon: Database, label: 'Memory' },
  { icon: Shield, label: 'Security' },
  { icon: Settings, label: 'Settings' }
];

function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AGENTS OS</h1>
            <p className="text-slate-400 text-xs">Command Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-2 py-4">
          {SIDEBAR_ITEMS.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-11",
                item.active 
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="flex-1">{item.label}</span>
              {item.count && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-emerald-500 text-white">
              NH
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">Night Fury</p>
            <p className="text-slate-400 text-xs">@nightfury</p>
          </div>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-slate-900">Mission Control</h2>
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
          <Wifi className="w-3 h-3 mr-1" />
          All Systems Online
        </Badge>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents, missions..."
            className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </Button>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const statusColors = {
    active: 'bg-emerald-500',
    collaborating: 'bg-blue-500',
    idle: 'bg-amber-500',
    offline: 'bg-slate-400'
  };

  return (
    <Card className="bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-12 h-12 text-xl bg-slate-100">
                <AvatarFallback className="text-xl bg-transparent">
                  {agent.avatar}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                statusColors[agent.status]
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{agent.name}</h3>
              <p className="text-slate-500 text-sm">{agent.role}</p>
            </div>
          </div>
          
          <Badge variant="outline" className="text-xs">
            Lvl {agent.level}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{agent.efficiency}%</div>
            <div className="text-xs text-slate-500">Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{agent.tasksCompleted}</div>
            <div className="text-xs text-slate-500">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{agent.hoursPlayed}h</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const statusColors = {
    active: 'text-blue-600 bg-blue-100',
    completed: 'text-emerald-600 bg-emerald-100',
    pending: 'text-amber-600 bg-amber-100'
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-slate-900">{mission.title}</h4>
          <Badge className={statusColors[mission.status]}>
            {mission.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${mission.progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{mission.progress}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Assigned to: {mission.agent}</p>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const typeIcons = {
    success: <span className="text-emerald-500">✓</span>,
    info: <span className="text-blue-500">ℹ</span>,
    warning: <span className="text-amber-500">⚠</span>
  };

  return (
    <div className="space-y-3">
      {RECENT_ACTIVITIES.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex-shrink-0 mt-0.5">
            {typeIcons[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900">{activity.action}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-500">{activity.agent}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GamingFullDashboard() {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />
        
        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Active Agents</p>
                      <p className="text-3xl font-bold">5</p>
                    </div>
                    <Users className="w-8 h-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Active Missions</p>
                      <p className="text-3xl font-bold">3</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Efficiency</p>
                      <p className="text-3xl font-bold">92%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Response Time</p>
                      <p className="text-3xl font-bold">1.2m</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Agents Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Your Agent Squad</h2>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Manage All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {SAMPLE_AGENTS.slice(0, 4).map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>

                {/* Active Missions */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Active Missions</h2>
                    <Button variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {ACTIVE_MISSIONS.map((mission) => (
                      <MissionCard key={mission.id} mission={mission} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-8">
                
                {/* Featured Agent */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="w-16 h-16 text-2xl bg-emerald-500">
                        <AvatarFallback className="text-2xl text-white bg-transparent">
                          🤖
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">Riley</h3>
                        <p className="text-slate-300">Data Analyst</p>
                        <Badge className="bg-emerald-500/20 text-emerald-300 mt-1">
                          Top Performer
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">96%</div>
                        <div className="text-xs text-slate-400">Efficiency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">312</div>
                        <div className="text-xs text-slate-400">Tasks Done</div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat with Riley
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-80">
                      <ActivityFeed />
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">CPU Usage</span>
                      <span className="text-sm font-medium">23%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-1/4" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Memory</span>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-2/3" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">API Calls</span>
                      <span className="text-sm font-medium">1.2k/hr</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamingFullDashboard; 