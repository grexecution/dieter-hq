"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  ScrollShadow,
  Snippet,
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
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Sidebar */}
      <Card shadow="md" className="h-[calc(100dvh-120px)] rounded-2xl border border-default-200/70">
        <CardHeader className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold leading-tight">Chat</div>
            <div className="text-xs text-default-500">Threads</div>
          </div>
          <form action={logoutAction}>
            <Button size="sm" variant="flat" type="submit">
              Logout
            </Button>
          </form>
        </CardHeader>
        <CardBody className="gap-3">
          <form action={newThreadAction}>
            <Button color="primary" variant="solid" className="w-full" type="submit">
              New thread
            </Button>
          </form>

          <Divider />

          <ScrollShadow className="-mx-1 flex-1 overflow-y-auto px-1">
            <div className="grid gap-2">
              {threads.length ? (
                threads.map((t) => (
                  <Button
                    key={t.threadId}
                    as={Link}
                    href={`/chat?thread=${encodeURIComponent(t.threadId)}`}
                    variant={t.threadId === activeThreadId ? "solid" : "flat"}
                    color={t.threadId === activeThreadId ? "primary" : "default"}
                    className="h-auto justify-start px-3 py-3"
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="text-left">
                        <div className="font-semibold">{pickTitle(t)}</div>
                        <div className="text-xs opacity-70">{t.count} msgs</div>
                      </div>
                      <Chip size="sm" variant="flat">
                        {new Date(t.lastAt).toLocaleDateString()}
                      </Chip>
                    </div>
                  </Button>
                ))
              ) : (
                <Card shadow="none" className="border">
                  <CardBody className="text-sm text-default-500">
                    No threads yet.
                  </CardBody>
                </Card>
              )}
            </div>
          </ScrollShadow>

          <div className="text-xs text-default-400">
            <Link className="hover:underline" href="/events">
              View event log
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Main */}
      <Card shadow="md" className="h-[calc(100dvh-120px)] rounded-2xl border border-default-200/70">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-default-500">Thread</div>
              <div className="truncate font-mono text-sm">{activeThreadId}</div>
            </div>
            <Snippet
              size="sm"
              symbol=""
              className="max-w-[220px]"
              codeString={activeThreadId}
            >
              copy id
            </Snippet>
          </div>

          {/* OpenClaw-style inbox banner: show last message loud */}
          {liveMessages.length ? (
            <div className="w-full truncate text-lg font-semibold text-danger">
              {liveMessages[liveMessages.length - 1]?.content}
            </div>
          ) : null}

          <div className="text-xs text-default-400">
            {liveMessages.length} messages
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="flex flex-col gap-4 overflow-hidden">
          {/* Messages */}
          <ScrollShadow className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-3">
              {liveMessages.length ? (
                liveMessages.map((m) => {
                  const artefactId = extractArtefactIdFromContent(m.content);
                  const artefact = artefactId ? artefactsById[artefactId] : null;
                  const url = artefactId ? `/api/artefacts/${encodeURIComponent(artefactId)}` : null;

                  const isUser = m.role === "user";
                  const bubble = (
                    <Card
                      shadow="none"
                      className={`max-w-[780px] border ${
                        isUser ? "ml-auto bg-primary-50 border-primary-100" : "bg-content1"
                      }`}
                    >
                      <CardBody className="gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <Chip size="sm" variant="flat" color={isUser ? "primary" : "default"}>
                            {m.role}
                          </Chip>
                          <div className="text-xs text-default-400">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {artefact && url ? (
                          <div className="grid gap-2">
                            <div className="text-sm font-medium">📎 {artefact.originalName}</div>
                            {isImageMime(artefact.mimeType) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt={artefact.originalName}
                                className="max-h-[420px] w-auto rounded-large border border-default-200"
                              />
                            ) : (
                              <a
                                href={url}
                                className="text-sm text-primary underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        )}
                      </CardBody>
                    </Card>
                  );

                  return (
                    <div key={m.id} className="flex">
                      {bubble}
                    </div>
                  );
                })
              ) : (
                <Card shadow="none" className="border">
                  <CardBody className="py-10 text-center text-sm text-default-500">
                    Empty thread.
                  </CardBody>
                </Card>
              )}
            </div>
          </ScrollShadow>

          {/* Composer */}
          <form action={sendMessageAction} className="flex gap-2">
            <Input
              name="content"
              placeholder="Type a message…"
              className="flex-1"
              autoComplete="off"
            />
            <Button color="primary" type="submit">
              Send
            </Button>
          </form>

          <ChatComposer threadId={activeThreadId} />
        </CardBody>
      </Card>
    </div>
  );
}
