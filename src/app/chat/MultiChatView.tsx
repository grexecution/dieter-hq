"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Send, Sparkles, User, Bot, MessageCircle, Dumbbell, Briefcase, Code } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";
import { StatusBar } from "./_components/StatusBar";
import { SubagentPanel } from "./_components/SubagentPanel";
import { CHAT_TABS, type ChatTab } from "./chat-config";

const VoiceRecorder = dynamic(
  () => import("./_components/VoiceRecorder").then((m) => m.VoiceRecorder),
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// ============================================
// Tab Navigation Component
// ============================================

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  threadCounts: Record<string, number>;
}

function TabNavigation({ activeTab, onTabChange, threadCounts }: TabNavigationProps) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-2 py-1.5 scrollbar-hide">
        {CHAT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const messageCount = threadCounts[tab.id] || 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex min-w-[70px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
            >
              {/* Content */}
              <span className="text-sm">{tab.emoji}</span>
              <span className="truncate text-[11px]">{tab.name}</span>
              
              {/* Badge */}
              {messageCount > 0 && !isActive && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 px-1 text-[9px] font-medium text-zinc-600 dark:text-zinc-300">
                  {messageCount > 99 ? "99" : messageCount}
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
// Message Bubble Component
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

  // System messages (hidden or minimal)
  if (isSystem) {
    return (
      <div className="mx-auto max-w-md py-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {meta.text.slice(0, 100)}
          {meta.text.length > 100 && "..."}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/dieter-avatar.png" alt={author} />
            <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-indigo-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        )}
      >
        {/* Author & Time */}
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {author}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
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
                className="max-h-[360px] w-auto rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
            ) : isAudioMime(artefact.mimeType) ? (
              <audio controls src={url} className="w-full max-w-xs" />
            ) : (
              <a
                href={url}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Download {artefact.originalName}
              </a>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {meta.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Chat Content Component
// ============================================

interface ChatContentProps {
  activeTab: string;
  messages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
}

function ChatContent({ activeTab, messages, artefactsById }: ChatContentProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        {messages.length > 0 ? (
            <div key={activeTab} className="space-y-4">
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
            <div
              key={`${activeTab}-empty`}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
                {currentTab && <currentTab.icon className="h-8 w-8 text-zinc-600 dark:text-zinc-400" />}
              </div>
              <h2 className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-100">
                {currentTab?.emoji} {currentTab?.name}
              </h2>
              <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                {currentTab?.description}
              </p>
              <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-500">
                Start a conversation below
              </p>
            </div>
          )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

// ============================================
// Chat Composer Section
// ============================================

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  onSubmit: () => void;
  onVoiceTranscript: (transcript: string) => void;
  threadId: string;
  activeTab: string;
}

function Composer({ draft, setDraft, isSending, onSubmit, onVoiceTranscript, threadId, activeTab }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);

  // Auto-resize textarea
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
    <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-3xl pb-safe">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Attachment & Voice - Left side */}
          <div className="flex items-center gap-1">
            <ChatComposer threadId={threadId} disabled={isSending} />
            <VoiceRecorder onTranscript={onVoiceTranscript} disabled={isSending} />
          </div>

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
                "w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5",
                "text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                "transition-colors focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-800",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
              draft.trim()
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
            )}
          >
            <Send className={cn("h-4 w-4", isSending && "opacity-50")} />
          </button>
        </form>

        {/* Context indicator - Hidden on mobile */}
        <div className="mt-2 hidden items-center justify-center md:flex">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {currentTab?.emoji} {currentTab?.name} · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Multi-Chat View
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
  const [liveMessages, setLiveMessages] = useState<Record<string, MessageRow[]>>(threadMessages);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>({});
  const [subagentPanelCollapsed, setSubagentPanelCollapsed] = useState(true);

  const endRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync messages from props
  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  // Get current tab data
  const currentMessages = liveMessages[activeTab] || [];
  const currentDraft = drafts[activeTab] || "";
  const isSending = sendingStates[activeTab] || false;

  // Calculate thread counts for tab navigation
  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of CHAT_TABS) {
      counts[tab.id] = liveMessages[tab.id]?.length || 0;
    }
    return counts;
  }, [liveMessages]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Handle draft changes per tab
  const setDraft = (value: string) => {
    setDrafts(prev => ({ ...prev, [activeTab]: value }));
  };

  // Send message handler for current tab
  const handleSend = async () => {
    const content = currentDraft.trim();
    if (!content || isSending) return;

    setSendingStates(prev => ({ ...prev, [activeTab]: true }));
    setDrafts(prev => ({ ...prev, [activeTab]: "" }));

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeTab, content }),
      });
      if (!r.ok) throw new Error("send_failed");
      const data = (await r.json()) as { ok: boolean; item: MessageRow };
      if (data?.ok && data.item?.id) {
        setLiveMessages((prev) => ({
          ...prev,
          [activeTab]: [
            ...(prev[activeTab] || []),
            data.item
          ].filter((m, i, arr) => arr.findIndex(msg => msg.id === m.id) === i) // dedup
        }));
      }
    } catch {
      setDrafts(prev => ({ ...prev, [activeTab]: content })); // Restore on failure
    } finally {
      setSendingStates(prev => ({ ...prev, [activeTab]: false }));
    }
  };

  // SSE subscription for real-time messages per tab
  useEffect(() => {
    const eventSources: EventSource[] = [];
    
    for (const tab of CHAT_TABS) {
      const lastMessage = liveMessages[tab.id]?.[liveMessages[tab.id].length - 1];
      const lastCreatedAt = lastMessage?.createdAt || 0;
      
      const es = new EventSource(
        `/api/stream?thread=${encodeURIComponent(tab.id)}&since=${encodeURIComponent(String(lastCreatedAt))}`
      );

      const onMessage = (ev: MessageEvent) => {
        try {
          const item = JSON.parse(ev.data) as MessageRow;
          if (!item?.id || item.threadId !== tab.id) return;
          
          setLiveMessages((prev) => {
            const existing = prev[tab.id] || [];
            if (existing.some((m) => m.id === item.id)) return prev;
            
            return {
              ...prev,
              [tab.id]: [...existing, item]
            };
          });
        } catch {
          // ignore parse errors
        }
      };

      es.addEventListener("message", onMessage);
      eventSources.push(es);
    }

    return () => {
      eventSources.forEach(es => {
        es.close();
      });
    };
  }, [liveMessages]);

  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);

  return (
    <div className={cn(
      "grid gap-6",
      subagentPanelCollapsed 
        ? "lg:grid-cols-[320px_1fr_auto]" 
        : "lg:grid-cols-[320px_1fr_280px]"
    )}>
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:self-start">
        <OpenClawStatusSidebar logoutAction={logoutAction} />
        <form action={newThreadAction} className="hidden" aria-hidden="true" />
      </aside>

      {/* Mobile HUD overlay */}
      {mobileHudOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
          onClick={() => setMobileHudOpen(false)}
        >
          <div
            className="absolute inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <span className="text-sm font-medium">Status</span>
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

      {/* Main Chat Area */}
      <section className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden md:rounded-lg md:border md:border-zinc-200 md:dark:border-zinc-800 md:bg-white md:dark:bg-zinc-950 lg:h-[calc(100dvh-5rem)]">
        {/* Header */}
        <header className="hidden md:flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileHudOpen(true)}
              title="Open status"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                  <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Dieter {currentTab && `· ${currentTab.name}`}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
              {currentMessages.length}
            </span>
          </div>
        </header>

        {/* Live Status Bar */}
        <StatusBar />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          threadCounts={threadCounts}
        />

        {/* Now Bar */}
        <NowBar />

        {/* Messages */}
        <ChatContent 
          activeTab={activeTab}
          messages={currentMessages}
          artefactsById={artefactsById}
        />

        {/* Composer */}
        <Composer
          draft={currentDraft}
          setDraft={setDraft}
          isSending={isSending}
          onSubmit={handleSend}
          onVoiceTranscript={(transcript) => setDraft(transcript)}
          threadId={activeTab}
          activeTab={activeTab}
        />
      </section>

      {/* Subagent Panel (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:self-start">
        <SubagentPanel
          collapsed={subagentPanelCollapsed}
          onToggleCollapse={() => setSubagentPanelCollapsed((prev) => !prev)}
          className="h-full"
        />
      </aside>
    </div>
  );
}