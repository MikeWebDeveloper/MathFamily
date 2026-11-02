// Unit tests for the Awin client's pure logic. Zero deps — Node's built-in runner.
// Run: node --test tools/awin/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AWIN_API_BASE,
  toAwinStart,
  toAwinEnd,
  daysInclusive,
  validateRange,
  buildAccountsUrl,
  buildProgrammesUrl,
  buildTransactionsUrl,
  buildFeedListUrl,
  airportFromClickRef,
  surfaceFromClickRef,
  pageTypeFromSurface,
  aggregateTransactions,
  diffProgrammes,
  parseFeedListCsv,
} from "./lib.mjs";

test("toAwinStart / toAwinEnd format a YYYY-MM-DD day as Awin UTC datetimes", () => {
  assert.equal(toAwinStart("2026-06-01"), "2026-06-01T00:00:00Z");
  assert.equal(toAwinEnd("2026-06-30"), "2026-06-30T23:59:59Z");
});

test("toAwinStart rejects malformed dates", () => {
  assert.throws(() => toAwinStart("2026-6-1"), /YYYY-MM-DD/);
  assert.throws(() => toAwinStart("01/06/2026"), /YYYY-MM-DD/);
  assert.throws(() => toAwinStart("2026-13-01"), /invalid/i);
});

test("daysInclusive counts both endpoints", () => {
  assert.equal(daysInclusive("2026-06-01", "2026-06-01"), 1);
  assert.equal(daysInclusive("2026-06-01", "2026-06-30"), 30);
});

test("validateRange enforces order and the 31-day Awin cap", () => {
  assert.doesNotThrow(() => validateRange("2026-06-01", "2026-07-01")); // 31 days
  assert.throws(() => validateRange("2026-06-01", "2026-07-02"), /31 days/);
  assert.throws(() => validateRange("2026-06-30", "2026-06-01"), /before/);
});

test("buildAccountsUrl targets /accounts with optional type, no token in URL", () => {
  assert.equal(buildAccountsUrl(), `${AWIN_API_BASE}/accounts`);
  assert.equal(buildAccountsUrl({ type: "publisher" }), `${AWIN_API_BASE}/accounts?type=publisher`);
});

test("buildProgrammesUrl includes publisher id and relationship filter", () => {
  assert.equal(
    buildProgrammesUrl("2932035", { relationship: "pending" }),
    `${AWIN_API_BASE}/publishers/2932035/programmes?relationship=pending`,
  );
  assert.equal(
    buildProgrammesUrl("2932035"),
    `${AWIN_API_BASE}/publishers/2932035/programmes`,
  );
});

test("buildProgrammesUrl rejects an unknown relationship value", () => {
  assert.throws(() => buildProgrammesUrl("2932035", { relationship: "friends" }), /relationship/);
});

test("buildTransactionsUrl encodes dates, timezone and optional filters", () => {
  const url = buildTransactionsUrl("2932035", {
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    timezone: "Europe/London",
    dateType: "transaction",
  });
  assert.ok(url.startsWith(`${AWIN_API_BASE}/publishers/2932035/transactions/?`));
  assert.match(url, /startDate=2026-06-01T00%3A00%3A00Z/);
  assert.match(url, /endDate=2026-06-30T23%3A59%3A59Z/);
  assert.match(url, /timezone=Europe%2FLondon/);
  assert.match(url, /dateType=transaction/);
  assert.ok(!/accessToken/.test(url), "token must never be placed in the URL");
});

test("buildFeedListUrl uses the product-data host and the feed key", () => {
  assert.equal(
    buildFeedListUrl("FEEDKEY123"),
    "https://productdata.awin.com/datafeed/list/apikey/FEEDKEY123/",
  );
});

test("airportFromClickRef / surfaceFromClickRef parse parkmath-<airport>[-<surface>]", () => {
  assert.equal(airportFromClickRef("parkmath-heathrow-dropoff"), "heathrow");
  assert.equal(surfaceFromClickRef("parkmath-heathrow-dropoff"), "dropoff");
  assert.equal(airportFromClickRef("parkmath-gatwick"), "gatwick");
  assert.equal(surfaceFromClickRef("parkmath-gatwick"), null);
  assert.equal(airportFromClickRef("someoneelse-xyz"), null);
  assert.equal(airportFromClickRef(""), null);
});

