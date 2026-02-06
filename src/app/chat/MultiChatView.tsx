"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Menu,
  Send,
  Sparkles,
  User,
  Bot,
  ChevronLeft,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";
import { StatusBar } from "./_components/StatusBar";
import { SubagentPanel } from "./_components/SubagentPanel";
import {
  WorkspaceManager,
  type WorkspaceProject,
} from "./_components/WorkspaceManager";
import { CHAT_TABS, type ChatTab } from "./chat-config";

const VoiceRecorder = dynamic(
  () => import("./_components/VoiceRecorder").then((m) => m.VoiceRecorder),
  { ssr: false }
);

const VoiceMessageBubble = dynamic(
  () =>
    import("./_components/VoiceMessageBubble").then((m) => m.VoiceMessageBubble),
  { ssr: false }
);

// ============================================
// Types
// ============================================

export type ThreadRow = {
  threadId: string;
  lastAt: number;
  count: number;
};

export type MessageRow = {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  createdAtLabel: string;
  audioUrl?: string | null;
  audioDurationMs?: number | null;
  transcription?: string | null;
};

export type ArtefactRow = {
  id: string;
  threadId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export { CHAT_TABS };

// ============================================
// Utilities
// ============================================

function displayContent(raw: string): { author?: string; text: string } {
  const m = raw.match(/^\[(.+?)\]\s*([\s\S]*)$/);
  if (!m) return { text: raw };
  return { author: m[1], text: m[2] };
}

function extractArtefactIdFromContent(content: string): string | null {
  const m = content.match(/\/api\/artefacts\/([0-9a-fA-F-]{8,})/);
  return m?.[1] ?? null;
}

function isImageMime(m: string): boolean {
  return m.startsWith("image/");
}

function isAudioMime(m: string): boolean {
  return m.startsWith("audio/") || m === "video/webm";
}

// ============================================
// Tab Navigation
// ============================================

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  threadCounts: Record<string, number>;
}

