import Link from "next/link";
import { loadRoamingDataset, loadEsimDataset } from "@mathfamily/data";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeStat } from "@mathfamily/ui";
import { FamilyLinks } from "@/components/family-links";

export default function HomePage() {
  const roamingDataset = loadRoamingDataset();
  const esimDataset = loadEsimDataset();

  const destinations = roamingDataset.destinations;
  const destinationCount = destinations.length;

  const spainDest = destinations.find((d) => d.countrySlug === "spain");
  const spainEsim = esimDataset.records.find((r) => r.countrySlug === "spain") ?? null;
  const spainResult = spainDest
    ? roamingTripCost(spainDest.perNetwork, spainEsim?.bundles ?? [], 7, 5)
    : null;
  const cheapestSpainPence =
    spainResult?.verdict === "esim"
      ? (spainResult.esimChoice?.totalPence ?? 0)
      : (spainResult?.cheapestNetwork?.totalPence ?? 0);
  const cheapestSpainLabel =
    cheapestSpainPence === 0
      ? "Included — no extra charge"
      : formatPence(cheapestSpainPence);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "RoamMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-ink">
          What does your phone cost{" "}
          <span className="text-brand-accent">abroad</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          UK mobile roaming charges for all four networks across 40 destinations, eSIM
          comparisons and airline baggage fees — every figure verified against official
          pages and date-stamped.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeeStat
          label="Destinations tracked"
          value={String(destinationCount)}
          note="roaming charges per destination"
        />
        <FeeStat
          label="Networks compared"
          value="4 + 3"
          note="EE, O2, Vodafone, Three + eSIM providers"
        />
        <FeeStat
          label="Cheapest week in Spain"
          value={cheapestSpainLabel}
          note="7-day trip, 5GB data (O2 or best eSIM)"
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">40 destinations</h2>
        <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {destinations.map((d) => (
            <li key={d.countrySlug}>
              <Link
                href={`/roaming/${d.countrySlug}`}
                className="font-medium text-brand-accent underline underline-offset-4"
              >
                {d.countryName}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex flex-wrap gap-6">
        <Link
          href="/roaming"
          className="text-base font-semibold text-brand-accent underline underline-offset-4"
        >
          Compare all roaming charges →
        </Link>
        <Link
          href="/baggage-fees"
          className="text-base font-semibold text-brand-accent underline underline-offset-4"
        >
          Airline baggage fees →
        </Link>
      </p>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when roaming charges change"
      />

      <FamilyLinks />
    </div>
  );
}
