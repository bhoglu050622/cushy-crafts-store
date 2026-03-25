import { apiConfigMessage, isApiConfigured, ApiRequestError } from "@/lib/api";

/** Map auth errors to user-friendly UI copy (signup / login forms). */
export function authExceptionMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    const m = err.message || "";
    if (/firebase|identitytoolkit|configuration-not-found|auth\/api-key/i.test(m)) {
      return "Account sign-in is unavailable. Confirm the site is on the latest version, then try again. If this continues, the server may be unreachable.";
    }
    const low = m.toLowerCase();
    if (
      low.includes("invalid login credentials") ||
      low.includes("invalid email or password")
    ) {
      return "We couldn't sign you in. Check your email and password, then try again.";
    }
    if (low.includes("user already registered") || low.includes("409")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (
      low.includes("password") &&
      (low.includes("weak") || low.includes("short") || low.includes("least"))
    ) {
      return "Choose a stronger password (at least 6 characters).";
    }
    if (low.includes("invalid email")) {
      return "Please enter a valid email address.";
    }
    return m || "Something went wrong. Please try again.";
  }

  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const msg = raw.toLowerCase();
  if (/firebase|identitytoolkit|configuration-not-found|auth\/api-key/i.test(raw)) {
    return "Account sign-in failed. Use the latest version of this site or contact support.";
  }
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return "We couldn't sign you in. Check your email and password, then try again.";
  }
  if (msg.includes("user already registered") || msg.includes("409")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (
    msg.includes("password") &&
    (msg.includes("weak") || msg.includes("short") || msg.includes("least"))
  ) {
    return "Choose a stronger password (at least 6 characters).";
  }
  if (msg.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  return raw || "Something went wrong. Please try again.";
}

export function authFormBlockedMessage(): string | null {
  return apiConfigMessage() ?? (!isApiConfigured() ? "API is not configured." : null);
}

export { isApiConfigured, apiConfigMessage };
