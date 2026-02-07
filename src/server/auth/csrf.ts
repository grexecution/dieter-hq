import * as crypto from "node:crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "hq_csrf";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set the CSRF token cookie and return the token.
 */
export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const jar = await cookies();
  
  jar.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Get the CSRF token from cookies.
 */
export async function getCsrfFromCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from form against cookie.
 * Uses timing-safe comparison.
 */
export async function validateCsrf(formToken: string | null): Promise<boolean> {
  if (!formToken) return false;
  
  const cookieToken = await getCsrfFromCookie();
  if (!cookieToken) return false;

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(formToken),
      Buffer.from(cookieToken)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

/**
 * Clear CSRF cookie after successful validation.
 */
export async function clearCsrfCookie(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: CSRF_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
