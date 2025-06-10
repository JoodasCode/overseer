'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Activity,
  Clock,
  Zap,
  Users,
  ChevronRight,
  Dot
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
  currentMission: string;
  lastAction: string;
  context: string;
  responseTime: string;
  tools: string[];
  recentActivity: string[];
}

const SAMPLE_AGENTS: Agent[] = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Strategic Coordinator',
    avatar: '🧑‍💼',
    status: 'active',
    efficiency: 94,
    currentMission: 'Q2 Campaign Planning',
    lastAction: 'Notion Integration',
    context: 'Related to: Annual Strategy',
    responseTime: '2m avg',
    tools: ['Notion', 'Gmail', 'Calendar'],
    recentActivity: [
      'Analyzed competitor data',
      'Scheduled team sync'
    ]
  },
  {
    id: 'dana',
    name: 'Dana',
    role: 'Creative Assistant',
    avatar: '👽',
    status: 'collaborating',
    efficiency: 87,
    currentMission: 'Brand visual refresh',
    lastAction: 'Figma Integration',
    context: 'Related to: Q2 Campaign',
    responseTime: '30s avg',
    tools: ['Figma', 'Canva', 'Slack'],
    recentActivity: [
      'Created mood board',
      'Collaborated with Alex'
    ]
  },
  {
    id: 'jamie',
    name: 'Jamie',
    role: 'Team Coordinator',
    avatar: '🛸',
    status: 'active',
    efficiency: 91,
    currentMission: 'Team morale check-in',
    lastAction: 'Slack Integration',
    context: 'Related to: Team Health',
    responseTime: '1m avg',
    tools: ['Slack', 'Gmail', 'Notion'],
    recentActivity: [
      'Facilitated conflict resolution',
      'Scheduled team building'
    ]
  },
  {
    id: 'riley',
    name: 'Riley',
    role: 'Data Analyst',
    avatar: '🤖',
    status: 'active',
    efficiency: 96,
    currentMission: 'Performance metrics review',
    lastAction: 'Analytics Integration',
    context: 'Related to: KPI Dashboard',
    responseTime: '45s avg',
    tools: ['Analytics', 'Sheets', 'PostHog'],
    recentActivity: [
      'Generated weekly report',
      'Identified growth trends'
    ]
  },
  {
    id: 'toby',
    name: 'Toby',
    role: 'Support Coordinator',
    avatar: '👨‍🚀',
    status: 'idle',
    efficiency: 89,
    currentMission: 'Monitoring systems',
    lastAction: 'Discord Integration',
    context: 'Related to: System Health',
    responseTime: '15s avg',
    tools: ['Discord', 'Slack', 'Sentry'],
    recentActivity: [
      'Resolved urgent ticket',
      'Updated documentation'
    ]
  }
];

const STATUS_CONFIG = {
  active: {
    color: 'bg-emerald-500',
    label: 'ACTIVE',
    pulse: true,
    textColor: 'text-emerald-600'
  },
  collaborating: {
    color: 'bg-blue-500',
    label: 'COLLABORATING',
    pulse: true,
    textColor: 'text-blue-600'
  },
  idle: {
    color: 'bg-amber-500',
    label: 'IDLE',
    pulse: false,
    textColor: 'text-amber-600'
  },
  offline: {
    color: 'bg-gray-400',
    label: 'OFFLINE',
    pulse: false,
    textColor: 'text-gray-600'
  }
};

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = STATUS_CONFIG[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1",
        "border-gray-200 hover:border-gray-300",
        "bg-white/80 backdrop-blur-sm"
      )}>
        {/* Gradient Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="p-6 relative z-10">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 text-2xl bg-gray-100 border-2 border-white shadow-sm">
                  <AvatarFallback className="text-2xl bg-transparent">
                    {agent.avatar}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                    statusConfig.color,
                    statusConfig.pulse && "animate-pulse"
                  )} />
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {agent.name}
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  {agent.role}
                </p>
              </div>
            </div>
            
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-semibold px-2.5 py-1",
                statusConfig.textColor,
                "bg-gray-50 border-0"
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Efficiency Meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Efficiency
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {agent.efficiency}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${agent.efficiency}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Current Mission */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              CURRENT MISSION
            </h4>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {agent.currentMission}
            </p>
            <p className="text-xs text-gray-500">
              {agent.context}
            </p>
          </div>

          {/* Last Action & Response Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Last Tool</p>
              <p className="text-sm font-semibold text-gray-900">{agent.lastAction}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Response
              </p>
              <p className="text-sm font-semibold text-gray-900">{agent.responseTime}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">
              RECENT ACTIVITY
            </h4>
            <div className="space-y-1.5">
              {agent.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center text-xs text-gray-600">
                  <Dot className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
                  <span>{activity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className="flex-1 h-9 text-sm font-semibold bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function GamingAgentDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Communications Command Center
            </h1>
            <p className="text-gray-600 font-medium">
              Your AI agent squad • 5 active • All systems operational
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              All Systems Green
            </Badge>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {SAMPLE_AGENTS.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="max-w-7xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">92%</div>
              <div className="text-sm text-gray-600 font-medium">Team Efficiency</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">1.2m</div>
              <div className="text-sm text-gray-600 font-medium">Avg Response</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">3</div>
              <div className="text-sm text-gray-600 font-medium">Active Missions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">14</div>
              <div className="text-sm text-gray-600 font-medium">Tasks Completed</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default GamingAgentDashboard; 