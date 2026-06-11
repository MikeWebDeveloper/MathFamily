import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeStat, RunwayDivider, UkMap } from "@mathfamily/ui";
import { AirportSearch } from "@/components/airport-search";
import { FamilyLinks } from "@/components/family-links";

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

  return (
    <div className="space-y-14">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />
      <section className="relative">
        <UkMap
          markers={airports.map((a) => ({ lat: a.lat, lng: a.lng }))}
          className="pointer-events-none absolute -top-6 right-0 hidden h-[340px] text-brand sm:block"
        />
        <div className="relative space-y-5">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            What does it cost to <span className="text-brand-accent">drop someone off</span> at a UK airport?
          </h1>
          <p className="max-w-2xl text-lg text-ink-muted">
            Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
            official airport pages and date-stamped.
          </p>
          <AirportSearch airports={airports} feeBySlug={feeBySlug} />
        </div>
      </section>

      <section className="mf-reveal grid gap-4 sm:grid-cols-3">
        <FeeStat label="Most expensive drop-off" value={formatPence(maxBandPence)} note={maxBandNote} />
        <FeeStat label="Airports charging a fee" value={String(charging.length)} note={`of ${records.length} tracked`} />
        <FeeStat label="Still free" value={String(freeCount)} note="Free at the forecourt" />
      </section>

      <p>
        <Link href="/drop-off-charges" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare all airports in one table →
        </Link>
      </p>

      <p className="flex flex-wrap gap-6">
        <Link href="/airport-parking" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare airport parking →
        </Link>
        <Link href="/airport-lounges" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Lounge or membership? →
        </Link>
      </p>

      <RunwayDivider className="h-2 w-full text-brand/15" />

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when any UK airport changes its drop-off fees"
      />

      <FamilyLinks />
    </div>
  );
}
