import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";

export const runtime = "nodejs";

function sseEvent(opts: { id?: string; event?: string; data: unknown }): string {
  const lines: string[] = [];
  if (opts.id) lines.push(`id: ${opts.id}`);
  if (opts.event) lines.push(`event: ${opts.event}`);
  lines.push(`data: ${JSON.stringify(opts.data)}`);
  return lines.join("\n") + "\n\n";
}

export async function GET(req: NextRequest) {
  const threadId = String(req.nextUrl.searchParams.get("thread") ?? "main");

  // Cursor in unix ms. Prefer Last-Event-ID header if present.
  const lastEventIdHeader = req.headers.get("last-event-id");
  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceMs = Number(lastEventIdHeader ?? sinceParam ?? 0);
  const startCursor = Number.isFinite(sinceMs) ? sinceMs : 0;

  const encoder = new TextEncoder();
  let cancelled = false;
  let cursor = startCursor;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      // Initial hello + retry hint
      write(": ok\n");
      write("retry: 2000\n\n");

      const fmt = new Intl.DateTimeFormat("de-AT", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Vienna",
      });

      const tick = async () => {
        if (cancelled) return;
        try {
          const rows = await db
            .select()
            .from(messages)
            .where(eq(messages.threadId, threadId))
            .orderBy(asc(messages.createdAt));

          const fresh = rows
            .map((m) => ({
              id: m.id,
              threadId: m.threadId,
              role: m.role,
              content: m.content,
              createdAt: new Date(m.createdAt).getTime(),
              createdAtLabel: fmt.format(new Date(m.createdAt)),
            }))
            .filter((m) => m.createdAt > cursor);

          if (fresh.length) {
            for (const m of fresh) {
              cursor = Math.max(cursor, m.createdAt);
              write(
                sseEvent({
                  id: String(m.createdAt),
                  event: "message",
                  data: m,
                }),
              );
            }
          } else {
            // keep-alive
            write(": ping\n\n");
          }
        } catch (err) {
          write(sseEvent({ event: "error", data: { message: String(err) } }));
        }
      };

      const interval = setInterval(() => void tick(), 1000);
      void tick();

      const close = () => {
        cancelled = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // When client closes connection
      req.signal.addEventListener("abort", close);
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
