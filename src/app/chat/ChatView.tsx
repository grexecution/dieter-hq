"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  ScrollShadow,
  Snippet,
  Textarea,
} from "@heroui/react";

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
};

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

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

function pickTitle(t: ThreadRow): string {
  // Pretty titles for synthetic inbox threads.
  if (t.threadId.startsWith("inbox:")) {
    const parts = t.threadId.split(":");
    const channel = parts[1] ?? "inbox";
    const chatId = parts[2] ?? "";
    return `${channel}${chatId ? ` (${chatId})` : ""}`;
  }
  return t.threadId.slice(0, 8);
}

function extractArtefactIdFromContent(content: string): string | null {
  // Our upload message currently stores a URL like /api/artefacts/<id>
  const m = content.match(/\/api\/artefacts\/([0-9a-fA-F-]{8,})/);
  return m?.[1] ?? null;
}

function isImageMime(m: string): boolean {
  return m.startsWith("image/");
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

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar (keep minimal; main thread is the default) */}
      <Card
        shadow="md"
        className="h-[calc(100dvh-120px)] rounded-2xl border border-default-200/70 bg-background/70 backdrop-blur"
      >
        <CardHeader className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold leading-tight">Inbox</div>
            <div className="text-xs text-default-500">Dieter HQ</div>
          </div>
          <form action={logoutAction}>
            <Button size="sm" variant="flat" type="submit">
              Logout
            </Button>
          </form>
        </CardHeader>
        <CardBody className="gap-3">
          <Button
            as={Link}
            href="/chat?thread=main"
            variant={activeThreadId === "main" ? "solid" : "flat"}
            color={activeThreadId === "main" ? "primary" : "default"}
            className="h-auto justify-start px-3 py-3"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <div className="text-left">
                <div className="font-semibold">{pickTitle({ threadId: "main", lastAt: 0, count: 0 })}</div>
                <div className="text-xs opacity-70">{threads.find((t) => t.threadId === "main")?.count ?? liveMessages.length} msgs</div>
              </div>
              <Chip size="sm" variant="flat">
                live
              </Chip>
            </div>
          </Button>

          <form action={newThreadAction}>
            <Button type="submit" variant="flat" className="w-full">
              New thread (debug)
            </Button>
          </form>

          <Divider />

          <div className="text-xs text-default-400">
            <Link className="hover:underline" href="/events">
              View event log
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Main */}
      <Card
        shadow="md"
        className="h-[calc(100dvh-120px)] rounded-2xl border border-default-200/70 bg-background/70 backdrop-blur"
      >
        <CardHeader className="flex flex-col items-start gap-3">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-default-500">Thread</div>
              <div className="truncate text-base font-semibold">Main</div>
            </div>
            <Snippet size="sm" symbol="" className="max-w-[220px]" codeString={activeThreadId}>
              copy id
            </Snippet>
          </div>

          {/* Loud last message banner */}
          {liveMessages.length ? (
            <div className="w-full truncate text-lg font-semibold text-danger">
              {displayContent(liveMessages[liveMessages.length - 1]?.content).text}
            </div>
          ) : null}
        </CardHeader>

        <Divider />

        <CardBody className="flex flex-col gap-4 overflow-hidden">
          {/* Messages */}
          <ScrollShadow className="flex-1 overflow-y-auto px-1">
            <div className="flex flex-col gap-3">
              {liveMessages.length ? (
                liveMessages.map((m) => {
                  const artefactId = extractArtefactIdFromContent(m.content);
                  const artefact = artefactId ? artefactsById[artefactId] : null;
                  const url = artefactId
                    ? `/api/artefacts/${encodeURIComponent(artefactId)}`
                    : null;

                  const isUser = m.role === "user";
                  const meta = displayContent(m.content);

                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser ? (
                        <Avatar name={meta.author ?? "Dieter"} size="sm" className="shrink-0" />
                      ) : null}

                      <div
                        className={`max-w-[780px] rounded-2xl px-4 py-3 shadow-sm ring-1 ${
                          isUser
                            ? "bg-primary text-primary-foreground ring-primary/20"
                            : "bg-content1 ring-default-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs opacity-70">
                            {isUser ? "You" : meta.author ?? "Dieter"}
                          </div>
                          <div className="text-xs opacity-60">{formatTime(m.createdAt)}</div>
                        </div>

                        {artefact && url ? (
                          <div className="mt-2 grid gap-2">
                            <div className="text-sm font-medium">📎 {artefact.originalName}</div>
                            {isImageMime(artefact.mimeType) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt={artefact.originalName}
                                className="max-h-[420px] w-auto rounded-xl border border-default-200"
                              />
                            ) : (
                              <a
                                href={url}
                                className="text-sm underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                            {meta.text}
                          </div>
                        )}
                      </div>

                      {isUser ? (
                        <Avatar name="G" size="sm" className="shrink-0" />
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-default-200 p-10 text-center text-sm text-default-500">
                  Schreib einfach los – ich antworte hier.
                </div>
              )}
            </div>
          </ScrollShadow>

          {/* Composer */}
          <form action={sendMessageAction} className="flex items-end gap-3">
            <Textarea
              name="content"
              placeholder="Write a message…"
              minRows={1}
              maxRows={6}
              className="flex-1"
              variant="flat"
            />
            <Button color="primary" type="submit" className="h-[44px]">
              Send
            </Button>
          </form>

          <ChatComposer threadId={activeThreadId} />
        </CardBody>
      </Card>
    </div>
  );
}
