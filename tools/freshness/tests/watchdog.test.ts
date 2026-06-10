import { describe, expect, it } from "vitest";
import { runWatchdog, type Fetcher, type HashState } from "../src/watchdog";
import { contentFingerprint } from "../src/normalize";
import type { Watchlist } from "../src/watchlist";

const list: Watchlist = {
  generatedAt: "2026-06-10",
  entries: [
    { url: "https://a.example/fees", refs: ["drop-off:alpha"], watchable: true },
    { url: "https://b.example/fees", refs: ["parking:beta"], watchable: true },
    { url: "https://blocked.example/x", refs: ["esim:gamma"], watchable: false }
  ]
};

const body = (s: string) => Buffer.from(s, "utf8");

function fetcherOf(map: Record<string, Buffer | Error>): Fetcher {
  return async (url) => {
    const v = map[url];
    if (!v) throw new Error(`unexpected fetch ${url}`);
    if (v instanceof Error) throw v;
    return v;
  };
}

describe("runWatchdog", () => {
  it("bootstrap: unknown URLs get seeded without triggering", async () => {
    const state: HashState = {};
    const result = await runWatchdog(list, state, fetcherOf({
      "https://a.example/fees": body("Fee £10"),
      "https://b.example/fees": body("Fee £5")
    }), new Date("2026-06-11T06:30:00Z"));
    expect(result.changed).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(state["https://a.example/fees"]?.hash).toBe(contentFingerprint(body("Fee £10")));
    expect(state["https://blocked.example/x"]).toBeUndefined(); // unwatchable skipped
  });

  it("change detection: differing content triggers once and sets pendingSince", async () => {
    const state: HashState = {
      "https://a.example/fees": { hash: contentFingerprint(body("Fee £10")), checkedAt: "2026-06-10" },
      "https://b.example/fees": { hash: contentFingerprint(body("Fee £5")), checkedAt: "2026-06-10" }
    };
    const fetcher = fetcherOf({
      "https://a.example/fees": body("Fee £12"),
      "https://b.example/fees": body("Fee £5")
    });
    const first = await runWatchdog(list, state, fetcher, new Date("2026-06-11T06:30:00Z"));
    expect(first.changed.map((c) => c.url)).toEqual(["https://a.example/fees"]);
    expect(first.changed[0]!.refs).toEqual(["drop-off:alpha"]);
    expect(state["https://a.example/fees"]?.pendingSince).toBe("2026-06-11");
    expect(state["https://a.example/fees"]?.hash).toBe(contentFingerprint(body("Fee £10"))); // NOT overwritten

    const second = await runWatchdog(list, state, fetcher, new Date("2026-06-12T06:30:00Z"));
    expect(second.changed).toEqual([]); // single-trigger while pending
  });

  it("fetch failure reports an error and leaves state untouched", async () => {
    const state: HashState = {
      "https://a.example/fees": { hash: "deadbeef", checkedAt: "2026-06-10" }
    };
    const result = await runWatchdog(
      { ...list, entries: [list.entries[0]!] },
      state,
      fetcherOf({ "https://a.example/fees": new Error("403") }),
      new Date("2026-06-11T06:30:00Z")
    );
    expect(result.errors.map((e) => e.url)).toEqual(["https://a.example/fees"]);
    expect(state["https://a.example/fees"]?.hash).toBe("deadbeef");
  });
});
