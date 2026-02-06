import { NextResponse } from "next/server";

// Temporary debug endpoint - DELETE AFTER FIXING
export async function GET() {
  return NextResponse.json({
    OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL ? "SET" : "NOT SET",
    OPENCLAW_GATEWAY_PASSWORD: process.env.OPENCLAW_GATEWAY_PASSWORD ? "SET" : "NOT SET",
    // Show first 5 chars to verify it's the right value
    URL_PREVIEW: process.env.OPENCLAW_GATEWAY_URL?.slice(0, 30) || null,
    NODE_ENV: process.env.NODE_ENV,
  });
}
