"use client";

import { useState } from "react";
import Link from "next/link";
import { FeeGrid, IataTile, SegmentedControl } from "@mathfamily/ui";

type SortKey = "fee" | "cheap" | "az";

export interface DropOffRow {
  airportSlug: string;
  airportName: string;
  iata: string;
  /** fee pence for sort; null = free (sort as 0) */
  feePence: number;
  /** Display cells (already formatted strings/strings) — indices match columns[1..5] */
  fee: string;
  timeLimit: string;
  penalty: string;
  freeAlt: string;
  verifiedAt: string;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "fee", label: "Most expensive" },
  { value: "cheap", label: "Cheapest" },
  { value: "az", label: "A–Z" }
];

function sortRows(rows: DropOffRow[], key: SortKey): DropOffRow[] {
  const copy = [...rows];
  if (key === "fee") {
    copy.sort((a, b) => b.feePence - a.feePence);
  } else if (key === "cheap") {
    copy.sort((a, b) => a.feePence - b.feePence);
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
    r.timeLimit,
    r.penalty,
    r.freeAlt,
    r.verifiedAt
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
        caption="Data verified per airport — click through for details, sources and the free alternative."
        columns={["Airport", "Fee", "Time limit", "Penalty", "Free alternative", "Verified"]}
        numericColumns={[1, 2, 3]}
        rows={feeGridRows}
      />
    </div>
  );
}
