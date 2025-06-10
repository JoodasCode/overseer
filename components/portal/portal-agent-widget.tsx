'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  MessageSquare,
  Settings,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'idle' | 'offline';
  last_active: string;
  department_type: string | null;
  personality_profile: any;
  is_active: boolean;
}

interface PortalAgentWidgetProps {
  agent: Agent;
  onChatClick?: (agentId: string) => void;
  onSettingsClick?: (agentId: string) => void;
  className?: string;
}

const statusConfig = {
  active: {
    color: 'bg-green-500',
    pulse: 'animate-pulse',
    label: 'Active',
    icon: Activity
  },
  idle: {
    color: 'bg-yellow-500',
    pulse: '',
    label: 'Idle',
    icon: Clock
  },
  offline: {
    color: 'bg-gray-400',
    pulse: '',
    label: 'Offline',
    icon: Clock
  }
};

const departmentColors = {
  communications: 'bg-blue-100 text-blue-800 border-blue-200',
  hr: 'bg-green-100 text-green-800 border-green-200',
  operations: 'bg-orange-100 text-orange-800 border-orange-200',
  product: 'bg-purple-100 text-purple-800 border-purple-200',
  finance: 'bg-red-100 text-red-800 border-red-200',
  analytics: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

const avatarVariants = {
  hover: {
    scale: 1.1,
    rotate: [0, -5, 5, 0],
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export function PortalAgentWidget({ 
  agent, 
  onChatClick, 
  onSettingsClick,
  className 
}: PortalAgentWidgetProps) {
  const statusInfo = statusConfig[agent.status];
  const StatusIcon = statusInfo.icon;

  // Get department color
  const getDepartmentColor = (department: string | null) => {
    return departmentColors[department as keyof typeof departmentColors] || departmentColors.general;
  };

  // Format last active time
  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative transition-all duration-200 hover:shadow-md border-l-4',
        statusInfo.color,
        agent.is_active 
          ? 'border-l-green-500 hover:scale-[1.02]' 
          : 'border-l-gray-300 opacity-75',
        className
      )}
    >
      {/* Status Indicator */}
      <div className={cn(
        'absolute top-3 right-3 w-2 h-2 rounded-full',
        statusInfo.color
      )} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              variants={avatarVariants}
              whileHover="hover"
              className="relative"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-lg">
                  {agent.avatar || agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicator with pulse animation */}
              <div className="absolute -bottom-1 -right-1">
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 border-white",
                  statusInfo.color,
                  statusInfo.pulse
                )} />
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {agent.name}
              </h3>
              <p className={cn('text-xs truncate', statusInfo.color)}>
                {agent.role}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </Badge>
          </motion.div>
        </div>

        {/* Department Tag */}
        {agent.department_type && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium", getDepartmentColor(agent.department_type))}
            >
              {agent.department_type.charAt(0).toUpperCase() + agent.department_type.slice(1)}
            </Badge>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Last Active */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center text-xs text-gray-500"
        >
          <Clock className="w-3 h-3 mr-1" />
          {formatLastActive(agent.last_active)}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-2 pt-2"
        >
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="flex-1"
          >
            <Button
              size="sm"
              variant="default"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => onChatClick?.(agent.id)}
              disabled={!agent.is_active}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </Button>
          </motion.div>
          
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-gray-50"
              onClick={() => onSettingsClick?.(agent.id)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>
    </motion.div>
  );
} 