"use client";

import { useState } from "react";
import { 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Bug, 
  PullRequest, 
  Shield, 
  Package, 
  Zap,
  TrendingUp,
  ExternalLink,
  MoreHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectHealth {
  id: string;
  name: string;
  status: "healthy" | "attention" | "critical";
  branch: string;
  lastDeploy: string;
  openPRs: number;
  openIssues: number;
  dependencies: {
    outdated: number;
    vulnerable: number;
  };
  tests: {
    coverage: number;
    passing: boolean;
  };
  build: {
    passing: boolean;
    duration: string;
  };
  suggestions: Array<{
    id: string;
    type: "security" | "dependency" | "performance" | "bug";
    title: string;
    confidence: number;
  }>;
}

const mockProjects: ProjectHealth[] = [
  {
    id: "1",
    name: "olivadis-shop",
    status: "attention",
    branch: "main (2 behind)",
    lastDeploy: "3h ago",
    openPRs: 1,
    openIssues: 2,
    dependencies: { outdated: 3, vulnerable: 0 },
    tests: { coverage: 94, passing: true },
    build: { passing: true, duration: "2.3s" },
    suggestions: [
      {
        id: "1",
        type: "dependency",
        title: "Update lodash to 4.17.21",
        confidence: 95
      }
    ]
  },
  {
    id: "2", 
    name: "bluemonkeys-api",
    status: "healthy",
    branch: "main (up to date)",
    lastDeploy: "1d ago",
    openPRs: 0,
    openIssues: 1,
    dependencies: { outdated: 1, vulnerable: 0 },
    tests: { coverage: 98, passing: true },
    build: { passing: true, duration: "1.8s" },
    suggestions: []
  },
  {
    id: "3",
    name: "dieter-hq", 
    status: "healthy",
    branch: "main (up to date)",
    lastDeploy: "just now",
    openPRs: 2,
    openIssues: 0,
    dependencies: { outdated: 0, vulnerable: 0 },
    tests: { coverage: 89, passing: true },
    build: { passing: true, duration: "4.2s" },
    suggestions: [
      {
        id: "2",
        type: "performance", 
        title: "Optimize bundle size",
        confidence: 73
      }
    ]
  },
  {
    id: "4",
    name: "blackboard-headless",
    status: "critical",
    branch: "develop (5 behind)",
    lastDeploy: "1w ago",
    openPRs: 3,
    openIssues: 7,
    dependencies: { outdated: 12, vulnerable: 2 },
    tests: { coverage: 67, passing: false },
    build: { passing: false, duration: "N/A" },
    suggestions: [
      {
        id: "3",
        type: "security",
        title: "Fix critical security vulnerabilities",
        confidence: 100
      },
      {
        id: "4", 
        type: "bug",
        title: "Fix failing tests in payment module",
        confidence: 89
      }
    ]
  }
];

const statusColors = {
  healthy: "text-green-500 bg-green-500/10",
  attention: "text-yellow-500 bg-yellow-500/10", 
  critical: "text-red-500 bg-red-500/10"
};

const statusIcons = {
  healthy: CheckCircle2,
  attention: AlertTriangle,
  critical: AlertTriangle
};

const suggestionTypeIcons = {
  security: Shield,
  dependency: Package,
  performance: Zap,
  bug: Bug
};

export function ProjectsStatusDashboard() {
  const [projects] = useState(mockProjects);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const healthyCount = projects.filter(p => p.status === "healthy").length;
  const attentionCount = projects.filter(p => p.status === "attention").length;
  const criticalCount = projects.filter(p => p.status === "critical").length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Projects</h2>
          <Badge variant="outline" className="text-xs">
            {projects.length}
          </Badge>
        </div>
      </div>

      {/* Health Overview */}
      <div className="border-b border-white/10 p-4 dark:border-white/5">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-semibold text-green-500">{healthyCount}</span>
            <span className="text-muted-foreground">Healthy</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-semibold text-yellow-500">{attentionCount}</span>
            <span className="text-muted-foreground">Attention</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-semibold text-red-500">{criticalCount}</span>
            <span className="text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status];
            const isExpanded = expandedProject === project.id;
            
            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-lg border p-3 transition-all cursor-pointer",
                  statusColors[project.status],
                  "hover:bg-white/50 dark:hover:bg-white/5"
                )}
                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
              >
                {/* Project Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("h-4 w-4", statusColors[project.status].split(" ")[0])} />
                    <span className="text-sm font-semibold truncate">
                      {project.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>

                {/* Quick Status */}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.branch}</span>
                  <span>{project.lastDeploy}</span>
                </div>

                {/* Metrics Row */}
                <div className="mt-2 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <PullRequest className="h-3 w-3" />
                    <span>{project.openPRs}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bug className="h-3 w-3" />
                    <span>{project.openIssues}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{project.tests.coverage}%</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3 dark:border-white/5">
                    {/* Health Check Details */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium">Health Check:</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span>Dependencies:</span>
                          <span className={cn(
                            project.dependencies.outdated > 0 ? "text-yellow-500" : "text-green-500"
                          )}>
                            {project.dependencies.outdated === 0 ? "✅" : `⚠️ ${project.dependencies.outdated}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Security:</span>
                          <span className={cn(
                            project.dependencies.vulnerable > 0 ? "text-red-500" : "text-green-500"
                          )}>
                            {project.dependencies.vulnerable === 0 ? "✅" : `🔴 ${project.dependencies.vulnerable}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Tests:</span>
                          <div className="flex items-center gap-1">
                            <span className={cn(project.tests.passing ? "text-green-500" : "text-red-500")}>
                              {project.tests.passing ? "✅" : "❌"}
                            </span>
                            <span>{project.tests.coverage}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Build:</span>
                          <span className={cn(project.build.passing ? "text-green-500" : "text-red-500")}>
                            {project.build.passing ? "✅" : "❌"} {project.build.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Coverage Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Test Coverage</span>
                        <span>{project.tests.coverage}%</span>
                      </div>
                      <Progress value={project.tests.coverage} className="h-1" />
                    </div>

                    {/* Suggestions */}
                    {project.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium">💡 Suggestions:</h4>
                        {project.suggestions.map((suggestion) => {
                          const SuggestionIcon = suggestionTypeIcons[suggestion.type];
                          return (
                            <div key={suggestion.id} className="flex items-center justify-between rounded bg-white/30 p-2 text-xs dark:bg-white/5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <SuggestionIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{suggestion.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <Badge variant="secondary" className="text-xs h-4">
                                  {suggestion.confidence}%
                                </Badge>
                                <Button size="sm" className="h-6 text-xs">
                                  Fix
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        GitHub
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 dark:border-white/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last check: 2 min ago</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}