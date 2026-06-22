import Link from "next/link";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { MoveCalculator } from "@/components/move-calculator";
import { AffiliateSlot } from "@/components/affiliate-slot";
import { MortgageSlot } from "@/components/mortgage-slot";
import { AdviceDisclaimer } from "@/components/disclaimer";
import { FamilyLinks } from "@/components/family-links";
import { SPOKES } from "@/lib/spokes";
import { VERIFIED_AT } from "@/lib/dataset";

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "MoveMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does it really cost to{" "}
          <span className="text-brand-accent">move home</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Add up the full cost of moving in England &amp; Northern Ireland — Stamp Duty (SDLT), removals,
          conveyancing and a survey — in one place. Every figure is an estimate from public sources, date-stamped.
        </p>
      </section>

      <AdviceDisclaimer />

      <section>
        <MoveCalculator />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "SDLT nil-rate band", value: "£125,000", note: "0% up to here (standard rates)" },
            { label: "First-time buyer relief", value: "£300,000", note: "0% up to here; lost above £500k" },
            { label: "Second-home surcharge", value: "+5%", note: "on every band, over £40,000" }
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Worked examples by buyer type &amp; price</h2>
        <nav aria-label="Worked examples" className="mf-reveal grid gap-3 sm:grid-cols-2">
          {SPOKES.map((s) => (
            <Link
              key={s.slug}
              href={`/buying/${s.slug}`}
              className="mf-press rounded-card border border-ink/10 bg-card p-4 transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              <span className="block text-sm font-semibold text-ink">{s.heading}</span>
              <span className="mt-1 block text-xs text-ink-muted">{s.buyerType.replaceAll("-", " ")} · {s.priceBandLabel}</span>
            </Link>
          ))}
        </nav>
        <p>
          <Link href="/buying" className="text-base font-semibold text-brand-accent underline underline-offset-4">
            See all worked examples →
          </Link>
        </p>
      </section>

      {/* Conversion surfaces. GREEN rails are INERT "coming soon". Mortgage is FCA-red + inert. */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Get quotes for your move</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AffiliateSlot category="removals" surface="home" />
          <AffiliateSlot category="conveyancing" surface="home" />
          <AffiliateSlot category="surveys" surface="home" />
          <MortgageSlot />
        </div>
      </section>

      <EmailCaptureSlot
        brandName="MoveMath"
        hook="Get notified when Stamp Duty rules or moving costs change"
        description="UK moving-cost & Stamp Duty updates"
        source="home"
        privacyHref="/privacy"
      />

      <p className="text-xs text-ink-muted">Stamp Duty rates verified against gov.uk on {VERIFIED_AT}.</p>

      <FamilyLinks />
    </div>
  );
}
