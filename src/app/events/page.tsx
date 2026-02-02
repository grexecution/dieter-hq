import Link from "next/link";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export default async function EventsPage() {
  const rows = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(200);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">Event log</h1>
        <Link className="text-sm text-slate-600 hover:underline" href="/chat">
          Back to chat
        </Link>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Internal log placeholder (DB table <code>events</code>). This is not yet
        a user-facing audit log.
      </p>

      <div className="mt-6 grid gap-2">
        {rows.length ? (
          rows.map((e) => (
            <div key={e.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium">{e.type}</div>
                <div className="text-xs text-slate-500">
                  {new Date(e.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                thread: <span className="font-mono">{e.threadId}</span>
              </div>
              <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-xs">
                {e.payloadJson}
              </pre>
            </div>
          ))
        ) : (
          <div className="rounded-lg border p-6 text-sm text-slate-600">
            No events yet.
          </div>
        )}
      </div>
    </main>
  );
}
