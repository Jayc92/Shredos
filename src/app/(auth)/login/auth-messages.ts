// ============================================================
// UI-7 closeout correction — authentication messaging.
//
// Tiny pure presentation helpers colocated with the login surface
// (NOT an auth abstraction): the Supabase calls, their arguments,
// redirects, and callback behavior are untouched. This module only
// decides what TEXT the user sees.
// ============================================================

/**
 * Neutral, anti-enumeration-safe signup response. Supabase
 * intentionally returns a non-error response for an existing address
 * so account existence cannot be probed; definitive "Account
 * created" wording was therefore not reliably true. This copy is
 * honest in both cases and makes no attempt to detect which one
 * occurred.
 */
export const SIGNUP_NEUTRAL_MESSAGE =
  'Check your email to continue. If this address can be registered, we sent a confirmation link.'

/**
 * Maps known provider throttle text to a friendly, actionable
 * message. Everything else passes through VERBATIM — unrelated
 * errors (e.g. "Invalid login credentials") are never hidden behind
 * a generic message, no success is inferred, and the failure state
 * is preserved by the caller exactly as before.
 */
export function presentAuthError(providerMessage: string): string {
  if (/email rate limit/i.test(providerMessage)) {
    return 'Too many email attempts. Please wait before trying again.'
  }
  return providerMessage
}
