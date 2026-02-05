"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Send, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { AgentStatusBar } from "../_ui/AgentStatusBar";
import { UnifiedInbox } from "../_ui/UnifiedInbox";
import { ProjectsStatusDashboard } from "../_ui/ProjectsStatusDashboard";

const VoiceRecorderButton = dynamic(
  () => import("./VoiceRecorderButton").then((m) => m.VoiceRecorderButton),
  { ssr: false }
);

// Types from original file
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

// Message component from original file
function MessageItem({ message, artefactsById }: { 
  message: MessageRow; 
  artefactsById: Record<string, ArtefactRow>;
}) {
  const isUser = message.role === "user";
  
  return (
    <div className={cn("flex gap-3 p-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[80%] space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2 text-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-white/60 text-foreground dark:bg-white/10"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        <div className={cn(
          "text-xs text-muted-foreground",
          isUser ? "text-right" : "text-left"
        )}>
          {message.createdAtLabel}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
            G
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// Composer component
function Composer({ draft, setDraft, isSending, onSubmit, threadId }: {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  onSubmit: () => void;
  threadId: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

        <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
          Press <kbd className="rounded bg-muted/50 px-1">Enter</kbd> to send,{" "}
          <kbd className="rounded bg-muted/50 px-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// Main Chat View Component
interface ChatViewProps {
  threads: ThreadRow[];
  activeThreadId: string;
  threadMessages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
  newThreadAction: () => void;
  logoutAction: () => void;
}

export function ChatViewNew({
  threads,
  activeThreadId,
  threadMessages,
  artefactsById,
  newThreadAction,
  logoutAction,
}: ChatViewProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [liveMessages, setLiveMessages] = useState<MessageRow[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allMessages = useMemo(() => {
    const combined = [...threadMessages, ...liveMessages];
    const unique = combined.filter((msg, index, arr) => 
      arr.findIndex(m => m.id === msg.id) === index
    );
    return unique.sort((a, b) => a.createdAt - b.createdAt);
  }, [threadMessages, liveMessages]);

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
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-60px)] flex-col">
      {/* Agent Status Bar */}
      <AgentStatusBar />
      
      {/* Main 3-Column Layout */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Left Column: Unified Inbox */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <UnifiedInbox />
        </aside>

        {/* Center Column: Chat Area */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/40">
          {/* Chat Header */}
          <header className="flex items-center justify-between border-b border-white/10 p-4 dark:border-white/5">
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile menu button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                title="Open menu"
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
            
            <NowBar />
          </header>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-2">
            {allMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <div>
                  <Bot className="mx-auto h-12 w-12 mb-4 text-primary/50" />
                  <p>Start a conversation with Dieter</p>
                  <p className="text-xs mt-1">Your AI assistant is ready to help</p>
                </div>
              </div>
            ) : (
              <div className="pb-4">
                {allMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    artefactsById={artefactsById}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Chat Composer */}
          <Composer
            draft={draft}
            setDraft={setDraft}
            isSending={isSending}
            onSubmit={handleSend}
            threadId={activeThreadId}
          />
        </main>

        {/* Right Column: Projects Status */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <ProjectsStatusDashboard />
        </aside>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-80 max-w-[90%] bg-background/95 shadow-2xl backdrop-blur-xl border-r border-white/20 dark:border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <span className="font-semibold">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-2">
                <div className="space-y-4">
                  <UnifiedInbox />
                  <ProjectsStatusDashboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}