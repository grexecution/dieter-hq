import { NextRequest, NextResponse } from "next/server";
import { enforceAuth } from "./server/auth/edge";

export async function middleware(req: NextRequest) {
  // Allow login + unauthenticated health/pwa routes.
  const p = req.nextUrl.pathname;
  if (p.startsWith("/login")) return NextResponse.next();
  if (p.startsWith("/manifest.webmanifest")) return NextResponse.next();

  // Allow unauthenticated API routes
  if (p.startsWith("/api/health")) return NextResponse.next();
  if (p.startsWith("/api/push")) return NextResponse.next();  // Push notifications (has own auth check)

  const res = await enforceAuth(req);
  return res ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:path*",
    "/events/:path*",
    "/kanban/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
