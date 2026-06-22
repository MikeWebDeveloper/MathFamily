import Link from "next/link";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { PET_COST_RECORDS, PET_COSTS_LAST_UPDATED } from "@/lib/pet-costs";
import { lifetimeRangeLabel } from "@/lib/pet-content";
import { HomePetCalculator } from "@/components/home-pet-calculator";
import { DisclosureNote } from "@/components/disclosure-note";
import { FamilyLinks } from "@/components/family-links";

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const records = PET_COST_RECORDS;

  const dogMax = records.find((r) => r.slug === "large-dog");
  const cat = records.find((r) => r.slug === "cat");

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "PetMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does a pet really cost{" "}
          <span className="text-brand-accent">over its lifetime</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          The real UK cost of owning a dog, cat or rabbit — food, routine vet care and one-off set-up — built from
          PDSA Animal Wellbeing figures, with a source and a verified date on every number.
        </p>
      </section>

      <section>
        <HomePetCalculator records={records} />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "Pets costed", value: String(records.length), note: "dogs, cats and rabbits by size" },
            { label: "Lifetime cat cost", value: cat ? lifetimeRangeLabel(cat) : "—", note: "PDSA, essential care only" },
            { label: "Lifetime large dog", value: dogMax ? lifetimeRangeLabel(dogMax) : "—", note: "the priciest pet here" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">Pick your pet</h2>
        <nav aria-label="Pets" className="mf-reveal grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {records.map((r) => (
            <Link
              key={r.slug}
              href={`/cost/${r.slug}`}
              className="mf-press rounded-card border border-ink/10 bg-card p-4 transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              <span className="block font-semibold text-ink">{r.name}</span>
              <span className="mt-0.5 block text-sm text-ink-muted">{lifetimeRangeLabel(r)} over its lifetime</span>
            </Link>
          ))}
        </nav>
      </section>

      <EmailCaptureSlot
        brandName="PetMath"
        hook="Get notified when UK pet costs change"
        description="UK pet-cost update"
        source="home"
        privacyHref="/privacy"
      />

      <DisclosureNote />

      <FamilyLinks />

      <p className="text-xs text-ink-muted">Costs last verified {PET_COSTS_LAST_UPDATED}.</p>
    </div>
  );
}
