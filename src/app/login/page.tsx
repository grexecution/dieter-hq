import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPassword } from "@/server/auth/constants";
import { redirect } from "next/navigation";
import { LoginView } from "./LoginView";

export default async function LoginPage({
  searchParams,
}: {
  // Next.js may provide searchParams as a Promise in newer runtimes
  searchParams?: Promise<{ err?: string }> | { err?: string };
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined;

  async function loginAction(formData: FormData) {
    "use server";
    const password = getPassword();

    // If no password is configured, auth is disabled: just proceed.
    if (!password) {
      redirect("/chat");
    }

    const attempt = String(formData.get("password") ?? "");
    if (attempt !== password) {
      redirect("/login?err=bad_password");
    }

    const token = createSessionToken({ iat: Date.now() });
    await setSessionCookie(token);
    redirect("/chat");
  }

  return <LoginView err={sp?.err} action={loginAction} />;
}
