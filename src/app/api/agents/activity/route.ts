import { NextResponse } from 'next/server';
import { getActivityCache, getCacheStats } from '@/lib/agent-activity-cache';

export interface AgentActivityItem {
  sessionKey: string;
  agentId: string;
  label: string;
  model: string;
  status: 'active' | 'idle' | 'error';
  workspace?: string;
  task?: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  runtimeMs: number;
  createdAt: string;
  updatedAt: string;
  isSubagent: boolean;
  parentSession?: string;
}

interface ActivitySummary {
  total: number;
  active: number;
  idle: number;
  error: number;
  totalTokens: number;
}

/**
 * Parse session key to extract agent info
 */
function parseSessionKey(key: string): { 
  agentId: string; 
  isSubagent: boolean; 
  workspace?: string;
  label: string;
} {
  const parts = key.split(':');
  
  if (parts[0] !== 'agent' || parts.length < 3) {
    return { agentId: 'unknown', isSubagent: false, label: key };
  }
  
  const agentId = parts[1];
  
  // Check if sub-agent: agent:coder:subagent:uuid
  if (parts[2] === 'subagent') {
    return { 
      agentId, 
      isSubagent: true, 
      label: parts.slice(3).join(':') || 'sub-agent'
    };
  }
  
  // Check for workspace: agent:coder:dieter-hq:dev:workspacename
  if (parts.length >= 5 && parts[2] === 'dieter-hq' && parts[3] === 'dev') {
    return { 
      agentId, 
      isSubagent: false, 
      workspace: parts[4],
      label: `${agentId} / ${parts[4]}`
    };
  }
  
  // Main session: agent:main:main
  return { 
    agentId, 
    isSubagent: false, 
    label: agentId.charAt(0).toUpperCase() + agentId.slice(1)
  };
}

/**
 * Determine status based on updatedAt timestamp
 */
function getStatus(updatedAt: number, abortedLastRun?: boolean): 'active' | 'idle' | 'error' {
  if (abortedLastRun) return 'error';
  
  const now = Date.now();
  const diff = now - updatedAt;
  
  if (diff < 30_000) return 'active'; // < 30s
  return 'idle';
}

/**
 * GET /api/agents/activity
 * Returns agent activity for the panel
 */
export async function GET() {
  try {
    const activityData = await getActivityCache();
    const cacheStats = await getCacheStats();
    
    if (!activityData) {
      return NextResponse.json({
        ok: false,
        error: 'No activity data available - waiting for sync',
        agents: [],
        summary: { total: 0, active: 0, idle: 0, error: 0, totalTokens: 0 },
        cache: cacheStats,
      });
    }

    const agents: AgentActivityItem[] = [];
    const summary: ActivitySummary = {
      total: 0,
      active: 0,
      idle: 0,
      error: 0,
      totalTokens: 0,
    };

    for (const session of activityData.sessions) {
      const { agentId, isSubagent, workspace, label } = parseSessionKey(session.key);
      const status = getStatus(session.updatedAt, session.abortedLastRun);
      
      const model = session.model || 'unknown';
      const runtimeMs = session.updatedAt ? Date.now() - session.updatedAt : 0;
      
      const item: AgentActivityItem = {
        sessionKey: session.key,
        agentId,
        label: session.label || label,
        model,
        status,
        workspace,
        tokens: {
          input: 0,
          output: 0,
          total: session.totalTokens || 0,
        },
        runtimeMs: Math.max(0, runtimeMs),
        createdAt: new Date(session.updatedAt).toISOString(),
        updatedAt: new Date(session.updatedAt).toISOString(),
        isSubagent: isSubagent,
        task: session.lastMessage,
      };

      agents.push(item);
      
      summary.total++;
      summary.totalTokens += session.totalTokens || 0;
      if (status === 'active') summary.active++;
      else if (status === 'error') summary.error++;
      else summary.idle++;
    }

    // Sort: active first, then by updatedAt desc
    agents.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({
      ok: true,
      agents,
      summary,
      updatedAt: activityData.updatedAt,
      cache: {
        hit: cacheStats.hasData && !cacheStats.isStale,
        ageMs: cacheStats.ageMs,
      },
    });
  } catch (error) {
    console.error('[agents/activity] Error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to fetch agent activity',
        details: error instanceof Error ? error.message : 'Unknown error',
        agents: [],
        summary: { total: 0, active: 0, idle: 0, error: 0, totalTokens: 0 },
      },
      { status: 500 }
    );
  }
}
