import type { Metadata } from "next";
import Link from "next/link";
import { loadDropOffDataset } from "@mathfamily/data";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "How we verify — ParkMath methodology",
  description:
    "Exactly how ParkMath sources and keeps UK airport drop-off and parking fees current: every figure read from the airport's own official page, date-stamped, and re-checked on a schedule. What 'Verified [date]' means and how it stays true.",
  alternates: { canonical: "/methodology" }
};

export default function MethodologyPage() {
  const dataset = loadDropOffDataset();
  const records = dataset.records;
  const airportCount = records.length;
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;
  const oldestVerified = records.map((r) => r.verifiedAt).sort()[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const steps = [
    {
      title: "Every figure comes from the airport's own official page",
      body: (
        <>
          Each airport&apos;s drop-off and parking fees are read directly from that airport&apos;s{" "}
          <strong>own official website</strong> — never copied from a comparison or aggregator site. We
          keep a source registry that pins each of the {airportCount} airports we track to its official
          source URL, so every number is traceable back to where the airport itself published it.
        </>
      )
    },
    {
      title: "Each price is date-stamped when it's verified",
      body: (
        <>
          When we confirm a figure against its official source, we record the date as{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.85em] font-mono">verifiedAt</code>{" "}
          on that record. That&apos;s the date you see in the green &ldquo;Verified&rdquo; badge next to a
          price. It means: <em>on this date, this exact figure matched the airport&apos;s official page.</em>
        </>
      )
    },
    {
      title: "We re-check on a schedule — and before every content update",
      body: (
        <>
          Fees move, typically at the January and April fiscal boundaries. So we re-run a freshness
          check that re-fetches each airport&apos;s official source and compares it to what we have
          stored, classifying every record as <strong>current</strong>, <strong>stale</strong>,{" "}
          <strong>conflicting</strong>, or <strong>unverifiable</strong>. Anything that isn&apos;t a
          clean &ldquo;current&rdquo; match gets a human look before anything changes.
        </>
      )
    },
    {
      title: "When an airport's page blocks a simple fetch, we use a real browser",
      body: (
        <>
          A handful of airport sites block automated requests. For those, the check escalates to a real
          rendered browser to read the official tariff table directly, and falls back to an
          official-domain search only as a last resort — still never a third-party aggregator. The
          source of truth is always the airport itself.
        </>
      )
    },
    {
      title: "Nothing is auto-published, and nothing is invented",
      body: (
        <>
          The freshness check is <strong>read-only by design</strong>. It never edits the dataset and
          never publishes a price on its own. Any change it spots is surfaced as a reviewed diff that a
          human approves before it goes live — and we only ever change a value we can verify against an
          official source. If we can&apos;t verify a number, we don&apos;t present it as fact.
        </>
      )
    }
  ];

  return (
    <article className="max-w-2xl space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Methodology", url: `${siteUrl}/methodology` }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>How we verify every price</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} href={null} />
        <p className="mf-speakable text-lead text-ink">
          ParkMath&apos;s whole value is that the numbers are right. Here&apos;s exactly how each UK
          airport fee is sourced, date-stamped, and kept current — so you can trust the figure you see.
        </p>
      </header>

      <section className="space-y-6">
        <ol className="space-y-6">
          {steps.map((step, i) => (
            <li key={step.title} className="mf-card-lg mf-edge flex gap-4 p-5">
              <span
                className="mf-num-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-sm font-bold text-brand-accent"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                <p className="text-sm text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">What &ldquo;Verified [date]&rdquo; means</h2>
        <p>
          A green <strong>Verified [date]</strong> badge means that, on the date shown, the figure
          matched the airport&apos;s own official page. If a price hasn&apos;t been re-checked in a
          while, the badge turns amber and reads <strong>&ldquo;Last verified&rdquo;</strong> — a signal
          to double-check with the airport before you travel. Either way, the date is honest: it&apos;s
          the last time a human-reviewed check confirmed the number, not a timestamp that auto-refreshes
          to look current.
        </p>
        <p>
          You can always see and download the underlying data on the{" "}
          <Link href="/drop-off-charges" className="font-semibold text-brand-accent hover:underline">
            drop-off charges table
          </Link>{" "}
          (each row links to its official source), and read who runs ParkMath and why on our{" "}
          <Link href="/about" className="font-semibold text-brand-accent hover:underline">
            about page
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
