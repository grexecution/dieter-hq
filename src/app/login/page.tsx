import { createSessionToken, setSessionCookie } from "@/server/auth/node";
import { getPasswordOrThrow } from "@/server/auth/constants";
import { redirect } from "next/navigation";

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

  const err = searchParams?.err;

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Dieter HQ</h1>
      <p className="mt-2 text-sm text-slate-600">Single-user login (MVP).</p>

      {err ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {err === "missing_password"
            ? "Missing HQ_PASSWORD env var. Set it and restart the server."
            : "Wrong password."}
        </div>
      ) : null}

      <form action={loginAction} className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            className="rounded-lg border px-3 py-2"
            autoFocus
            required
          />
        </label>
        <button className="rounded-lg bg-black px-3 py-2 text-white">
          Sign in
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Configure via <code className="rounded bg-slate-100 px-1">HQ_PASSWORD</code>
        .
      </p>
    </main>
  );
}
