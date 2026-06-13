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
