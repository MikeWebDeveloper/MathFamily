import Link from "next/link";
import { loadLoungeDataset, loadPriorityPass, loadAirports } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip, IataTile, FreshnessBadge } from "@mathfamily/ui";
import { FamilyLinks } from "@/components/family-links";
import { buildLoungePageModel, latestVerifiedAt } from "@/lib/lounge-content";

export default function HomePage() {
  const ds = loadLoungeDataset();
  const airports = loadAirports();
  const pp = loadPriorityPass();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const latest = latestVerifiedAt();

  // Build a light per-airport summary for the directory (cheapest from-price + PP).
  const cards = ds.records
    .map((r) => {
      const airport = airports.find((a) => a.slug === r.airportSlug);
      if (!airport) return null;
      const priced = r.lounges
        .map((l) => l.walkInPence)
        .filter((p): p is number => p !== null)
        .sort((a, b) => a - b);
      return {
        slug: r.airportSlug,
        name: airport.name,
        iata: airport.iata,
        loungeCount: r.lounges.length,
        cheapestPence: priced[0] ?? null,
        priorityPass: r.lounges.some((l) => l.priorityPass),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Headline stat: cheapest verified walk-in across the whole network.
  const allPriced = cards.map((c) => c.cheapestPence).filter((p): p is number => p !== null);
  const cheapestOverall = allPriced.length ? Math.min(...allPriced) : null;
  const standardTier = pp.tiers.find((t) => t.tier === "Standard") ?? pp.tiers[0]!;

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "LoungeMath", url: siteUrl })} />
      <JsonLd
        data={itemListLd({
          name: "UK airport lounges",
          items: cards.map((c) => ({ name: `${c.name} lounges`, url: `${siteUrl}/lounge-access/${c.slug}` })),
        })}
      />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          Can you get into the lounge — and is it{" "}
          <span className="text-brand-accent">worth it</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Clear, verified answers for every UK airport: which lounges there are, HOW you get in
          (Priority Pass, a credit card, or paying on the door), and whether a membership beats the
          walk-in price for how often you fly. Every price is checked against the official source and
          date-stamped.
        </p>
        <FreshnessBadge verifiedAt={latest} href={null} />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "UK airports covered", value: String(cards.length), note: "verified lounge access info" },
            {
              label: "Cheapest lounge from",
              value: cheapestOverall !== null ? formatPence(cheapestOverall) : "varies",
              note: "lowest published walk-in / pre-book price",
            },
            {
              label: "Priority Pass from",
              value: formatPence(standardTier.annualFeePence),
              note: `${standardTier.tier} tier, then ${formatPence(standardTier.perVisitPence)}/visit`,
            },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">{cards.length} UK airports</h2>
        <nav aria-label="UK airport lounges" className="mf-reveal grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.slug}
              href={`/lounge-access/${c.slug}`}
              className="mf-press group flex items-center gap-3 rounded-card border border-ink/10 bg-card p-4 transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              <IataTile code={c.iata} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{c.name}</span>
                <span className="block text-sm text-ink-muted">
                  {c.loungeCount} lounge{c.loungeCount === 1 ? "" : "s"}
                  {c.cheapestPence !== null ? ` · from ${formatPence(c.cheapestPence)}` : ""}
                  {c.priorityPass ? " · Priority Pass" : ""}
                </span>
              </span>
              <span aria-hidden className="text-brand-accent opacity-0 transition-opacity group-hover:opacity-100">→</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="space-y-3 rounded-card bg-surface p-6">
        <h2 className="text-xl font-semibold text-ink">The three ways into a UK airport lounge</h2>
        <ul className="space-y-2 text-ink-muted">
          <li>
            <strong className="text-ink">Pay on the door / pre-book.</strong> Buy a single visit from
            the lounge operator. Pre-booking is usually cheaper than a walk-up and guarantees a slot.
          </li>
          <li>
            <strong className="text-ink">Priority Pass (or DragonPass / LoungeKey).</strong> A membership
            that gets you into accepting lounges — pay an annual fee plus a small per-visit charge, or an
            unlimited tier. Worth it once you visit enough times a year.
          </li>
          <li>
            <strong className="text-ink">A credit card that bundles access.</strong> Several premium UK
            travel cards include a Priority Pass membership or direct lounge access — so your per-visit
            cost can be £0. Check your card's benefits first.
          </li>
        </ul>
        <p className="text-sm text-ink-muted">
          Open any airport above to see its lounges, the access methods that actually work there, and a
          break-even calculator for your travel frequency.
        </p>
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when lounge prices or access rules change"
      />

      <FamilyLinks />
    </div>
  );
}
