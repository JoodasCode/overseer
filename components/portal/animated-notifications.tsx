'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundSystem } from '@/lib/sound-system';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'celebration';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const notificationConfig = {
  success: {
    icon: CheckCircle,
    colors: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-600',
    sound: 'taskCompleted' as const
  },
  error: {
    icon: AlertCircle,
    colors: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-600',
    sound: 'agentError' as const
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconColor: 'text-yellow-600',
    sound: 'needsAttention' as const
  },
  info: {
    icon: Info,
    colors: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-600',
    sound: 'newActivity' as const
  },
  celebration: {
    icon: Sparkles,
    colors: 'bg-purple-50 border-purple-200 text-purple-800',
    iconColor: 'text-purple-600',
    sound: 'levelUp' as const
  }
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    rotateX: -90
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: 300,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const celebrationVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    rotate: -10
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      duration: 0.6
    }
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    rotate: 10,
    transition: {
      duration: 0.3
    }
  }
};

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;
  const { playTaskCompleted, playAgentError, playNeedsAttention, playNewActivity, playLevelUp } = useSoundSystem();
  
  useEffect(() => {
    // Play sound when notification appears
    switch (config.sound) {
      case 'taskCompleted':
        playTaskCompleted();
        break;
      case 'agentError':
        playAgentError();
        break;
      case 'needsAttention':
        playNeedsAttention();
        break;
      case 'newActivity':
        playNewActivity();
        break;
      case 'levelUp':
        playLevelUp();
        break;
    }
  }, []);

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const variants = notification.type === 'celebration' ? celebrationVariants : itemVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={cn(
        "relative max-w-sm w-full border rounded-lg shadow-lg backdrop-blur-sm",
        config.colors,
        "overflow-hidden"
      )}
    >
      {/* Animated background for celebration */}
      {notification.type === 'celebration' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-yellow-400/20"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      <div className="relative p-4">
        <div className="flex items-start">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="flex-shrink-0"
          >
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </motion.div>
          
          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium"
            >
              {notification.title}
            </motion.h3>
            
            {notification.message && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-1 text-sm opacity-90"
              >
                {notification.message}
              </motion.p>
            )}
            
            {notification.action && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {notification.action.label}
              </motion.button>
            )}
          </div>
          
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {notification.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: notification.duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message?: string, action?: Notification['action']) => 
    addNotification({ type: 'success', title, message, action });

  const error = (title: string, message?: string, action?: Notification['action']) => 
    addNotification({ type: 'error', title, message, action, duration: 8000 });

  const warning = (title: string, message?: string, action?: Notification['action']) => 
    addNotification({ type: 'warning', title, message, action });

  const info = (title: string, message?: string, action?: Notification['action']) => 
    addNotification({ type: 'info', title, message, action });

  const celebrate = (title: string, message?: string, action?: Notification['action']) => 
    addNotification({ type: 'celebration', title, message, action, duration: 6000 });

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    celebrate
  };
} 