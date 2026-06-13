/**
 * Pure logic for the first-party Awin client — no network, no secrets, no deps.
 * Everything here is unit-tested (lib.test.mjs). The CLI (awin.mjs) supplies the
 * Bearer token at fetch time; URLs built here NEVER contain the token.
 *
 * Awin Publisher API: base https://api.awin.com, OAuth2 Bearer, 20 calls/min,
 * transactions capped at a 31-day window. Docs: https://help.awin.com/apidocs/introduction-1
 */

export const AWIN_API_BASE = "https://api.awin.com";
export const AWIN_FEED_BASE = "https://productdata.awin.com";

const RELATIONSHIPS = new Set(["joined", "pending", "suspended", "rejected", "notjoined"]);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---- dates -----------------------------------------------------------------

function parseDay(day) {
  if (typeof day !== "string" || !DAY_RE.test(day)) {
    throw new Error(`Date must be in YYYY-MM-DD format, got: ${JSON.stringify(day)}`);
  }
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`invalid calendar date: ${day}`);
  }
  return dt;
}

/** "2026-06-01" → "2026-06-01T00:00:00Z" (Awin's startDate format). */
export function toAwinStart(day) {
  parseDay(day);
  return `${day}T00:00:00Z`;
}

/** "2026-06-30" → "2026-06-30T23:59:59Z" (inclusive end of day). */
export function toAwinEnd(day) {
  parseDay(day);
  return `${day}T23:59:59Z`;
}

/** Whole days from start to end, counting both endpoints. */
export function daysInclusive(startDay, endDay) {
  const a = parseDay(startDay);
  const b = parseDay(endDay);
  return Math.floor((b - a) / 86_400_000) + 1;
}

/** Throws if end precedes start or the window exceeds Awin's 31-day transaction cap. */
export function validateRange(startDay, endDay) {
  const a = parseDay(startDay);
  const b = parseDay(endDay);
  if (b < a) throw new Error("endDate must not be before startDate");
  if (daysInclusive(startDay, endDay) > 31) {
    throw new Error("date range must not exceed 31 days (Awin transactions limit)");
  }
}

/** Split [startDay, endDay] into ≤31-day [start, end] chunks for the transactions API. */
export function chunkRange(startDay, endDay, maxDays = 31) {
  parseDay(startDay);
  parseDay(endDay);
  if (parseDay(endDay) < parseDay(startDay)) throw new Error("endDate must not be before startDate");
  const chunks = [];
  let cursor = parseDay(startDay);
  const end = parseDay(endDay);
  while (cursor <= end) {
    const chunkEnd = new Date(Math.min(cursor.getTime() + (maxDays - 1) * 86_400_000, end.getTime()));
    chunks.push({ start: cursor.toISOString().slice(0, 10), end: chunkEnd.toISOString().slice(0, 10) });
    cursor = new Date(chunkEnd.getTime() + 86_400_000);
  }
  return chunks;
}

// ---- URL builders (token-free) ---------------------------------------------

export function buildAccountsUrl({ type } = {}) {
  const u = new URL(`${AWIN_API_BASE}/accounts`);
  if (type) u.searchParams.set("type", type);
  return u.toString();
}

export function buildProgrammesUrl(publisherId, { relationship, countryCode } = {}) {
  if (relationship && !RELATIONSHIPS.has(relationship)) {
    throw new Error(`Unknown relationship "${relationship}" (expected: ${[...RELATIONSHIPS].join(", ")})`);
  }
  const u = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmes`);
  if (relationship) u.searchParams.set("relationship", relationship);
  if (countryCode) u.searchParams.set("countryCode", countryCode);
  return u.toString();
}

export function buildTransactionsUrl(publisherId, opts = {}) {
  const u = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/transactions/`);
  for (const key of ["startDate", "endDate", "timezone", "dateType", "advertiserId", "status"]) {
    if (opts[key]) u.searchParams.set(key, opts[key]);
  }
  return u.toString();
}

