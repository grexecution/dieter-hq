"use client";

import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";

export function LoginView({
  err,
  action,
}: {
  err?: string;
  action: (formData: FormData) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
      <Card className="w-full" shadow="md">
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-xl font-semibold tracking-tight">Dieter HQ</div>
          <div className="text-sm text-default-500">Single-user login (MVP).</div>
        </CardHeader>
        <CardBody className="gap-4">
          {err ? (
            <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
              {err === "missing_password"
                ? "Missing HQ_PASSWORD env var. Set it and restart the server."
                : "Wrong password."}
            </div>
          ) : null}

          <form action={action} className="grid gap-3">
            <Input
              name="password"
              type="password"
              label="Password"
              autoFocus
              required
            />
            <Button color="primary" type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="text-xs text-default-400">
            Configure via <code className="px-1">HQ_PASSWORD</code>.
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
