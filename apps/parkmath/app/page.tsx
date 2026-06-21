import type { CSSProperties } from "react";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FreshnessBadge, NavTileGrid, RunwayDivider, Sparkline, TrendChip, UkMap } from "@mathfamily/ui";
import { AirportBentoSearch, type AirportTile } from "@/components/airport-bento-search";
import { HomeAnswerHero } from "@/components/home-answer-hero";
import { NearbyAirports } from "@/components/nearby-airports";
import { AffiliateExtras } from "@/components/affiliate-extras";
import { FamilyLinks } from "@/components/family-links";
import { dearestDropOff } from "@/lib/content";
import { CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon, GlobeIcon } from "@/components/tile-icons";

export default function HomePage() {
  const airports = loadAirports();
  const dataset = loadDropOffDataset();
  const records = dataset.records;
  const charging = records.filter((r) => !r.isFree);
  const freeCount = records.length - charging.length;
  const airportsBySlug = new Map(airports.map((a) => [a.slug, a]));
  const recordBySlug = new Map(records.map((r) => [r.airportSlug, r]));

  // The hero answer: the airport with the highest HEADLINE drop-off charge (bands[0]) — the standard
  // drop-off fee, NOT a long-stay tier or overstay penalty. (See dearestDropOff: it must match the
  // table/trendNote, which also key off bands[0], so e.g. Bristol's £60/120-min tier never headlines.)
  const dearest = dearestDropOff(records);
  const maxBandPence = dearest?.pence ?? 0;
  const dearestName = dearest ? airportsBySlug.get(dearest.airportSlug)?.name ?? dearest.airportSlug : "";
  const dearestMinutes = dearest?.upToMinutes ?? 0;

  // Biggest verified year-on-year rise — honest, only from real priorYearFeePence.
  let biggestRise: { name: string; prior: number; current: number } | null = null;
  for (const r of charging) {
    const current = r.bands[0]?.totalPence;
    if (current === undefined || r.priorYearFeePence === null || r.priorYearFeePence === 0) continue;
    const diff = current - r.priorYearFeePence;
    if (diff > 0 && (biggestRise === null || diff > biggestRise.current - biggestRise.prior)) {
      biggestRise = { name: airportsBySlug.get(r.airportSlug)?.name ?? r.airportSlug, prior: r.priorYearFeePence, current };
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const dashPct = Math.round((charging.length / records.length) * 97);

  const feeBySlug: Record<string, string> = {};
  const airportTiles: AirportTile[] = [];
  for (const a of airports) {
    const r = recordBySlug.get(a.slug);
    const isFree = r?.isFree ?? true;
    const feePence = isFree ? 0 : r?.bands[0]?.totalPence ?? 0;
    feeBySlug[a.slug] = isFree ? "Free" : `${formatPence(feePence)} drop-off`;
    airportTiles.push({ slug: a.slug, name: a.name, iata: a.iata, isFree, feePence, priorPence: r?.priorYearFeePence ?? null });
  }

  const primaryTiles = [
    { href: "/drop-off-charges", title: "Drop-off charges", descriptor: "Compare every UK airport in one table", icon: <CarIcon /> },
    { href: "/airport-parking", title: "Airport parking", descriptor: "Gate price vs pre-book — what you save", icon: <ParkingIcon /> },
    { href: "/airport-lounges", title: "Airport lounges", descriptor: "Pay-per-visit or membership break-even", icon: <LoungeIcon /> },
    { href: "/parking-price-index-2026", title: "Price index & data", descriptor: "Track UK airport price trends + open data", icon: <PriceIndexIcon /> }
  ];
  const secondaryTiles = [
    { href: "/abroad", title: "Going abroad by car", icon: <GlobeIcon /> },
    { href: "/news", title: "Travel news", icon: <NewsIcon /> },
    { href: "/data/drop-off-charges.csv", title: "Open data (CSV)", icon: <DataIcon />, download: true }
  ];

  return (
    <div className="space-y-12">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />

      {/* ── 1. HERO — text-forward, LCP target ── */}
      <section className="relative">
        <UkMap
          markers={airports.map((a) => ({ lat: a.lat, lng: a.lng }))}
          className="pointer-events-none absolute -top-6 right-0 hidden h-[300px] text-brand-strong lg:block"
        />
        <div className="relative space-y-4">
          <span className="inline-flex flex-wrap items-center gap-2.5 text-sm font-semibold text-ink-muted">
            <FreshnessBadge verifiedAt={dataset.lastUpdated} />
            <span>· {records.length} UK airports tracked</span>
          </span>
          <h1 className="max-w-3xl text-h1 font-bold tracking-tight text-balance text-ink">
            What does it cost to <span className="text-brand-accent whitespace-nowrap">drop someone off</span> at a UK airport?
          </h1>
          <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
            Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
            official airport pages and date-stamped.
          </p>
        </div>
      </section>

      {/* ── 2. BENTO — the answer is the biggest thing on screen ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HomeAnswerHero
            label={`Most expensive drop-off · ${dearestName}`}
            pence={maxBandPence}
            note={`Up to ${dearestMinutes} minutes at the barrier — the steepest single drop-off charge we track.`}
            compareHref="/drop-off-charges"
            compareCount={records.length}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {/* Live coverage donut */}
          <div className="mf-card-lg mf-edge flex items-center gap-4 p-5">
            <svg width="56" height="56" viewBox="0 0 36 36" aria-hidden className="shrink-0">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-surface-muted)" strokeWidth="5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-brand-accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dashPct} 97`} transform="rotate(-90 18 18)" />
            </svg>
            <div>
              <div className="mf-num-display text-2xl font-bold text-ink">
                {charging.length}
                <span className="text-base font-semibold text-ink-muted">/{records.length}</span>
              </div>
              <div className="text-sm text-ink-muted">charge a fee · {freeCount} still free</div>
            </div>
          </div>

          {/* Biggest verified rise — only rendered when real prior-year data exists */}
          {biggestRise ? (
            <div className="mf-card-lg mf-edge flex flex-col justify-between gap-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Biggest rise this year</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{biggestRise.name}</span>
                <TrendChip data={[biggestRise.prior, biggestRise.current]} baseLabel="vs 2025" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="mf-num-display text-xl font-bold text-brand-strong">{formatPence(biggestRise.current)}</span>
                <Sparkline data={[biggestRise.prior, biggestRise.current]} />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 3. PRIMARY NAV — route into the answer pages ── */}
      <section className="space-y-4">
        <NavTileGrid tiles={primaryTiles} variant="primary" />
      </section>

      {/* ── 4. TRACKED AIRPORTS — command search + honest sparkline grid ── */}
      <div className="mf-reveal">
        <AirportBentoSearch airports={airportTiles} />
        <div className="mt-5">
          <NearbyAirports airports={airports} feeBySlug={feeBySlug} />
        </div>
      </div>

      {/* ── 5. SECONDARY NAV ── */}
      <section className="mf-reveal space-y-4" style={{ "--mf-delay": "60ms" } as CSSProperties}>
        <h2 className="text-h2 font-semibold text-ink">Explore more</h2>
        <NavTileGrid tiles={secondaryTiles} variant="secondary" />
      </section>

      {/* ── 6. TRUST BAND ── */}
      <section
        className="mf-reveal mf-card-lg mf-edge flex flex-wrap items-center justify-between gap-4 p-6"
        style={{ "--mf-delay": "80ms" } as CSSProperties}
      >
        <div className="flex items-center gap-3.5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <p className="max-w-prose text-sm text-ink-muted">
            <strong className="text-ink">Every figure verified</strong> against each airport&apos;s official page and
            date-stamped. We&apos;re independent — not owned by any airport or booking site.
          </p>
        </div>
        <a href="/methodology" className="text-sm font-semibold text-brand-accent hover:underline">
          Sources &amp; method <span aria-hidden>→</span>
        </a>
      </section>

      {/* ── 7. PARTNER EXTRAS — calm, neutral-voice ── */}
      <AffiliateExtras />

      <RunwayDivider className="h-2 w-full text-brand-strong/15" />

      {/* ── 8. EMAIL CAPTURE + FAMILY LINKS ── */}
      <div className="mf-reveal space-y-8" style={{ "--mf-delay": "100ms" } as CSSProperties}>
        <EmailCaptureSlot
          formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
          hook="Get notified when any UK airport changes its drop-off fees"
        />
        <FamilyLinks />
      </div>
    </div>
  );
}
