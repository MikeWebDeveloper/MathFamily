/** Email-capture core: validation + the durable fail-safe sink + the MailerLite connector.
 *
 *  The contract that must never break: a valid, consented signup is NEVER lost. We persist it
 *  durably (Resend email to the Company inbox + a structured runtime-log line) BEFORE we ever
 *  try MailerLite, and we only report success once the durable sink has confirmed. MailerLite
 *  is best-effort on top — its absence or failure must not surface as a user-facing error.
 *
 *  Runs on the Node serverless runtime (no durable local filesystem), so the authoritative
 *  store is the Resend email (Gmail = append-only). The console.log line is a second,
 *  independent durable copy captured in Vercel runtime logs. Everything here is pure/seam-able
 *  so the route stays thin and the logic is unit-testable with the network mocked. */

export type SubscribeResult =
  | { ok: true; durable: true; mailerlite: "subscribed" | "skipped" | "failed" }
  | { ok: false; reason: "invalid_email" | "no_consent" | "durable_failed" };

/** Permissive-but-sane RFC-ish email check: one @, a dot in the domain, no spaces. We do not
 *  try to fully validate (that's a fool's errand) — MailerLite/double-opt-in is the real gate. */
export function isValidEmail(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const email = raw.trim();
  if (email.length < 3 || email.length > 254 || /\s/.test(email)) return false;
  return /^[^@]+@[^@]+\.[^@]+$/.test(email);
}

/** Consent must be an explicit affirmative — checkbox "on"/"true"/true. Anything falsy or a
 *  missing field is treated as NO consent (GDPR: no pre-ticked / assumed consent). */
export function hasConsent(raw: unknown): boolean {
  return raw === true || raw === "true" || raw === "on" || raw === "1";
}

export interface SubscribeInput {
  email: string;
  consent: unknown;
  source?: string;
}

export interface SubscribeEnv {
  resendToken?: string;
  notifyTo?: string;
  notifyFrom?: string;
  mailerliteToken?: string;
  mailerliteGroupId?: string;
}

/** Read the seam from process.env. Kept separate so tests inject env directly. */
export function readEnv(env: NodeJS.ProcessEnv = process.env): SubscribeEnv {
  return {
    resendToken: env.RESEND_API_TOKEN,
    notifyTo: env.SIGNUP_NOTIFY_TO,
    notifyFrom: env.SIGNUP_NOTIFY_FROM || "ParkMath signups <list@parkmath.co.uk>",
    mailerliteToken: env.MAILERLITE_API_TOKEN,
    mailerliteGroupId: env.MAILERLITE_GROUP_ID
  };
}

/** The structured, greppable durable log line. Always emitted — this is the second, infra-free
 *  durable copy (Vercel runtime logs), and the recovery source if email delivery ever lapses. */
export function signupLogLine(email: string, source: string): string {
  return `SIGNUP|${email}|${source}|${new Date().toISOString()}`;
}

/** Durable sink. Returns true once the signup is safely persisted somewhere that survives the
 *  request. The log line ALWAYS lands (so we never silently lose a signup even with zero env),
 *  and we additionally email it via Resend when configured. We treat the signup as durable if
 *  EITHER the email send succeeded OR there is no Resend config (log-only fallback) — because a
 *  log-only capture is still recoverable. We only return false if Resend IS configured but the
 *  send hard-fails, so the client can ask the user to retry rather than silently drop them. */
export async function persistDurable(
  input: { email: string; source: string },
  env: SubscribeEnv,
  fetchImpl: typeof fetch = fetch,
  log: (line: string) => void = console.log
): Promise<boolean> {
  // Always write the infra-free durable copy first.
  log(signupLogLine(input.email, input.source));

  // No Resend configured → log-only capture is our durable store. Still recoverable.
  if (!env.resendToken || !env.notifyTo) return true;

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.notifyFrom,
        to: [env.notifyTo],
        subject: `New ParkMath signup: ${input.email}`,
        text: `${input.email}\nsource: ${input.source}\nat: ${new Date().toISOString()}\n\nReply-safe durable record of an email-list signup. If MailerLite was not yet connected, run tools/mailerlite/flush.mjs to import.`
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort MailerLite subscribe. Never throws; returns a status the route logs but does not
 *  surface as a user error. "skipped" when no token/group is configured yet (pre-token phase). */
export async function subscribeMailerLite(
  email: string,
  env: SubscribeEnv,
  fetchImpl: typeof fetch = fetch
): Promise<"subscribed" | "skipped" | "failed"> {
  if (!env.mailerliteToken || !env.mailerliteGroupId) return "skipped";
  try {
    const res = await fetchImpl("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mailerliteToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, groups: [env.mailerliteGroupId] })
    });
    // MailerLite returns 200/201 for create/upsert; anything else is a soft failure.
    return res.ok ? "subscribed" : "failed";
  } catch {
    return "failed";
  }
}

/** Orchestrator: validate → durable-first → best-effort MailerLite. Pure of the HTTP layer so
 *  the route handler just adapts request/response around it. */
export async function processSubscription(
  input: SubscribeInput,
  env: SubscribeEnv,
  deps: { fetchImpl?: typeof fetch; log?: (line: string) => void } = {}
): Promise<SubscribeResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? console.log;

  if (!isValidEmail(input.email)) return { ok: false, reason: "invalid_email" };
  if (!hasConsent(input.consent)) return { ok: false, reason: "no_consent" };

  const email = input.email.trim().toLowerCase();
  const source = (input.source || "unknown").slice(0, 200);

  const durable = await persistDurable({ email, source }, env, fetchImpl, log);
  if (!durable) return { ok: false, reason: "durable_failed" };

  const mailerlite = await subscribeMailerLite(email, env, fetchImpl);
  return { ok: true, durable: true, mailerlite };
}
