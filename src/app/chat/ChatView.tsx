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
      <div className="mx-auto max-w-md py-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60 px-3.5 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
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
          "flex items-end gap-2.5",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-zinc-900">
          {isUser ? (
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
              <User className="h-4 w-4" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src="/dieter-avatar.png" alt={author} />
              <AvatarFallback className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium">
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
        "flex items-end gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-zinc-900">
        {isUser ? (
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/dieter-avatar.png" alt={author} />
            <AvatarFallback className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-indigo-600 text-white dark:bg-indigo-500"
            : "bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60"
        )}
      >
        {/* Author & Time */}
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <span className={cn(
            "text-[11px] font-medium",
            isUser 
              ? "text-indigo-200" 
              : "text-zinc-500 dark:text-zinc-400"
          )}>
            {author}
          </span>
          <span className={cn(
            "text-[10px]",
            isUser
              ? "text-indigo-300"
              : "text-zinc-400 dark:text-zinc-500"
          )}>
            {message.createdAtLabel}
          </span>
        </div>

        {/* Content */}
        {artefact && url ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <span>📎</span>
              <span className="truncate">{artefact.originalName}</span>
            </div>
            {isImageMime(artefact.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={artefact.originalName}
                className="max-h-[360px] w-auto rounded-xl border border-zinc-200/50 dark:border-zinc-700/50"
              />
            ) : isAudioMime(artefact.mimeType) ? (
              <audio controls src={url} className="w-full max-w-xs" />
            ) : (
              <a
                href={url}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-700/60 px-3 py-2 text-[13px] font-medium hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Download {artefact.originalName}
              </a>
            )}
          </div>
        ) : (
          <MarkdownContent content={meta.text} className={cn(
            "text-[14px] leading-relaxed",
            isUser ? "[&_*]:text-white [&_a]:text-indigo-200" : ""
          )} />
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
    <div className="sticky bottom-0 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl px-4 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/95">
      <div className="mx-auto w-full max-w-3xl pb-[env(safe-area-inset-bottom)]">
        <form
          className="flex items-end gap-2.5"
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
                "w-full resize-none rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3",
                "text-[14px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                "transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white",
                "dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:focus:border-indigo-600 dark:focus:bg-zinc-800",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
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
                "h-11 w-11 rounded-2xl transition-all duration-200",
                draft.trim()
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
            </Button>
          </div>
        </form>

        {/* Keyboard shortcut hint */}
        <p className="mt-2.5 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          Press <kbd className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-sans dark:bg-zinc-800">Enter</kbd> to send,{" "}
          <kbd className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-sans dark:bg-zinc-800">Shift+Enter</kbd> for new line
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
      <section className="flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200/80 px-4 py-3.5 dark:border-zinc-800/80">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl lg:hidden"
              onClick={() => setMobileHudOpen(true)}
              title="Open status"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-zinc-100 dark:ring-zinc-800">
                  <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                  <AvatarFallback className="bg-indigo-600 text-white dark:bg-indigo-500">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Dieter</h1>
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                  AI Assistant • Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-zinc-100/80 px-3 py-1.5 text-[11px] font-medium text-zinc-500 tabular-nums dark:bg-zinc-800/80 dark:text-zinc-400">
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
                  <div className="flex items-end gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-zinc-900">
                      <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
                      <AvatarFallback className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="group relative max-w-[75%] rounded-2xl px-4 py-3 bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm">
                      <div className="mb-1.5 flex items-center justify-between gap-4">
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          Dieter
                        </span>
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400">
                          typing...
                        </span>
                      </div>
                      <div className="text-[14px] leading-relaxed min-h-[1.5rem]">
                        {streamingContent ? (
                          <MarkdownContent content={streamingContent} className="text-[14px]" />
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400/60 animate-pulse" />
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400/40 animate-pulse [animation-delay:150ms]" />
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400/20 animate-pulse [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40">
                  <Bot className="h-10 w-10 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Hey, I'm Dieter! 🐶
                </h2>
                <p className="max-w-sm text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
