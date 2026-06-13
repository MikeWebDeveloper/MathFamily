"use client";

import { useState } from "react";
import { formatPence } from "@mathfamily/engine";
import { AnswerLead, CaveatChip, SavesVerdict, SegmentedControl } from "@mathfamily/ui";
import { BookingOptions } from "./booking-options";
import type { ParkingPageModel } from "../lib/parking-content";

export interface ParkingAnswerEntry {
  days: number;
  model: ParkingPageModel;
}

const DURATION_OPTIONS = [
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
] as const;

type DurationStr = "3" | "7" | "14";

export function ParkingAnswer({
  entries,
  defaultDays = 7,
  slug,
  airportName,
  officialUrl,
}: {
  entries: ParkingAnswerEntry[];
  defaultDays?: number;
  slug: string;
  airportName: string;
  officialUrl: string;
}) {
  const [selectedDays, setSelectedDays] = useState<DurationStr>(String(defaultDays) as DurationStr);

  const currentEntry = entries.find((e) => String(e.days) === selectedDays) ?? entries[0];
  const m = currentEntry!.model;

  return (
    <section aria-label={`${airportName} parking answer`} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-muted">Duration:</span>
        <SegmentedControl<DurationStr>
          options={DURATION_OPTIONS.filter((o) => entries.some((e) => String(e.days) === o.value))}
          value={selectedDays}
          onChange={(v) => setSelectedDays(v)}
          ariaLabel="Select parking duration"
        />
      </div>

      <div aria-live="polite" data-testid="parking-result" className="space-y-4">
        <AnswerLead answer={m.answer} />

        <SavesVerdict
          amount={m.savingsVsGatePence ? formatPence(m.savingsVsGatePence) : undefined}
          verdict={
            m.savingsVsGatePence && m.cheapest
              ? `Pre-booking saves ${formatPence(m.savingsVsGatePence)} vs the drive-up gate price for ${currentEntry!.days} days (${m.cheapest.name}).`
              : `Compare options above to find the best price for your dates.`
          }
        />

        {m.options.length > 0 ? (
          <div className="space-y-2">
            {m.options.map((o, i) => (
              <div
                key={o.name}
                className={
                  i === 0
                    ? "flex items-start justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                    : "flex items-start justify-between rounded-xl border border-ink/10 px-4 py-3"
                }
              >
                <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink">
                  {i === 0 ? (
                    <span className="mt-0.5 shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Cheapest
                    </span>
                  ) : null}
                  <span className="min-w-0">{o.name}</span>
                </span>
                <span className="mf-num shrink-0 text-lg font-bold text-brand">{formatPence(o.totalPence)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink-muted">No published price for {currentEntry!.days} days — check the official site.</p>
        )}

        {m.warnings.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {m.warnings.map((w) => (
              <li key={w.code}>
                <CaveatChip>{w.message}</CaveatChip>
              </li>
            ))}
          </ul>
        ) : null}

        <BookingOptions
          airportName={airportName}
          airportSlug={slug}
          officialUrl={officialUrl}
          price={m.cheapest?.totalPence}
          days={currentEntry!.days}
        />
      </div>
    </section>
  );
}
