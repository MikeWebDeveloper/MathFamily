import { describe, expect, it } from "vitest";
import { loadDropOffDataset } from "@mathfamily/data";
import nextConfig from "../next.config";
import { qualifiesForAvoidPage } from "../lib/avoid-content";

// An airport's /avoid-drop-off-charge/<slug> page exists only while its record has a free
// alternative. When a re-verify drops it (Cardiff, rolling PR #102, Nov 2026), the URL would 404
// and lose its rankings; it should 308 to the airport's drop-off page instead. Config redirects run
// before page routes, so the rule must be data-driven: a hard-coded Cardiff redirect would hide the
// page again if Cardiff's free alternative ever comes back.
describe("avoid-page redirects follow the dataset", () => {
  it("redirects exactly the airports without an avoid page, to their drop-off page", async () => {
    const rules = await nextConfig.redirects!();
    for (const r of loadDropOffDataset().records) {
      const rule = rules.find((x) => x.source === `/avoid-drop-off-charge/${r.airportSlug}`);
      if (qualifiesForAvoidPage(r)) {
        expect(rule, `${r.airportSlug} has an avoid page; a redirect would shadow it`).toBeUndefined();
      } else {
        expect(rule, `${r.airportSlug} has no avoid page`).toMatchObject({ destination: `/drop-off-charges/${r.airportSlug}`, permanent: true });
      }
    }
  });
});
