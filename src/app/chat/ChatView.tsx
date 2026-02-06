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
import { MarkdownContent } from "@/components/MarkdownContent";

const VoiceRecorder = dynamic(
  () => import("./_components/VoiceRecorder").then((m) => m.VoiceRecorder),
  { ssr: false }
);

const VoiceMessageBubble = dynamic(
  () => import("./_components/VoiceMessageBubble").then((m) => m.VoiceMessageBubble),
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
  // Voice message fields (Telegram-style)
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {meta.text.slice(0, 100)}
          {meta.text.length > 100 && "..."}
        </span>
      </div>
    );
  }

  // Voice messages (Telegram-style)
  if (message.audioUrl) {
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
          <MarkdownContent content={meta.text} className="text-sm" />
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
  onVoiceTranscript: (transcript: string) => void;
  onVoiceMessage: (message: MessageRow) => void;
  threadId: string;
}

function Composer({ draft, setDraft, isSending, onSubmit, onVoiceTranscript, onVoiceMessage, threadId }: ComposerProps) {
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
    <div className="sticky bottom-0 border-t border-divider bg-content1 px-4 py-4">
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
                "w-full resize-none rounded-xl border border-divider bg-default-100 px-4 py-3 pr-12",
                "text-sm placeholder:text-foreground-400",
                "transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ChatComposer threadId={threadId} disabled={isSending} />
            <VoiceRecorder
              threadId={threadId}
              onTranscript={onVoiceTranscript}
              onVoiceMessage={onVoiceMessage}
              disabled={isSending}
            />
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

  // Streaming message state - the assistant message being streamed
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  // Send message handler with SSE streaming
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setDraft("");
    setStreamingContent("");
    setStreamingMsgId(null);

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, content }),
      });

      if (!r.ok) throw new Error("send_failed");

      const contentType = r.headers.get("content-type") || "";

      // Handle SSE streaming response
      if (contentType.includes("text/event-stream") && r.body) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;

            try {
              const event = JSON.parse(payload) as {
                type: "user_confirmed" | "delta" | "done";
                item?: MessageRow;
                content?: string;
              };

              if (event.type === "user_confirmed" && event.item) {
                // Add user message to the list
                setLiveMessages((prev) => {
                  if (prev.some((m) => m.id === event.item!.id)) return prev;
                  return [...prev, event.item!];
                });
                // Start showing streaming placeholder
                const tempId = `streaming-${Date.now()}`;
                setStreamingMsgId(tempId);
              } else if (event.type === "delta" && event.content) {
                // Accumulate streaming content
                accumulatedContent += event.content;
                setStreamingContent(accumulatedContent);
              } else if (event.type === "done" && event.item) {
                // Finalize: add complete assistant message
                setStreamingContent(null);
                setStreamingMsgId(null);
                setLiveMessages((prev) => {
                  if (prev.some((m) => m.id === event.item!.id)) return prev;
                  return [...prev, event.item!];
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } else {
        // Fallback: non-streaming JSON response
        const data = (await r.json()) as { ok: boolean; item: MessageRow };
        if (data?.ok && data.item?.id) {
          setLiveMessages((prev) => {
            if (prev.some((m) => m.id === data.item.id)) return prev;
            return [...prev, data.item];
          });
        }
      }
    } catch {
      setDraft(content); // Restore on failure
      setStreamingContent(null);
      setStreamingMsgId(null);
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
            className="absolute inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-divider bg-content1 shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
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
      <section className="flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-2xl border border-divider bg-content1 shadow-lg">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-divider px-4 py-3">
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
                <Avatar className="h-10 w-10 ring-2 ring-default/20">
                  <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />
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
            {liveMessages.length > 0 || streamingMsgId ? (
              <>
                {liveMessages.map((m) => {
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
                {/* Streaming message indicator */}
                {streamingMsgId && (
                  <div className="flex items-end gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                      <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="group relative max-w-[80%] rounded-lg px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Dieter
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          typing...
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed min-h-[1.5rem]">
                        {streamingContent ? (
                          <MarkdownContent content={streamingContent} className="text-sm" />
                        ) : (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-20" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-6">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  Hey, I'm Dieter! 🐶
                </h2>
                <p className="max-w-sm text-sm text-foreground-500">
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
          onVoiceTranscript={(transcript) => {
            // Set transcript as draft (fallback for old API)
            setDraft(transcript);
          }}
          onVoiceMessage={(message) => {
            // Add voice message to chat immediately
            setLiveMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }}
          threadId={activeThreadId}
        />
      </section>
    </div>
  );
}
