import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";
import { siteUrl as siteUrlFromEnv, CONTACT_EMAIL } from "../../lib/site";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description:
    "How RoamMath is funded: some links to eSIM, car hire and travel insurance providers may pay us a commission. They are always labelled and never change which option we show as cheapest.",
  alternates: { canonical: "/affiliate-disclosure" }
};

export default function AffiliateDisclosurePage() {
  const siteUrl = siteUrlFromEnv();
  return (
    <article className="max-w-2xl space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Affiliate disclosure", url: `${siteUrl}/affiliate-disclosure` }
        ])}
      />
      <header className="space-y-3">
        <PageHeading>Affiliate disclosure</PageHeading>
        <p className="mf-speakable text-lead text-ink">
          RoamMath is free to use. Some links on the site may earn us a commission when you buy, at no
          extra cost to you. This page explains how that works and the rules we hold ourselves to.
        </p>
      </header>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">What can earn us money</h2>
        <p>
          We may link to eSIM providers, car-hire sites and travel-insurance providers through
          affiliate networks (such as AWIN or Impact). If you click one of those links and then buy, the
          provider may pay RoamMath a commission. The roaming charges, eSIM prices and baggage fees we
          publish are always read from the official pages, never from an affiliate feed.
        </p>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">How you can tell</h2>
        <p>
          Any link that can pay us is labelled &ldquo;Affiliate link&rdquo; next to the link itself, on
          the page where it appears. Where no label appears, the link goes to the official page of the
          network, provider or airline and pays us nothing. We do not put affiliate links in social posts
          or emails.
        </p>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">What it never changes</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Which option we show as cheapest.</strong> Rankings and comparisons use the verified
            prices only, never whether a link pays us.
          </li>
          <li>
            <strong>The figures themselves.</strong> We never publish a price we have not verified against
            the provider&apos;s own page, and every figure shows the date we last checked it.
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Cookies and tracking</h2>
        <p>
          Following an affiliate link takes you through the affiliate network so the sale can be credited
          to us. The network and the provider may set their own cookies on their own sites, under their
          own privacy policies. See our{" "}
          <Link href="/privacy" className="font-semibold text-accent-strong hover:underline">
            privacy page
          </Link>{" "}
          for what RoamMath itself records.
        </p>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Questions</h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-strong hover:underline">
            {CONTACT_EMAIL}
          </a>
          . More about who runs the site is on the{" "}
          <Link href="/about" className="font-semibold text-accent-strong hover:underline">
            about page
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
