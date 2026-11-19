import { describe, expect, test } from "vitest";
import robots from "../app/robots";

// /go/* is the first-party affiliate-click redirect. A crawler that follows it fires the AWIN tracker
// (phantom clicks that dilute the merchants' conversion rate). RoamMath already disallows it; ParkMath
// must too, and on EVERY user-agent group — a group that names its own rules ignores the "*" group.
describe("robots.txt", () => {
  test("keeps /go/ away from every crawler group, including the named AI bots", () => {
    const rules = [robots().rules].flat();
    expect(rules.length).toBeGreaterThan(1);
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(["/go/"]);
    }
  });

  test("still lets the AI answer engines in (being cited is the product)", () => {
    const agents = [robots().rules].flat().map((r) => r.userAgent);
    for (const bot of ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"]) {
      expect(agents).toContain(bot);
    }
  });
});
