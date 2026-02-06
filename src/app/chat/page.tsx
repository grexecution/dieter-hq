export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { artefacts, messages } from "@/server/db/schema";
import { asc, desc, eq, sql, inArray, like, or } from "drizzle-orm";
import { logEvent } from "@/server/events/log";
import { clearSessionCookie } from "@/server/auth/node";
import { redirect } from "next/navigation";

import { ChatShell } from "../_ui/ChatShell";
import { MultiChatView } from "./MultiChatView";
import { CHAT_TAB_IDS, CHAT_TABS } from "./chat-config";

// Helper to format message timestamps
function formatMessageTimestamp(m: { createdAt: Date }) {
  const ts = new Date(m.createdAt).getTime();
  const label = new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(new Date(ts));
  return { ts, label };
}

export default async function ChatPage() {
  // Get all supported thread IDs (fixed tabs)
  const supportedThreadIds = CHAT_TAB_IDS;

  // Load threads with statistics (fixed tabs)
  const threads = await db
    .select({
      threadId: messages.threadId,
      lastAt: sql<number>`max(${messages.createdAt})`.as("last_at"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(messages)
    .where(inArray(messages.threadId, supportedThreadIds))
    .groupBy(messages.threadId)
    .orderBy(desc(sql`max(${messages.createdAt})`));

  // Load messages for all supported threads
  const threadMessages: Record<string, any[]> = {};
  
  for (const tabId of supportedThreadIds) {
    const messagesForThread = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, tabId))
      .orderBy(asc(messages.createdAt));

    threadMessages[tabId] = messagesForThread.map((m) => {
      const { ts, label } = formatMessageTimestamp(m);
      return {
        id: m.id,
        threadId: m.threadId,
        role: m.role,
        content: m.content,
        createdAt: ts,
        createdAtLabel: label,
        // Voice message fields (Telegram-style)
        audioUrl: m.audioUrl ?? null,
        audioDurationMs: m.audioDurationMs ?? null,
        transcription: m.transcription ?? null,
      };
    });
  }

  // Also load workspace project messages (threads starting with "dev:")
  const workspaceMessages = await db
    .select()
    .from(messages)
    .where(like(messages.threadId, "dev:%"))
    .orderBy(asc(messages.createdAt));

  // Group workspace messages by threadId
  for (const m of workspaceMessages) {
    const { ts, label } = formatMessageTimestamp(m);
    const formattedMsg = {
      id: m.id,
      threadId: m.threadId,
      role: m.role,
      content: m.content,
      createdAt: ts,
      createdAtLabel: label,
      audioUrl: m.audioUrl ?? null,
      audioDurationMs: m.audioDurationMs ?? null,
      transcription: m.transcription ?? null,
    };
    
    if (!threadMessages[m.threadId]) {
      threadMessages[m.threadId] = [];
    }
    threadMessages[m.threadId].push(formattedMsg);
  }

  // Log event for the first thread with messages (or default to 'life')
  const activeThreads = Object.keys(threadMessages).filter(id => threadMessages[id].length > 0);
  const defaultThreadId = activeThreads[0] || "life";

  if (threads.length > 0 || Object.values(threadMessages).some(msgs => msgs.length > 0)) {
    await logEvent({
      threadId: defaultThreadId,
      type: "chat.multi_view",
      payload: { 
        threadId: defaultThreadId,
        supportedThreads: supportedThreadIds,
        threadCounts: Object.fromEntries(
          Object.entries(threadMessages).map(([id, msgs]) => [id, msgs.length])
        )
      },
    });
  }

  async function newThreadAction() {
    "use server";
    // UI no longer exposes multi-threading in the old sense. 
    // Keep this server action wired (hidden) to avoid changing any existing plumbing.
    redirect("/chat");
  }

  async function logoutAction() {
    "use server";
    await clearSessionCookie();
    redirect("/login");
  }

  // Load artefacts for all threads (fixed + workspace)
  const allArtefacts = await db
    .select({
      id: artefacts.id,
      threadId: artefacts.threadId,
      originalName: artefacts.originalName,
      mimeType: artefacts.mimeType,
      sizeBytes: artefacts.sizeBytes,
    })
    .from(artefacts)
    .where(
      or(
        inArray(artefacts.threadId, supportedThreadIds),
        like(artefacts.threadId, "dev:%")
      )
    );

  const artefactsById = Object.fromEntries(allArtefacts.map((a) => [a.id, a]));

  return (
    <ChatShell>
      <MultiChatView
        threads={threads.map((t) => ({
          threadId: t.threadId,
          lastAt: t.lastAt,
          count: t.count,
        }))}
        threadMessages={threadMessages}
        artefactsById={artefactsById}
        newThreadAction={newThreadAction}
        logoutAction={logoutAction}
      />
    </ChatShell>
  );
}