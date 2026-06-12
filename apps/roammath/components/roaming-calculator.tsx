"use client";

import { useState } from "react";
import { formatPence, roamingTripCost, type EsimBundleOption, type NetworkRoamingOption } from "@mathfamily/engine";
import { AnimatedNumber, CaveatChip, RangeSlider } from "@mathfamily/ui";
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
      className="mf-edge rounded-card bg-white p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">Your trip</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm text-ink-muted">
          Days: <strong className="mf-num text-ink">{days}</strong>
          <RangeSlider min={1} max={30} value={days} onChange={setDays} ariaLabel="Trip duration in days" ariaValuetext={`${days} days`} className="mt-1" />
        </label>
        <label className="block text-sm text-ink-muted">
          Data needed: <strong className="mf-num text-ink">{dataGb}GB</strong>
          <RangeSlider min={1} max={30} value={dataGb} onChange={setDataGb} ariaLabel="Data needed in gigabytes" ariaValuetext={`${dataGb} gigabytes`} className="mt-1" />
        </label>
      </div>
      <div aria-live="polite" data-testid="roaming-result" className="mt-5 space-y-2 rounded-xl bg-surface p-4 text-sm">
        {r.networkCosts.map((n) => (
          <p key={n.network} className="flex justify-between text-ink-muted">
            <span>{NETWORK_LABELS[n.network] ?? n.network}</span>
            <span className="font-medium text-ink">
              {n.totalPence === null ? <span className="mf-num">no standard pass</span> : n.included ? <span className="mf-num">included</span> : (
                <AnimatedNumber pence={n.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} />
              )}
            </span>
          </p>
        ))}
        {r.esimChoice ? (
          <p className="flex justify-between text-ink-muted">
            <span>Best eSIM ({r.esimChoice.provider}, {r.esimChoice.bundleName})</span>
            <span className="font-medium text-ink"><AnimatedNumber pence={r.esimChoice.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} /></span>
          </p>
        ) : null}
        <p className="mt-2 rounded-lg border-t border-ink/10 bg-brand-accent/[0.07] p-3 text-sm font-semibold text-brand">
          {r.verdict === "esim"
            ? `eSIM wins — saves ${formatPence(r.savingsPence)} vs the cheapest network charge.`
            : r.verdict === "network"
              ? r.cheapestNetwork?.included
                ? `${NETWORK_LABELS[r.cheapestNetwork.network] ?? ""} customers pay nothing extra here.`
                : `Your network's daily charge is the cheapest tracked option.`
              : "Not enough published data — check the official pages."}
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {r.warnings.map((w) => (
          <li key={w.code}><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
    </section>
  );
}
