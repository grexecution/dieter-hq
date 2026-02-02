export const AUTH_COOKIE_NAME = process.env.HQ_AUTH_COOKIE ?? "hq_session";

export const PASSWORD_ENV = "HQ_PASSWORD" as const;

export function getPasswordOrThrow(): string {
  const pw = process.env.HQ_PASSWORD;
  if (!pw) {
    throw new Error(
      "Missing env HQ_PASSWORD. Set it to enable single-user auth.",
    );
  }
  return pw;
}
