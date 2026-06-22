import { describe, it, expect, vi } from "vitest";
import {
  isValidEmail,
  hasConsent,
  signupLogLine,
  persistDurable,
  subscribeFamilyList,
  processSubscription,
  type FamilySubscribeEnv
} from "../src/subscribe";

const okFetch = () => vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
const failFetch = () => vi.fn<typeof fetch>(async () => new Response("nope", { status: 500 }));
const throwFetch = () => vi.fn<typeof fetch>(async () => { throw new Error("network"); });

describe("isValidEmail", () => {
  it("accepts normal addresses, rejects junk", () => {
    expect(isValidEmail("first.last@sub.domain.co.uk")).toBe(true);
    for (const bad of ["", "no-at", "a@b", "a b@c.d", 5, null, undefined]) {
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
  it("is the greppable SIGNUP| record carrying brand + source", () => {
    const line = signupLogLine("a@b.co", "RoamMath", "home");
    expect(line).toMatch(/^SIGNUP\|a@b\.co\|RoamMath\|home\|\d{4}-\d{2}-\d{2}T/);
  });
});

describe("persistDurable", () => {
  it("always logs the durable line even with zero env (log-only is recoverable → durable)", async () => {
    const log = vi.fn();
    const ok = await persistDurable({ email: "a@b.co", brand: "RoamMath", source: "home" }, {}, okFetch(), log);
    expect(ok).toBe(true);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]![0]).toMatch(/^SIGNUP\|a@b\.co\|RoamMath\|home\|/);
  });

  it("emails via Resend when configured and returns true on send success", async () => {
    const f = okFetch();
    const ok = await persistDurable(
      { email: "a@b.co", brand: "RoamMath", source: "home" },
      { resendToken: "re_x", notifyTo: "inbox@x.co", notifyFrom: "list@x.co" },
      f
    );
    expect(ok).toBe(true);
    expect(f).toHaveBeenCalledOnce();
    const [url] = f.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
  });

  it("returns false ONLY when Resend is configured but the send hard-fails", async () => {
    const ok = await persistDurable(
      { email: "a@b.co", brand: "RoamMath", source: "home" },
      { resendToken: "re_x", notifyTo: "inbox@x.co" },
      failFetch()
    );
    expect(ok).toBe(false);
  });
});

describe("subscribeFamilyList", () => {
  it("skips (no error) when the shared family group/token is unset", async () => {
    const f = okFetch();
    const status = await subscribeFamilyList("a@b.co", "RoamMath", "home", {}, f);
    expect(status).toBe("skipped");
    expect(f).not.toHaveBeenCalled();
  });

  it("posts the email to the ONE shared family group, tagging brand + source", async () => {
    const f = okFetch();
    const env: FamilySubscribeEnv = { mailerliteToken: "ml_x", mailerliteFamilyGroupId: "grp_family" };
    const status = await subscribeFamilyList("a@b.co", "RoamMath", "home", env, f);
    expect(status).toBe("subscribed");
    const [, init] = f.mock.calls[0]!;
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.groups).toEqual(["grp_family"]);
    // brand + source carried as MailerLite fields/tags for attribution.
    const serialized = JSON.stringify(body);
    expect(serialized).toMatch(/RoamMath/);
    expect(serialized).toMatch(/home/);
  });

  it("never throws on network failure — returns 'failed'", async () => {
    const status = await subscribeFamilyList("a@b.co", "RoamMath", "home", { mailerliteToken: "ml_x", mailerliteFamilyGroupId: "g" }, throwFetch());
    expect(status).toBe("failed");
  });
});

describe("processSubscription — durable-first, fail-safe", () => {
  const env: FamilySubscribeEnv = { mailerliteToken: "ml_x", mailerliteFamilyGroupId: "g" };

  it("rejects invalid email before any network call", async () => {
    const f = okFetch();
    const r = await processSubscription({ email: "nope", consent: true, brand: "RoamMath" }, env, { fetchImpl: f });
    expect(r).toEqual({ ok: false, reason: "invalid_email" });
    expect(f).not.toHaveBeenCalled();
  });

  it("rejects missing consent", async () => {
    const r = await processSubscription({ email: "a@b.co", consent: false, brand: "RoamMath" }, env, { fetchImpl: okFetch() });
    expect(r).toEqual({ ok: false, reason: "no_consent" });
  });

  it("persists durably BEFORE MailerLite and reports success on a good signup", async () => {
    const order: string[] = [];
    const f = vi.fn<typeof fetch>(async (url) => {
      order.push(String(url).includes("resend") ? "durable" : "mailerlite");
      return new Response(null, { status: 200 });
    });
    const r = await processSubscription(
      { email: "A@B.co", consent: "on", brand: "RoamMath", source: "home" },
      { ...env, resendToken: "re_x", notifyTo: "inbox@x.co" },
      { fetchImpl: f }
    );
    expect(r).toEqual({ ok: true, durable: true, familyList: "subscribed" });
    expect(order[0]).toBe("durable"); // durable sink runs first
  });

  it("MailerLite failure does NOT fail the signup (best-effort on top of durable)", async () => {
    const f = vi.fn<typeof fetch>(async (url) =>
      String(url).includes("resend") ? new Response(null, { status: 200 }) : new Response("x", { status: 500 })
    );
    const r = await processSubscription(
      { email: "a@b.co", consent: true, brand: "RoamMath" },
      { ...env, resendToken: "re_x", notifyTo: "inbox@x.co" },
      { fetchImpl: f }
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.familyList).toBe("failed");
  });

  it("durable hard-failure surfaces as a retryable 500-class error", async () => {
    const r = await processSubscription(
      { email: "a@b.co", consent: true, brand: "RoamMath" },
      { ...env, resendToken: "re_x", notifyTo: "inbox@x.co" },
      { fetchImpl: failFetch() }
    );
    expect(r).toEqual({ ok: false, reason: "durable_failed" });
  });
});
