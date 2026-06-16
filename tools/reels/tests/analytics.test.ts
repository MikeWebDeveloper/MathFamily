import { describe, it, expect, beforeEach } from "vitest";
import { fetchReach } from "../src/analytics";

describe("fetchReach", () => {
  beforeEach(() => {
    for (const k of ["PLAUSIBLE_HOST", "PLAUSIBLE_API_KEY", "PLAUSIBLE_SITE_ID", "CF_API_TOKEN", "CF_ACCOUNT_TAG", "CF_SITE_TAG"]) {
      delete process.env[k];
    }
  });
  it("returns source 'none' (no network) when nothing is configured", async () => {
    const r = await fetchReach(7);
    expect(r.source).toBe("none");
    expect(r.rows).toEqual([]);
  });
});
