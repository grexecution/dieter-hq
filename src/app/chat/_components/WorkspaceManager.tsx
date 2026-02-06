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
  X,
  Loader2
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
// API Helpers (persistent in Neon DB)
// ============================================

async function fetchProjects(): Promise<WorkspaceProject[]> {
  try {
    const res = await fetch('/api/workspace/projects');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
}

async function createProject(name: string): Promise<WorkspaceProject | null> {
  try {
    const res = await fetch('/api/workspace/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create');
    const data = await res.json();
    return data.project || null;
  } catch (err) {
    console.error('Error creating project:', err);
    return null;
  }
}

async function updateProject(id: string, updates: { archived?: boolean; touch?: boolean }): Promise<boolean> {
  try {
    const res = await fetch('/api/workspace/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating project:', err);
    return false;
  }
}

async function deleteProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/workspace/projects?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting project:', err);
    return false;
  }
}

// Legacy localStorage helpers for migration
function loadProjectsFromLocalStorage(): WorkspaceProject[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("dieter-hq:workspace-projects");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearLocalStorageProjects() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("dieter-hq:workspace-projects");
}

// ============================================
// Create Project Dialog
// ============================================

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isCreating: boolean;
}

function CreateProjectDialog({ isOpen, onClose, onCreate, isCreating }: CreateProjectDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && !isCreating) {
      onCreate(trimmed);
      setName("");
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
            disabled={isCreating}
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
              disabled={isCreating}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load projects on mount (with localStorage migration)
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      
      // Fetch from DB
      const dbProjects = await fetchProjects();
      
      // Check for localStorage projects to migrate
      const localProjects = loadProjectsFromLocalStorage();
      if (localProjects.length > 0 && dbProjects.length === 0) {
        // Migrate localStorage projects to DB
        console.log('Migrating', localProjects.length, 'projects from localStorage to DB...');
        for (const lp of localProjects) {
          await createProject(lp.name);
        }
        clearLocalStorageProjects();
        // Re-fetch after migration
        const migrated = await fetchProjects();
        setProjects(migrated);
      } else {
        // Clear old localStorage if DB has projects
        if (localProjects.length > 0) {
          clearLocalStorageProjects();
        }
        setProjects(dbProjects);
      }
      
      setIsLoading(false);
    }
    load();
  }, []);

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const visibleProjects = showArchived ? projects : activeProjects;

  const handleCreate = useCallback(async (name: string) => {
    setIsCreating(true);
    const newProject = await createProject(name);
    setIsCreating(false);
    
    if (newProject) {
      setProjects(prev => [newProject, ...prev]);
      setCreateDialogOpen(false);
      onProjectCreate(newProject);
      onProjectSelect(newProject);
    }
  }, [onProjectCreate, onProjectSelect]);

  const handleArchive = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newArchived = !project.archived;
    const success = await updateProject(projectId, { archived: newArchived });
    
    if (success) {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, archived: newArchived } : p
      ));
      
      // If archiving the active project, deselect it
      if (activeProjectId === projectId && newArchived) {
        onProjectSelect(null);
      }
    }
  }, [projects, activeProjectId, onProjectSelect]);

  const handleDelete = useCallback(async (projectId: string) => {
    const success = await deleteProject(projectId);
    
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (activeProjectId === projectId) {
        onProjectSelect(null);
      }
    }
  }, [activeProjectId, onProjectSelect]);

  const handleProjectClick = useCallback(async (project: WorkspaceProject) => {
    // Update last active time in background
    updateProject(project.id, { touch: true });
    
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, lastActiveAt: Date.now() } : p
    ));
    onProjectSelect(project);
  }, [onProjectSelect]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="mt-2 text-sm text-zinc-500">Loading projects...</p>
      </div>
    );
  }

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
        isCreating={isCreating}
      />
    </div>
  );
}

// Export loadProjects for SSE subscription in parent
export { fetchProjects as loadProjects };
