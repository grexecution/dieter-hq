"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Send, Sparkles, User, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";
import { AgentStatusPanel } from "@/components/agent-status-panel";

const VoiceRecorderButton = dynamic(
  () => import("./VoiceRecorderButton").then((m) => m.VoiceRecorderButton),
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
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
        "flex items-end gap-3 animate-fade-in-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          "h-8 w-8 shrink-0 ring-2 transition-all",
          isUser
            ? "ring-primary/20 bg-primary/10"
            : "ring-white/30 dark:ring-white/10 bg-background"
        )}
      >
        {isUser ? (
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/dieter-avatar.png" alt={author} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[75%] rounded-2xl px-4 py-3 shadow-sm backdrop-blur-xl transition-all",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "glass rounded-bl-md"
        )}
      >
        {/* Author & Time */}
        <div className="mb-1 flex items-center justify-between gap-4">
          <span
            className={cn(
              "text-xs font-medium",
              isUser ? "text-primary-foreground/80" : "text-foreground-secondary"
            )}
          >
            {author}
          </span>
          <span
            className={cn(
              "text-[10px] opacity-60 transition-opacity group-hover:opacity-100",
              isUser ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
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
                className="max-h-[360px] w-auto rounded-xl border border-white/20 shadow-lg"
              />
            ) : isAudioMime(artefact.mimeType) ? (
              <audio controls src={url} className="w-full max-w-xs" />
            ) : (
              <a
                href={url}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-colors"
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
// Chat Composer Section
// ============================================

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  onSubmit: () => void;
  threadId: string;
}

function Composer({ draft, setDraft, isSending, onSubmit, threadId }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="sticky bottom-0 border-t border-white/20 bg-background/80 px-4 py-4 backdrop-blur-2xl dark:border-white/5 dark:bg-background/60">
      <div className="mx-auto w-full max-w-3xl pb-[env(safe-area-inset-bottom)]">
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Dieter..."
              rows={1}
              disabled={isSending}
              className={cn(
                "w-full resize-none rounded-2xl border-0 bg-white/60 px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground",
                "shadow-sm backdrop-blur-xl transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "disabled:opacity-50",
                "dark:bg-white/5 dark:placeholder:text-zinc-500"
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ChatComposer threadId={threadId} disabled={isSending} />
            <VoiceRecorderButton threadId={threadId} disabled={isSending} />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !draft.trim()}
              className={cn(
                "h-11 w-11 rounded-full transition-all",
                draft.trim()
                  ? "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
            </Button>
          </div>
        </form>

        {/* Keyboard shortcut hint */}
        <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
          Press <kbd className="rounded bg-muted/50 px-1">Enter</kbd> to send,{" "}
          <kbd className="rounded bg-muted/50 px-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// ============================================
// Main Chat View
// ============================================

export function ChatView({
  threads,
  activeThreadId,
  threadMessages,
  artefactsById,
  newThreadAction,
  logoutAction,
}: {
  threads: ThreadRow[];
  activeThreadId: string;
  threadMessages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
  newThreadAction: (formData: FormData) => void;
  logoutAction: (formData: FormData) => void;
}) {
  const [liveMessages, setLiveMessages] = useState<MessageRow[]>(threadMessages);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Sync messages from props
  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [liveMessages.length]);

  const lastCreatedAt = useMemo(() => {
    const last = liveMessages[liveMessages.length - 1];
    return last?.createdAt ?? 0;
  }, [liveMessages]);

  // SSE subscription for real-time messages
  useEffect(() => {
    if (activeThreadId !== "main") return;

    const es = new EventSource(
      `/api/stream?thread=${encodeURIComponent(activeThreadId)}&since=${encodeURIComponent(String(lastCreatedAt))}`
    );

    const onMessage = (ev: MessageEvent) => {
      try {
        const item = JSON.parse(ev.data) as MessageRow;
        if (!item?.id) return;
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === item.id)) return prev;
          return [...prev, item];
        });
      } catch {
        // ignore parse errors
      }
    };

    es.addEventListener("message", onMessage);
    return () => {
      es.removeEventListener("message", onMessage);
      es.close();
    };
  }, [activeThreadId, lastCreatedAt]);

  // Polling fallback
  useEffect(() => {
    if (activeThreadId !== "main") return;

    let stopped = false;

    const tick = async () => {
      try {
        const r = await fetch(
          `/api/chat/messages?thread=${encodeURIComponent(activeThreadId)}&since=${encodeURIComponent(String(lastCreatedAt))}`,
          { cache: "no-store" }
        );
        if (!r.ok) return;
        const data = (await r.json()) as { ok: boolean; items: MessageRow[] };
        if (!data?.ok || !Array.isArray(data.items) || stopped) return;
        if (!data.items.length) return;

        setLiveMessages((prev) => {
          const have = new Set(prev.map((m) => m.id));
          const next = [...prev];
          for (const it of data.items) if (it?.id && !have.has(it.id)) next.push(it);
          return next;
        });
      } catch {
        // ignore
      }
    };

    const t = setInterval(tick, 2500);
    void tick();

    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [activeThreadId, lastCreatedAt]);

  // Send message handler
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setDraft("");

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, content }),
      });
      if (!r.ok) throw new Error("send_failed");
      const data = (await r.json()) as { ok: boolean; item: MessageRow };
      if (data?.ok && data.item?.id) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === data.item.id)) return prev;
          return [...prev, data.item];
        });
      }
    } catch {
      setDraft(content); // Restore on failure
    } finally {
      setIsSending(false);
    }
  };

  const mainCount = threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:self-start">
        <AgentStatusPanel />
        <form action={newThreadAction} className="hidden" aria-hidden="true" />
      </aside>

      {/* Mobile HUD overlay */}
      {mobileHudOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileHudOpen(false)}
        >
          <div
            className="absolute inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-background/95 shadow-2xl backdrop-blur-xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold">Agent Status</span>
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
              <AgentStatusPanel defaultCollapsed={false} className="h-full" />
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <section className="flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/40">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 dark:border-white/5">
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
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Dieter</h1>
                <p className="text-xs text-muted-foreground">
                  AI Assistant • Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground tabular-nums">
              {mainCount} messages
            </span>
          </div>
        </header>

        {/* Now Bar */}
        <NowBar />

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {liveMessages.length > 0 ? (
              liveMessages.map((m) => {
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
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-6">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h2 className="mb-2 text-lg font-semibold">
                  Hey, I'm Dieter! 🐶
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Your personal AI assistant. Ask me anything, and I'll do my
                  best to help. Start typing below!
                </p>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Composer */}
        <Composer
          draft={draft}
          setDraft={setDraft}
          isSending={isSending}
          onSubmit={handleSend}
          threadId={activeThreadId}
        />
      </section>
    </div>
  );
}
