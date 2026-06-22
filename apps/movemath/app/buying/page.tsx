import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { AdviceDisclaimer } from "@/components/disclaimer";
import { SPOKES, buildSpokeModel } from "@/lib/spokes";
import { VERIFIED_AT } from "@/lib/dataset";

export const metadata: Metadata = {
  title: "Cost of moving home — worked examples by buyer type & price",
  description:
    "Worked examples of the full cost of moving home in England & Northern Ireland — first-time buyers, home movers and second properties across price bands. Stamp Duty plus fees, itemised."
};

export default function BuyingIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const models = SPOKES.map(buildSpokeModel);

  const rows = models.map((m) => [
    <Link
      key="ex"
      href={`/buying/${m.slug}`}
      className="font-medium text-brand-accent underline-offset-4 hover:underline"
    >
      {m.heading}
    </Link>,
    m.buyerLabel,
    m.priceBandLabel,
    m.sdltFormatted,
    m.totalFormatted
  ]);

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Worked examples", url: `${siteUrl}/buying` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "Cost of moving home — worked examples",
          items: models.map((m) => ({ name: m.heading, url: `${siteUrl}/buying/${m.slug}` }))
        })}
      />

      <header className="space-y-3">
        <PageHeading>The cost of moving home: worked examples</PageHeading>
        <FreshnessBadge verifiedAt={VERIFIED_AT} />
      </header>

      <AdviceDisclaimer />

      <p className="text-ink-muted">
        Each example computes Stamp Duty (England &amp; NI) plus removals, conveyancing and a survey for a
        representative price. Click through for the full itemised breakdown and FAQs.
      </p>

      <FeeGrid
        caption="Stamp Duty and estimated total cost to move, by buyer type and price band."
        columns={["Example", "Buyer type", "Price", "Stamp Duty", "Total to move"]}
        numericColumns={[3, 4]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Stamp Duty verified against gov.uk on {VERIFIED_AT}. All other figures are typical estimates, not quotes.
      </p>
    </article>
  );
}
