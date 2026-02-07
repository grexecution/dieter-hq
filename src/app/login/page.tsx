import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPassword } from "@/server/auth/constants";
import { verifyPassword, isBcryptHash } from "@/server/auth/password";
import { setCsrfCookie, validateCsrf, clearCsrfCookie } from "@/server/auth/csrf";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/server/auth/rate-limit";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginView } from "./LoginView";

function getClientIp(headersList: Headers): string {
  // Check common proxy headers
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  // Fallback
  return "unknown";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }> | { err?: string };
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined;

  // Generate CSRF token for the form
  const csrfToken = await setCsrfCookie();

  async function loginAction(formData: FormData) {
    "use server";

    const headersList = await headers();
    const ip = getClientIp(headersList);

    // Check rate limit first
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSec ?? 1800) / 60);
      redirect(`/login?err=rate_limited&retry=${minutes}`);
    }

    // Validate CSRF token
    const csrfFromForm = formData.get("csrf_token") as string | null;
    const csrfValid = await validateCsrf(csrfFromForm);
    if (!csrfValid) {
      redirect("/login?err=csrf_invalid");
    }

    const password = getPassword();

    // If no password is configured, auth is disabled: just proceed.
    if (!password) {
      redirect("/chat");
    }

    const attempt = String(formData.get("password") ?? "");

    // Verify password - supports both bcrypt hashes and plain text (legacy)
    let passwordValid = false;

    if (isBcryptHash(password)) {
      // Modern: compare against bcrypt hash
      passwordValid = await verifyPassword(attempt, password);
    } else {
      // Legacy: plain text comparison (not recommended)
      // This branch allows migration from plain to hashed passwords
      passwordValid = attempt === password;
    }

    if (!passwordValid) {
      recordFailedAttempt(ip);
      redirect("/login?err=bad_password");
    }

    // Success - clear rate limit and CSRF
    clearRateLimit(ip);
    await clearCsrfCookie();

    const token = createSessionToken({ iat: Date.now() });
    await setSessionCookie(token);
    redirect("/chat");
  }

  return <LoginView err={sp?.err} action={loginAction} csrfToken={csrfToken} />;
}
