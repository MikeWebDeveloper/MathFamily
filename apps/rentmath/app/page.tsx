import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, speakableLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { TrueCostCalculator } from "../components/true-cost-calculator";
import { InertAffiliateSlot } from "../components/inert-affiliate-slot";
import { FamilyLinks } from "../components/family-links";
import { TOWNS } from "../lib/rent-data";
import { trueCostOfRenting, townToInput } from "../lib/rent-content";

// Home is the family's renting "what does it really cost" entry point — give it its own GEO-ready
// title + description (the layout template appends "| RentMath" elsewhere; the home title is whole).
export const metadata: Metadata = {
  title: "True cost of renting in the UK — rent plus council tax, bills & deposit, by town",
  description:
    "What renting in the UK really costs: median rent plus council tax, typical bills and the capped move-in deposit, worked out town by town — every figure with a source and a date."
};

export default function HomePage() {
  const towns = TOWNS;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  // Cheapest / dearest true annual cost across the seed towns, for the stat strip.
  const ranked = towns
    .map((t) => ({ town: t, result: trueCostOfRenting(townToInput(t)) }))
    .sort((a, b) => a.result.annualTrueCostPence - b.result.annualTrueCostPence);
  const cheapest = ranked[0];
  const dearest = ranked[ranked.length - 1];

  // One-sentence, factual, voice/AI-extractable answer derived ONLY from the seed dataset range.
  const homeAnswer = cheapest && dearest
    ? `In the UK, the true cost of renting — median rent plus council tax, typical bills and the statutory capped deposit — works out at roughly ${formatPence(
        cheapest.result.annualTrueCostPence
      )} to ${formatPence(dearest.result.annualTrueCostPence)} a year across the ${towns.length} towns covered, depending on where you rent.`
    : "In the UK, the true cost of renting is the median rent plus council tax, typical bills and the statutory capped deposit — worked out town by town.";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "RentMath", url: siteUrl })} />
      <JsonLd data={speakableLd({ url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does renting{" "}
          <span className="text-brand-accent">really</span> cost?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          The advertised rent is only part of the bill. RentMath adds council tax, typical bills and
          the capped deposit to show the real annual cost of a UK tenancy — town by town, with a
          source and a date on every figure.
        </p>
      </section>

      {/* GEO entry point: the speakableLd selector targets h1 + .mf-speakable, so the one-sentence
          factual answer below carries mf-speakable to be the home page's voice/AI-extractable lead. */}
      <section id="mf-answer-anchor" className="mf-speakable">
        <AnswerLead answer={homeAnswer} />
      </section>

      <section>
        <TrueCostCalculator towns={towns} />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "Towns covered", value: String(towns.length), note: "true cost worked out per town" },
            cheapest
              ? {
                  label: `Cheapest: ${cheapest.town.townName}`,
                  value: formatPence(cheapest.result.annualTrueCostPence),
                  note: "real cost per year (rent + council tax + bills)"
                }
              : { label: "Cheapest", value: "—", note: "" },
            dearest
              ? {
                  label: `Dearest: ${dearest.town.townName}`,
                  value: formatPence(dearest.result.annualTrueCostPence),
                  note: "real cost per year (rent + council tax + bills)"
                }
              : { label: "Dearest", value: "—", note: "" }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">Choose a town</h2>
        <nav aria-label="Towns" className="mf-reveal flex flex-wrap gap-2">
          {towns.map((t) => (
            <Link
              key={t.townSlug}
              href={`/towns/${t.townSlug}`}
              className="mf-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              {t.townName}
            </Link>
          ))}
        </nav>
      </section>

      <p>
        <Link href="/towns" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare the true cost of renting across all towns →
        </Link>
      </p>

      <InertAffiliateSlot />

      <EmailCaptureSlot
        brandName="RentMath"
        hook="Get notified when rent and council-tax figures are updated"
        description="monthly UK renting-cost update"
        source="home"
        privacyHref="/privacy"
      />

      <FamilyLinks />

      <p className="text-xs text-ink-muted">
        RentMath is an independent information tool, not a letting agent, landlord or financial
        adviser. Figures are estimates — always confirm rent, council-tax band and bills with the
        landlord and your local billing authority before you sign. Nothing here is financial advice.
      </p>
    </div>
  );
}
