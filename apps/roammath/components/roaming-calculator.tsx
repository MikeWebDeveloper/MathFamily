"use client";

import { useState } from "react";
import { formatPence, roamingTripCost, type EsimBundleOption, type NetworkRoamingOption } from "@mathfamily/engine";
import { NETWORK_LABELS } from "@/lib/roaming-content";

export function RoamingCalculator({
  networks,
  esims,
  countryName
}: {
  networks: NetworkRoamingOption[];
  esims: EsimBundleOption[];
  countryName: string;
}) {
  const [days, setDays] = useState(7);
  const [dataGb, setDataGb] = useState(5);
  const r = roamingTripCost(networks, esims, days, dataGb);

  return (
    <section
      aria-label={`${countryName} trip cost calculator`}
      className="rounded-card border border-ink/10 bg-white p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">Your trip</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm text-ink-muted">
          Days: <strong className="mf-num text-ink">{days}</strong>
          <input type="range" min={1} max={30} value={days} aria-valuetext={`${days} days`} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 h-2 w-full cursor-pointer accent-brand-accent" />
        </label>
        <label className="block text-sm text-ink-muted">
          Data needed: <strong className="mf-num text-ink">{dataGb}GB</strong>
          <input type="range" min={1} max={30} value={dataGb} aria-valuetext={`${dataGb} gigabytes`} onChange={(e) => setDataGb(Number(e.target.value))} className="mt-1 h-2 w-full cursor-pointer accent-brand-accent" />
        </label>
      </div>
      <div aria-live="polite" data-testid="roaming-result" className="mt-5 space-y-2 rounded-xl bg-surface p-4 text-sm">
        {r.networkCosts.map((n) => (
          <p key={n.network} className="flex justify-between text-ink-muted">
            <span>{NETWORK_LABELS[n.network] ?? n.network}</span>
            <span className="mf-num font-medium text-ink">
              {n.totalPence === null ? "no standard pass" : n.included ? "included" : formatPence(n.totalPence)}
            </span>
          </p>
        ))}
        {r.esimChoice ? (
          <p className="flex justify-between text-ink-muted">
            <span>Best eSIM ({r.esimChoice.provider}, {r.esimChoice.bundleName})</span>
            <span className="mf-num font-medium text-ink">{formatPence(r.esimChoice.totalPence)}</span>
          </p>
        ) : null}
        <p className="mt-2 border-t border-ink/10 pt-3 text-base font-bold text-brand">
          {r.verdict === "esim"
            ? `eSIM wins — saves ${formatPence(r.savingsPence)} vs the cheapest network charge.`
            : r.verdict === "network"
              ? r.cheapestNetwork?.included
                ? `${NETWORK_LABELS[r.cheapestNetwork.network] ?? ""} customers pay nothing extra here.`
                : `Your network's daily charge is the cheapest tracked option.`
              : "Not enough published data — check the official pages."}
        </p>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
        {r.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
