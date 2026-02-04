import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "dieter-hq",
    ts: new Date().toISOString(),
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
  });
}
