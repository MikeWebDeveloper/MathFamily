"use client";

import { useState } from "react";
import Link from "next/link";
import { FeeGrid, IataTile, SegmentedControl, VerifiedStamp } from "@mathfamily/ui";

type SortKey = "fee" | "cheap" | "permin" | "az";

export interface DropOffRow {
  airportSlug: string;
  airportName: string;
  iata: string;
  /** fee pence for sort; null = free (sort as 0) */
  feePence: number;
  /** effective £/min in pence for sort; null = no per-minute figure (free / per-entry → sort last) */
  perMinutePence: number | null;
  /** Display cells (already formatted strings) — indices match columns[1..n] */
  fee: string;
  perMin: string;
  timeLimit: string;
  penalty: string;
  freeAlt: string;
  /** Official airport source URL — the per-row "verified [date]" link (the freshness moat). */
  sourceUrl: string;
  verifiedAt: string;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "fee", label: "Most expensive" },
  { value: "cheap", label: "Cheapest" },
  { value: "permin", label: "£/min" },
  { value: "az", label: "A–Z" }
];

function sortRows(rows: DropOffRow[], key: SortKey): DropOffRow[] {
  const copy = [...rows];
  if (key === "fee") {
    copy.sort((a, b) => b.feePence - a.feePence);
  } else if (key === "cheap") {
    copy.sort((a, b) => a.feePence - b.feePence);
  } else if (key === "permin") {
    // Worst £/min first; entries without a per-minute figure (free / per-entry) sort last.
    copy.sort((a, b) => {
      if (a.perMinutePence !== null && b.perMinutePence !== null) return b.perMinutePence - a.perMinutePence;
      if (a.perMinutePence !== null) return -1;
      if (b.perMinutePence !== null) return 1;
      return b.feePence - a.feePence;
    });
  } else {
    copy.sort((a, b) => a.airportName.localeCompare(b.airportName));
  }
  return copy;
}

export function SortableFeeTable({ rows: initialRows }: { rows: DropOffRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("fee");
  const rows = sortRows(initialRows, sortKey);

  const feeGridRows = rows.map((r) => [
    <Link
      key="a"
      href={`/drop-off-charges/${r.airportSlug}`}
      className="inline-flex items-center gap-2 font-medium text-brand-accent underline-offset-4 hover:underline"
    >
      {r.airportName}
      <IataTile code={r.iata} />
    </Link>,
    r.fee,
    r.perMin,
    r.timeLimit,
    r.penalty,
    r.freeAlt,
    <VerifiedStamp
      key="v"
      verifiedAt={r.verifiedAt}
      sourceUrl={r.sourceUrl}
      sourceLabel={`Official ${r.airportName} page`}
    />
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-ink-muted">Sort:</span>
        <SegmentedControl
          ariaLabel="Sort airports"
          value={sortKey}
          onChange={setSortKey}
          options={SORT_OPTIONS}
        />
      </div>
      <FeeGrid
        caption="Every figure is read from each airport's own official page — tap the ✓ date in any row to open the source. Click an airport for the full breakdown and the free alternative."
        columns={["Airport", "Fee", "£/min", "Time limit", "Penalty", "Free alternative", "Verified"]}
        numericColumns={[1, 2, 3, 4]}
        rows={feeGridRows}
      />
    </div>
  );
}
