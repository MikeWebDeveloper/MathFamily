import { describe, it, expect, vi } from "vitest";
import {
  isValidEmail,
  hasConsent,
  signupLogLine,
  buildSignupNotification,
  formatNotifyTime,
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

describe("buildSignupNotification — source-led, timestamped subject", () => {
  // A fixed instant: 2026-06-22T13:07:00Z → 14:07 Europe/London (BST, +01:00).
  const at = new Date("2026-06-22T13:07:00Z");

  it("subject LEADS with brand + source + HH:MM time (the source-led format)", () => {
    const { subject } = buildSignupNotification(
      { email: "a@b.co", brand: "RoamMath", source: "region" },
      at
    );
    // brand + surface + time FIRST.
    expect(subject).toBe("New signup · RoamMath · region · 14:07");
    expect(subject).toContain("RoamMath"); // brand present
    expect(subject).toContain("region"); // source present
    expect(subject).toMatch(/\b\d{2}:\d{2}$/); // HH:MM time present, leading the line
    expect(formatNotifyTime(at)).toBe("14:07"); // London time, not UTC
  });

  it("subject VARIES by source (templated off brand + source per app/page)", () => {
    const home = buildSignupNotification({ email: "a@b.co", brand: "RoamMath", source: "home" }, at);
    const region = buildSignupNotification({ email: "a@b.co", brand: "RoamMath", source: "region" }, at);
    expect(home.subject).not.toBe(region.subject);
    expect(home.subject).toContain("home");
    expect(region.subject).toContain("region");
  });

  it("subject VARIES by brand too (per-app)", () => {
    const roam = buildSignupNotification({ email: "a@b.co", brand: "RoamMath", source: "home" }, at);
    const rent = buildSignupNotification({ email: "a@b.co", brand: "RentMath", source: "home" }, at);
    expect(roam.subject).not.toBe(rent.subject);
  });

  it("body carries email, brand, source, full London timestamp, and page/referrer when present", () => {
    const { text } = buildSignupNotification(
      { email: "a@b.co", brand: "RoamMath", source: "region", page: "/region/london", referrer: "https://roammath.com/region/london" },
      at
    );
    expect(text).toContain("email: a@b.co");
    expect(text).toContain("brand: RoamMath");
    expect(text).toContain("source: region");
    expect(text).toContain("22 Jun 2026, 14:07"); // full date + time, Europe/London
    expect(text).toContain("Europe/London");
    expect(text).toContain("page: /region/london");
    expect(text).toContain("referrer: https://roammath.com/region/london");
  });

  it("omits page/referrer lines when not supplied", () => {
    const { text } = buildSignupNotification({ email: "a@b.co", brand: "RoamMath", source: "home" }, at);
    expect(text).not.toContain("page:");
    expect(text).not.toContain("referrer:");
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
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    // The Resend payload carries the source-led subject (brand + source + HH:MM time).
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.subject).toMatch(/^New signup · RoamMath · home · \d{2}:\d{2}$/);
    expect(body.text).toContain("email: a@b.co");
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
