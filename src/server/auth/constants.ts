export const AUTH_COOKIE_NAME = process.env.HQ_AUTH_COOKIE ?? "hq_session";

export const PASSWORD_ENV = "HQ_PASSWORD" as const;

/**
 * Returns the configured single-user password.
 * If unset, auth is treated as disabled (local/dev convenience).
 */
export function getPassword(): string | null {
  return process.env.HQ_PASSWORD ?? null;
}

/**
 * Strict variant (use in production-only contexts).
 */
export function getPasswordOrThrow(): string {
  const pw = getPassword();
  if (!pw) {
    throw new Error(
      "Missing env HQ_PASSWORD. Set it to enable single-user auth.",
    );
  }
  return pw;
}
