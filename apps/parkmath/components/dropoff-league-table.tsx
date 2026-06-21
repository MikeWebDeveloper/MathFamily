import { formatPence } from "@mathfamily/engine";
import { FeeGrid } from "@mathfamily/ui";
import type { LeagueEntry } from "@/lib/content";

/**
 * The £-per-minute league table — the data-PR hook ("you're charged by the minute; Britain's
 * worst-value airport to drop off is X"). Server component: a static, ranked, source-of-truth
 * ordering (most expensive per minute → least). Per-entry and free airports are shown at the
 * bottom with an honest "flat fee" / "free" marker instead of a fabricated per-minute figure.
 */
export function DropOffLeagueTable({ league }: { league: LeagueEntry[] }) {
  const rows = league.map((e, i) => [
    <span key="rank" className="tabular-nums">{i + 1}</span>,
    <a
      key="name"
      href={`/drop-off-charges/${e.airportSlug}`}
      className="font-medium text-brand-accent underline-offset-4 hover:underline"
    >
      {e.name}
    </a>,
    e.perMinutePence !== null ? `${formatPence(Math.round(e.perMinutePence))}/min` : e.isFree ? "Free" : "Flat fee",
    e.isFree ? "Free" : formatPence(e.feePence),
    e.isFree ? "—" : e.isPerEntry ? "Per entry" : `${e.minutes} min`
  ]);

  return (
    <FeeGrid
      caption="Ranked by effective cost per minute of the headline allowance (worst value first). Per-entry charges (a flat fee however briefly you stop) and free airports rank last — they have no honest per-minute figure."
      columns={["#", "Airport", "£ per minute", "Headline fee", "Time you get"]}
      numericColumns={[2, 3, 4]}
      rows={rows}
    />
  );
}
