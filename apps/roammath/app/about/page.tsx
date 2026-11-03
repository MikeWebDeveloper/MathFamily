import type { Metadata } from "next";
import Link from "next/link";
import { loadRoamingDataset, loadBaggageDataset } from "@mathfamily/data";
import { breadcrumbLd, personLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";
import { siteUrl as siteUrlFromEnv, CONTACT_EMAIL } from "../../lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who runs RoamMath, why it exists, and how it stays independent: verified UK roaming charges, eSIM prices and airline baggage fees, with any commission links clearly labelled.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  const destinationCount = loadRoamingDataset().destinations.length;
  const airlineCount = loadBaggageDataset().records.length;
  const siteUrl = siteUrlFromEnv();

  return (
    <article className="max-w-2xl space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "About", url: `${siteUrl}/about` }
        ])}
      />
      {/* Person schema for the named founder. sameAs is intentionally omitted — we never invent social links.
          The Organization + founder graph is emitted site-wide from the root layout (organizationLd). */}
      <JsonLd
        data={personLd({
          siteUrl,
          name: "Michal Latal",
          jobTitle: "Founder & editor, RoamMath",
          url: `${siteUrl}/about`
        })}
      />

      <header className="space-y-3">
        <PageHeading>About RoamMath</PageHeading>
        <p className="mf-speakable text-lead text-ink">
          RoamMath is built and run by one person, <strong>Michal Latal</strong>, to answer a simple
          question honestly: what will my phone and my bags actually cost me abroad?
        </p>
      </header>

      <section className="space-y-4 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Why this site exists</h2>
        <p>
          Roaming charges, eSIM prices and airline bag fees change often and are rarely stated in one
          place. RoamMath puts the answer in one place and shows its working: every figure is read from
          the network&apos;s, eSIM provider&apos;s or airline&apos;s <strong>own official page</strong>,
          date-stamped, and re-checked on a schedule. We currently track UK roaming charges for four
          networks across {destinationCount} destinations, eSIM bundles from three providers, and the
          baggage fees of {airlineCount} airlines. If we can&apos;t verify a number against an official
          source, we don&apos;t publish it as fact.
        </p>
        <p>
          The full process is on our{" "}
          <Link href="/methodology" className="font-semibold text-accent-strong hover:underline">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4 text-ink-muted" id="independence">
        <h2 className="text-h2 font-semibold text-ink">Editorial independence</h2>
        <p>
          RoamMath is independent: it is not owned by, or operated on behalf of, any mobile network, eSIM
          provider, airline or booking site. <strong>Our comparisons are commission-blind.</strong> When
          we say an option is the cheapest, that is based on the verified numbers alone, never on whether
          a link pays us.
        </p>
        <p>
          Some pages may contain affiliate links (for example to buy an eSIM, hire a car or get travel
          insurance). They are always labelled &ldquo;Affiliate link&rdquo; next to the link itself, and we
          may earn a commission if you buy through one, at no extra cost to you. Read the{" "}
          <Link href="/affiliate-disclosure" className="font-semibold text-accent-strong hover:underline">
            affiliate disclosure
          </Link>{" "}
          for the detail.
        </p>
        <p>
          RoamMath is part of the =Math family of UK cost calculators, alongside ParkMath, which does the
          same job for airport drop-off and parking charges.
        </p>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Contact</h2>
        <p>
          Spotted a price that has changed, or anything that looks wrong? Tell us; corrections are the
          whole point.
        </p>
        <p className="text-base text-ink">
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-strong hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </article>
  );
}
