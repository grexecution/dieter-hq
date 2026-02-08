'use client';

/**
 * GlobalActivityBar
 * 
 * Shows real-time activity for ALL sessions (main + subagents).
 * Uses WebSocket events, NOT HTTP polling.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Cpu, Wrench, PenLine, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useGlobalActivity, 
  getActivityLabel,
  type SessionActivity 
} from '@/lib/openclaw/hooks';

// ============================================================================
// Session Name Formatter
// ============================================================================

/**
 * Converts technical session keys to human-readable names
 * 
 * Examples:
 * - "agent:main:dieter-hq:main" → "Dieter HQ"
 * - "agent:subagent:gyn-portale:abc123" → "Gyn Portale"
 * - "agent:subagent:security-agent:xyz" → "Security Agent"
 * - "gyn-websites" → "Gyn Websites"
 */
function formatSessionName(sessionKey: string, label?: string): string {
  // If we have a clean label, use it
  if (label && !label.includes(':')) {
    return formatSlug(label);
  }
  
  // Parse session key: agent:type:name:id
  const parts = sessionKey.split(':');
  
  if (parts.length >= 3) {
    // Get the meaningful part (usually index 2)
    const name = parts[2];
    return formatSlug(name);
  }
  
  // Fallback: just format whatever we have
  return formatSlug(label || sessionKey);
}

/**
 * Convert slug to Title Case
 * "gyn-portale" → "Gyn Portale"
 * "security_agent" → "Security Agent"
 */
function formatSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim() || 'Agent';
}

// ============================================================================
// Activity Icon
// ============================================================================

function ActivityIcon({ type }: { type: SessionActivity['type'] }) {
  switch (type) {
    case 'thinking':
      return <Brain className="h-3.5 w-3.5 text-purple-500 animate-pulse" />;
    case 'streaming':
      return <PenLine className="h-3.5 w-3.5 text-blue-500" />;
    case 'tool':
      return <Wrench className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
    case 'queued':
      return <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />;
    case 'idle':
    default:
      return <Bot className="h-3.5 w-3.5 text-zinc-400" />;
  }
}

// ============================================================================
// Session Chip
// ============================================================================

interface SessionChipProps {
  session: SessionActivity;
}

const SessionChip = memo(function SessionChip({ session }: SessionChipProps) {
  const activityLabel = getActivityLabel(session);
  const isActive = session.type !== 'idle';
  const displayName = formatSessionName(session.sessionKey, session.label);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
        "border transition-colors",
        isActive
          ? "bg-zinc-900 border-zinc-700 text-zinc-100 dark:bg-zinc-800 dark:border-zinc-600"
          : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
      )}
    >
      <ActivityIcon type={session.type} />
      <span className="font-medium truncate max-w-[100px]">
        {displayName}
      </span>
      {activityLabel && (
        <>
          <span className="text-zinc-500 dark:text-zinc-400">·</span>
          <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[120px]">
            {activityLabel}
          </span>
        </>
      )}
      {session.toolName && (
        <code className="text-[10px] bg-zinc-800 dark:bg-zinc-700 px-1 py-0.5 rounded truncate max-w-[100px]">
          {session.toolName}
        </code>
      )}
    </motion.div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

interface GlobalActivityBarProps {
  className?: string;
  showWhenEmpty?: boolean;
}

export function GlobalActivityBar({ 
  className,
  showWhenEmpty = false 
}: GlobalActivityBarProps) {
  const { 
    sessions, 
    activeCount, 
    isAnyActive,
    mainSession, 
    subagents,
    connected,
    connecting 
  } = useGlobalActivity();

  // Don't show if not connected yet
  if (!connected && !connecting) {
    return null;
  }

  // Don't show if empty (unless forced)
  if (!isAnyActive && !showWhenEmpty) {
    return null;
  }

  // Sort: active first, then main before subagents
  const allSessions = Array.from(sessions.values())
    .filter(s => s.type !== 'idle')
    .sort((a, b) => {
      // Active first
      if (a.type !== 'idle' && b.type === 'idle') return -1;
      if (b.type !== 'idle' && a.type === 'idle') return 1;
      // Main before subagents
      const aIsSub = a.sessionKey.includes('subagent');
      const bIsSub = b.sessionKey.includes('subagent');
      if (!aIsSub && bIsSub) return -1;
      if (aIsSub && !bIsSub) return 1;
      // By timestamp
      return b.timestamp - a.timestamp;
    });

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2",
      "bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm",
      "border-b border-zinc-200 dark:border-zinc-800",
      className
    )}>
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-emerald-500" : connecting ? "bg-amber-500 animate-pulse" : "bg-zinc-400"
        )} />
        <span className="hidden sm:inline">
          {connected ? 'Live' : connecting ? 'Verbinde...' : 'Offline'}
        </span>
      </div>

      {/* Divider */}
      {allSessions.length > 0 && (
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      )}

      {/* Session chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {allSessions.map(session => (
            <SessionChip key={session.sessionKey} session={session} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {allSessions.length === 0 && showWhenEmpty && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Keine aktiven Sessions
        </span>
      )}

      {/* Active count badge */}
      {activeCount > 0 && (
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {activeCount}
          </span>
          <span>aktiv</span>
        </div>
      )}
    </div>
  );
}

export default GlobalActivityBar;
