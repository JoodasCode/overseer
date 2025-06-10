'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageCircle, Brain, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationEvent {
  id: string;
  type: 'collaboration' | 'discussion' | 'thinking' | 'working';
  agents: {
    id: string;
    name: string;
    avatar: string;
  }[];
  message: string;
  timestamp: Date;
  duration?: number; // in seconds
}

interface CollaborationIndicatorsProps {
  events: CollaborationEvent[];
  className?: string;
}

const eventConfig = {
  collaboration: {
    icon: Users,
    color: 'bg-blue-500',
    label: 'Collaborating',
    animation: 'pulse'
  },
  discussion: {
    icon: MessageCircle,
    color: 'bg-green-500',
    label: 'Discussing',
    animation: 'bounce'
  },
  thinking: {
    icon: Brain,
    color: 'bg-purple-500',
    label: 'Thinking',
    animation: 'spin'
  },
  working: {
    icon: Zap,
    color: 'bg-yellow-500',
    label: 'Working',
    animation: 'pulse'
  }
};

const indicatorVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    scale: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

const avatarVariants = {
  hidden: { scale: 0, x: -10 },
  visible: (i: number) => ({
    scale: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  })
};

function CollaborationIndicator({ event }: { event: CollaborationEvent }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const AUTO_REMOVE_TIME = 10; // Reduced from 30 to 10 seconds
  const config = eventConfig[event.type];
  const Icon = config.icon;

  // Auto-remove after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(AUTO_REMOVE_TIME);
    }, 2000); // Start countdown after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const getAnimationClass = () => {
    switch (config.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'spin':
        return 'animate-spin';
      default:
        return '';
    }
  };

  return (
    <motion.div
      variants={indicatorVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="bg-white rounded-lg shadow-md border border-gray-200 p-3 min-w-64 max-w-xs"
    >
      <div className="flex items-start space-x-2">
        {/* Icon with animation */}
        <motion.div
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white",
            config.color
          )}
          animate={{
            scale: config.animation === 'pulse' ? [1, 1.05, 1] : 1,
            rotate: config.animation === 'spin' ? 360 : 0
          }}
          transition={{
            duration: config.animation === 'spin' ? 3 : 2,
            repeat: Infinity,
            ease: config.animation === 'spin' ? 'linear' : 'easeInOut'
          }}
        >
          <Icon className="w-3 h-3" />
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Header with agents */}
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex -space-x-1">
              <AnimatePresence>
                {event.agents.slice(0, 2).map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    custom={index}
                    variants={avatarVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs">
                      {agent.avatar}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-xs font-medium text-gray-900 truncate">
                {event.agents.map(a => a.name).join(' & ')}
              </span>
            </div>
          </div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-gray-600 mb-1 line-clamp-2"
          >
            {event.message}
          </motion.p>

          {/* Footer with time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Clock className="w-2 h-2" />
              <span>
                {event.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            {timeLeft !== null && timeLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-1 text-xs text-gray-500"
              >
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span>{timeLeft}s</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CollaborationIndicators({ events, className }: CollaborationIndicatorsProps) {
  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-20 right-4 z-30 space-y-2 max-w-xs", className)}>
      <AnimatePresence mode="popLayout">
        {/* Only show the most recent collaboration, not multiple */}
        {sortedEvents.slice(0, 1).map((event) => (
          <CollaborationIndicator key={event.id} event={event} />
        ))}
      </AnimatePresence>
      
      {/* Remove the "more collaborations" indicator to reduce clutter */}
    </div>
  );
}

// Hook for managing collaboration events
export function useCollaborationEvents() {
  const [events, setEvents] = useState<CollaborationEvent[]>([]);

  const addEvent = (event: Omit<CollaborationEvent, 'id' | 'timestamp'>) => {
    const newEvent: CollaborationEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    setEvents(prev => [...prev, newEvent]);
    
    // Auto-remove event after duration + 5 seconds
    if (event.duration) {
      setTimeout(() => {
        setEvents(prev => prev.filter(e => e.id !== newEvent.id));
      }, (event.duration + 5) * 1000);
    }
    
    return newEvent.id;
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const clearEvents = () => {
    setEvents([]);
  };

  // Convenience methods
  const startCollaboration = (agents: CollaborationEvent['agents'], message: string, duration?: number) =>
    addEvent({ type: 'collaboration', agents, message, duration });

  const startDiscussion = (agents: CollaborationEvent['agents'], message: string, duration?: number) =>
    addEvent({ type: 'discussion', agents, message, duration });

  const startThinking = (agents: CollaborationEvent['agents'], message: string, duration?: number) =>
    addEvent({ type: 'thinking', agents, message, duration });

  const startWorking = (agents: CollaborationEvent['agents'], message: string, duration?: number) =>
    addEvent({ type: 'working', agents, message, duration });

  return {
    events,
    addEvent,
    removeEvent,
    clearEvents,
    startCollaboration,
    startDiscussion,
    startThinking,
    startWorking
  };
} 