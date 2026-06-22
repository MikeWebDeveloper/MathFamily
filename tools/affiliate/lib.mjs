// Pure, dependency-free aggregation for ParkMath affiliate-click measurement.
//
// The /go redirect route emits one structured line per affiliate-CTA click:
//   {"event":"parkmath_affiliate_click","airport":"southend","target":"parking","surface":"hub","ts":"2026-06-22T08:01:00.000Z"}
// These functions turn a stream of such lines (from Vercel runtime logs / a log drain / a saved
// file) into a countable daily clicks-by-airport-by-surface snapshot. No network, no deps — unit-tested.

export const CLICK_MARKER = "parkmath_affiliate_click";

/** Extract every affiliate-click event embedded in a blob of log text. Each Vercel log line may wrap
 *  the JSON in a timestamp/prefix, so we scan for the marker and parse the JSON object around it.
 *  Malformed or non-matching lines are skipped (never throw) so one bad line can't lose a day's data. */
export function parseClickEvents(text) {
  const events = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    if (!rawLine.includes(CLICK_MARKER)) continue;
    const start = rawLine.indexOf("{");
    const end = rawLine.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) continue;
    let obj;
    try {
      obj = JSON.parse(rawLine.slice(start, end + 1));
    } catch {
      continue;
    }
    if (obj?.event !== CLICK_MARKER || typeof obj.airport !== "string") continue;
    events.push({
      airport: obj.airport,
      target: typeof obj.target === "string" ? obj.target : "unknown",
      surface: obj.surface == null ? "none" : String(obj.surface),
      ts: typeof obj.ts === "string" ? obj.ts : null,
    });
  }
  return events;
}

/** The UTC date (YYYY-MM-DD) of an event, or "undated" when the timestamp is missing/invalid. */
export function eventDate(ev) {
  if (!ev.ts) return "undated";
  const d = new Date(ev.ts);
  return Number.isNaN(d.getTime()) ? "undated" : d.toISOString().slice(0, 10);
}

/** Aggregate events into countable totals: overall, by airport, by surface, by airport×surface, and
 *  per UTC day. Deterministic key order (sorted) so snapshots diff cleanly day to day. */
export function aggregateClicks(events) {
  const byAirport = {};
  const bySurface = {};
  const byAirportSurface = {};
  const byDate = {};
  for (const ev of events) {
    byAirport[ev.airport] = (byAirport[ev.airport] ?? 0) + 1;
    bySurface[ev.surface] = (bySurface[ev.surface] ?? 0) + 1;
    const as = `${ev.airport} · ${ev.surface}`;
    byAirportSurface[as] = (byAirportSurface[as] ?? 0) + 1;
    byDate[eventDate(ev)] = (byDate[eventDate(ev)] ?? 0) + 1;
  }
  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  return {
    total: events.length,
    byAirport: sortObj(byAirport),
    bySurface: sortObj(bySurface),
    byAirportSurface: sortObj(byAirportSurface),
    byDate: Object.fromEntries(Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]))),
  };
}

/** Build the Vercel runtime-logs API URL for a project (read-only). teamId is appended when set. */
export function buildVercelLogsUrl({ projectId, teamId } = {}) {
  if (!projectId) throw new Error("projectId is required to pull Vercel runtime logs");
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  const qs = params.toString();
  return `https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/logs${qs ? `?${qs}` : ""}`;
}
