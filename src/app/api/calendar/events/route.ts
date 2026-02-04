import { NextRequest, NextResponse } from "next/server";

import { db } from "@/server/db";
import { calendarEvents } from "@/server/db/schema";
import { and, asc, gte, lte } from "drizzle-orm";

function safeNumber(v: unknown) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const from = safeNumber(req.nextUrl.searchParams.get("from"));
  const to = safeNumber(req.nextUrl.searchParams.get("to"));

  // Default to current month (local time).
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

  const fromMs = from ?? defaultFrom;
  const toMs = to ?? defaultTo;

  // Overlap query: start <= to && end >= from
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(and(lte(calendarEvents.startAt, new Date(toMs)), gte(calendarEvents.endAt, new Date(fromMs))))
    .orderBy(asc(calendarEvents.startAt));

  const items = rows.map((r) => ({
    ...r,
    startAt: new Date(r.startAt).getTime(),
    endAt: new Date(r.endAt).getTime(),
    createdAt: new Date(r.createdAt).getTime(),
    updatedAt: new Date(r.updatedAt).getTime(),
  }));

  return NextResponse.json({ ok: true, from: fromMs, to: toMs, items });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        title?: unknown;
        description?: unknown;
        startAt?: unknown;
        endAt?: unknown;
        allDay?: unknown;
      }
    | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const startAt = safeNumber(body?.startAt);
  const endAt = safeNumber(body?.endAt);
  const allDay = Boolean(body?.allDay);

  if (!title) {
    return NextResponse.json({ ok: false, error: "title_required" }, { status: 400 });
  }
  if (startAt == null || endAt == null) {
    return NextResponse.json({ ok: false, error: "start_end_required" }, { status: 400 });
  }
  if (endAt < startAt) {
    return NextResponse.json({ ok: false, error: "end_before_start" }, { status: 400 });
  }

  const now = new Date();
  const item = {
    id: crypto.randomUUID(),
    title,
    description,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    allDay,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(calendarEvents).values(item);

  return NextResponse.json({
    ok: true,
    item: {
      id: item.id,
      title: item.title,
      description: item.description,
      startAt,
      endAt,
      allDay: item.allDay,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    },
  });
}
