import { describe, it, expect, vi } from "vitest";
import {
  isValidEmail,
  hasConsent,
  signupLogLine,
  persistDurable,
  subscribeMailerLite,
  processSubscription,
  type SubscribeEnv
} from "../lib/subscribe";

const okFetch = () => vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
const failFetch = () => vi.fn<typeof fetch>(async () => new Response("nope", { status: 500 }));
const throwFetch = () => vi.fn<typeof fetch>(async () => { throw new Error("network"); });

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("first.last@sub.domain.co.uk")).toBe(true);
  });
  it("rejects junk", () => {
    for (const bad of ["", "no-at", "a@b", "a b@c.d", "@b.co", "a@.co", 5, null, undefined]) {
      expect(isValidEmail(bad as unknown)).toBe(false);
    }
  });
});

describe("hasConsent", () => {
  it("only an explicit affirmative passes", () => {
    for (const yes of [true, "true", "on", "1"]) expect(hasConsent(yes)).toBe(true);
    for (const no of [false, "false", "", undefined, null, 0, "off"]) expect(hasConsent(no)).toBe(false);
  });
});

describe("signupLogLine", () => {
  it("is the greppable SIGNUP| record", () => {
    const line = signupLogLine("a@b.co", "hub");
    expect(line).toMatch(/^SIGNUP\|a@b\.co\|hub\|\d{4}-\d{2}-\d{2}T/);
  });
});

describe("persistDurable — fail-safe store", () => {
  it("with NO Resend config, still durable via the log line (never lost)", async () => {
    const log = vi.fn();
    const ok = await persistDurable({ email: "a@b.co", source: "hub" }, {}, okFetch(), log);
    expect(ok).toBe(true);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("SIGNUP|a@b.co|hub|"));
  });

  it("with Resend config, emails the signup and reports durable", async () => {
    const env: SubscribeEnv = { resendToken: "re_x", notifyTo: "in@box.co", notifyFrom: "f@parkmath.co.uk" };
    const f = okFetch();
    const ok = await persistDurable({ email: "a@b.co", source: "spoke" }, env, f, vi.fn());
    expect(ok).toBe(true);
    expect(f).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  });

  it("with Resend configured but send FAILS, reports NOT durable so client can retry", async () => {
    const env: SubscribeEnv = { resendToken: "re_x", notifyTo: "in@box.co" };
    expect(await persistDurable({ email: "a@b.co", source: "x" }, env, failFetch(), vi.fn())).toBe(false);
    expect(await persistDurable({ email: "a@b.co", source: "x" }, env, throwFetch(), vi.fn())).toBe(false);
  });
});

describe("subscribeMailerLite", () => {
  it("skips cleanly when no token/group (pre-token phase)", async () => {
    expect(await subscribeMailerLite("a@b.co", {}, okFetch())).toBe("skipped");
    expect(await subscribeMailerLite("a@b.co", { mailerliteToken: "t" }, okFetch())).toBe("skipped");
  });
  it("subscribes to the configured group", async () => {
    const f = okFetch();
    const r = await subscribeMailerLite("a@b.co", { mailerliteToken: "t", mailerliteGroupId: "g1" }, f);
    expect(r).toBe("subscribed");
    const body = JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).toEqual({ email: "a@b.co", groups: ["g1"] });
  });
  it("never throws; reports failed on error", async () => {
    const env = { mailerliteToken: "t", mailerliteGroupId: "g1" };
    expect(await subscribeMailerLite("a@b.co", env, failFetch())).toBe("failed");
    expect(await subscribeMailerLite("a@b.co", env, throwFetch())).toBe("failed");
  });
});

describe("processSubscription — orchestration", () => {
  it("rejects invalid email and missing consent before any side effect", async () => {
    const f = okFetch();
    expect(await processSubscription({ email: "bad", consent: true }, {}, { fetchImpl: f, log: vi.fn() }))
      .toEqual({ ok: false, reason: "invalid_email" });
    expect(await processSubscription({ email: "a@b.co", consent: false }, {}, { fetchImpl: f, log: vi.fn() }))
      .toEqual({ ok: false, reason: "no_consent" });
    expect(f).not.toHaveBeenCalled();
  });

  it("PRE-TOKEN: valid+consented signup succeeds and is durable even with zero env", async () => {
    const log = vi.fn();
    const r = await processSubscription({ email: "A@B.co", consent: "on", source: "hub" }, {}, { fetchImpl: okFetch(), log });
    expect(r).toEqual({ ok: true, durable: true, mailerlite: "skipped" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("SIGNUP|a@b.co|hub|")); // normalised lower-case
  });

  it("POST-TOKEN: durable AND subscribed to MailerLite", async () => {
    const env: SubscribeEnv = { mailerliteToken: "t", mailerliteGroupId: "g" };
    const r = await processSubscription({ email: "a@b.co", consent: true }, env, { fetchImpl: okFetch(), log: vi.fn() });
    expect(r).toEqual({ ok: true, durable: true, mailerlite: "subscribed" });
  });

  it("durable failure surfaces as retryable, and does NOT report success", async () => {
    const env: SubscribeEnv = { resendToken: "re_x", notifyTo: "in@box.co" };
    const r = await processSubscription({ email: "a@b.co", consent: true }, env, { fetchImpl: failFetch(), log: vi.fn() });
    expect(r).toEqual({ ok: false, reason: "durable_failed" });
  });
});
