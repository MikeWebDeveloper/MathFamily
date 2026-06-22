import { describe, expect, it } from "vitest";
import { parseClickEvents, aggregateClicks, eventDate, buildVercelLogsUrl } from "./lib.mjs";

const LOGS = [
  `2026-06-22T08:01:00.000Z app[GET] {"event":"parkmath_affiliate_click","airport":"southend","target":"parking","surface":"hub","ts":"2026-06-22T08:01:00.000Z"}`,
  `2026-06-22T09:00:00.000Z app[GET] {"event":"parkmath_affiliate_click","airport":"southend","target":"parking","surface":"dropoff","ts":"2026-06-22T09:00:00.000Z"}`,
  `2026-06-22T10:00:00.000Z app[GET] {"event":"parkmath_affiliate_click","airport":"gatwick","target":"parking","surface":"hub","ts":"2026-06-23T10:00:00.000Z"}`,
  `some unrelated log line that should be ignored`,
  `{"event":"parkmath_affiliate_click","airport":"luton","surface":null,"ts":"bad-date"}`,
  `broken {"event":"parkmath_affiliate_click", not json`,
].join("\n");

describe("parseClickEvents", () => {
  it("extracts only well-formed affiliate-click events, skipping noise and malformed lines", () => {
    const evs = parseClickEvents(LOGS);
    expect(evs).toHaveLength(4); // 3 clean + the null-surface one; broken JSON + unrelated skipped
    expect(evs[0]).toMatchObject({ airport: "southend", target: "parking", surface: "hub" });
    expect(evs[3]).toMatchObject({ airport: "luton", surface: "none" });
  });
});

describe("eventDate", () => {
  it("returns UTC day, or 'undated' for missing/invalid ts", () => {
    expect(eventDate({ ts: "2026-06-22T23:00:00.000Z" })).toBe("2026-06-22");
    expect(eventDate({ ts: "bad-date" })).toBe("undated");
    expect(eventDate({ ts: null })).toBe("undated");
  });
});

describe("aggregateClicks", () => {
  it("counts overall, by airport, by surface, by airport×surface and by day", () => {
    const agg = aggregateClicks(parseClickEvents(LOGS));
    expect(agg.total).toBe(4);
    expect(agg.byAirport).toMatchObject({ southend: 2, gatwick: 1, luton: 1 });
    expect(agg.bySurface).toMatchObject({ hub: 2, dropoff: 1, none: 1 });
    expect(agg.byAirportSurface["southend · hub"]).toBe(1);
    expect(agg.byDate["2026-06-22"]).toBe(2);
    expect(agg.byDate["2026-06-23"]).toBe(1);
    expect(agg.byDate["undated"]).toBe(1);
  });
});

describe("buildVercelLogsUrl", () => {
  it("builds a read-only project logs URL with teamId", () => {
    expect(buildVercelLogsUrl({ projectId: "prj_x", teamId: "team_y" })).toBe(
      "https://api.vercel.com/v1/projects/prj_x/logs?teamId=team_y"
    );
  });
  it("throws without a projectId", () => {
    expect(() => buildVercelLogsUrl({})).toThrow(/projectId/);
  });
});