test("aggregateTransactions sums commission by advertiser, airport and clickRef", () => {
  const txns = [
    { id: 1, advertiserId: 3496, advertiserName: "Holiday Extras", clickRef: "parkmath-heathrow-dropoff", commissionAmount: { amount: 2.5, currency: "GBP" }, saleAmount: { amount: 40, currency: "GBP" } },
    { id: 2, advertiserId: 3496, advertiserName: "Holiday Extras", clickRef: "parkmath-heathrow", commissionAmount: { amount: 1.5, currency: "GBP" }, saleAmount: { amount: 30, currency: "GBP" } },
    { id: 3, advertiserId: 3496, advertiserName: "Holiday Extras", clickRef: "parkmath-gatwick-lounge", commissionAmount: { amount: 4, currency: "GBP" }, saleAmount: { amount: 60, currency: "GBP" } },
  ];
  const agg = aggregateTransactions(txns);
  assert.equal(agg.totals.count, 3);
  assert.equal(agg.totals.commission, 8);
  assert.equal(agg.totals.currency, "GBP");
  assert.equal(agg.byAirport.heathrow.commission, 4);
  assert.equal(agg.byAirport.heathrow.count, 2);
  assert.equal(agg.byAirport.gatwick.commission, 4);
  assert.equal(agg.byAdvertiser["Holiday Extras"].commission, 8);
});

test("aggregateTransactions tolerates flat numeric amounts and missing clickRef", () => {
  const agg = aggregateTransactions([
    { id: 9, advertiserName: "APH", clickRef: "", commissionAmount: 0.23, saleAmount: 12 },
  ]);
  assert.equal(agg.totals.commission, 0.23);
  assert.equal(agg.byAirport.unattributed.count, 1);
});

test("diffProgrammes reports relationship transitions by advertiser", () => {
  const prev = { "12028": { name: "Purple Parking", relationship: "pending" }, "3496": { name: "Holiday Extras", relationship: "joined" } };
  const curr = { "12028": { name: "Purple Parking", relationship: "joined" }, "3496": { name: "Holiday Extras", relationship: "joined" } };
  const changes = diffProgrammes(prev, curr);
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], { id: "12028", name: "Purple Parking", from: "pending", to: "joined" });
});

test("diffProgrammes flags newly appearing advertisers as from=none", () => {
  const changes = diffProgrammes({}, { "3494": { name: "Airparks", relationship: "pending" } });
  assert.deepEqual(changes, [{ id: "3494", name: "Airparks", from: "none", to: "pending" }]);
});

test("parseFeedListCsv parses a quoted, comma-delimited feed list into objects", () => {
  const csv =
    'Feed ID,Advertiser ID,Advertiser Name,Region\n' +
    '12345,3496,"Holiday Extras, Ltd",GB\n' +
    '67890,12028,Purple Parking,GB\n';
  const rows = parseFeedListCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]["Feed ID"], "12345");
  assert.equal(rows[0]["Advertiser Name"], "Holiday Extras, Ltd");
  assert.equal(rows[1]["Advertiser ID"], "12028");
});

// Regression: a hardcoded surface allowlist silently rotted. "options" (and "hub") were
// never in it, so parkmath-exeter-options parsed as airport="exeter-options", surface=null
// — every /airport-parking-options/ conversion was booked to a nonexistent airport and the
// revenue-by-page-type split was invisible. Airports now come from the dataset; the surface
// is whatever remains, so a NEW surface can never mis-attribute the airport again.
test("clickRef parsing survives surfaces that are not in any allowlist", () => {
  assert.equal(airportFromClickRef("parkmath-exeter-options"), "exeter");
  assert.equal(surfaceFromClickRef("parkmath-exeter-options"), "options");
  // A surface nobody has invented yet must still resolve the airport correctly.
  assert.equal(airportFromClickRef("parkmath-luton-somethingnew"), "luton");
  assert.equal(surfaceFromClickRef("parkmath-luton-somethingnew"), "somethingnew");
  // Multi-word airport slugs must win over any shorter prefix match.
  assert.equal(airportFromClickRef("parkmath-leeds-bradford-options"), "leeds-bradford");
  assert.equal(surfaceFromClickRef("parkmath-leeds-bradford-options"), "options");
  assert.equal(airportFromClickRef("parkmath-belfast-international"), "belfast-international");
  assert.equal(surfaceFromClickRef("parkmath-belfast-international"), null);
});

