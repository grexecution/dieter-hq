"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  FolderOpen, 
  Archive, 
  ChevronDown, 
  Code, 
  MoreVertical,
  Trash2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

export type WorkspaceProject = {
  id: string;
  name: string;
  threadId: string; // e.g., "dev:dieter-hq"
  createdAt: number;
  lastActiveAt: number;
  archived: boolean;
};

// ============================================
// Local Storage Helpers
// ============================================

const STORAGE_KEY = "dieter-hq:workspace-projects";

function loadProjects(): WorkspaceProject[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: WorkspaceProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function generateThreadId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return `dev:${slug}`;
}

// ============================================
// Create Project Dialog
// ============================================

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

function CreateProjectDialog({ isOpen, onClose, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
      setName("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            New Project
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., DieterHQ, Bluemonkeys Website"
              className={cn(
                "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5",
                "text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                "focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              )}
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Project List Item
// ============================================

interface ProjectItemProps {
  project: WorkspaceProject;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function ProjectItem({ project, isActive, onClick, onArchive, onDelete }: ProjectItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
        isActive
          ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        isActive 
          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
      )}>
        <Code className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "truncate text-sm font-medium",
            isActive 
              ? "text-indigo-900 dark:text-indigo-100" 
              : "text-zinc-900 dark:text-zinc-100"
          )}>
            {project.name}
          </span>
          {project.archived && (
            <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              archived
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(project.lastActiveAt).toLocaleDateString("de-AT", { 
            day: "numeric", 
            month: "short" 
          })}
        </span>
      </div>

      <div className="relative">
        <button
          className={cn(
            "rounded-md p-1.5 text-zinc-400 transition-opacity",
            "hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                  setMenuOpen(false);
                }}
              >
                <Archive className="h-4 w-4" />
                {project.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                    onDelete();
                  }
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Workspace Manager
// ============================================

interface WorkspaceManagerProps {
  activeProjectId: string | null;
  onProjectSelect: (project: WorkspaceProject | null) => void;
  onProjectCreate: (project: WorkspaceProject) => void;
}

export function WorkspaceManager({ 
  activeProjectId, 
  onProjectSelect,
  onProjectCreate 
}: WorkspaceManagerProps) {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const visibleProjects = showArchived ? projects : activeProjects;

  const handleCreate = useCallback((name: string) => {
    const threadId = generateThreadId(name);
    const now = Date.now();
    
    // Check for duplicate thread ID
    let finalThreadId = threadId;
    let counter = 1;
    while (projects.some(p => p.threadId === finalThreadId)) {
      finalThreadId = `${threadId}-${counter}`;
      counter++;
    }

    const newProject: WorkspaceProject = {
      id: crypto.randomUUID(),
      name,
      threadId: finalThreadId,
      createdAt: now,
      lastActiveAt: now,
      archived: false,
    };

    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
    onProjectCreate(newProject);
    onProjectSelect(newProject);
  }, [projects, onProjectCreate, onProjectSelect]);

  const handleArchive = useCallback((projectId: string) => {
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, archived: !p.archived } : p
    );
    setProjects(updated);
    saveProjects(updated);
    
    // If archiving the active project, deselect it
    if (activeProjectId === projectId) {
      onProjectSelect(null);
    }
  }, [projects, activeProjectId, onProjectSelect]);

  const handleDelete = useCallback((projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    saveProjects(updated);
    
    if (activeProjectId === projectId) {
      onProjectSelect(null);
    }
  }, [projects, activeProjectId, onProjectSelect]);

  const handleProjectClick = useCallback((project: WorkspaceProject) => {
    // Update last active time
    const updated = projects.map(p => 
      p.id === project.id ? { ...p, lastActiveAt: Date.now() } : p
    );
    setProjects(updated);
    saveProjects(updated);
    onProjectSelect(project);
  }, [projects, onProjectSelect]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Workspace
          </span>
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {activeProjects.length}
          </span>
        </div>
        
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-auto px-3 py-3">
        {visibleProjects.length > 0 ? (
          <div className="space-y-1">
            {visibleProjects.map(project => (
              <ProjectItem
                key={project.id}
                project={project}
                isActive={activeProjectId === project.id}
                onClick={() => handleProjectClick(project)}
                onArchive={() => handleArchive(project.id)}
                onDelete={() => handleDelete(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
              <Code className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              No projects yet
            </h3>
            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              Create your first project to get started
            </p>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Archive Toggle */}
      {archivedProjects.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex w-full items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>
              {showArchived ? "Hide" : "Show"} archived ({archivedProjects.length})
            </span>
            <ChevronDown className={cn(
              "ml-auto h-3.5 w-3.5 transition-transform",
              showArchived && "rotate-180"
            )} />
          </button>
        </div>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

// Export for use in parent components
export { loadProjects, saveProjects, generateThreadId };
