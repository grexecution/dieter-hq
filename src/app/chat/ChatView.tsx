"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Send, Sparkles, User, Bot, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Haptics } from "@/lib/haptics";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";
import { AgentStatusPanel } from "@/components/agent-status-panel";
import { MarkdownContent } from "@/components/MarkdownContent";

// OpenClaw WebSocket Hooks
import { useOpenClawConnection, useOpenClawChat } from "@/lib/openclaw/hooks";
import type { Message as OpenClawMessage } from "@/lib/openclaw/types";
import type { AgentActivity } from "@/lib/openclaw/client";

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
// Session Key Mapping
// ============================================

function getSessionKey(threadId: string): string {
  // Thread → Session Key mapping
  // dev: threads go to the coder agent
  // other threads go to the main agent
  return threadId.startsWith("dev:")
    ? `agent:coder:dieter-hq:${threadId}`
    : `agent:main:dieter-hq:${threadId}`;
}

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

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Convert OpenClaw Message to MessageRow
function toMessageRow(msg: OpenClawMessage, threadId: string): MessageRow {
  return {
    id: msg.id,
    threadId,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    createdAt: new Date(msg.timestamp).getTime(),
    createdAtLabel: formatTimestamp(msg.timestamp),
  };
}

// ============================================
// Connection Status Indicator
// ============================================

interface ConnectionStatusProps {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
}

function ConnectionStatus({ connected, connecting, reconnecting }: ConnectionStatusProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="hidden sm:inline">Connected</span>
      </div>
    );
  }

  if (connecting || reconnecting) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-warning opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
        </span>
        <span className="hidden sm:inline">{reconnecting ? "Reconnecting..." : "Connecting..."}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-destructive">
      <span className="h-2 w-2 rounded-full bg-destructive" />
      <span className="hidden sm:inline">Disconnected</span>
    </div>
  );
}

// ============================================
// Agent Activity Indicator
// ============================================

interface ActivityIndicatorProps {
  activity: AgentActivity;
  activityLabel: string;
}

function ActivityIndicator({ activity, activityLabel }: ActivityIndicatorProps) {
  if (activity.type === 'idle' || !activityLabel) {
    return null;
  }

  // Different colors for different activities
  const colorClass = {
    thinking: 'bg-purple-500',
    streaming: 'bg-blue-500',
    tool: 'bg-amber-500',
    queued: 'bg-gray-400',
    idle: 'bg-gray-400',
  }[activity.type] || 'bg-gray-400';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground animate-pulse">
      <span className={cn("h-2 w-2 rounded-full", colorClass)} />
      <span className="font-medium">{activityLabel}</span>
      {activity.toolName && (
        <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
          {activity.toolName}
        </code>
      )}
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
  disabled?: boolean;
}

