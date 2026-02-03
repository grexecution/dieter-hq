"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
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

  const mainCount = threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length;

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const startRecording = async () => {
    if (isRecording || isUploadingVoice) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));

    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = async () => {
      try {
        setIsUploadingVoice(true);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type,
        });

        const fd = new FormData();
        fd.set("threadId", activeThreadId);
        fd.set("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload_failed");
      } finally {
        setIsUploadingVoice(false);
        chunksRef.current = [];
      }
    };

    rec.start();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      recorderRef.current?.stop();
    } finally {
      setIsRecording(false);
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

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

        <div className="px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
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
                className="min-h-[44px] flex-1 resize-none"
              />
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                className="h-[44px] w-[44px] px-0"
                onClick={async () => {
                  if (isRecording) await stopRecording();
                  else await startRecording();
                }}
                disabled={isUploadingVoice}
                title={isRecording ? "Stop recording" : "Record voice"}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                type="submit"
                className="h-[44px]"
                disabled={isSending || isRecording || isUploadingVoice}
              >
                {isSending ? "Sending…" : isUploadingVoice ? "Uploading…" : "Send"}
              </Button>
            </form>

            <ChatComposer threadId={activeThreadId} />
          </div>
        </div>
      </section>
    </div>
  );
}
