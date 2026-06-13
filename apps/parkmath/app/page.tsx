import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, RunwayDivider, StatStrip, UkMap, NavTileGrid } from "@mathfamily/ui";
import { AirportSearch } from "@/components/airport-search";
import { NearbyAirports } from "@/components/nearby-airports";
import { DealsStrip } from "@/components/deals-strip";
import { FamilyLinks } from "@/components/family-links";
import { CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon } from "@/components/tile-icons";

export default function HomePage() {
  const airports = loadAirports();
  const records = loadDropOffDataset().records;
  const charging = records.filter((r) => !r.isFree);
  const freeCount = records.length - charging.length;
  const airportsBySlug = new Map(airports.map((a) => [a.slug, a]));
  let maxBandPence = 0;
  let maxBandNote = "";
  for (const r of charging) {
    for (const b of r.bands) {
      if (b.totalPence > maxBandPence) {
        maxBandPence = b.totalPence;
        const name = airportsBySlug.get(r.airportSlug)?.name ?? r.airportSlug;
        maxBandNote = `${name}, up to ${b.upToMinutes} min`;
      }
    }
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const feeBySlug: Record<string, string> = {};
  for (const r of records) {
    feeBySlug[r.airportSlug] = r.isFree ? "Free" : `${formatPence(r.bands[0]?.totalPence ?? 0)} drop-off`;
  }

  const primaryTiles = [
    { href: "/drop-off-charges", title: "Drop-off charges", descriptor: "Compare every UK airport in one table", icon: <CarIcon /> },
    { href: "/airport-parking", title: "Airport parking", descriptor: "Gate price vs pre-book — what you save", icon: <ParkingIcon /> },
    { href: "/airport-lounges", title: "Airport lounges", descriptor: "Pay-per-visit or membership break-even", icon: <LoungeIcon /> },
  ];
  const secondaryTiles = [
    { href: "/parking-price-index-2026", title: "Price index 2026", icon: <PriceIndexIcon /> },
    { href: "/news", title: "Travel news", icon: <NewsIcon /> },
    { href: "/data/drop-off-charges.csv", title: "Open data (CSV)", icon: <DataIcon />, download: true },
  ];

  return (
    <div className="space-y-12">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />
      <section className="relative">
        <UkMap
          markers={airports.map((a) => ({ lat: a.lat, lng: a.lng }))}
          className="pointer-events-none absolute -top-6 right-0 hidden h-[340px] text-brand lg:block"
        />
        <div className="relative space-y-5">
          <h1 className="max-w-3xl text-h1 font-bold tracking-tight text-balance text-ink">
            What does it cost to <span className="text-brand-accent whitespace-nowrap">drop someone off</span> at a UK airport?
          </h1>
          <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
            Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
            official airport pages and date-stamped.
          </p>
          <AirportSearch airports={airports} feeBySlug={feeBySlug} />
          <NearbyAirports airports={airports} feeBySlug={feeBySlug} />
        </div>
      </section>

      <section className="mf-reveal">
        <StatStrip stats={[
          { label: "Most expensive drop-off", value: formatPence(maxBandPence), note: maxBandNote },
          { label: "Airports charging a fee", value: String(charging.length), note: `of ${records.length} tracked` },
          { label: "Still free", value: String(freeCount), note: "Free at the forecourt" },
        ]} />
      </section>

      <section className="space-y-4">
        <h2 className="mf-reveal text-h2 font-semibold text-ink">Where do you want to start?</h2>
        <NavTileGrid tiles={primaryTiles} variant="primary" />
        <NavTileGrid tiles={secondaryTiles} variant="secondary" />
      </section>

      <DealsStrip />

      <RunwayDivider className="h-2 w-full text-brand/15" />

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when any UK airport changes its drop-off fees"
      />

      <FamilyLinks />
    </div>
  );
}
