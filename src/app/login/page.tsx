import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPassword } from "@/server/auth/constants";
import { verifyPassword, isBcryptHash } from "@/server/auth/password";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/server/auth/rate-limit";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginView } from "./LoginView";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }> | { err?: string };
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined;

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

    const password = getPassword();

    // If no password is configured, auth is disabled: just proceed.
    if (!password) {
      redirect("/chat");
    }

    const attempt = String(formData.get("password") ?? "");

    // Verify password - supports both bcrypt hashes and plain text (legacy)
    let passwordValid = false;

    if (isBcryptHash(password)) {
      passwordValid = await verifyPassword(attempt, password);
    } else {
      passwordValid = attempt === password;
    }

    if (!passwordValid) {
      recordFailedAttempt(ip);
      redirect("/login?err=bad_password");
    }

    // Success - clear rate limit
    clearRateLimit(ip);

    const token = createSessionToken({ iat: Date.now() });
    await setSessionCookie(token);
    redirect("/chat");
  }

  return <LoginView err={sp?.err} action={loginAction} />;
}
