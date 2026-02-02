import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { logEvent } from "@/server/events/log";
import { clearSessionCookie } from "@/server/auth/node";
import { ChatComposer } from "./ChatComposer";

type SearchParams = {
  thread?: string;
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = searchParams ?? {};

  const threads = await db
    .select({
      threadId: messages.threadId,
      lastAt: sql<number>`max(${messages.createdAt})`.as("last_at"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(messages)
    .groupBy(messages.threadId)
    .orderBy(desc(sql`max(${messages.createdAt})`));

  const activeThreadId =
    sp.thread ?? threads[0]?.threadId ?? crypto.randomUUID();

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
    const threadId = crypto.randomUUID();
    const now = new Date();
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      threadId,
      role: "system",
      content: "New thread.",
      createdAt: now,
    });
    await logEvent({
      threadId,
      type: "thread.create",
      payload: { threadId },
    });
    redirect(`/chat?thread=${encodeURIComponent(threadId)}`);
  }

  async function logoutAction() {
    "use server";
    await clearSessionCookie();
    redirect("/login");
  }

  async function sendMessageAction(formData: FormData) {
    "use server";
    const raw = String(formData.get("content") ?? "");
    const content = raw.trim();
    if (!content) return;

    const now = new Date();
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      threadId: activeThreadId,
      role: "user",
      content,
      createdAt: now,
    });

    await logEvent({
      threadId: activeThreadId,
      type: "message.create",
      payload: { role: "user" },
    });

    redirect(`/chat?thread=${encodeURIComponent(activeThreadId)}`);
  }

  return (
    <main className="mx-auto flex max-w-5xl gap-6 p-6">
      <aside className="w-64 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chat</h1>
          <form action={logoutAction}>
            <button className="text-xs text-slate-600 hover:underline">
              Logout
            </button>
          </form>
        </div>

        <form className="mt-3" action={newThreadAction}>
          <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
            + New thread
          </button>
        </form>

        <div className="mt-4 grid gap-2">
          {threads.length ? (
            threads.map((t) => (
              <Link
                key={t.threadId}
                href={`/chat?thread=${encodeURIComponent(t.threadId)}`}
                className={`rounded-lg border p-3 text-sm hover:bg-slate-50 ${
                  t.threadId === activeThreadId ? "bg-slate-50" : ""
                }`}
              >
                <div className="font-medium">{t.threadId.slice(0, 8)}</div>
                <div className="mt-1 text-xs text-slate-600">
                  {t.count} msgs
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border p-3 text-sm text-slate-600">
              No threads yet.
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-500">
          <Link className="hover:underline" href="/events">
            View event log
          </Link>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="truncate text-base font-semibold">
            Thread: <span className="font-mono">{activeThreadId}</span>
          </h2>
          <div className="text-xs text-slate-500">
            {threadMessages.length} messages
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {threadMessages.length ? (
            threadMessages.map((m) => (
              <div key={m.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    {m.role}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {m.content}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border p-6 text-sm text-slate-600">
              Empty thread.
            </div>
          )}
        </div>

        <form action={sendMessageAction} className="mt-4 flex gap-2">
          <input
            name="content"
            placeholder="Type a message…"
            className="flex-1 rounded-lg border px-3 py-2"
            autoComplete="off"
          />
          <button className="rounded-lg bg-black px-4 py-2 text-white">
            Send
          </button>
        </form>

        <ChatComposer threadId={activeThreadId} />
      </section>
    </main>
  );
}
