import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

type AgentStatus = 'active' | 'working' | 'idle' | 'blocked';

interface LiveAgent {
  id: string;
  agentId: string;
  label: string;
  status: AgentStatus;
  lastActivity: number | null;
  currentTask: string | null;
  progress: number | null;
  parentId: string | null;
}

interface SessionFile {
  file: string;
  mtimeMs: number;
  agentId: string;
  isSubagent: boolean;
  parentId: string | null;
  fullPath: string;
}

const OPENCLAW_ROOT = '/Users/dieter/.openclaw';

function getStatus(mtimeMs: number): AgentStatus {
  const age = Date.now() - mtimeMs;
  if (age < 30000) return 'active'; // Active in last 30s
  if (age < 120000) return 'working'; // Working in last 2min
  return 'idle';
}

async function listAgentSessions(agentDir: string, agentId: string): Promise<SessionFile[]> {
  const sessionsDir = path.join(agentDir, 'sessions');
  let entries: string[] = [];
  
  try {
    entries = await fs.readdir(sessionsDir);
  } catch {
    return [];
  }

  // Only include active .jsonl files (not deleted ones)
  const files = entries.filter((f) => f.endsWith('.jsonl') && !f.includes('.deleted'));
  
  const stats = await Promise.all(
    files.map(async (f) => {
      const fp = path.join(sessionsDir, f);
      try {
        const st = await fs.stat(fp);
        // Subagent detection: agents other than 'main' that are spawned by main
        const isSubagent = agentId !== 'main';
        
        return {
          file: f,
          mtimeMs: st.mtimeMs,
          agentId,
          isSubagent,
          parentId: isSubagent ? 'main' : null,
          fullPath: fp,
        };
      } catch {
        return null;
      }
    }),
  );

  return stats.filter((x): x is SessionFile => x !== null);
}

async function getAllSessions(): Promise<SessionFile[]> {
  const agentsDir = path.join(OPENCLAW_ROOT, 'agents');
  let agents: string[] = [];
  
  try {
    agents = await fs.readdir(agentsDir);
  } catch {
    return [];
  }

  const allSessions: SessionFile[] = [];
  
  for (const agent of agents) {
    const agentPath = path.join(agentsDir, agent);
    try {
      const stat = await fs.stat(agentPath);
      if (stat.isDirectory()) {
        const sessions = await listAgentSessions(agentPath, agent);
        allSessions.push(...sessions);
      }
    } catch {
      // Skip if can't access
    }
  }

  return allSessions;
}

async function extractCurrentTask(fullPath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.trim().split('\n');
    
    // Go through last few lines to find an assistant message with text
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
      const line = lines[i];
      if (!line) continue;
      
      try {
        const data = JSON.parse(line);
        if (data.role === 'assistant' && data.content && Array.isArray(data.content)) {
          const textBlock = data.content.find((c: { type: string }) => c.type === 'text');
          if (textBlock?.text) {
            // Get first line or first 50 chars
            const firstLine = textBlock.text.split('\n')[0]?.trim();
            if (firstLine) {
              return firstLine.slice(0, 60);
            }
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sessions = await getAllSessions();
    const now = Date.now();
    
    // Filter to recent sessions (last 24h) to avoid clutter
    const recentSessions = sessions.filter((s) => now - s.mtimeMs < 24 * 60 * 60 * 1000);
    
    // Convert to LiveAgent format
    const agents: LiveAgent[] = await Promise.all(
      recentSessions.map(async (s) => {
        const currentTask = await extractCurrentTask(s.fullPath);
        const sessionUuid = s.file.replace('.jsonl', '');
        
        return {
          id: `${s.agentId}:${sessionUuid}`,
          agentId: s.agentId,
          label: `${s.agentId}:${sessionUuid.slice(0, 8)}`,
          status: getStatus(s.mtimeMs),
          lastActivity: s.mtimeMs,
          currentTask,
          progress: null,
          parentId: s.parentId,
        };
      })
    );

    // Sort by last activity (most recent first)
    agents.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

    // Aggregate stats
    const byAgent: Record<string, { active: number; total: number }> = {};
    for (const agent of agents) {
      if (!byAgent[agent.agentId]) {
        byAgent[agent.agentId] = { active: 0, total: 0 };
      }
      byAgent[agent.agentId].total++;
      if (agent.status === 'active' || agent.status === 'working') {
        byAgent[agent.agentId].active++;
      }
    }

    return NextResponse.json({ 
      agents,
      summary: byAgent,
      timestamp: Date.now(),
      source: 'filesystem'
    });
  } catch (error) {
    console.error('Failed to list agent sessions:', error);
    return NextResponse.json({ 
      agents: [],
      summary: {},
      error: String(error),
      timestamp: Date.now()
    }, { status: 200 }); // Always return 200 to not break UI
  }
}
