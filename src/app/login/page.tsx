import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPasswordOrThrow } from "@/server/auth/constants";
import { redirect } from "next/navigation";
import { LoginView } from "./LoginView";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { err?: string };
}) {
  async function loginAction(formData: FormData) {
    "use server";
    const password = getPasswordOrThrow();
    const attempt = String(formData.get("password") ?? "");

    if (attempt !== password) {
      redirect("/login?err=bad_password");
    }

    const token = createSessionToken({ iat: Date.now() });
    await setSessionCookie(token);
    redirect("/chat");
  }

  return <LoginView err={searchParams?.err} action={loginAction} />;
}