function TabNavigation({
  activeTab,
  onTabChange,
  threadCounts,
}: TabNavigationProps) {
  return (
    <div className="border-b border-border bg-background-secondary/50">
      <div className="flex items-center gap-0.5 overflow-x-auto px-4 py-2 scrollbar-hide">
        {CHAT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const messageCount = threadCounts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-base",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground-secondary hover:text-foreground hover:bg-background/60"
              )}
            >
              <span className="text-base">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.name}</span>

              {messageCount > 0 && !isActive && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {messageCount > 99 ? "99+" : messageCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Message Bubble
// ============================================

interface MessageBubbleProps {
  message: MessageRow;
  artefact: ArtefactRow | null;
  url: string | null;
}

function MessageBubble({ message, artefact, url }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const meta = displayContent(message.content);
  const author = isUser ? "You" : meta.author ?? "Dieter";

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {meta.text.slice(0, 80)}
          {meta.text.length > 80 && "..."}
        </span>
      </div>
    );
  }

  // Voice messages
  if (message.audioUrl) {
    return (
      <div
        className={cn(
          "flex items-end gap-3 max-w-[85%]",
          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
          {isUser ? (
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              <User className="h-4 w-4" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src="/dieter-avatar.png" alt={author} />
              <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <VoiceMessageBubble
          audioUrl={message.audioUrl}
          durationMs={message.audioDurationMs || 0}
          transcription={message.transcription}
          isUser={isUser}
          timestamp={message.createdAtLabel}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
        {isUser ? (
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/dieter-avatar.png" alt={author} />
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5",
          isUser ? "chat-bubble-user" : "chat-bubble-assistant"
        )}
      >
        {/* Meta */}
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-foreground-tertiary">
            {author}
          </span>
          <span className="text-[10px] text-foreground-tertiary">
            {message.createdAtLabel}
          </span>
        </div>

        {/* Content */}
        {artefact && url ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>📎</span>
              <span className="truncate">{artefact.originalName}</span>
            </div>
            {isImageMime(artefact.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={artefact.originalName}
                className="max-h-64 w-auto rounded-xl border border-border"
              />
            ) : isAudioMime(artefact.mimeType) ? (
              <audio controls src={url} className="w-full max-w-xs h-10" />
            ) : (
              <a
                href={url}
                className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80 transition-base"
                target="_blank"
                rel="noreferrer"
              >
                Download {artefact.originalName}
              </a>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {meta.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Chat Content
// ============================================

interface ChatContentProps {
  activeTab: string;
  messages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
}

function ChatContent({
  activeTab,
  messages,
  artefactsById,
}: ChatContentProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const currentTab = CHAT_TABS.find((tab) => tab.id === activeTab);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((m) => {
              const artefactId = extractArtefactIdFromContent(m.content);
              const artefact = artefactId ? artefactsById[artefactId] : null;
              const url = artefactId
                ? `/api/artefacts/${encodeURIComponent(artefactId)}`
                : null;

              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  artefact={artefact}
                  url={url}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              {currentTab && (
                <currentTab.icon className="h-8 w-8 text-primary" />
              )}
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {currentTab?.emoji} {currentTab?.name}
            </h2>
            <p className="max-w-sm text-sm text-foreground-secondary">
              {currentTab?.description}
            </p>
            <p className="mt-2 text-xs text-foreground-tertiary">
              Start a conversation
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

// ============================================
// Composer
// ============================================

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  onSubmit: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onVoiceMessage: (message: MessageRow) => void;
  threadId: string;
  activeTab: string;
}

function Composer({
  draft,
  setDraft,
  isSending,
  onSubmit,
  onVoiceTranscript,
  onVoiceMessage,
  threadId,
  activeTab,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentTab = CHAT_TABS.find((tab) => tab.id === activeTab);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto w-full max-w-4xl pb-safe">
        <form
          className="chat-input flex items-end gap-3 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Attachment */}
          <ChatComposer threadId={threadId} disabled={isSending} />

          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              disabled={isSending}
              className={cn(
                "w-full resize-none bg-transparent px-2 py-2",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Voice Recorder */}
          <VoiceRecorder
            threadId={threadId}
            onTranscript={onVoiceTranscript}
            onVoiceMessage={onVoiceMessage}
            disabled={isSending}
          />

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || isSending}
            className="h-9 w-9 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Context hint */}
        <div className="mt-2 hidden items-center justify-center md:flex">
          <p className="text-[11px] text-foreground-tertiary">
            {currentTab?.emoji} {currentTab?.name} · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Chat Header
// ============================================

interface ChatHeaderProps {
  currentTab: ChatTab | undefined;
  activeProject: WorkspaceProject | null;
  isWorkspaceTab: boolean;
  messageCount: number;
  effectiveThreadId: string;
  onBack: () => void;
  onReset: () => void;
  onMenuOpen: () => void;
}

function ChatHeader({
  currentTab,
  activeProject,
  isWorkspaceTab,
  messageCount,
  effectiveThreadId,
  onBack,
  onReset,
  onMenuOpen,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={onMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Back button for projects */}
        {isWorkspaceTab && activeProject && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
              <AvatarFallback className="bg-foreground text-background">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {isWorkspaceTab && activeProject
                ? `Dieter · ${activeProject.name}`
                : `Dieter ${currentTab ? `· ${currentTab.name}` : ""}`}
            </h1>
            <p className="text-xs text-foreground-tertiary">
              {isWorkspaceTab && activeProject ? "Project Session" : "Online"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">
          {messageCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onReset}
          title="Reset chat"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

// ============================================
// Main Component
// ============================================

export function MultiChatView({
  threads,
  threadMessages,
  artefactsById,
  newThreadAction,
  logoutAction,
}: {
  threads: ThreadRow[];
  threadMessages: Record<string, MessageRow[]>;
  artefactsById: Record<string, ArtefactRow>;
  newThreadAction: (formData: FormData) => void;
  logoutAction: (formData: FormData) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("life");
  const [liveMessages, setLiveMessages] =
    useState<Record<string, MessageRow[]>>(threadMessages);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [subagentPanelCollapsed, setSubagentPanelCollapsed] = useState(true);

  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(
    null
  );
  const [workspaceProjects, setWorkspaceProjects] = useState<
    WorkspaceProject[]
  >([]);

  const lastMessageTimestampsRef = useRef<Record<string, number>>({});

  // Load workspace projects
  useEffect(() => {
    async function loadWorkspaceProjects() {
      try {
        const res = await fetch("/api/workspace/projects");
        if (res.ok) {
          const data = await res.json();
          const projects = data.projects || [];
          setWorkspaceProjects(projects);
          setActiveProject((prev) => {
            if (!prev) return null;
            const stillExists = projects.some(
              (p: WorkspaceProject) => p.id === prev.id
            );
            return stillExists ? prev : null;
          });
        }
      } catch (err) {
        console.error("Error loading workspace projects:", err);
      }
    }
    loadWorkspaceProjects();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadWorkspaceProjects();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Sync messages
  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  const currentTabConfig = CHAT_TABS.find((tab) => tab.id === activeTab);
  const isWorkspaceTab = currentTabConfig?.isWorkspace === true;

  const effectiveThreadId =
    isWorkspaceTab && activeProject ? activeProject.threadId : activeTab;

  const currentMessages = liveMessages[effectiveThreadId] || [];
  const currentDraft = drafts[effectiveThreadId] || "";
  const isSending = sendingStates[effectiveThreadId] || false;

  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of CHAT_TABS) {
      if (tab.isWorkspace) {
        const projectThreadIds = workspaceProjects.map((p) => p.threadId);
        counts[tab.id] = projectThreadIds.reduce(
          (sum, tid) => sum + (liveMessages[tid]?.length || 0),
          0
        );
      } else {
        counts[tab.id] = liveMessages[tab.id]?.length || 0;
      }
    }
    return counts;
  }, [liveMessages, workspaceProjects]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const newTabConfig = CHAT_TABS.find((tab) => tab.id === tabId);
    if (!newTabConfig?.isWorkspace) {
      setActiveProject(null);
    }
  };

  const handleProjectSelect = useCallback(
    (project: WorkspaceProject | null) => {
      setActiveProject(project);
    },
    []
  );

  const handleProjectCreate = useCallback((project: WorkspaceProject) => {
    setWorkspaceProjects((prev) => [project, ...prev]);
  }, []);

  const handleProjectDelete = useCallback(
    (projectId: string) => {
      const project = workspaceProjects.find((p) => p.id === projectId);
      setWorkspaceProjects((prev) => prev.filter((p) => p.id !== projectId));
      setActiveProject((prev) => (prev?.id === projectId ? null : prev));
      if (project) {
        setLiveMessages((prev) => {
          const next = { ...prev };
          delete next[project.threadId];
          return next;
        });
        delete lastMessageTimestampsRef.current[project.threadId];
      }
    },
    [workspaceProjects]
  );

  const handleProjectsRefresh = useCallback((projects: WorkspaceProject[]) => {
    setWorkspaceProjects(projects);
    setActiveProject((prev) => {
      if (!prev) return null;
      const stillExists = projects.some((p) => p.id === prev.id);
      return stillExists ? prev : null;
    });
  }, []);

  const setDraft = (value: string) => {
    setDrafts((prev) => ({ ...prev, [effectiveThreadId]: value }));
  };

  // Send message
  const handleSend = async () => {
    const content = currentDraft.trim();
    if (!content || isSending) return;

    const sendThreadId = effectiveThreadId;

    setSendingStates((prev) => ({ ...prev, [sendThreadId]: true }));
    setDrafts((prev) => ({ ...prev, [sendThreadId]: "" }));

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: sendThreadId, content }),
      });

      if (!r.ok) throw new Error(`send_failed: ${r.status}`);
      if (!r.body) throw new Error("No response body");

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === "user_confirmed" && event.item) {
              setLiveMessages((prev) => ({
                ...prev,
                [sendThreadId]: [...(prev[sendThreadId] || []), event.item].filter(
                  (m, i, arr) => arr.findIndex((msg) => msg.id === m.id) === i
                ),
              }));
              if (event.item.createdAt) {
                lastMessageTimestampsRef.current[sendThreadId] =
                  event.item.createdAt;
              }
            } else if (event.type === "done" && event.item) {
              setLiveMessages((prev) => ({
                ...prev,
                [sendThreadId]: [...(prev[sendThreadId] || []), event.item].filter(
                  (m, i, arr) => arr.findIndex((msg) => msg.id === m.id) === i
                ),
              }));
              if (event.item.createdAt) {
                lastMessageTimestampsRef.current[sendThreadId] =
                  event.item.createdAt;
              }
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSendingStates((prev) => ({ ...prev, [sendThreadId]: false }));
    }
  };

  // SSE subscription
  useEffect(() => {
    const timestamps = lastMessageTimestampsRef.current;
    for (const tab of CHAT_TABS) {
      if (tab.isWorkspace) continue;
      const messages = threadMessages[tab.id];
      if (messages?.length) {
        const lastTs = messages[messages.length - 1]?.createdAt || 0;
        if (!timestamps[tab.id] || lastTs > timestamps[tab.id]) {
          timestamps[tab.id] = lastTs;
        }
      }
    }
  }, [threadMessages]);

  useEffect(() => {
    const eventSources: EventSource[] = [];

    const subscribeToThread = (threadId: string) => {
      const since = lastMessageTimestampsRef.current[threadId] || 0;

      const es = new EventSource(
        `/api/stream?thread=${encodeURIComponent(
          threadId
        )}&since=${encodeURIComponent(String(since))}`
      );

      const onMessage = (ev: MessageEvent) => {
        try {
          const item = JSON.parse(ev.data) as MessageRow;
          if (!item?.id || item.threadId !== threadId) return;

          setLiveMessages((prev) => {
            const existing = prev[threadId] || [];
            if (existing.some((m) => m.id === item.id)) return prev;

            if (item.createdAt) {
              const currentTs =
                lastMessageTimestampsRef.current[threadId] || 0;
              if (item.createdAt > currentTs) {
                lastMessageTimestampsRef.current[threadId] = item.createdAt;
              }
            }

            return { ...prev, [threadId]: [...existing, item] };
          });
        } catch {
          // ignore
        }
      };

      es.addEventListener("message", onMessage);
      eventSources.push(es);
    };

    for (const tab of CHAT_TABS) {
      if (tab.isWorkspace) continue;
      subscribeToThread(tab.id);
    }

    for (const project of workspaceProjects) {
      subscribeToThread(project.threadId);
    }

    return () => {
      eventSources.forEach((es) => es.close());
    };
  }, [workspaceProjects]);

  const currentTab = CHAT_TABS.find((tab) => tab.id === activeTab);
  const showWorkspaceManager = isWorkspaceTab && !activeProject;
  const showChat = !isWorkspaceTab || (isWorkspaceTab && activeProject);

  const handleReset = async () => {
    if (
      window.confirm("Reset chat? All messages will be deleted.")
    ) {
      setLiveMessages((prev) => ({
        ...prev,
        [effectiveThreadId]: [],
      }));
      try {
        await fetch("/api/chat/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: effectiveThreadId }),
        });
      } catch (err) {
        console.error("Failed to reset chat:", err);
      }
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] gap-6 lg:h-[calc(100dvh-5rem)]">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-20 h-[calc(100vh-6rem)]">
          <OpenClawStatusSidebar logoutAction={logoutAction} />
          <form action={newThreadAction} className="hidden" aria-hidden="true" />
        </div>
      </aside>

      {/* Mobile HUD */}
      {mobileHudOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileHudOpen(false)}
        >
          <div
            className="absolute inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Status</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileHudOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-auto">
              <OpenClawStatusSidebar logoutAction={logoutAction} />
            </div>
          </div>
        </div>
      )}

      {/* Main Chat */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <ChatHeader
          currentTab={currentTab}
          activeProject={activeProject}
          isWorkspaceTab={isWorkspaceTab}
          messageCount={currentMessages.length}
          effectiveThreadId={effectiveThreadId}
          onBack={() => setActiveProject(null)}
          onReset={handleReset}
          onMenuOpen={() => setMobileHudOpen(true)}
        />

        {/* Status Bar */}
        <StatusBar />

        {/* Tabs */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          threadCounts={threadCounts}
        />

        {/* Now Bar */}
        <NowBar />

        {/* Content */}
        {showWorkspaceManager && (
          <div className="flex-1 overflow-hidden">
            <WorkspaceManager
              activeProjectId={null}
              onProjectSelect={handleProjectSelect}
              onProjectCreate={handleProjectCreate}
              onProjectDelete={handleProjectDelete}
              onProjectsRefresh={handleProjectsRefresh}
            />
          </div>
        )}

        {showChat && (
          <>
            <ChatContent
              activeTab={effectiveThreadId}
              messages={currentMessages}
              artefactsById={artefactsById}
            />

            <Composer
              draft={currentDraft}
              setDraft={setDraft}
              isSending={isSending}
              onSubmit={handleSend}
              onVoiceTranscript={(transcript) => setDraft(transcript)}
              onVoiceMessage={async (message) => {
                const threadIdAtSend = effectiveThreadId;
                setLiveMessages((prev) => ({
                  ...prev,
                  [threadIdAtSend]: [...(prev[threadIdAtSend] || []), message].filter(
                    (m, i, arr) => arr.findIndex((msg) => msg.id === m.id) === i
                  ),
                }));

                if (message.transcription) {
                  setSendingStates((prev) => ({
                    ...prev,
                    [threadIdAtSend]: true,
                  }));

                  try {
                    const r = await fetch("/api/chat/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        threadId: threadIdAtSend,
                        content: message.transcription,
                        skipUserMessage: true,
                      }),
                    });

                    if (r.ok && r.body) {
                      const reader = r.body.getReader();
                      const decoder = new TextDecoder();
                      let buffer = "";

                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                          if (!line.startsWith("data: ")) continue;
                          const payload = line.slice(6).trim();
                          if (!payload || payload === "[DONE]") continue;

                          try {
                            const event = JSON.parse(payload);
                            if (event.type === "done" && event.item) {
                              setLiveMessages((prev) => ({
                                ...prev,
                                [threadIdAtSend]: [
                                  ...(prev[threadIdAtSend] || []),
                                  event.item,
                                ].filter(
                                  (m, i, arr) =>
                                    arr.findIndex((msg) => msg.id === m.id) === i
                                ),
                              }));
                              if (event.item.createdAt) {
                                lastMessageTimestampsRef.current[threadIdAtSend] =
                                  event.item.createdAt;
                              }
                            }
                          } catch {
                            // Ignore
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error("Voice message response failed:", err);
                  } finally {
                    setSendingStates((prev) => ({
                      ...prev,
                      [threadIdAtSend]: false,
                    }));
                  }
                }
              }}
              threadId={effectiveThreadId}
              activeTab={activeTab}
            />
          </>
        )}
      </section>

      {/* Subagent Panel (desktop) */}
      <aside className="hidden shrink-0 lg:block">
        <div className="sticky top-20 h-[calc(100vh-6rem)]">
          <SubagentPanel
            collapsed={subagentPanelCollapsed}
            onToggleCollapse={() => setSubagentPanelCollapsed((prev) => !prev)}
            className="h-full"
          />
        </div>
      </aside>
    </div>
  );
}
