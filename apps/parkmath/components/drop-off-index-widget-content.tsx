"use client";

/**
 * DropOffIndexWidgetContent — the visible UI inside the /widget/drop-off-index page.
 *
 * Rendered server-side first (SSR); optionally enhanced client-side if JS is
 * available (the apiUrl prop enables a background refetch so an embedded copy
 * always gets the latest data without a full page reload).
 *
 * Design:
 *   - Headline stat: large, dark-navy mono number + airport name.
 *   - Static Sparkline SVG (no canvas, crawlable-safe, WCAG-friendly).
 *   - Two secondary stats: cheapest airport + "X of Y airports charge".
 *   - "View full table →" text link to /drop-off-charges.
 *   - No React hydration footprint on the publisher's page (the widget is
 *     inside an iframe; hydration is purely local to our origin).
 *   - prefers-reduced-motion: sparkline has no animation; the JS refetch is
 *     silent (no visual transition).
 */

import { useEffect, useState } from "react";
import { Sparkline } from "@mathfamily/ui";
import type { WidgetDataPayload } from "@/app/api/widget-data/route";

export interface DropOffIndexWidgetContentProps {
  headlineAirport: string;
  headlineFee: string;
  headlineFeePence: number;
  cheapestName: string | null;
  cheapestFee: string | null;
  chargingCount: number;
  totalCount: number;
  sparklineData: number[];
  hubUrl: string;
  /** If provided, the widget silently refetches fresh data from this URL. */
  apiUrl?: string;
}

export function DropOffIndexWidgetContent({
  headlineAirport,
  headlineFee,
  sparklineData,
  cheapestName,
  cheapestFee,
  chargingCount,
  totalCount,
  hubUrl,
  apiUrl
}: DropOffIndexWidgetContentProps) {
  // Local state for JS-enhanced live data (starts from SSR props)
  const [liveAirport, setLiveAirport] = useState(headlineAirport);
  const [liveFee, setLiveFee] = useState(headlineFee);
  const [liveSpark, setLiveSpark] = useState(sparklineData);
  const [liveCheapestName, setLiveCheapestName] = useState(cheapestName);
  const [liveCheapestFee, setLiveCheapestFee] = useState(cheapestFee);
  const [liveCharging, setLiveCharging] = useState(chargingCount);
  const [liveTotal, setLiveTotal] = useState(totalCount);

  // Silent background refetch — no loading state shown to the user
  useEffect(() => {
    if (!apiUrl) return;
    let cancelled = false;
    fetch(apiUrl)
      .then((r) => (r.ok ? (r.json() as Promise<WidgetDataPayload>) : null))
      .then((d) => {
        if (cancelled || !d) return;
        setLiveAirport(d.headlineAirport);
        setLiveFee(d.headlineFee);
        setLiveSpark(d.sparkline);
        setLiveCharging(d.chargingAirports);
        setLiveTotal(d.totalAirports);
        // cheapest not in API payload (keep SSR value)
      })
      .catch(() => {
        /* network failure — keep SSR data */
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}
    >
      {/* ── Headline stat row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted, #475569)",
              lineHeight: 1.3
            }}
          >
            Most expensive drop-off
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              marginTop: "2px",
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                fontFamily:
                  'var(--font-mono, "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace)',
                fontSize: "clamp(1.5rem, 5vw, 2rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-brand, #0a2540)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums"
              }}
              aria-label={`${liveFee} drop-off charge`}
            >
              {liveFee}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-ink-muted, #475569)",
                lineHeight: 1.3,
                maxWidth: "120px"
              }}
            >
              {liveAirport}
            </span>
          </div>
        </div>

        {/* Sparkline — static SVG, aria-hidden, decorative companion to the stat */}
        <div
          aria-hidden
          style={{ flexShrink: 0, alignSelf: "center", paddingBottom: "2px" }}
        >
          <Sparkline
            data={liveSpark}
            width={72}
            height={32}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        aria-hidden
        style={{
          borderTop: "1px solid rgb(15 23 42 / 0.07)"
        }}
      />

      {/* ── Secondary stats row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px"
        }}
      >
        {liveCheapestName && liveCheapestFee && (
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--color-ink-muted, #475569)",
                lineHeight: 1.3
              }}
            >
              Cheapest charge
            </p>
            <p
              style={{
                margin: "1px 0 0",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-positive, #16a34a)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.2
              }}
            >
              {liveCheapestFee}
            </p>
            <p
              style={{
                margin: "1px 0 0",
                fontSize: "10px",
                color: "var(--color-ink-muted, #475569)",
                lineHeight: 1.3
              }}
            >
              {liveCheapestName}
            </p>
          </div>
        )}

        <div>
          <p
            style={{
              margin: 0,
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--color-ink-muted, #475569)",
              lineHeight: 1.3
            }}
          >
            Airports charging
          </p>
          <p
            style={{
              margin: "1px 0 0",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-ink, #0f172a)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2
            }}
          >
            {liveCharging} of {liveTotal}
          </p>
          <p
            style={{
              margin: "1px 0 0",
              fontSize: "10px",
              color: "var(--color-ink-muted, #475569)",
              lineHeight: 1.3
            }}
          >
            UK airports
          </p>
        </div>
      </div>

      {/* ── CTA link ── */}
      <div style={{ marginTop: "2px" }}>
        <a
          href={hubUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-brand-accent, #2563eb)",
            textDecoration: "none",
            letterSpacing: "-0.01em"
          }}
        >
          Compare all airports →
        </a>
      </div>
    </div>
  );
}
