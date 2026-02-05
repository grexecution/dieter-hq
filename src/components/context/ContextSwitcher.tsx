'use client';

/**
 * Context Switcher Component
 * 
 * Provides a UI for switching between conversation contexts
 * with visual indicators for status, activity, and recommendations.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Context,
  ContextType,
  ContextStatus,
  ThreadRecommendation,
} from '@/lib/ai/context/types';

// ============================================================================
// TYPES
// ============================================================================

interface ContextSwitcherProps {
  contexts: Context[];
  activeContextId: string | null;
  recommendations?: ThreadRecommendation[];
  onSwitch: (contextId: string) => void;
  onCreate: (type: ContextType, goal?: string) => void;
  onArchive: (contextId: string) => void;
  onDelete: (contextId: string) => void;
  compact?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getContextIcon(type: ContextType): string {
  const icons: Record<ContextType, string> = {
    primary: '💬',
    task: '⚡',
    background: '🔄',
    external: '🌐',
    specialist: '🎯',
  };
  return icons[type] || '📝';
}

function getStatusColor(status: ContextStatus): string {
  const colors: Record<ContextStatus, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    failed: 'bg-red-500',
    archived: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-400';
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ContextItemProps {
  context: Context;
  isActive: boolean;
  recommendation?: ThreadRecommendation;
  onSelect: () => void;
  onArchive: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function ContextItem({
  context,
  isActive,
  recommendation,
  onSelect,
  onArchive,
  onDelete,
  compact,
}: ContextItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`
        relative group rounded-lg border transition-all cursor-pointer
        ${isActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${compact ? 'p-2' : 'p-3'}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(context.status)}`} />

      {/* Main content */}
      <div className="flex items-start gap-2">
        <span className="text-lg">{getContextIcon(context.type)}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
              {context.goal || `${context.type} context`}
            </h4>
            {recommendation && recommendation.relevanceScore > 70 && (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                Suggested
              </span>
            )}
          </div>
          
          {!compact && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {context.messages.length} messages • {formatTimeAgo(context.lastActiveAt)}
              </p>
              
              {context.summary?.shortSummary && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {context.summary.shortSummary}
                </p>
              )}
              
              {/* Task indicator */}
              {(context.tasks.active.length > 0 || context.tasks.pending.length > 0) && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    ⚡ {context.tasks.active.length} active, {context.tasks.pending.length} pending
                  </span>
                </div>
              )}
              
              {/* Recommendation reason */}
              {recommendation && recommendation.reasons.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  💡 {recommendation.reasons[0]}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions overlay */}
      {showActions && !compact && (
        <div 
          className="absolute top-2 right-6 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {context.status !== 'archived' && (
            <button
              onClick={onArchive}
              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
              title="Archive"
            >
              📥
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

interface NewContextButtonProps {
  onCreate: (type: ContextType, goal?: string) => void;
}

function NewContextButton({ onCreate }: NewContextButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [selectedType, setSelectedType] = useState<ContextType>('primary');

  const contextTypes: Array<{ type: ContextType; label: string; icon: string }> = [
    { type: 'primary', label: 'General Chat', icon: '💬' },
    { type: 'task', label: 'Task/Subagent', icon: '⚡' },
    { type: 'specialist', label: 'Specialist', icon: '🎯' },
    { type: 'background', label: 'Background', icon: '🔄' },
  ];

  const handleCreate = () => {
    onCreate(selectedType, goal || undefined);
    setGoal('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        + New Context
      </button>
    );
  }

  return (
    <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
      <div className="flex flex-wrap gap-2">
        {contextTypes.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`
              px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors
              ${selectedType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      
      <input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="What's the goal? (optional)"
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Create
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContextSwitcher({
  contexts,
  activeContextId,
  recommendations = [],
  onSwitch,
  onCreate,
  onArchive,
  onDelete,
  compact = false,
}: ContextSwitcherProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Create recommendation map for quick lookup
  const recommendationMap = useMemo(() => {
    const map = new Map<string, ThreadRecommendation>();
    for (const rec of recommendations) {
      map.set(rec.contextId, rec);
    }
    return map;
  }, [recommendations]);

  // Filter and sort contexts
  const filteredContexts = useMemo(() => {
    let filtered = contexts;

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(c => c.status !== 'archived');
    } else if (filter === 'archived') {
      filtered = filtered.filter(c => c.status === 'archived');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.goal?.toLowerCase().includes(query) ||
        c.summary?.shortSummary?.toLowerCase().includes(query) ||
        c.summary?.topics.some(t => t.includes(query))
      );
    }

    // Sort: active first, then by recommendation score, then by last active
    return filtered.sort((a, b) => {
      // Active context always first
      if (a.id === activeContextId) return -1;
      if (b.id === activeContextId) return 1;

      // Then by recommendation score
      const aRec = recommendationMap.get(a.id)?.relevanceScore || 0;
      const bRec = recommendationMap.get(b.id)?.relevanceScore || 0;
      if (aRec !== bRec) return bRec - aRec;

      // Then by last active
      return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
    });
  }, [contexts, filter, searchQuery, activeContextId, recommendationMap]);

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Contexts ({contexts.length})
          </h3>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-1">
            {(['active', 'all', 'archived'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${filter === f
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {!compact && contexts.length > 5 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contexts..."
          className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {/* Context list */}
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
        {filteredContexts.map((context) => (
          <ContextItem
            key={context.id}
            context={context}
            isActive={context.id === activeContextId}
            recommendation={recommendationMap.get(context.id)}
            onSelect={() => onSwitch(context.id)}
            onArchive={() => onArchive(context.id)}
            onDelete={() => onDelete(context.id)}
            compact={compact}
          />
        ))}
      </div>

      {/* New context button */}
      {!compact && <NewContextButton onCreate={onCreate} />}

      {/* Empty state */}
      {filteredContexts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No contexts found</p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-blue-500 hover:underline mt-1"
            >
              Show all contexts
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ContextSwitcher;
