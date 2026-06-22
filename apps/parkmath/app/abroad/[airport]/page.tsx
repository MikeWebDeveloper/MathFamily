import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import { FaqAccordion, FreshnessBadge, PageHeading, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { abroadModel, abroadAirportSlugs } from "@/lib/abroad-content";
import { AbroadAnswer } from "@/components/abroad-answer";

export const dynamicParams = false;
export function generateStaticParams() {
  return abroadAirportSlugs().map((airport) => ({ airport }));
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const m = abroadModel(airport);
  if (!m) return {};
  return {
    title: `Going abroad from ${m.airport.name}? Parking + roaming + bags — total cost 2026`,
    description: `What it really costs to drive to ${m.airport.name} and go abroad: cheapest parking or drop-off, phone roaming and baggage — every figure verified and date-stamped.`,
    alternates: { canonical: `/abroad/${airport}` }
  };
}

export default async function AbroadAirportPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const m = abroadModel(slug);
  if (!m) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const roammathUrl = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  const url = `${siteUrl}/abroad/${m.airport.slug}`;

  return (
    <article className="space-y-6">
      <JsonLd data={faqPageLd(m.faqs)} />
      <JsonLd data={speakableLd({ url })} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Going abroad by car", url: `${siteUrl}/abroad` },
          { name: m.airport.name, url }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>Going abroad from {m.airport.name}? The full travel cost</PageHeading>
        <FreshnessBadge verifiedAt={m.verifiedAt} />
      </header>

      <AbroadAnswer model={m} roammathUrl={roammathUrl} />

      <section id="faq" className="space-y-3 scroll-mt-20">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={m.faqs} />
      </section>

      <p className="text-sm">
        <Link href="/abroad" className="text-brand-accent underline underline-offset-4">
          ← All airports: going abroad by car
        </Link>
      </p>

      <EmailCaptureSlot
        source="abroad"
        hook={`Get notified when ${m.airport.name} parking or drop-off prices change`}
      />

      <SourcesBlock
        sources={[{ label: `Official ${m.airport.name} parking & drop-off pages`, url: siteUrl, verifiedAt: m.verifiedAt }]}
        method="Parking and drop-off figures are ParkMath's verified airport data; roaming and baggage are RoamMath's verified datasets. Nothing is scraped from aggregators."
      />
    </article>
  );
}
