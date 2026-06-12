import Link from "next/link";
import { loadRoamingDataset, loadEsimDataset } from "@mathfamily/data";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { CountryFlag, EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { FamilyLinks } from "@/components/family-links";
import { NETWORK_LABELS } from "@/lib/roaming-content";

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

  // Derive the dual-value framing for the Spain stat card
  let spainStatValue = "";
  let spainStatNote = "";

  if (spainResult) {
    const cheapestNetwork = spainResult.cheapestNetwork;
    const esimChoice = spainResult.esimChoice;
    const cheapestNetworkIncluded = cheapestNetwork?.included ?? false;

    // Determine the value: £0 (NETWORK) if included network wins, otherwise the cheapest price
    if (cheapestNetworkIncluded && cheapestNetwork) {
      const networkLabel = NETWORK_LABELS[cheapestNetwork.network] ?? cheapestNetwork.network;
      spainStatValue = `£0 (${networkLabel})`;
    } else if (cheapestNetwork && cheapestNetwork.totalPence !== null) {
      spainStatValue = formatPence(cheapestNetwork.totalPence);
    } else {
      spainStatValue = "Varies by network";
    }

    // Build the note dynamically
    const noteParts: string[] = [];

    // Included network or cheapest network label
    if (cheapestNetworkIncluded && cheapestNetwork) {
      const networkLabel = NETWORK_LABELS[cheapestNetwork.network] ?? cheapestNetwork.network;
      noteParts.push(`${networkLabel}: included`);
    } else if (cheapestNetwork && cheapestNetwork.totalPence !== null) {
      const networkLabel = NETWORK_LABELS[cheapestNetwork.network] ?? cheapestNetwork.network;
      noteParts.push(`${networkLabel} from ${formatPence(cheapestNetwork.totalPence)}`);
    }

    // eSIM option
    if (esimChoice) {
      const converted = esimChoice.bundleName.includes("(converted)") ? " (converted)" : "";
      noteParts.push(`eSIM from ${formatPence(esimChoice.totalPence)}${converted}`);
    }

    // Trip details
    noteParts.push("7 days, 5GB");

    spainStatNote = noteParts.join(" · ");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "RoamMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does your phone cost{" "}
          <span className="text-brand-accent">abroad</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          UK mobile roaming charges for all four networks across 40 destinations, eSIM
          comparisons and airline baggage fees — every figure verified against official
          pages and date-stamped.
        </p>
      </section>

      <section>
        <StatStrip stats={[
          { label: "Destinations tracked", value: String(destinationCount), note: "roaming charges per destination" },
          { label: "Networks compared", value: "4 + 3", note: "EE, O2, Vodafone, Three + eSIM providers" },
          { label: "Cheapest week in Spain", value: spainStatValue, note: spainStatNote },
        ]} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">40 destinations</h2>
        <nav aria-label="Destinations" className="mf-reveal flex flex-wrap gap-2">
          {destinations.map((d) => (
            <Link
              key={d.countrySlug}
              href={`/roaming/${d.countrySlug}`}
              className="mf-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              <CountryFlag iso2={d.iso2} size={18} />
              {d.countryName}
            </Link>
          ))}
        </nav>
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