test("aggregateTransactions splits revenue by surface (page type)", () => {
  const txns = [
    { commissionAmount: { amount: 2.53, currency: "GBP" }, saleAmount: { amount: 100 }, clickRefs: { clickRef: "parkmath-exeter-options" } },
    { commissionAmount: { amount: 0.83, currency: "GBP" }, saleAmount: { amount: 20 }, clickRefs: { clickRef: "parkmath-stansted-parking" } },
  ];
  const agg = aggregateTransactions(txns);
  assert.equal(agg.bySurface.options.commission, 2.53);
  assert.equal(agg.bySurface.parking.commission, 0.83);
  assert.equal(agg.byAirport.exeter.commission, 2.53);
});

// 2026-11-02: drop-off, blue-badge and avoid-drop-off-charge all emitted the single surface "dropoff",
// so the revenue split could not tell the three page types apart. Blue-badge now emits "badge" and
// avoid emits "avoid" (plus the "-hotels|-lounge|-transfers" product suffix on the extras links).
test("clickRef parsing handles the page-type surfaces for blue-badge and avoid pages", () => {
  assert.equal(airportFromClickRef("parkmath-exeter-badge"), "exeter");
  assert.equal(surfaceFromClickRef("parkmath-exeter-badge"), "badge");
  assert.equal(airportFromClickRef("parkmath-belfast-international-avoid-transfers"), "belfast-international");
  assert.equal(surfaceFromClickRef("parkmath-belfast-international-avoid-transfers"), "avoid-transfers");
  assert.equal(airportFromClickRef("parkmath-leeds-bradford-badge-hotels"), "leeds-bradford");
  assert.equal(surfaceFromClickRef("parkmath-leeds-bradford-badge-hotels"), "badge-hotels");
});

test("pageTypeFromSurface rolls a surface up to its page type without an allowlist", () => {
  // Product extras and the above-the-fold bridge belong to the page that carries them.
  assert.equal(pageTypeFromSurface("dropoff"), "dropoff");
  assert.equal(pageTypeFromSurface("dropoff-hotels"), "dropoff");
  assert.equal(pageTypeFromSurface("dropoff-transfers"), "dropoff");
  assert.equal(pageTypeFromSurface("dropoff-degated"), "dropoff");
  assert.equal(pageTypeFromSurface("dropoffbridge"), "dropoff");
  assert.equal(pageTypeFromSurface("badge-lounge"), "badge");
  assert.equal(pageTypeFromSurface("avoid-transfers"), "avoid");
  // A surface that merely IS a product (the lounges page) must not be stripped to nothing.
  assert.equal(pageTypeFromSurface("lounge"), "lounge");
  // Surfaces nobody has invented yet pass through untouched.
  assert.equal(pageTypeFromSurface("options"), "options");
  assert.equal(pageTypeFromSurface("somethingnew"), "somethingnew");
  assert.equal(pageTypeFromSurface(null), "(no surface)");
  assert.equal(pageTypeFromSurface(""), "(no surface)");
});

test("aggregateTransactions also rolls revenue up by page type, keeping the raw surface split", () => {
  const txns = [
    { commissionAmount: { amount: 1, currency: "GBP" }, saleAmount: { amount: 10 }, clickRefs: { clickRef: "parkmath-exeter-badge" } },
    { commissionAmount: { amount: 2, currency: "GBP" }, saleAmount: { amount: 20 }, clickRefs: { clickRef: "parkmath-exeter-badge-hotels" } },
    { commissionAmount: { amount: 4, currency: "GBP" }, saleAmount: { amount: 40 }, clickRefs: { clickRef: "parkmath-exeter-dropoff" } },
    { commissionAmount: { amount: 8, currency: "GBP" }, saleAmount: { amount: 80 }, clickRefs: { clickRef: "parkmath-exeter-dropoffbridge" } },
    { commissionAmount: { amount: 16, currency: "GBP" }, saleAmount: { amount: 160 }, clickRefs: { clickRef: "parkmath-exeter-options" } },
    { commissionAmount: { amount: 32, currency: "GBP" }, saleAmount: { amount: 320 }, clickRef: "someone-else" },
  ];
  const agg = aggregateTransactions(txns);
  assert.equal(agg.byPageType.badge.commission, 3);
  assert.equal(agg.byPageType.badge.count, 2);
  assert.equal(agg.byPageType.dropoff.commission, 12);
  assert.equal(agg.byPageType.options.commission, 16);
  assert.equal(agg.byPageType["(no surface)"].commission, 32);
  // The raw surface split is unchanged, so historical comparisons still work.
  assert.equal(agg.bySurface["badge-hotels"].commission, 2);
  assert.equal(agg.bySurface.dropoffbridge.commission, 8);
});
