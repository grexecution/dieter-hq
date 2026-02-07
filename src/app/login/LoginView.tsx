"use client";

import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";

function getErrorMessage(err: string | undefined): string | null {
  if (!err) return null;

  switch (err) {
    case "missing_password":
      return "Missing HQ_PASSWORD env var. Set it and restart the server.";
    case "bad_password":
      return "Wrong password.";
    case "csrf_invalid":
      return "Security token expired. Please try again.";
    case "rate_limited":
      return "Too many failed attempts. Please wait before trying again.";
    default:
      return "Authentication failed.";
  }
}

export function LoginView({
  err,
  action,
  csrfToken,
}: {
  err?: string;
  action: (formData: FormData) => void;
  csrfToken: string;
}) {
  const errorMessage = getErrorMessage(err);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
      <Card className="w-full" shadow="md">
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-xl font-semibold tracking-tight">Dieter HQ</div>
          <div className="text-sm text-default-500">Single-user login.</div>
        </CardHeader>
        <CardBody className="gap-4">
          {errorMessage && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-200">
              {errorMessage}
            </div>
          )}

          <form action={action} className="grid gap-3">
            {/* CSRF Token - hidden field */}
            <input type="hidden" name="csrf_token" value={csrfToken} />

            <Input
              name="password"
              type="password"
              label="Password"
              autoFocus
              required
              autoComplete="current-password"
            />
            <Button color="primary" type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="text-xs text-default-400">
            Configure via <code className="rounded bg-default-100 px-1">HQ_PASSWORD</code>.
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