export function buildFeedListUrl(feedApiKey) {
  return `${AWIN_FEED_BASE}/datafeed/list/apikey/${feedApiKey}/`;
}

// ---- clickRef → airport / surface ------------------------------------------

const KNOWN_SURFACES = new Set([
  "parking", "lounge", "dropoff", "drop-off", "hotel", "hotels", "transfer", "transfers", "extras",
]);

function parseClickRef(clickRef) {
  if (typeof clickRef !== "string" || !clickRef.startsWith("parkmath-")) return { airport: null, surface: null };
  const rest = clickRef.slice("parkmath-".length);
  if (!rest) return { airport: null, surface: null };
  const segs = rest.split("-");
  if (segs.length >= 2 && KNOWN_SURFACES.has(segs[segs.length - 1])) {
    return { airport: segs.slice(0, -1).join("-") || null, surface: segs[segs.length - 1] };
  }
  return { airport: rest, surface: null };
}

export function airportFromClickRef(clickRef) {
  return parseClickRef(clickRef).airport;
}

export function surfaceFromClickRef(clickRef) {
  return parseClickRef(clickRef).surface;
}

// ---- transaction aggregation -----------------------------------------------

function amountOf(x) {
  if (typeof x === "number") return x;
  if (x && typeof x.amount === "number") return x.amount;
  return 0;
}
function currencyOf(x) {
  return x && typeof x === "object" && x.currency ? x.currency : null;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function bump(map, key, commission, sale) {
  if (!map[key]) map[key] = { commission: 0, sale: 0, count: 0 };
  map[key].commission += commission;
  map[key].sale += sale;
  map[key].count += 1;
}
function finalize(map) {
  for (const k of Object.keys(map)) {
    map[k].commission = round2(map[k].commission);
    map[k].sale = round2(map[k].sale);
  }
}

/** Roll transactions up by advertiser, airport (from clickRef) and raw clickRef. */
export function aggregateTransactions(transactions) {
  const byAdvertiser = {};
  const byAirport = {};
  const byClickRef = {};
  let count = 0;
  let commission = 0;
  let sale = 0;
  let currency = null;

  for (const t of transactions) {
    const comm = amountOf(t.commissionAmount);
    const saleAmt = amountOf(t.saleAmount);
    const cur = currencyOf(t.commissionAmount) || currencyOf(t.saleAmount);
    if (cur && !currency) currency = cur;
    count += 1;
    commission += comm;
    sale += saleAmt;
    bump(byAdvertiser, t.advertiserName || String(t.advertiserId ?? "unknown"), comm, saleAmt);
    bump(byAirport, airportFromClickRef(t.clickRef) || "unattributed", comm, saleAmt);
    bump(byClickRef, t.clickRef || "(none)", comm, saleAmt);
  }

  finalize(byAdvertiser);
  finalize(byAirport);
  finalize(byClickRef);
  return {
    totals: { count, commission: round2(commission), sale: round2(sale), currency: currency || "GBP" },
    byAdvertiser,
    byAirport,
    byClickRef,
  };
}

// ---- programme relationship diffing ----------------------------------------

/**
 * Compare two {id: {name, relationship}} snapshots. Returns the advertisers whose
 * relationship changed (e.g. pending → joined), with from="none" for new arrivals.
 */
export function diffProgrammes(prev, curr) {
  const changes = [];
  for (const id of Object.keys(curr)) {
    const to = curr[id].relationship;
    const from = prev[id] ? prev[id].relationship : "none";
    if (from !== to) changes.push({ id, name: curr[id].name, from, to });
  }
  return changes;
}

// ---- feed list CSV ---------------------------------------------------------

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { inQuotes = false; }
      } else { cur += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Parse Awin's Create-a-Feed list CSV (quoted, comma-delimited) into row objects. */
export function parseFeedListCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}
