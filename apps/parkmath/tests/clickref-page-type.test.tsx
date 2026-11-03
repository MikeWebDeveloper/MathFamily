import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadDropOffDataset } from "@mathfamily/data";
import BlueBadgePage, { generateStaticParams as blueBadgeParams } from "../app/blue-badge/[airport]/page";
import AvoidPage, { generateStaticParams as avoidParams } from "../app/avoid-drop-off-charge/[airport]/page";
import DropOffPage from "../app/drop-off-charges/[airport]/page";
import { buildAwinLink } from "../lib/partners";

// 2026-11-02: drop-off, blue-badge and avoid-drop-off-charge all emitted s=dropoff, so AWIN's clickref
// (parkmath-<airport>-<surface>) could not tell which TEMPLATE earned a booking. Each now names itself:
// drop-off keeps "dropoff" (history), blue-badge emits "badge", avoid emits "avoid". The parsers in
// tools/awin take the airport from the dataset and treat the remainder as the surface, so any new
// surface parses without a tooling change (see tools/awin/lib.test.mjs).

type Page = (props: { params: Promise<{ airport: string }> }) => Promise<React.JSX.Element>;
const render = async (P: unknown, airport: string) => renderToStaticMarkup(await (P as Page)({ params: Promise.resolve({ airport }) }));
/** Every first-party /go link's `s=` surface in the HTML. */
const surfaces = (html: string) => [...html.matchAll(/\/go\/[^"?]+\?s=([a-z0-9-]+)/g)].map((m) => m[1]!);

describe("page-type surfaces on the /go links", () => {
  it("blue-badge pages emit only badge / badge-<product>", async () => {
    const found = surfaces(await render(BlueBadgePage, "gatwick"));
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) expect(s, s).toMatch(/^badge(-(hotels|lounge|transfers))?$/);
  });

  it("avoid pages emit only avoid / avoid-<product>", async () => {
    const found = surfaces(await render(AvoidPage, "gatwick"));
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) expect(s, s).toMatch(/^avoid(-(hotels|lounge|transfers))?$/);
  });

  it("the drop-off page keeps its existing dropoff* surfaces, so history stays comparable", async () => {
    const found = surfaces(await render(DropOffPage, "gatwick"));
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) expect(s, s).toMatch(/^dropoff(bridge)?(-(hotels|lounge|transfers))?$/);
  });
});

describe("clickref stays inside AWIN's limits for every airport on the new surfaces", () => {
  // The repo's own attribution spec caps clickref at 50 chars of lowercase alnum + "-".
  const slugs = loadDropOffDataset().records.map((r) => r.airportSlug);
  const emitted = ["badge", "badge-transfers", "badge-hotels", "badge-lounge", "avoid", "avoid-transfers", "avoid-hotels", "avoid-lounge"];

  it("every airport x emitted surface builds a clickref of <= 50 chars matching ^parkmath-[a-z0-9-]+$", () => {
    for (const slug of slugs) {
      for (const surface of emitted) {
        const url = new URL(buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: slug, clickrefSuffix: surface }));
        const clickref = url.searchParams.get("clickref")!;
        expect(clickref, `${slug}/${surface}`).toMatch(/^parkmath-[a-z0-9-]+$/);
        expect(clickref.length, `${slug}/${surface}: ${clickref}`).toBeLessThanOrEqual(50);
      }
    }
  });

  it("the surfaces actually rendered on every blue-badge and avoid page are all inside the emitted set", async () => {
    const seen = new Set<string>();
    for (const { airport } of blueBadgeParams()) for (const s of surfaces(await render(BlueBadgePage, airport))) seen.add(s);
    for (const { airport } of avoidParams()) for (const s of surfaces(await render(AvoidPage, airport))) seen.add(s);
    for (const s of seen) expect(emitted, s).toContain(s);
  });
});
