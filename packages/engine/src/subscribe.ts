/** Shared, brand-aware email-capture core for the WHOLE family — validation + the durable
 *  fail-safe sink + the ONE shared cross-brand MailerLite family group ("What Britain Pays This
 *  Month"). Generalised from ParkMath's apps/parkmath/lib/subscribe.ts.
 *
 *  The contract that must never break: a valid, consented signup is NEVER lost. We persist it
 *  durably (Resend email to the Company inbox + a structured runtime-log line) BEFORE we ever
 *  touch MailerLite, and only report success once the durable sink confirms. MailerLite is
 *  best-effort on top — its absence or failure must NEVER surface as a user-facing error.
 *
 *  Architecture (Mike's call): every brand posts to a SINGLE shared family group, tagging
 *  `brand` (the calling app, e.g. "RoamMath") and `source` (the surface, e.g. "home"/"region")
 *  so we can attribute which app/page converted, while building ONE durable cross-brand list.
 *
 *  Pure of the HTTP layer (fetch + log are injectable seams) so route handlers stay thin and the
 *  logic is unit-testable with the network mocked. Runs on the Node serverless runtime. */

export type FamilySubscribeResult =
  | { ok: true; durable: true; familyList: "subscribed" | "skipped" | "failed" }
  | { ok: false; reason: "invalid_email" | "no_consent" | "durable_failed" };

/** Permissive-but-sane RFC-ish email check: one @, a dot in the domain, no spaces. The real gate
 *  is MailerLite double-opt-in — we only reject obvious junk here. */
export function isValidEmail(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const email = raw.trim();
  if (email.length < 3 || email.length > 254 || /\s/.test(email)) return false;
  return /^[^@]+@[^@]+\.[^@]+$/.test(email);
}

/** Consent must be an explicit affirmative (checkbox "on"/"true"/true/"1"). Anything falsy or a
 *  missing field is treated as NO consent (UK GDPR: no pre-ticked / assumed consent). */
export function hasConsent(raw: unknown): boolean {
  return raw === true || raw === "true" || raw === "on" || raw === "1";
}

export interface FamilySubscribeInput {
  email: string;
  consent: unknown;
  /** The calling brand, e.g. "RoamMath". Tagged onto the family-list record for attribution. */
  brand: string;
  /** Surface tag, e.g. "home" / "region" / "<spoke>". */
  source?: string;
}

export interface FamilySubscribeEnv {
  resendToken?: string;
  notifyTo?: string;
  notifyFrom?: string;
  mailerliteToken?: string;
  /** The ONE shared family group id ("What Britain Pays This Month"). */
  mailerliteFamilyGroupId?: string;
}

/** Read the seam from process.env. Kept separate so tests inject env directly. Every app copies
 *  this shape; only NOTIFY_FROM's default differs per brand (override via SIGNUP_NOTIFY_FROM). */
export function readFamilyEnv(env: NodeJS.ProcessEnv = process.env): FamilySubscribeEnv {
  return {
    resendToken: env.RESEND_API_TOKEN,
    notifyTo: env.SIGNUP_NOTIFY_TO,
    notifyFrom: env.SIGNUP_NOTIFY_FROM,
    mailerliteToken: env.MAILERLITE_API_TOKEN,
    // One shared cross-brand group. MAILERLITE_FAMILY_GROUP_ID is the same value in every app.
    mailerliteFamilyGroupId: env.MAILERLITE_FAMILY_GROUP_ID || env.MAILERLITE_GROUP_ID
  };
}

/** The structured, greppable durable log line. Always emitted — the infra-free durable copy
 *  (Vercel runtime logs) and the recovery source if email delivery ever lapses. */
export function signupLogLine(email: string, brand: string, source: string): string {
  return `SIGNUP|${email}|${brand}|${source}|${new Date().toISOString()}`;
}

/** Durable sink. Returns true once the signup is safely persisted somewhere that survives the
 *  request. The log line ALWAYS lands (so we never silently lose a signup even with zero env),
 *  and we additionally email it via Resend when configured. Durable if EITHER the email send
 *  succeeded OR there is no Resend config (log-only fallback is still recoverable). We only return
 *  false when Resend IS configured but the send hard-fails, so the client can ask for a retry. */
export async function persistDurable(
  input: { email: string; brand: string; source: string },
  env: FamilySubscribeEnv,
  fetchImpl: typeof fetch = fetch,
  log: (line: string) => void = console.log
): Promise<boolean> {
  log(signupLogLine(input.email, input.brand, input.source));

  if (!env.resendToken || !env.notifyTo) return true;

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.notifyFrom || `${input.brand} signups <list@themathfamily.com>`,
        to: [env.notifyTo],
        subject: `New ${input.brand} signup: ${input.email}`,
        text: `${input.email}\nbrand: ${input.brand}\nsource: ${input.source}\nat: ${new Date().toISOString()}\n\nReply-safe durable record of a family-list signup. If MailerLite was not yet connected, run the family flush import.`
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort subscribe to the ONE shared family group. Never throws; returns a status the route
 *  logs but does not surface as a user error. "skipped" when no token/group is configured yet.
 *  `brand` + `source` are sent as MailerLite subscriber fields so we can attribute the conversion. */
export async function subscribeFamilyList(
  email: string,
  brand: string,
  source: string,
  env: FamilySubscribeEnv,
  fetchImpl: typeof fetch = fetch
): Promise<"subscribed" | "skipped" | "failed"> {
  if (!env.mailerliteToken || !env.mailerliteFamilyGroupId) return "skipped";
  try {
    const res = await fetchImpl("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mailerliteToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        email,
        groups: [env.mailerliteFamilyGroupId],
        // Custom fields for attribution: which app + which surface converted this signup.
        fields: { brand, source }
      })
    });
    return res.ok ? "subscribed" : "failed";
  } catch {
    return "failed";
  }
}

/** Orchestrator: validate → durable-first → best-effort shared family list. Pure of the HTTP
 *  layer so the route handler just adapts request/response around it. */
export async function processSubscription(
  input: FamilySubscribeInput,
  env: FamilySubscribeEnv,
  deps: { fetchImpl?: typeof fetch; log?: (line: string) => void } = {}
): Promise<FamilySubscribeResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? console.log;

  if (!isValidEmail(input.email)) return { ok: false, reason: "invalid_email" };
  if (!hasConsent(input.consent)) return { ok: false, reason: "no_consent" };

  const email = input.email.trim().toLowerCase();
  const brand = (input.brand || "unknown").slice(0, 60);
  const source = (input.source || "unknown").slice(0, 200);

  const durable = await persistDurable({ email, brand, source }, env, fetchImpl, log);
  if (!durable) return { ok: false, reason: "durable_failed" };

  const familyList = await subscribeFamilyList(email, brand, source, env, fetchImpl);
  return { ok: true, durable: true, familyList };
}
