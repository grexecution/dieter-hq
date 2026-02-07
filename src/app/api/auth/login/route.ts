import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPassword } from "@/server/auth/constants";
import { verifyPassword, isBcryptHash } from "@/server/auth/password";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  getRemainingAttempts,
} from "@/server/auth/rate-limit";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Check rate limit
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many failed attempts. Please wait before trying again.",
        retryAfterSec: rateCheck.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.retryAfterSec ?? 1800),
        },
      }
    );
  }

  const password = getPassword();

  // If no password is configured, auth is disabled
  if (!password) {
    const token = createSessionToken({ iat: Date.now() });
    await setSessionCookie(token);
    return NextResponse.json({ success: true, message: "Auth disabled, logged in." });
  }

  // Parse request body
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const attempt = body.password;

  if (!attempt || typeof attempt !== "string") {
    return NextResponse.json(
      { error: "invalid_request", message: "Password is required." },
      { status: 400 }
    );
  }

  // Verify password
  let passwordValid = false;

  if (isBcryptHash(password)) {
    passwordValid = await verifyPassword(attempt, password);
  } else {
    // Legacy plain text comparison
    passwordValid = attempt === password;
  }

  if (!passwordValid) {
    recordFailedAttempt(ip);
    const remaining = getRemainingAttempts(ip);

    return NextResponse.json(
      {
        error: "bad_password",
        message: "Invalid password.",
        remainingAttempts: remaining,
      },
      { status: 401 }
    );
  }

  // Success
  clearRateLimit(ip);

  const token = createSessionToken({ iat: Date.now() });
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}

// Explicitly disallow GET
export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", message: "Use POST to login." },
    { status: 405 }
  );
}
