"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Menu } from "lucide-react";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ChatComposer } from "./ChatComposer";
import { NowBar } from "./NowBar";
import { OpenClawStatusSidebar } from "./OpenClawStatusSidebar";

const VoiceRecorderButton = dynamic(
  () => import("./VoiceRecorderButton").then((m) => m.VoiceRecorderButton),
  { ssr: false },
);

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
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiveMessages(threadMessages);
  }, [threadMessages]);

  useEffect(() => {
    // Always scroll to newest message (simple + predictable for HQ chat).
    endRef.current?.scrollIntoView({ block: "end" });
  }, [liveMessages.length]);

  const lastCreatedAt = useMemo(() => {
    const last = liveMessages[liveMessages.length - 1];
    return last?.createdAt ?? 0;
  }, [liveMessages]);

  // Realtime: subscribe via SSE and append messages.
  // Cloudflare / some networks can block/kill EventSource; so we also keep
  // a low-frequency polling fallback.
  useEffect(() => {
    if (activeThreadId !== "main") return;

    const es = new EventSource(
      `/api/stream?thread=${encodeURIComponent(activeThreadId)}&since=${encodeURIComponent(String(lastCreatedAt))}`,
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
        // ignore
      }
    };

    es.addEventListener("message", onMessage);

    return () => {
      es.removeEventListener("message", onMessage);
      es.close();
    };
  }, [activeThreadId, lastCreatedAt]);

  // Fallback: poll for new messages every ~2.5s.
  useEffect(() => {
    if (activeThreadId !== "main") return;

    let stopped = false;

    const tick = async () => {
      try {
        const r = await fetch(
          `/api/chat/messages?thread=${encodeURIComponent(activeThreadId)}&since=${encodeURIComponent(String(lastCreatedAt))}`,
          { cache: "no-store" },
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
    // also fire once quickly
    void tick();

    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [activeThreadId, lastCreatedAt]);

  const mainCount = threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length;

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar (desktop) */}
      <div className="hidden lg:block lg:sticky lg:top-0">
        <OpenClawStatusSidebar logoutAction={logoutAction} />
        {/* Keep the server action wired, but don’t expose debug UI */}
        <form action={newThreadAction} className="hidden" aria-hidden="true" />
      </div>

      {/* Mobile HUD overlay */}
      {mobileHudOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 p-3 backdrop-blur-sm lg:hidden">
          <div className="h-full w-full overflow-hidden rounded-2xl border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-semibold">OpenClaw</div>
              <Button type="button" variant="ghost" onClick={() => setMobileHudOpen(false)}>
                Close
              </Button>
            </div>
            <div className="h-[calc(100%-44px)] overflow-auto">
              <OpenClawStatusSidebar logoutAction={logoutAction} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Main */}
      <section className="flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/55 shadow-[0_12px_45px_-22px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/35">
        <header className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile HUD button */}
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

            <div className="min-w-0">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Thread</div>
              <div className="truncate text-base font-semibold">Main</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{mainCount} msgs</div>
        </header>

        <Separator />

        <NowBar />

        <ScrollArea className="flex-1">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
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
                          ? "bg-white/20 text-white ring-white/20 shadow-[0_16px_45px_-28px_rgba(0,0,0,0.65)] backdrop-blur-2xl dark:bg-white/10 dark:ring-white/10"
                          : "bg-white/55 text-zinc-900 ring-white/40 shadow-[0_16px_45px_-30px_rgba(0,0,0,0.20)] backdrop-blur-2xl dark:bg-zinc-950/35 dark:text-zinc-50 dark:ring-zinc-800/70",
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
                          ) : isAudioMime(artefact.mimeType) ? (
                            <audio controls src={url} className="w-full" />
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
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <Separator />

        <div className="sticky bottom-0 border-t border-white/30 bg-white/65 px-4 py-4 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 dark:border-zinc-800/60 dark:bg-zinc-950/55 dark:supports-[backdrop-filter]:bg-zinc-950/35">
          <div className="mx-auto w-full max-w-3xl pb-[env(safe-area-inset-bottom)]">
            {/* Composer */}
            <form
              className="flex items-end gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
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
                  // restore draft on failure
                  setDraft(content);
                } finally {
                  setIsSending(false);
                }
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                rows={1}
                className="min-h-[44px] flex-1 resize-none rounded-2xl border-white/30 bg-white/55 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/30"
              />
              <ChatComposer threadId={activeThreadId} disabled={isSending} />

              <VoiceRecorderButton threadId={activeThreadId} disabled={isSending} />

              <Button type="submit" className="h-[44px]" disabled={isSending}>
                {isSending ? "Sending…" : "Send"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
