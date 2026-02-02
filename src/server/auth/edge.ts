import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "./constants";

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const str = atob(b64 + pad);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSha256Base64url(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return bytesToBase64url(sig);
}

export async function enforceAuth(req: NextRequest): Promise<NextResponse | null> {
  const password = process.env.HQ_PASSWORD;
  if (!password) {
    // In dev, make it obvious why /chat is blocked.
    return NextResponse.redirect(new URL("/login?err=missing_password", req.url));
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const expected = await hmacSha256Base64url(password, payloadB64);
  if (sig !== expected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Optional: basic TTL (30d)
  try {
    const json = new TextDecoder().decode(base64urlToBytes(payloadB64));
    const payload = JSON.parse(json) as { iat?: number };
    const iat = typeof payload.iat === "number" ? payload.iat : 0;
    const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
    if (!iat || Date.now() - iat > maxAgeMs) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return null;
}
