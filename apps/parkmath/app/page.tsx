import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeStat } from "@mathfamily/ui";
import { AirportSearch } from "@/components/airport-search";

export default function HomePage() {
  const airports = loadAirports();
  const records = loadDropOffDataset().records;
  const charging = records.filter((r) => !r.isFree);
  const maxFee = Math.max(...charging.map((r) => r.bands[0]?.totalPence ?? 0));
  const freeCount = records.length - charging.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-ink">
          What does it cost to <span className="text-brand-accent">drop someone off</span> at a UK airport?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
          official airport pages and date-stamped.
        </p>
        <AirportSearch airports={airports} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeeStat label="Most expensive drop-off" value={formatPence(maxFee)} note="Highest current UK forecourt fee" />
        <FeeStat label="Airports charging a fee" value={String(charging.length)} note={`of ${records.length} tracked`} />
        <FeeStat label="Still free" value={String(freeCount)} note="Free at the forecourt" />
      </section>

      <p>
        <Link href="/drop-off-charges" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare all airports in one table →
        </Link>
      </p>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when any UK airport changes its drop-off fees"
      />
    </div>
  );
}
