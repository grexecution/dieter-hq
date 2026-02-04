import { NextRequest, NextResponse } from "next/server";

import { db } from "@/server/db";
import { calendarEvents } from "@/server/db/schema";
import { eq } from "drizzle-orm";

function safeNumber(v: unknown) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      ...row,
      startAt: new Date(row.startAt).getTime(),
      endAt: new Date(row.endAt).getTime(),
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as
    | {
        title?: unknown;
        description?: unknown;
        startAt?: unknown;
        endAt?: unknown;
        allDay?: unknown;
      }
    | null;

  const patch: Partial<{
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    updatedAt: Date;
  }> = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "title_required" }, { status: 400 });
    }
    patch.title = title;
  }

  if (body && "description" in body) {
    patch.description = typeof body.description === "string" ? body.description.trim() : null;
  }

  const startAt = safeNumber(body?.startAt);
  const endAt = safeNumber(body?.endAt);
  if (startAt != null) patch.startAt = new Date(startAt);
  if (endAt != null) patch.endAt = new Date(endAt);

  if (body && "allDay" in body) {
    patch.allDay = Boolean(body.allDay);
  }

  if (startAt != null && endAt != null && endAt < startAt) {
    return NextResponse.json({ ok: false, error: "end_before_start" }, { status: 400 });
  }

  patch.updatedAt = new Date();

  await db.update(calendarEvents).set(patch).where(eq(calendarEvents.id, id));

  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      ...row,
      startAt: new Date(row.startAt).getTime(),
      endAt: new Date(row.endAt).getTime(),
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  return NextResponse.json({ ok: true });
}
