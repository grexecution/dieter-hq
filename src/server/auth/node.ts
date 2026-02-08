import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, getPasswordOrThrow } from "./constants";

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(key: string, payloadB64: string) {
  return base64url(
    crypto.createHmac("sha256", key).update(payloadB64).digest(),
  );
}

export type SessionPayload = {
  iat: number; // ms
};

export function createSessionToken(payload: SessionPayload): string {
  // Use password as HMAC key, fall back to a static key when auth is disabled
  const key = process.env.HQ_PASSWORD || "dev-no-auth";
  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = sign(key, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30d
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function requireAuth() {
  // Server-side guard for non-middleware contexts.
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirect("/login");
}
