import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeGrid, FreshnessBadge, StatStrip } from "@mathfamily/ui";
import { FamilyLinks } from "@/components/family-links";
import { NHS_BAND_CHARGES, TREATMENTS, latestVerifiedAt } from "@/lib/dental-data";
import { compareTreatment, formatRange } from "@/lib/dental-content";

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const verified = latestVerifiedAt();

  const comparisons = TREATMENTS.map(compareTreatment);

  const band1 = NHS_BAND_CHARGES.find((b) => b.band === "band1")!;
  const band3 = NHS_BAND_CHARGES.find((b) => b.band === "band3")!;
  const crown = comparisons.find((c) => c.treatment.slug === "crown")!;

  const rows = comparisons.map((c) => [
    <Link
      key="t"
      href={`/treatments/${c.treatment.slug}`}
      className="font-medium text-brand-accent underline-offset-4 hover:underline"
    >
      {c.treatment.name}
    </Link>,
    `${c.band.label} · ${formatPence(c.nhsPence)}`,
    formatRange(c.treatment.privatePrice),
    c.savingPence > 0 ? formatPence(c.savingPence) : "—"
  ]);

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "DentalMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does the dentist <span className="text-brand-accent">really cost</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          NHS band charges versus typical private prices for the dental treatments people actually
          search for — check-ups, fillings, crowns and more. Every NHS figure is read from the official
          NHS pages and date-stamped; private figures are clearly-labelled typical ranges.
        </p>
        <FreshnessBadge verifiedAt={verified} href={null} />
      </section>

      <section>
        <StatStrip stats={[
          { label: "NHS check-up (Band 1)", value: formatPence(band1.pricePence), note: "England — exam, X-rays, scale & polish if needed" },
          { label: "NHS crown (Band 3)", value: formatPence(band3.pricePence), note: "the whole course of treatment" },
          { label: "Private crown saving", value: crown.savingPence > 0 ? formatPence(crown.savingPence) : "—", note: "NHS vs a mid-range private crown" },
        ]} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">NHS vs private, by treatment</h2>
        <FeeGrid
          caption="England NHS patient charge vs typical UK private price. NHS = one flat charge per course of treatment. Private = indicative range from public price guides — your dentist's quote will differ."
          columns={["Treatment", "NHS (England)", "Typical private", "Approx. saving on NHS"]}
          numericColumns={[1, 2, 3]}
          rows={rows}
        />
        <p className="text-sm text-ink-muted">
          NHS figures verified {verified}. Private prices are typical ranges and vary widely by practice,
          region and complexity. Scotland, Wales and Northern Ireland use different NHS charging models —
          see <Link href="/nhs-dental-charges" className="text-brand-accent underline underline-offset-4">NHS dental charges</Link>.
        </p>
      </section>

      <p className="flex flex-wrap gap-6">
        <Link href="/treatments" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          All treatment costs →
        </Link>
        <Link href="/nhs-dental-charges" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          NHS band charges explained →
        </Link>
      </p>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when NHS dental charges change"
      />

      <p className="rounded-card bg-surface p-4 text-sm text-ink-muted">
        DentalMath is for general information only — it is <strong className="font-semibold text-ink">not medical or financial advice</strong>.
        Always check with your dentist or NHS for your own situation.
      </p>

      <FamilyLinks />
    </div>
  );
}
