import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth/node";

export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({ success: true, message: "Logged out successfully." });
}

export async function GET() {
  // Allow GET for convenience (e.g., direct link)
  await clearSessionCookie();
  
  // Redirect to login page
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
