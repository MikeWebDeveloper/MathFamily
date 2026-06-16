// Unit tests for the watchdog's pure logic. Zero deps — Node's built-in runner.
// Run: node --test tools/watchdog/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recordsOf, DURATION_SLUGS, enumerateRoutes, buildAwinLink, validateDeeplink,
  activePartners, expectedDeeplinks, destinationUrls, classifyResults, formatReport,
} from "./lib.mjs";

test("DURATION_SLUGS mirrors apps/parkmath/lib/parking-content.ts", () => {
  assert.deepEqual(DURATION_SLUGS, ["3-days", "7-days", "14-days"]);
});

test("recordsOf normalizes bare array | {records} | {items} | junk", () => {
  assert.deepEqual(recordsOf([1, 2]), [1, 2]);
  assert.deepEqual(recordsOf({ records: [3] }), [3]);
  assert.deepEqual(recordsOf({ items: [4] }), [4]);
  assert.deepEqual(recordsOf(null), []);
  assert.deepEqual(recordsOf({ nope: 1 }), []);
});

const FIXTURE = {
  airports: [{ slug: "heathrow" }, { slug: "gatwick" }],
  dropOff: { records: [{ airportSlug: "heathrow" }, { airportSlug: "gatwick" }] },
  parking: { records: [{ airportSlug: "heathrow" }] },
  lounges: { records: [{ airportSlug: "gatwick" }] },
  news: { items: [{ id: "news-1" }, { id: "news-2" }] },
};

test("enumerateRoutes covers hubs + per-dataset airport/duration/news routes", () => {
  const routes = enumerateRoutes(FIXTURE);
  const paths = routes.map((r) => r.path);
  assert.ok(paths.includes("/") && paths.includes("/drop-off-charges") && paths.includes("/news"));
  assert.ok(paths.includes("/drop-off-charges/heathrow") && paths.includes("/drop-off-charges/gatwick"));
  assert.ok(paths.includes("/airport-parking/heathrow"));
  assert.ok(paths.includes("/airport-parking/heathrow/3-days"));
  assert.ok(paths.includes("/airport-parking/heathrow/14-days"));
  assert.ok(!paths.includes("/airport-parking/gatwick"));
  assert.ok(paths.includes("/airport-lounges/gatwick") && !paths.includes("/airport-lounges/heathrow"));
  assert.ok(paths.includes("/news/news-1") && paths.includes("/news/news-2"));
  assert.equal(routes.length, 14);
});

test("buildAwinLink matches the partners.ts contract (encoded ued, clickref suffix)", () => {
  const url = buildAwinLink({
    awinmid: "3496", publisherId: "2932035", airportSlug: "heathrow",
    ued: "https://www.holidayextras.com/airport-parking.html", clickrefSuffix: "dropoff",
  });
  assert.ok(url.startsWith("https://www.awin1.com/cread.php?"));
  const q = new URL(url).searchParams;
  assert.equal(q.get("awinmid"), "3496");
  assert.equal(q.get("awinaffid"), "2932035");
  assert.equal(q.get("clickref"), "parkmath-heathrow-dropoff");
  assert.equal(q.get("ued"), "https://www.holidayextras.com/airport-parking.html");
});

test("buildAwinLink omits suffix and ued when not given", () => {
  const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" });
  const q = new URL(url).searchParams;
  assert.equal(q.get("clickref"), "parkmath-gatwick");
  assert.equal(q.get("ued"), null);
});

const VALID_OPTS = { activeMids: new Set(["3496"]), publisherId: "2932035" };

test("validateDeeplink passes a well-formed link", () => {
  const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "heathrow", ued: "https://x.test/p", clickrefSuffix: "lounge" });
  assert.deepEqual(validateDeeplink(url, { ...VALID_OPTS, expectedUed: "https://x.test/p" }), []);
});

test("validateDeeplink flags wrong host, inactive mid, bad affid, bad clickref, ued mismatch", () => {
  assert.equal(validateDeeplink("https://evil.test/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-x", VALID_OPTS).length, 1);
  const wrongMid = buildAwinLink({ awinmid: "9999", publisherId: "2932035", airportSlug: "x" });
  assert.ok(validateDeeplink(wrongMid, VALID_OPTS).some((p) => p.includes("not an active mid")));
  const wrongAff = buildAwinLink({ awinmid: "3496", publisherId: "0000", airportSlug: "x" });
  assert.ok(validateDeeplink(wrongAff, VALID_OPTS).some((p) => p.includes("awinaffid")));
  const badRef = "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=WRONG";
  assert.ok(validateDeeplink(badRef, VALID_OPTS).some((p) => p.includes("clickref")));
  const goodUrl = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "x", ued: "https://a.test" });
  assert.ok(validateDeeplink(goodUrl, { ...VALID_OPTS, expectedUed: "https://b.test" }).some((p) => p.includes("ued")));
});

