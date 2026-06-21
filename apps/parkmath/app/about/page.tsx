import type { Metadata } from "next";
import Link from "next/link";
import { loadDropOffDataset } from "@mathfamily/data";
import { breadcrumbLd, personLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "About ParkMath — who runs it and why",
  description:
    "ParkMath is run by Mike, its founder, to keep every UK airport drop-off and parking charge current — verified against each airport's own official page, not copied from stale comparison sites.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  const dataset = loadDropOffDataset();
  const airportCount = dataset.records.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <article className="max-w-2xl space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "About", url: `${siteUrl}/about` }
        ])}
      />
      {/* Person schema for the named founder. sameAs is intentionally omitted until Mike
          confirms a real profile URL — we never invent social links. The Organization +
          founder graph is emitted site-wide from the root layout (organizationLd). */}
      <JsonLd
        data={personLd({
          siteUrl,
          name: "Mike",
          jobTitle: "Founder & editor, ParkMath",
          url: `${siteUrl}/about`
        })}
      />

      <header className="space-y-3">
        <PageHeading>About ParkMath</PageHeading>
        <p className="mf-speakable text-lead text-ink">
          ParkMath is run by a real person — <strong>Mike, its founder</strong> — to answer one
          question honestly: what does it actually cost to drop someone off, or park, at a UK airport
          right now?
        </p>
      </header>

      <section className="space-y-4 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Why this site exists</h2>
        <p>
          Airport drop-off and parking fees change often — usually at the January and April fiscal
          boundaries — and the big comparison sites are slow to catch up. It&apos;s common to find a
          headline drop-off price quoted that the airport raised months ago. When the number is wrong,
          you find out at the barrier, card in hand.
        </p>
        <p>
          ParkMath fixes that by doing the unglamorous part properly: every figure is read from the
          airport&apos;s <strong>own official page</strong>, date-stamped, and re-checked on a schedule.
          We currently track <strong>{airportCount} UK airports</strong>. If we can&apos;t verify a
          number against an official source, we don&apos;t publish it as fact.
        </p>
        <p>
          Read exactly how we source and re-verify every price on our{" "}
          <Link href="/methodology" className="font-semibold text-brand-accent hover:underline">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-ink">Who runs ParkMath</h2>
        <div className="mf-card-lg mf-edge space-y-4 p-6">
          <div className="flex items-start gap-4">
            {/* Real founder headshot. Plain <img> to match the existing image pattern in this app. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mike-latal.webp"
              alt="Mike, founder of ParkMath"
              width={80}
              height={80}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-ink/10"
            />
            <div className="space-y-1">
              <p className="text-lg font-bold text-ink">Mike</p>
              <p className="text-sm text-ink-muted">Founder &amp; editor, ParkMath</p>
            </div>
          </div>

          <p className="text-ink-muted">
            Mike is a web developer and the founder of ParkMath. He built it to fix a simple,
            frustrating problem: airport drop-off and parking prices change constantly, and most
            comparison sites quietly run out of date. ParkMath checks every UK airport&apos;s fee
            against the airport&apos;s own official page and date-stamps each one — so the number you
            see is the number you&apos;ll pay.
          </p>
        </div>
      </section>

      <section className="space-y-4 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Editorial independence</h2>
        <p>
          ParkMath is independent — not owned by, or operated on behalf of, any airport, car park or
          booking site. <strong>Our rankings are commission-blind:</strong> when we say an option is the
          cheapest or the best value, that&apos;s based on the verified numbers alone, never on whether
          a link pays us.
        </p>
        <p>
          Some pages contain affiliate links (for example parking pre-booking or travel extras), and
          these are always clearly labelled where they appear. We may earn a commission if you book
          through one — at no extra cost to you — but it never changes which option we show as cheapest
          or how we rank anything.
        </p>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">Contact</h2>
        <p>
          Spotted a price that&apos;s changed, or anything that looks wrong? Tell us — corrections are
          the whole point.
        </p>
        <p className="text-base text-ink">
          <a href="mailto:Mike@parkmath.co.uk" className="font-semibold text-brand-accent hover:underline">
            Mike@parkmath.co.uk
          </a>
        </p>
      </section>
    </article>
  );
}
