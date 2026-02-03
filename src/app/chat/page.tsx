export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { artefacts, messages } from "@/server/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { logEvent } from "@/server/events/log";
import { clearSessionCookie } from "@/server/auth/node";
import { redirect } from "next/navigation";

import { AppShell } from "../_ui/AppShell";
import { ChatView } from "./ChatView";

export default async function ChatPage() {
  const threads = await db
    .select({
      threadId: messages.threadId,
      lastAt: sql<number>`max(${messages.createdAt})`.as("last_at"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(messages)
    .groupBy(messages.threadId)
    .orderBy(desc(sql`max(${messages.createdAt})`));

  // Dieter HQ UI only exposes a single thread: main.
  const activeThreadId = "main";

  const threadMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, activeThreadId))
    .orderBy(asc(messages.createdAt));

  // Lightweight “internal event log” (placeholder): record page loads.
  // This is intentionally simple; we can expand to structured events later.
  if (threadMessages.length || threads.length) {
    await logEvent({
      threadId: activeThreadId,
      type: "chat.view",
      payload: { threadId: activeThreadId },
    });
  }

  async function newThreadAction() {
    "use server";
    // UI no longer exposes multi-threading. Keep this server action wired
    // (hidden) to avoid changing any existing plumbing.
    redirect("/chat");
  }

  async function logoutAction() {
    "use server";
    await clearSessionCookie();
    redirect("/login");
  }

  // Load artefacts for inline rendering
  const threadArtefacts = await db
    .select({
      id: artefacts.id,
      threadId: artefacts.threadId,
      originalName: artefacts.originalName,
      mimeType: artefacts.mimeType,
      sizeBytes: artefacts.sizeBytes,
    })
    .from(artefacts)
    .where(eq(artefacts.threadId, activeThreadId));

  const artefactsById = Object.fromEntries(threadArtefacts.map((a) => [a.id, a]));

  return (
    <AppShell active="chat">
      <ChatView
        threads={threads.map((t) => ({
          threadId: t.threadId,
          lastAt: t.lastAt,
          count: t.count,
        }))}
        activeThreadId={activeThreadId}
        threadMessages={threadMessages.map((m) => {
          const ts = new Date(m.createdAt).getTime();
          const label = new Intl.DateTimeFormat("de-AT", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Vienna",
          }).format(new Date(ts));

          return {
            id: m.id,
            threadId: m.threadId,
            role: m.role,
            content: m.content,
            createdAt: ts,
            createdAtLabel: label,
          };
        })}
        artefactsById={artefactsById}
        newThreadAction={newThreadAction}
        logoutAction={logoutAction}
      />
    </AppShell>
  );
}
