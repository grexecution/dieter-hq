"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";

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

function displayContent(raw: string): { author?: string; text: string } {
  // If content starts with [Author] prefix, split it out.
  // Avoid RegExp /s flag for older TS targets.
  const m = raw.match(/^\[(.+?)\]\s*([\s\S]*)$/);
  if (!m) return { text: raw };
  return { author: m[1], text: m[2] };
}

export type ArtefactRow = {
  id: string;
  threadId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

function extractArtefactIdFromContent(content: string): string | null {
  // Our upload message currently stores a URL like /api/artefacts/<id>
  const m = content.match(/\/api\/artefacts\/([0-9a-fA-F-]{8,})/);
  return m?.[1] ?? null;
}

function isImageMime(m: string): boolean {
  return m.startsWith("image/");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function ChatView({
  threads,
  activeThreadId,
  threadMessages,
  artefactsById,
  newThreadAction,
  logoutAction,
  sendMessageAction,
}: {
  threads: ThreadRow[];
  activeThreadId: string;
  threadMessages: MessageRow[];
  artefactsById: Record<string, ArtefactRow>;
  newThreadAction: (formData: FormData) => void;
  logoutAction: (formData: FormData) => void;
  sendMessageAction: (formData: FormData) => void;
}) {
  const [liveMessages, setLiveMessages] = useState<MessageRow[]>(threadMessages);

  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  const lastCreatedAt = useMemo(() => {
    const last = liveMessages[liveMessages.length - 1];
    return last?.createdAt ?? 0;
  }, [liveMessages]);

  // MVP: poll for new messages in main thread so replies show up live.
  useEffect(() => {
    if (activeThreadId !== "main") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(
          `/api/chat/messages?thread=${encodeURIComponent(activeThreadId)}&since=${encodeURIComponent(String(lastCreatedAt))}`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const data = (await r.json()) as {
          ok: boolean;
          items: MessageRow[];
        };
        if (!data?.ok || !Array.isArray(data.items) || !data.items.length) return;
        if (cancelled) return;
        setLiveMessages((prev) => [...prev, ...data.items]);
      } catch {
        // ignore
      }
    };

    const t = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [activeThreadId, lastCreatedAt]);

  const mainCount = threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside className="h-[calc(100dvh-120px)] rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Chat</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Dieter HQ • main</div>
          </div>
          <form action={logoutAction}>
            <Button size="sm" variant="secondary" type="submit">
              Logout
            </Button>
          </form>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Button asChild variant="outline" className="h-auto w-full justify-between px-3 py-3">
            <Link href="/chat">
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium">Main</span>
                <span className="text-xs text-muted-foreground">{mainCount} messages</span>
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                live
              </span>
            </Link>
          </Button>

          {/* Keep the server action wired, but don’t expose debug UI */}
          <form action={newThreadAction} className="hidden" aria-hidden="true" />
        </div>

        <div className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          Tip: paste images directly into the chat.
        </div>
      </aside>

      {/* Main */}
      <section className="flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/60 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
        <header className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Thread</div>
            <div className="truncate text-base font-semibold">Main</div>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{mainCount} msgs</div>
        </header>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {liveMessages.length ? (
              liveMessages.map((m) => {
                const artefactId = extractArtefactIdFromContent(m.content);
                const artefact = artefactId ? artefactsById[artefactId] : null;
                const url = artefactId
                  ? `/api/artefacts/${encodeURIComponent(artefactId)}`
                  : null;

                const isUser = m.role === "user";
                const meta = displayContent(m.content);
                const author = isUser ? "You" : meta.author ?? "Dieter";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-end gap-3",
                      isUser ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isUser ? (
                      <Avatar className="h-8 w-8 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                        <AvatarFallback>{initials(author)}</AvatarFallback>
                      </Avatar>
                    ) : null}

                    <div
                      className={cn(
                        "w-full max-w-[720px] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1",
                        isUser
                          ? "bg-zinc-900 text-white ring-zinc-900/10 dark:bg-zinc-50 dark:text-zinc-900 dark:ring-zinc-50/10"
                          : "bg-white/80 text-zinc-900 ring-zinc-200/70 dark:bg-zinc-950/60 dark:text-zinc-50 dark:ring-zinc-800",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isUser
                              ? "text-white/80 dark:text-zinc-900/70"
                              : "text-zinc-500 dark:text-zinc-400",
                          )}
                        >
                          {author}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isUser
                              ? "text-white/70 dark:text-zinc-900/60"
                              : "text-zinc-500 dark:text-zinc-400",
                          )}
                        >
                          {m.createdAtLabel}
                        </div>
                      </div>

                      {artefact && url ? (
                        <div className="mt-2 grid gap-2">
                          <div
                            className={cn(
                              "text-sm font-medium",
                              isUser && "text-white dark:text-zinc-900",
                            )}
                          >
                            📎 {artefact.originalName}
                          </div>
                          {isImageMime(artefact.mimeType) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={artefact.originalName}
                              className="max-h-[420px] w-auto rounded-xl border"
                            />
                          ) : (
                            <a
                              href={url}
                              className={cn(
                                "text-sm underline",
                                isUser
                                  ? "text-white dark:text-zinc-900"
                                  : "text-zinc-900 dark:text-zinc-50",
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 whitespace-pre-wrap leading-relaxed">
                          {meta.text}
                        </div>
                      )}
                    </div>

                    {isUser ? (
                      <Avatar className="h-8 w-8 border bg-background">
                        <AvatarFallback>G</AvatarFallback>
                      </Avatar>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                Schreib einfach los – ich antworte hier.
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            {/* Composer */}
            <form action={sendMessageAction} className="flex items-end gap-3">
              <Textarea
                name="content"
                placeholder="Write a message…"
                rows={1}
                className="min-h-[44px] flex-1 resize-none"
              />
              <Button type="submit" className="h-[44px]">
                Send
              </Button>
            </form>

            <ChatComposer threadId={activeThreadId} />
          </div>
        </div>
      </section>
    </div>
  );
}
