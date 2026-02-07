"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Menu, Send, Sparkles, User, Bot, MessageCircle, Dumbbell, Briefcase, Code, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
// import { NowBar } from "./NowBar"; // TODO: make functional before re-enabling
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";
import { DieterAvatar } from "./DieterAvatar";
import { StatusBar, type AgentActivityState } from "./_components/StatusBar";
import { SubagentPanel } from "./_components/SubagentPanel";
import { WorkspaceManager, type WorkspaceProject } from "./_components/WorkspaceManager";
import { ChatSuggestions, type ChatSuggestion } from "./_components/ChatSuggestions";
import { InboxView } from "./inbox";
import { CHAT_TABS, type ChatTab } from "./chat-config";
import { AgentActivityPanel } from "@/components/agents";

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

// Render message content with markdown image support
function MessageContent({ content }: { content: string }) {
  // Parse markdown images: ![alt](url)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = imagePattern.exec(content)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap break-words">
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    const [, alt, url] = match;
    
    // Render the image
    parts.push(
      <div key={key++} className="my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt || "Image"}
          className="max-w-full max-h-[400px] w-auto rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, "_blank")}
          loading="lazy"
        />
        {alt && alt !== "Image" && alt !== "Screenshot" && (
          <p className="text-[10px] text-zinc-500 mt-1">{alt}</p>
        )}
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last image
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap break-words">
        {content.slice(lastIndex)}
      </span>
    );
  }

  // If no images found, just return the text
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }

  return <>{parts}</>;
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
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50">
      <div className="mx-auto flex max-w-4xl items-center gap-0.5 md:gap-1 overflow-x-auto px-2 py-1.5 md:px-4 md:py-2 scrollbar-hide">
        {CHAT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const messageCount = threadCounts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex min-w-[56px] md:min-w-0 flex-1 flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-xs font-medium transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500",
                isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
            >
              <span className="text-sm md:text-base">{tab.emoji}</span>
              <span className="truncate text-[10px] md:text-[13px]">{tab.name}</span>

              {/* Badge */}
              {messageCount > 0 && !isActive && (
                <span className="absolute right-0.5 md:right-1.5 top-0.5 md:top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 px-1 text-[9px] md:text-xs font-medium text-zinc-600 dark:text-zinc-300">
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
  const author = isUser ? "Du" : meta.author ?? "Dieter";

  // System messages (hidden or minimal)
  if (isSystem) {
    return (
      <div className="mx-auto max-w-md py-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] md:text-xs text-muted-foreground">
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
          "flex items-end gap-2.5 md:gap-3 min-w-0 w-full",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        {isUser ? (
          <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 flex-none">
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] md:text-xs font-medium">
              <User className="h-3.5 w-3.5" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <DieterAvatar size="sm" />
        )}

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
        "flex items-end gap-2.5 md:gap-3 min-w-0 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 flex-none">
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] md:text-xs font-medium">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <DieterAvatar size="sm" />
      )}

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[85%] md:max-w-[70%] min-w-0 rounded-2xl px-3.5 py-2.5 md:px-4 md:py-3 overflow-hidden",
          isUser
            ? "bg-indigo-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
        )}
      >
        {/* Author & Time */}
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className="text-[11px] md:text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {author}
          </span>
          <span className="text-[10px] md:text-[11px] text-zinc-400 dark:text-zinc-500">
            {message.createdAtLabel}
          </span>
        </div>

        {/* Content */}
        {artefact && url ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium">
              <span>📎</span>
              <span className="truncate">{artefact.originalName}</span>
            </div>
            {isImageMime(artefact.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={artefact.originalName}
                className="max-h-[320px] w-auto rounded-xl border border-zinc-200 dark:border-zinc-700"
              />
            ) : isAudioMime(artefact.mimeType) ? (
              <audio controls src={url} className="w-full max-w-xs h-8" />
            ) : (
              <a
                href={url}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs md:text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Download {artefact.originalName}
              </a>
            )}
          </div>
        ) : (
          <div className="text-[13px] md:text-[14.5px] leading-relaxed [word-break:break-word] [overflow-wrap:break-word] [hyphens:auto]">
            <MessageContent content={meta.text} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Chat Content Component
// ============================================

// ============================================
// Streaming Response Bubble
// ============================================

function StreamingBubble({ text }: { text: string }) {
  const isThinking = text === "";

  return (
    <div className="flex items-end gap-2.5 md:gap-3 min-w-0 w-full flex-row animate-fade-in">
      <DieterAvatar size="sm" />
      <div className="max-w-[85%] md:max-w-[70%] min-w-0 rounded-2xl px-3.5 py-2.5 md:px-4 md:py-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1 px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <div className="text-[13px] md:text-[14.5px] leading-relaxed [word-break:break-word] [overflow-wrap:break-word] whitespace-pre-wrap">
            {text}
            <span className="inline-block w-0.5 h-4 bg-zinc-400 dark:bg-zinc-500 ml-0.5 animate-pulse align-text-bottom" />
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatContentProps {
  activeTab: string;
  messages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
  isTranscribing?: boolean;
  isSending?: boolean;
  streamingText?: string;
  onSuggestionClick?: (suggestion: ChatSuggestion) => void;
}

function ChatContent({ activeTab, messages, artefactsById, isTranscribing, isSending, streamingText, onSuggestionClick }: ChatContentProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);

  // Scroll to bottom - instant on tab change, smooth on new messages
  const scrollToBottom = useCallback((instant = false) => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: instant ? "instant" : "smooth"
        });
      }
    }
  }, []);

  // Scroll to bottom INSTANTLY when switching tabs or on initial load
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(timer);
  }, [activeTab, scrollToBottom]);

  // Scroll to bottom smoothly when new messages arrive
  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Scroll to bottom as streaming text grows
  useEffect(() => {
    if (streamingText) {
      scrollToBottom(false);
    }
  }, [streamingText, scrollToBottom]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 py-4 md:px-6 md:py-6 lg:max-w-4xl overflow-x-hidden">
        {messages.length > 0 ? (
            <div key={activeTab} className="space-y-3 md:space-y-4">
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
              className="flex flex-col items-center justify-center py-20 md:py-28 text-center"
            >
              <div className="mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-4 md:p-5">
                {currentTab && <currentTab.icon className="h-7 w-7 md:h-8 md:w-8 text-zinc-500 dark:text-zinc-400" />}
              </div>
              <h2 className="mb-1.5 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {currentTab?.emoji} {currentTab?.name}
              </h2>
              <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                {currentTab?.description}
              </p>
              <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-500">
                Starte eine Konversation
              </p>
            </div>
          )}

        {/* Streaming response bubble */}
        {isSending && streamingText !== undefined && (
          <StreamingBubble text={streamingText} />
        )}

        {/* Transcription indicator */}
        {isTranscribing && !isSending && (
          <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span>Transkribiere...</span>
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

const MAX_QUEUE_SIZE = 4;

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  queue: string[];
  onSubmit: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onVoiceMessage: (message: MessageRow) => void | Promise<void>;
  onTranscriptionStart: () => void;
  onTranscriptionEnd: () => void;
  onQueueEdit: (index: number, newText: string) => void;
  onQueueDelete: (index: number) => void;
  threadId: string;
  activeTab: string;
}

function Composer({ draft, setDraft, isSending, queue, onSubmit, onVoiceTranscript, onVoiceMessage, onTranscriptionStart, onTranscriptionEnd, onQueueEdit, onQueueDelete, threadId, activeTab }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const queueCount = queue.length;
  const isQueueFull = queueCount >= MAX_QUEUE_SIZE;

  // Auto-resize textarea (min 44px, max 160px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset to min height to get accurate scrollHeight
      textarea.style.height = "44px";
      // Only grow if content exceeds min height
      if (textarea.scrollHeight > 44) {
        textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
      }
    }
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className="sticky bottom-0 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-3 py-3 md:px-5 md:py-4"
      style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))" }}
    >
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl relative">
        <form
          className="flex items-center gap-2.5 md:gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Attachment */}
          <ChatComposer threadId={threadId} disabled={isSending} />

          {/* Text Input */}
          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSending ? "Zur Queue hinzufügen..." : "Nachricht..."}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border-0 backdrop-blur-sm",
                "min-h-[44px] px-4 py-[10px] text-[15px] leading-6",
                "placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100",
                "ring-1 transition-all duration-200 focus:outline-none focus:ring-2",
                isSending
                  ? "bg-indigo-50/80 dark:bg-indigo-950/30 ring-indigo-200/50 dark:ring-indigo-700/50 focus:ring-indigo-400/50"
                  : "bg-zinc-100/80 dark:bg-zinc-800/80 ring-zinc-200/50 dark:ring-zinc-700/50 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-zinc-800"
              )}
            />
          </div>

          {/* Voice Recorder */}
          <VoiceRecorder
            threadId={threadId}
            onTranscript={onVoiceTranscript}
            onVoiceMessage={onVoiceMessage}
            onTranscriptionStart={onTranscriptionStart}
            onTranscriptionEnd={onTranscriptionEnd}
            disabled={isSending}
          />
        </form>

        {/* Context indicator & Queue status */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <p className="hidden md:block text-[11px] text-zinc-400 dark:text-zinc-500">
            {currentTab?.emoji} {currentTab?.name} · Enter zum Senden
            {isQueueFull && " · Queue voll"}
          </p>
          {queueCount > 0 && (
            <button
              type="button"
              onClick={() => setQueueModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {queueCount}/{MAX_QUEUE_SIZE} in Warteschlange
            </button>
          )}
        </div>

        {/* Queue Modal */}
        {queueModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setQueueModalOpen(false)}
          >
            <div 
              className="w-full max-w-md mx-4 mb-4 md:mb-0 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Warteschlange ({queueCount}/{MAX_QUEUE_SIZE})
                </h3>
                <button
                  onClick={() => setQueueModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="sr-only">Schließen</span>
                  <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Queue Items */}
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {queue.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500 py-8">Keine Messages in der Warteschlange</p>
                ) : (
                  <div className="space-y-2">
                    {queue.map((msg, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        <span className="flex-none w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        
                        {editingIndex === index ? (
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  onQueueEdit(index, editText);
                                  setEditingIndex(null);
                                }}
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 break-words">
                              {msg}
                            </p>
                            <div className="flex-none flex gap-1">
                              <button
                                onClick={() => {
                                  setEditText(msg);
                                  setEditingIndex(index);
                                }}
                                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                title="Bearbeiten"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onQueueDelete(index)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Löschen"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-xs text-zinc-500">
                  Messages werden der Reihe nach gesendet
                </p>
              </div>
            </div>
          </div>
        )}
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
  const [streamingText, setStreamingText] = useState<Record<string, string>>({});
  const [messageQueue, setMessageQueue] = useState<Record<string, string[]>>({});
  const [subagentPanelCollapsed, setSubagentPanelCollapsed] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<"activity" | "subagents">("activity");
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
  
  // Voice transcription status per thread
  const [transcribingStates, setTranscribingStates] = useState<Record<string, boolean>>({});
  
  // Agent activity state per thread (what Dieter is doing)
  const [agentActivityStates, setAgentActivityStates] = useState<Record<string, AgentActivityState>>({});
  
  // Workspace state (for Dev tab)
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>([]);

  const endRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Ref to track last message timestamps for SSE subscriptions (avoids dependency on liveMessages)
  const lastMessageTimestampsRef = useRef<Record<string, number>>({});
  
  // Ref to track pending send operation to avoid stale closure issues
  const pendingSendRef = useRef<{ threadId: string; content: string } | null>(null);

  // Load workspace projects on mount (from API for persistence across devices)
  useEffect(() => {
    async function loadWorkspaceProjects() {
      try {
        const res = await fetch('/api/workspace/projects');
        if (res.ok) {
          const data = await res.json();
          const projects = data.projects || [];
          setWorkspaceProjects(projects);
          // Check if active project still exists after refresh
          setActiveProject(prev => {
            if (!prev) return null;
            const stillExists = projects.some((p: WorkspaceProject) => p.id === prev.id);
            return stillExists ? prev : null;
          });
        }
      } catch (err) {
        console.error('Error loading workspace projects:', err);
      }
    }
    loadWorkspaceProjects();

    // Refresh projects when tab becomes visible (cross-device sync)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadWorkspaceProjects();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Sync messages from props
  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  // Check if current tab is a workspace tab
  const currentTabConfig = CHAT_TABS.find(tab => tab.id === activeTab);
  const isWorkspaceTab = currentTabConfig?.isWorkspace === true;

  // For workspace tabs, use project's threadId; for others, use tab id directly
  const effectiveThreadId = isWorkspaceTab && activeProject 
    ? activeProject.threadId 
    : activeTab;

  // Get current messages based on effective thread
  const currentMessages = liveMessages[effectiveThreadId] || [];
  const currentDraft = drafts[effectiveThreadId] || "";
  const isSending = sendingStates[effectiveThreadId] || false;
  const currentAgentActivity: AgentActivityState = agentActivityStates[effectiveThreadId] || "idle";

  // Calculate thread counts for tab navigation
  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of CHAT_TABS) {
      if (tab.isSpecialView) {
        // Special view tabs (like Inbox) don't have message counts
        // TODO: Could fetch pending inbox items count from API
        counts[tab.id] = 0;
      } else if (tab.isWorkspace) {
        // For workspace tabs, count total messages across all projects
        const projectThreadIds = workspaceProjects.map(p => p.threadId);
        counts[tab.id] = projectThreadIds.reduce((sum, tid) => sum + (liveMessages[tid]?.length || 0), 0);
      } else {
        counts[tab.id] = liveMessages[tab.id]?.length || 0;
      }
    }
    return counts;
  }, [liveMessages, workspaceProjects]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    // If clicking the same workspace tab while in a project, go back to workspace view
    const newTabConfig = CHAT_TABS.find(tab => tab.id === tabId);
    if (newTabConfig?.isWorkspace && tabId === activeTab && activeProject) {
      setActiveProject(null);
      return;
    }
    
    setActiveTab(tabId);
    // Clear active project when switching to a non-workspace tab
    if (!newTabConfig?.isWorkspace) {
      setActiveProject(null);
    }
  };

  // Handle project selection
  const handleProjectSelect = useCallback((project: WorkspaceProject | null) => {
    setActiveProject(project);
  }, []);

  // Handle project creation
  const handleProjectCreate = useCallback((project: WorkspaceProject) => {
    setWorkspaceProjects(prev => [project, ...prev]);
  }, []);

  // Handle project deletion (for cross-device sync)
  const handleProjectDelete = useCallback((projectId: string) => {
    // Find the project to get its threadId for cleanup
    const project = workspaceProjects.find(p => p.id === projectId);
    
    setWorkspaceProjects(prev => prev.filter(p => p.id !== projectId));
    
    // Clear active project if it was deleted
    setActiveProject(prev => prev?.id === projectId ? null : prev);
    
    // Clean up messages for the deleted project's thread
    if (project) {
      setLiveMessages(prev => {
        const next = { ...prev };
        delete next[project.threadId];
        return next;
      });
      // Clean up timestamp ref
      delete lastMessageTimestampsRef.current[project.threadId];
    }
  }, [workspaceProjects]);

  // Handle projects refresh (from WorkspaceManager on visibility change)
  const handleProjectsRefresh = useCallback((projects: WorkspaceProject[]) => {
    setWorkspaceProjects(projects);
    // Check if active project still exists
    setActiveProject(prev => {
      if (!prev) return null;
      const stillExists = projects.some(p => p.id === prev.id);
      return stillExists ? prev : null;
    });
  }, []);

  // Handle draft changes per thread
  const setDraft = (value: string) => {
    setDrafts(prev => ({ ...prev, [effectiveThreadId]: value }));
  };

  // Core send function - takes content directly
  const sendMessage = async (content: string, threadId: string) => {
    if (!content.trim()) return;

    setSendingStates(prev => ({ ...prev, [threadId]: true }));
    // Start with "thinking" state
    setAgentActivityStates(prev => ({ ...prev, [threadId]: "thinking" }));

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, content }),
      });

      if (!r.ok) {
        throw new Error(`send_failed: ${r.status}`);
      }

      // Handle SSE stream response
      if (!r.body) {
        throw new Error("No response body");
      }

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
              // User message confirmed - Dieter is now typing response
              setAgentActivityStates(prev => ({ ...prev, [threadId]: "typing" }));
              // Initialize streaming bubble (empty = thinking dots)
              setStreamingText(prev => ({ ...prev, [threadId]: "" }));
              // Add user message to chat
              setLiveMessages((prev) => ({
                ...prev,
                [threadId]: [
                  ...(prev[threadId] || []),
                  event.item
                ].filter((m, i, arr) => arr.findIndex(msg => msg.id === m.id) === i)
              }));
              if (event.item.createdAt) {
                lastMessageTimestampsRef.current[threadId] = event.item.createdAt;
              }
            } else if (event.type === "delta" && event.content) {
              // Accumulate streaming text
              setStreamingText(prev => ({
                ...prev,
                [threadId]: (prev[threadId] || "") + event.content
              }));
            } else if (event.type === "done" && event.item) {
              // Response complete - clear streaming, show final message
              setStreamingText(prev => {
                const next = { ...prev };
                delete next[threadId];
                return next;
              });
              setAgentActivityStates(prev => ({ ...prev, [threadId]: "idle" }));
              // Add complete assistant message
              setLiveMessages((prev) => ({
                ...prev,
                [threadId]: [
                  ...(prev[threadId] || []),
                  event.item
                ].filter((m, i, arr) => arr.findIndex(msg => msg.id === m.id) === i)
              }));
              if (event.item.createdAt) {
                lastMessageTimestampsRef.current[threadId] = event.item.createdAt;
              }
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
    } catch (err) {
      console.error("Send failed:", err);
      // Clear streaming text on error
      setStreamingText(prev => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      // Set stuck state on error
      setAgentActivityStates(prev => ({ ...prev, [threadId]: "stuck" }));
      // Auto-recover to idle after 5 seconds
      setTimeout(() => {
        setAgentActivityStates(prev => ({ ...prev, [threadId]: "idle" }));
      }, 5000);
    } finally {
      // Mark sending as done
      setSendingStates(prev => ({ ...prev, [threadId]: false }));
      
      // Process next queued message for this thread
      setMessageQueue(prev => {
        const queue = prev[threadId] || [];
        if (queue.length > 0) {
          const [nextMessage, ...remaining] = queue;
          // Schedule next send (can't call sendMessage directly in setState)
          setTimeout(() => sendMessage(nextMessage, threadId), 0);
          return { ...prev, [threadId]: remaining };
        }
        return prev;
      });
    }
  };

  // Public send handler - reads draft, queues if busy, or sends directly
  const handleSend = async () => {
    const content = currentDraft.trim();
    if (!content) return;

    const threadId = effectiveThreadId;
    const currentQueue = messageQueue[threadId] || [];

    // If currently sending, queue the message (if not full)
    if (sendingStates[threadId]) {
      if (currentQueue.length >= MAX_QUEUE_SIZE) {
        // Queue is full, don't add more
        return;
      }
      setMessageQueue(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), content]
      }));
      setDrafts(prev => ({ ...prev, [threadId]: "" }));
      return;
    }

    // Clear draft and send
    setDrafts(prev => ({ ...prev, [threadId]: "" }));
    await sendMessage(content, threadId);
  };

  // Queue management functions
  const handleQueueEdit = useCallback((index: number, newText: string) => {
    const threadId = effectiveThreadId;
    setMessageQueue(prev => {
      const queue = [...(prev[threadId] || [])];
      if (index >= 0 && index < queue.length) {
        queue[index] = newText;
      }
      return { ...prev, [threadId]: queue };
    });
  }, [effectiveThreadId]);

  const handleQueueDelete = useCallback((index: number) => {
    const threadId = effectiveThreadId;
    setMessageQueue(prev => {
      const queue = [...(prev[threadId] || [])];
      queue.splice(index, 1);
      return { ...prev, [threadId]: queue };
    });
  }, [effectiveThreadId]);

  // Handle suggestion clicks (quick actions after assistant messages)
  const handleSuggestionClick = useCallback(async (suggestion: ChatSuggestion) => {
    if (suggestion.action === "workspace" && suggestion.payload) {
      // Switch to Dev tab and create a new workspace project via API
      setActiveTab("dev");
      
      try {
        const res = await fetch('/api/workspace/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: suggestion.payload }),
        });
        
        if (!res.ok) throw new Error('Failed to create project');
        
        const data = await res.json();
        const newProject = data.project as WorkspaceProject;
        
        // Add to local state and select
        setWorkspaceProjects(prev => [newProject, ...prev]);
        setActiveProject(newProject);
        
        // Set initial message for context using the correct threadId
        setDrafts(prev => ({
          ...prev,
          [newProject.threadId]: `Lass uns an "${suggestion.payload}" arbeiten. Was ist der Plan?`
        }));
      } catch (err) {
        console.error('Error creating project from suggestion:', err);
      }
    } else if (suggestion.action === "send" && suggestion.payload) {
      // Send the suggested message
      const threadId = activeProject?.id || activeTab;
      setDrafts(prev => ({ ...prev, [threadId]: suggestion.payload! }));
      // Trigger send after state update
      setTimeout(() => handleSend(), 50);
    } else if (suggestion.action === "custom") {
      // Focus the input for custom response
      const textarea = document.querySelector('textarea[placeholder="Nachricht..."]') as HTMLTextAreaElement;
      textarea?.focus();
    }
  }, [activeTab, activeProject, handleSend]);

  // SSE subscription for real-time messages per tab + workspace projects
  // Initialize timestamp refs from initial messages (runs once)
  useEffect(() => {
    const timestamps = lastMessageTimestampsRef.current;
    for (const tab of CHAT_TABS) {
      if (tab.isWorkspace || tab.isSpecialView) continue;
      const messages = threadMessages[tab.id];
      if (messages?.length) {
        const lastTs = messages[messages.length - 1]?.createdAt || 0;
        if (!timestamps[tab.id] || lastTs > timestamps[tab.id]) {
          timestamps[tab.id] = lastTs;
        }
      }
    }
  }, [threadMessages]);

  // SSE subscription - only recreate when workspaceProjects changes (rare)
  useEffect(() => {
    const eventSources: EventSource[] = [];
    
    // Helper to create SSE subscription for a thread
    const subscribeToThread = (threadId: string) => {
      // Use ref for timestamp to avoid stale closure, start from 0 if not set
      const since = lastMessageTimestampsRef.current[threadId] || 0;
      
      const es = new EventSource(
        `/api/stream?thread=${encodeURIComponent(threadId)}&since=${encodeURIComponent(String(since))}`
      );

      const onMessage = (ev: MessageEvent) => {
        try {
          const item = JSON.parse(ev.data) as MessageRow;
          if (!item?.id || item.threadId !== threadId) return;
          
          setLiveMessages((prev) => {
            const existing = prev[threadId] || [];
            if (existing.some((m) => m.id === item.id)) return prev;
            
            // Update timestamp ref for future reconnections
            if (item.createdAt) {
              const currentTs = lastMessageTimestampsRef.current[threadId] || 0;
              if (item.createdAt > currentTs) {
                lastMessageTimestampsRef.current[threadId] = item.createdAt;
              }
            }
            
            return {
              ...prev,
              [threadId]: [...existing, item]
            };
          });
        } catch {
          // ignore parse errors
        }
      };

      es.addEventListener("message", onMessage);
      eventSources.push(es);
    };
    
    // Subscribe to regular tabs (non-workspace, non-special view)
    for (const tab of CHAT_TABS) {
      if (tab.isWorkspace || tab.isSpecialView) continue;
      subscribeToThread(tab.id);
    }

    // Subscribe to workspace project threads
    for (const project of workspaceProjects) {
      subscribeToThread(project.threadId);
    }

    return () => {
      eventSources.forEach(es => {
        es.close();
      });
    };
  }, [workspaceProjects]); // Only depends on workspaceProjects, NOT liveMessages

  const currentTab = CHAT_TABS.find(tab => tab.id === activeTab);
  
  // Check if current tab is a special view (like Inbox)
  const isSpecialViewTab = currentTabConfig?.isSpecialView === true;
  
  // Determine what to show in the main area
  const showWorkspaceManager = isWorkspaceTab && !activeProject;
  const showInboxView = isSpecialViewTab && activeTab === "inbox";
  const showChat = !isWorkspaceTab && !isSpecialViewTab || (isWorkspaceTab && activeProject);

  return (
    <div className={cn(
      "grid gap-4 lg:gap-5 lg:px-4 lg:py-3",
      subagentPanelCollapsed
        ? "lg:grid-cols-[300px_1fr_auto]"
        : "lg:grid-cols-[300px_1fr_280px]"
    )}>
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-5rem)] lg:self-start">
        <OpenClawStatusSidebar logoutAction={logoutAction} />
        <form action={newThreadAction} className="hidden" aria-hidden="true" />
      </aside>

      {/* Mobile Activity Button removed - use DieterAvatar in chat instead */}

      {/* Mobile Activity Modal */}
      {mobileActivityOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileActivityOpen(false)}
        >
          <div
            className="absolute inset-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AgentActivityPanel
              className="h-full"
              pollIntervalMs={15000}
              onToggleCollapse={() => setMobileActivityOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile HUD overlay */}
      {mobileHudOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileHudOpen(false)}
        >
          <div
            className="absolute inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
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

      {/* Main Chat Area */}
      <section className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] flex-col overflow-hidden md:rounded-2xl md:border md:border-zinc-200/80 md:dark:border-zinc-800/80 md:bg-white md:dark:bg-zinc-950 md:shadow-sm lg:h-[calc(100dvh-4.5rem)]">
        {/* Header */}
        <header className="hidden md:flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3.5">
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

            {/* Back button for workspace projects */}
            {isWorkspaceTab && activeProject && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setActiveProject(null)}
                title="Back to workspace"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

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
                <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isWorkspaceTab && activeProject
                    ? `Dieter · ${activeProject.name}`
                    : `Dieter ${currentTab ? `· ${currentTab.name}` : ''}`
                  }
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isWorkspaceTab && activeProject ? 'Project Session' : 'Online'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
              {currentMessages.length}
            </span>
            {/* Reset Chat Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={async () => {
                if (window.confirm("Chat neu starten? Alle Nachrichten werden gelöscht.")) {
                  setLiveMessages((prev) => ({
                    ...prev,
                    [effectiveThreadId]: [],
                  }));
                  try {
                    await fetch('/api/chat/reset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ threadId: effectiveThreadId }),
                    });
                  } catch (err) {
                    console.error('Failed to reset chat in DB:', err);
                  }
                }
              }}
              title="Chat neu starten"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Live Status Bar - always shows what Dieter is doing */}
        <StatusBar agentActivity={currentAgentActivity} threadId={effectiveThreadId} />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          threadCounts={threadCounts}
        />

        {/* Now Bar - hidden on mobile, TODO: make functional */}
        {/* <NowBar /> */}

        {/* Workspace Manager (for Dev tab without project) */}
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

        {/* Inbox View (for Inbox tab) */}
        {showInboxView && (
          <div className="flex-1 overflow-hidden">
            <InboxView />
          </div>
        )}

        {/* Messages (for regular tabs or workspace with project) */}
        {showChat && (
          <>
            <ChatContent
              activeTab={effectiveThreadId}
              messages={currentMessages}
              artefactsById={artefactsById}
              isTranscribing={transcribingStates[effectiveThreadId]}
              isSending={isSending}
              streamingText={streamingText[effectiveThreadId]}
              onSuggestionClick={handleSuggestionClick}
            />

            {/* Composer */}
            <Composer
              draft={currentDraft}
              setDraft={setDraft}
              isSending={isSending}
              queue={messageQueue[effectiveThreadId] || []}
              onSubmit={handleSend}
              onQueueEdit={handleQueueEdit}
              onQueueDelete={handleQueueDelete}
              onVoiceTranscript={(transcript) => setDraft(transcript)}
              onVoiceMessage={async (message) => {
                console.log("[Voice] onVoiceMessage called:", { id: message.id, hasAudioUrl: !!message.audioUrl, transcription: message.transcription?.slice(0, 50), threadId: effectiveThreadId });
                
                // Add voice message to chat IMMEDIATELY (user sees playable audio right away!)
                const threadIdAtSend = effectiveThreadId;
                setLiveMessages((prev) => ({
                  ...prev,
                  [threadIdAtSend]: [
                    ...(prev[threadIdAtSend] || []),
                    message
                  ].filter((m, i, arr) => arr.findIndex(msg => msg.id === m.id) === i) // dedup
                }));
                
                // Helper to trigger assistant response
                const triggerAssistantResponse = async (transcription: string) => {
                  console.log("[Voice] Triggering assistant with transcription:", transcription.slice(0, 50));
                  setSendingStates(prev => ({ ...prev, [threadIdAtSend]: true }));
                  
                  try {
                    const r = await fetch("/api/chat/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        threadId: threadIdAtSend, 
                        content: transcription,
                        skipUserMessage: true // User message already added as voice message
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
                                  event.item
                                ].filter((m, i, arr) => arr.findIndex(msg => msg.id === m.id) === i)
                              }));
                              if (event.item.createdAt) {
                                lastMessageTimestampsRef.current[threadIdAtSend] = event.item.createdAt;
                              }
                            }
                          } catch {
                            // Ignore JSON parse errors
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error("[Voice] Assistant response failed:", err);
                  } finally {
                    setSendingStates(prev => ({ ...prev, [threadIdAtSend]: false }));
                  }
                };
                
                // If transcription exists immediately, trigger assistant
                if (message.transcription) {
                  await triggerAssistantResponse(message.transcription);
                } else {
                  // Transcription is processing in background - poll for it
                  console.log("[Voice] No transcription yet, polling for background transcription...");
                  
                  // Poll for transcription (max 30 seconds, every 500ms)
                  const pollForTranscription = async () => {
                    const maxAttempts = 60; // 30 seconds
                    const pollInterval = 500;
                    
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                      await new Promise(resolve => setTimeout(resolve, pollInterval));
                      
                      try {
                        const res = await fetch(`/api/chat/voice-message/${message.id}`);
                        if (res.ok) {
                          const data = await res.json();
                          if (data.transcription) {
                            console.log("[Voice] Background transcription received:", data.transcription.slice(0, 50));
                            
                            // Update local message with transcription
                            setLiveMessages((prev) => ({
                              ...prev,
                              [threadIdAtSend]: (prev[threadIdAtSend] || []).map(m => 
                                m.id === message.id 
                                  ? { ...m, transcription: data.transcription, content: data.transcription }
                                  : m
                              )
                            }));
                            
                            // Trigger assistant response
                            await triggerAssistantResponse(data.transcription);
                            return;
                          }
                        }
                      } catch (err) {
                        console.error("[Voice] Poll error:", err);
                      }
                    }
                    console.log("[Voice] Transcription polling timed out after 30s");
                  };
                  
                  // Start polling (don't await - let it run in background)
                  pollForTranscription().catch(err => console.error("[Voice] Polling failed:", err));
                }
              }}
              onTranscriptionStart={() => {
                console.log("[Voice] Transcription started");
                setTranscribingStates(prev => ({ ...prev, [effectiveThreadId]: true }));
              }}
              onTranscriptionEnd={() => {
                console.log("[Voice] Transcription ended");
                setTranscribingStates(prev => ({ ...prev, [effectiveThreadId]: false }));
              }}
              threadId={effectiveThreadId}
              activeTab={activeTab}
            />
          </>
        )}
      </section>

      {/* Right Panel: Agent Activity / Subagents (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-5rem)] lg:self-start">
        {subagentPanelCollapsed ? (
          // Collapsed: Show mini toggle buttons
          <div className="flex flex-col gap-2">
            <AgentActivityPanel
              collapsed={true}
              onToggleCollapse={() => {
                setSubagentPanelCollapsed(false);
                setRightPanelView("activity");
              }}
            />
            <SubagentPanel
              collapsed={true}
              onToggleCollapse={() => {
                setSubagentPanelCollapsed(false);
                setRightPanelView("subagents");
              }}
              className="h-auto"
            />
          </div>
        ) : (
          // Expanded: Show panel with tabs
          <div className="flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white/60 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 border-b border-zinc-200/70 px-2 py-1.5 dark:border-zinc-800">
              <button
                onClick={() => setRightPanelView("activity")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  rightPanelView === "activity"
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                🤖 Activity
              </button>
              <button
                onClick={() => setRightPanelView("subagents")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  rightPanelView === "subagents"
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                🧠 Subagents
              </button>
              <button
                onClick={() => setSubagentPanelCollapsed(true)}
                className="ml-1 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Minimieren"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelView === "activity" ? (
                <AgentActivityPanel
                  className="h-full border-0 rounded-none shadow-none bg-transparent"
                  pollIntervalMs={15000}
                />
              ) : (
                <SubagentPanel
                  className="h-full border-0 rounded-none shadow-none bg-transparent"
                />
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}