test("validateDeeplink rejects unparseable input", () => {
  assert.deepEqual(validateDeeplink("not a url", VALID_OPTS), ["unparseable URL"]);
});

const PARTNERS = {
  awin: { publisherId: "2932035" },
  partners: {
    "holiday-extras": {
      name: "Holiday Extras", awinmid: "3496", active: true,
      landingUrl: "https://he.test/parking",
      products: { parking: { url: "https://he.test/parking", label: "parking" }, lounge: { url: "https://he.test/lounge", label: "lounge" } },
    },
    "purple-parking": { name: "Purple Parking", awinmid: "12028", active: false },
    "priority-pass": { name: "Priority Pass", awinmid: null, active: false },
  },
};

test("activePartners returns only active+mid partners with their destinations", () => {
  const ap = activePartners(PARTNERS);
  assert.equal(ap.length, 1);
  assert.equal(ap[0].slug, "holiday-extras");
  assert.equal(ap[0].destinations.length, 3);
});

test("destinationUrls is the distinct set of ued targets, never awin1.com", () => {
  const urls = destinationUrls(PARTNERS);
  assert.equal(urls.length, 2); // deduped: landingUrl === products.parking.url, so 2 distinct not 3
  assert.deepEqual(new Set(urls), new Set(["https://he.test/parking", "https://he.test/lounge"]));
  assert.ok(urls.every((u) => !u.includes("awin1.com")));
});

test("expectedDeeplinks = activePartners × airports × destinations, all structurally valid", () => {
  const airportSlugs = ["heathrow", "gatwick"];
  const links = expectedDeeplinks({ partnersJson: PARTNERS, airportSlugs });
  assert.equal(links.length, 1 * 2 * 3);
  const opts = { activeMids: new Set(["3496"]), publisherId: "2932035" };
  for (const l of links) assert.deepEqual(validateDeeplink(l.url, { ...opts, expectedUed: l.expectedUed }), []);
  // surface:null (the bare landingUrl link) must emit no clickref suffix
  const bare = links.find((l) => l.surface === null && l.airport === "heathrow");
  assert.equal(new URL(bare.url).searchParams.get("clickref"), "parkmath-heathrow");
});

test("validateDeeplink accepts slugs containing digits (e.g. terminal4)", () => {
  const withDigits = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "terminal4" });
  assert.deepEqual(validateDeeplink(withDigits, VALID_OPTS), []);
});

test("classifyResults aggregates page/destination/deeplink failures", () => {
  const summary = classifyResults({
    pageResults: [{ path: "/", ok: true }, { path: "/news", ok: false, detail: "503" }],
    destResults: [{ url: "https://he.test/parking", ok: true }],
    deeplinkProblems: [{ url: "https://www.awin1.com/cread.php?x", problems: ["bad clickref: WRONG"] }],
  });
  assert.equal(summary.ok, false);
  assert.equal(summary.checked, 3);
  assert.equal(summary.failures.length, 2);
  assert.ok(summary.failures.some((f) => f.type === "page" && f.path === "/news"));
  assert.ok(summary.failures.some((f) => f.type === "deeplink"));
});

test("classifyResults ok=true when nothing fails", () => {
  const summary = classifyResults({ pageResults: [{ path: "/", ok: true }], destResults: [], deeplinkProblems: [] });
  assert.equal(summary.ok, true);
  assert.equal(summary.failures.length, 0);
});

test("formatReport renders page, destination, and deeplink failure branches", () => {
  const summary = classifyResults({
    pageResults: [{ path: "/news", ok: false, detail: "503" }],
    destResults: [{ url: "https://he.test/parking", ok: false, detail: "HTTP 404" }],
    deeplinkProblems: [{ url: "https://www.awin1.com/cread.php?x", problems: ["bad clickref: WRONG"] }],
  });
  const md = formatReport({ date: "2026-06-16", summary });
  assert.ok(md.includes("# 🔴 ParkMath watchdog — 2026-06-16"));
  assert.ok(md.includes("`/news`") && md.includes("503"));
  assert.ok(md.includes("**affiliate destination**") && md.includes("https://he.test/parking"));
  assert.ok(md.includes("**deeplink**") && md.includes("bad clickref: WRONG"));
});
