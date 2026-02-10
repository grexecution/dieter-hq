'use client';

/**
 * Activity Bar - Shows real-time activity across all sessions
 */

import { useEffect, useState } from 'react';
import { Loader2, Radio, Wifi, WifiOff, Wrench, Brain, Pen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useMultiChat, 
  sessionKeyToDisplayName 
} from '@/lib/openclaw';
import type { AgentActivity } from '@/lib/openclaw/client';

function ActivityIcon({ type }: { type: AgentActivity['type'] }) {
  switch (type) {
    case 'thinking':
      return <Brain className="h-3 w-3 animate-pulse" />;
    case 'streaming':
      return <Pen className="h-3 w-3 animate-pulse" />;
    case 'tool':
      return <Wrench className="h-3 w-3 animate-spin" />;
    case 'queued':
      return <Clock className="h-3 w-3" />;
    default:
      return null;
  }
}

function ActivityLabel({ activity }: { activity: AgentActivity }) {
  switch (activity.type) {
    case 'thinking':
      return <span>Denkt nach...</span>;
    case 'streaming':
      return <span>Schreibt...</span>;
    case 'tool':
      return <span>{activity.toolName || 'Tool'}...</span>;
    case 'queued':
      return <span>Warten...</span>;
    default:
      return null;
  }
}

export function ActivityBar() {
  const { connected, connecting, globalActivities, isUsingHttpFallback } = useMultiChat();
  const [visible, setVisible] = useState(false);

  // Only show when there's activity or connecting
  useEffect(() => {
    const hasActivity = globalActivities.size > 0;
    setVisible(hasActivity || connecting);
  }, [globalActivities, connecting]);

  // Filter out idle activities and sort by most recent
  const activeItems = Array.from(globalActivities.entries())
    .filter(([_, activity]) => activity.type !== 'idle')
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .slice(0, 3); // Show max 3 items

  if (!visible && connected) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 text-xs border-b transition-all",
      connected 
        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
        : connecting
        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
        : isUsingHttpFallback
        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
        : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
    )}>
      {/* Connection status */}
      <div className="flex items-center gap-1">
        {connected ? (
          <>
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="font-medium">Live</span>
          </>
        ) : connecting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Verbinde...</span>
          </>
        ) : isUsingHttpFallback ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>HTTP</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Separator */}
      {activeItems.length > 0 && (
        <div className="w-px h-3 bg-current opacity-30" />
      )}

      {/* Active sessions */}
      <div className="flex items-center gap-3 overflow-hidden">
        {activeItems.map(([sessionKey, activity]) => (
          <div 
            key={sessionKey}
            className="flex items-center gap-1 min-w-0"
          >
            <ActivityIcon type={activity.type} />
            <span className="truncate font-medium">
              {sessionKeyToDisplayName(sessionKey)}
            </span>
            <span className="opacity-70">·</span>
            <span className="truncate opacity-70">
              <ActivityLabel activity={activity} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
