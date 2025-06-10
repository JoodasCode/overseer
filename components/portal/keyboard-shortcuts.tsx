'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundSystem } from '@/lib/sound-system';

interface ShortcutAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: 'navigation' | 'agents' | 'actions' | 'settings';
}

interface KeyboardShortcutsProps {
  actions: ShortcutAction[];
  onNavigate?: (path: string) => void;
}

const categories = {
  navigation: { label: 'Navigation', color: 'text-blue-600' },
  agents: { label: 'Agents', color: 'text-green-600' },
  actions: { label: 'Actions', color: 'text-purple-600' },
  settings: { label: 'Settings', color: 'text-gray-600' }
};

export function KeyboardShortcuts({ actions, onNavigate }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { playModalOpen, playModalClose, playButtonClick, playButtonHover } = useSoundSystem();

  // Filter actions based on query
  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.description?.toLowerCase().includes(query.toLowerCase()) ||
    action.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  // Group actions by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, ShortcutAction[]>);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K to open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
      playModalOpen();
      return;
    }

    // Quick navigation shortcuts
    if ((e.metaKey || e.ctrlKey) && !isOpen) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          onNavigate?.('/portal/dashboard');
          break;
        case '2':
          e.preventDefault();
          onNavigate?.('/portal/agents');
          break;
        case '3':
          e.preventDefault();
          onNavigate?.('/portal/departments');
          break;
        case '4':
          e.preventDefault();
          onNavigate?.('/portal/tasks');
          break;
        case '5':
          e.preventDefault();
          onNavigate?.('/portal/workflow-builder');
          break;
        case '6':
          e.preventDefault();
          onNavigate?.('/portal/integrations');
          break;
        case '7':
          e.preventDefault();
          onNavigate?.('/portal/settings');
          break;
      }
      return;
    }

    // Command palette navigation
    if (isOpen) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          setSelectedIndex(0);
          playModalClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredActions.length - 1 ? prev + 1 : 0
          );
          playButtonHover();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredActions.length - 1
          );
          playButtonHover();
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action();
            setIsOpen(false);
            setQuery('');
            setSelectedIndex(0);
            playButtonClick();
          }
          break;
      }
    }
  }, [isOpen, filteredActions, selectedIndex, onNavigate, playModalOpen, playModalClose, playButtonClick, playButtonHover]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.15
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <Command className="w-3 h-3" />
            <span>+</span>
            <kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs">K</kbd>
            <span className="text-gray-300">for commands</span>
          </div>
        </motion.div>
      </div>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setSelectedIndex(0);
              playModalClose();
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 outline-none text-lg placeholder-gray-400"
                  autoFocus
                />
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <kbd className="bg-gray-100 px-2 py-1 rounded">↑↓</kbd>
                  <span>navigate</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded">↵</kbd>
                  <span>select</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded">esc</kbd>
                  <span>close</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {Object.keys(groupedActions).length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No commands found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedActions).map(([category, categoryActions]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className={categories[category as keyof typeof categories].color}>
                            {categories[category as keyof typeof categories].label}
                          </span>
                        </div>
                        {categoryActions.map((action, actionIndex) => {
                          const globalIndex = filteredActions.indexOf(action);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <motion.div
                              key={action.id}
                              className={cn(
                                "px-4 py-3 cursor-pointer transition-colors",
                                isSelected 
                                  ? "bg-blue-50 border-r-2 border-blue-500" 
                                  : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                action.action();
                                setIsOpen(false);
                                setQuery('');
                                setSelectedIndex(0);
                                playButtonClick();
                              }}
                              onMouseEnter={() => {
                                setSelectedIndex(globalIndex);
                                playButtonHover();
                              }}
                              whileHover={{ x: 4 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {action.icon && (
                                    <div className="text-gray-400">
                                      {action.icon}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {action.label}
                                    </div>
                                    {action.description && (
                                      <div className="text-sm text-gray-500">
                                        {action.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-blue-500"
                                  >
                                    <CornerDownLeft className="w-4 h-4" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Command className="w-3 h-3" />
                      <span>+</span>
                      <span>1-7</span>
                      <span>Quick navigation</span>
                    </div>
                  </div>
                  <div>
                    {filteredActions.length} command{filteredActions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 