function Composer({ draft, setDraft, isSending, onSubmit, onVoiceTranscript, onVoiceMessage, threadId, disabled }: ComposerProps) {
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
      Haptics.light(); // Haptic on Enter send
      onSubmit();
    }
  };

  const isDisabled = isSending || disabled;

  return (
    <div className="sticky bottom-0 border-t border-divider bg-content1 px-4 py-4">
      <div className="mx-auto w-full max-w-3xl pb-[env(safe-area-inset-bottom)]">
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            Haptics.medium(); // Haptic on button send
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
              disabled={isDisabled}
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
            <ChatComposer threadId={threadId} disabled={isDisabled} />
            <VoiceRecorder
              threadId={threadId}
              onTranscript={onVoiceTranscript}
              onVoiceMessage={onVoiceMessage}
              disabled={isDisabled}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isDisabled || !draft.trim()}
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
  // Debug: Log when ChatView mounts
  console.log('[ChatView] Mounted, activeThread:', activeThreadId);
  
  // OpenClaw WebSocket connection
  const connection = useOpenClawConnection();
  
  // Debug: Log connection state
  console.log('[ChatView] Connection:', { 
    connected: connection.connected, 
    connecting: connection.connecting,
    error: connection.error?.message 
  });
  
  // Session key for the current thread
  const sessionKey = useMemo(() => getSessionKey(activeThreadId), [activeThreadId]);
  
  // OpenClaw chat hook for WebSocket-based messaging
  const chat = useOpenClawChat(sessionKey);

  // Local state for messages (merged from initial props and WS)
  const [liveMessages, setLiveMessages] = useState<MessageRow[]>(threadMessages);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [useHttpFallback, setUseHttpFallback] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Sync messages from props (initial load)
  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  // Sync messages from WebSocket hook
  useEffect(() => {
    if (chat.messages.length > 0 && connection.connected) {
      // Convert OpenClaw messages to MessageRow format
      const wsMessages = chat.messages.map((m) => toMessageRow(m, activeThreadId));
      
      // Merge with existing messages, avoiding duplicates
      setLiveMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = wsMessages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        return [...prev, ...newMsgs].sort((a, b) => a.createdAt - b.createdAt);
      });
    }
  }, [chat.messages, activeThreadId, connection.connected]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [liveMessages.length, chat.streamingContent]);

  // Fallback to HTTP if WebSocket isn't available after 5 seconds
  useEffect(() => {
    if (connection.connected) {
      setUseHttpFallback(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!connection.connected && !connection.connecting) {
        console.log("[ChatView] WebSocket unavailable, using HTTP fallback");
        setUseHttpFallback(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [connection.connected, connection.connecting]);

  // HTTP Polling fallback (only when WS is unavailable)
  const lastCreatedAt = useMemo(() => {
    const last = liveMessages[liveMessages.length - 1];
    return last?.createdAt ?? 0;
  }, [liveMessages]);

  useEffect(() => {
    // Only use HTTP polling as fallback when WS is not connected
    if (connection.connected || !useHttpFallback) return;
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

    const t = setInterval(tick, 10000);
    void tick();

    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [activeThreadId, lastCreatedAt, connection.connected, useHttpFallback]);

  // Send message handler
  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setDraft("");

    try {
      // Try WebSocket first
      if (connection.connected) {
        await chat.send(content);
      } else {
        // HTTP fallback
        const r = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, content }),
        });

        if (!r.ok) throw new Error("send_failed");

        const contentType = r.headers.get("content-type") || "";

        // Handle SSE streaming response (HTTP fallback)
        if (contentType.includes("text/event-stream") && r.body) {
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
              if (!payload) continue;

              try {
                const event = JSON.parse(payload) as {
                  type: "user_confirmed" | "delta" | "done";
                  item?: MessageRow;
                  content?: string;
                };

                if (event.type === "user_confirmed" && event.item) {
                  setLiveMessages((prev) => {
                    if (prev.some((m) => m.id === event.item!.id)) return prev;
                    return [...prev, event.item!];
                  });
                } else if (event.type === "done" && event.item) {
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
          // Non-streaming JSON response
          const data = (await r.json()) as { ok: boolean; item: MessageRow };
          if (data?.ok && data.item?.id) {
            setLiveMessages((prev) => {
              if (prev.some((m) => m.id === data.item.id)) return prev;
              return [...prev, data.item];
            });
          }
        }
      }
    } catch (error) {
      console.error("[ChatView] Send error:", error);
      setDraft(content); // Restore on failure
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, connection.connected, chat, activeThreadId]);

  // Handle voice message from VoiceRecorder
  const handleVoiceMessage = useCallback((message: MessageRow) => {
    setLiveMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const mainCount = threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length;

  // Determine if we're currently streaming
  const isStreaming = chat.isStreaming || isSending;

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
                {/* Online indicator based on WS connection */}
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    connection.connected ? "bg-success" : "bg-warning"
                  )} 
                />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Dieter</h1>
                <p className="text-xs text-muted-foreground">
                  AI Assistant • <ConnectionStatus {...connection} />
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Activity Indicator */}
            <ActivityIndicator activity={chat.activity} activityLabel={chat.activityLabel} />
            
            {/* WebSocket/HTTP indicator */}
            <div 
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                connection.connected 
                  ? "bg-success/10 text-success" 
                  : useHttpFallback 
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
              )}
              title={connection.connected ? "WebSocket connected" : useHttpFallback ? "Using HTTP fallback" : "Connecting..."}
            >
              {connection.connected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {connection.connected ? "WS" : useHttpFallback ? "HTTP" : "..."}
              </span>
            </div>
            
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
            {liveMessages.length > 0 || chat.isStreaming ? (
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
                {/* Streaming/Activity message indicator */}
                {(chat.isStreaming || chat.activity.type !== 'idle') && (
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
                        <span className={cn(
                          "text-[10px]",
                          chat.activity.type === 'thinking' && "text-purple-500",
                          chat.activity.type === 'tool' && "text-amber-500",
                          chat.activity.type === 'streaming' && "text-blue-500",
                          chat.activity.type === 'idle' && "text-zinc-400"
                        )}>
                          {chat.activityLabel || 'typing...'}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed min-h-[1.5rem]">
                        {chat.streamingContent ? (
                          <MarkdownContent content={chat.streamingContent} className="text-sm" />
                        ) : chat.activity.type === 'thinking' ? (
                          <span className="flex items-center gap-2 text-purple-500/70">
                            <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-sm">Denkt nach...</span>
                          </span>
                        ) : chat.activity.type === 'tool' ? (
                          <span className="flex items-center gap-2 text-amber-500/70">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-spin" />
                            <span className="text-sm">
                              {chat.activity.toolName 
                                ? `Führt ${chat.activity.toolName} aus...` 
                                : 'Führt Aktion aus...'}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "0ms" }} />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
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
          isSending={isStreaming}
          onSubmit={handleSend}
          onVoiceTranscript={(transcript) => {
            // Set transcript as draft (fallback for old API)
            setDraft(transcript);
          }}
          onVoiceMessage={handleVoiceMessage}
          threadId={activeThreadId}
          disabled={!connection.connected && !useHttpFallback}
        />
      </section>
    </div>
  );
}
