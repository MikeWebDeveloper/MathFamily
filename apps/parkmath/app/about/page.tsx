import type { Metadata } from "next";
import Link from "next/link";
import { loadDropOffDataset } from "@mathfamily/data";
import { breadcrumbLd, personLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "About ParkMath — who runs it and why",
  description:
    "ParkMath is run by Mike Latal, its founder, to keep every UK airport drop-off and parking charge current — verified against each airport's own official page, not copied from stale comparison sites.",
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
          name: "Mike Latal",
          jobTitle: "Founder & editor, ParkMath",
          url: `${siteUrl}/about`
        })}
      />

      <header className="space-y-3">
        <PageHeading>About ParkMath</PageHeading>
        <p className="mf-speakable text-lead text-ink">
          ParkMath is run by a real person — <strong>Mike Latal, its founder</strong> — to answer one
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

      {/* ── PLACEHOLDER: Mike's bio, photo and any credentials ──────────────────────────
          We do NOT invent biographical facts or credentials. Mike fills this in. ──────── */}
      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-ink">Who runs ParkMath</h2>
        <div className="mf-card-lg mf-edge space-y-4 p-6">
          <div className="flex items-start gap-4">
            {/* Photo placeholder */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink-muted ring-1 ring-ink/10"
              aria-hidden
            >
              Photo
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-ink">Mike Latal</p>
              <p className="text-sm text-ink-muted">Founder &amp; editor, ParkMath</p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-brand-accent/40 bg-brand-accent/5 p-4 text-sm text-ink-muted">
            <p className="font-semibold text-ink">[Mike to confirm]</p>
            <p>
              Short bio (2–4 sentences), a photo, and any relevant credentials go here. Leave blank
              rather than guess — this block is intentionally a placeholder and ships only what Mike
              confirms is true. Nothing in this box is invented by the build.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>[Mike to confirm] Bio — who you are, why you started ParkMath.</li>
              <li>[Mike to confirm] Photo — a real headshot (replaces the placeholder above).</li>
              <li>
                [Mike to confirm] Credentials / relevant background, if any — only state what&apos;s
                genuinely true.
              </li>
            </ul>
          </div>
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
