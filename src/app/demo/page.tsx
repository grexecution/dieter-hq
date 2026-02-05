'use client';

import { UnifiedInbox } from '@/app/_ui/UnifiedInbox';
import { ProjectsStatusDashboard } from '@/app/_ui/ProjectsStatusDashboard';
import { AgentStatusBar } from '@/app/_ui/AgentStatusBar';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Agent Status Bar */}
      <AgentStatusBar />
      
      {/* 3-Column Layout */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* Left: Unified Inbox */}
        <div className="w-[300px] border-r border-zinc-800 overflow-y-auto">
          <UnifiedInbox />
        </div>
        
        {/* Middle: Chat Area Placeholder */}
        <div className="flex-1 flex items-center justify-center bg-zinc-900">
          <div className="text-center text-zinc-500">
            <p className="text-2xl mb-2">💬 Chat Area</p>
            <p>Multi-Chat with Tabs (Life/Sport/Work/Dev)</p>
          </div>
        </div>
        
        {/* Right: Projects Status */}
        <div className="w-[320px] border-l border-zinc-800 overflow-y-auto">
          <ProjectsStatusDashboard />
        </div>
      </div>
    </div>
  );
}
