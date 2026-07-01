import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import {
  AnswerLead,
  AnswerPassage,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  IataTile,
  MiniAnswerBar,
  PageHeading,
  SavesVerdict,
  SourceCitation,
  SourcesBlock,
} from "@mathfamily/ui";
import { BreakEvenCalculator } from "@/components/break-even-calculator";
import { AffiliateBlock } from "@/components/affiliate-block";
import { FamilyLinks } from "@/components/family-links";
import {
  allLoungeSlugs,
  buildLoungePageModel,
  accessMethods,
  breakEvenVerdict,
  buildLoungeFaqs,
  priorityPassTiers,
} from "@/lib/lounge-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return allLoungeSlugs().map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const model = buildLoungePageModel(key);
  if (!model) return {};
  const from =
    model.cheapestWalkInPence !== null ? ` from ${formatPence(model.cheapestWalkInPence)}` : "";
  return {
    title: `${model.airport.name} airport lounges — access, price & Priority Pass`,
    description: `Which lounges are at ${model.airport.name}, how to get in${from}, and whether a Priority Pass membership beats paying on the door. Verified against official sources.`,
  };
}

export default async function LoungeAccessDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const model = buildLoungePageModel(key);
  if (!model) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const name = model.airport.name;
  const methods = accessMethods(model);
  const faqs = buildLoungeFaqs(model);

  // Headline answer sentence.
  const answer =
    model.cheapestWalkInPence !== null
      ? `${name} has ${model.lounges.length} lounge${model.lounges.length === 1 ? "" : "s"}. You can pay on the door from ${formatPence(model.cheapestWalkInPence)} per adult${model.acceptsPriorityPass ? ", use Priority Pass (or an eligible credit card)" : ""} — and at higher visit frequencies a membership can be cheaper than paying each time.`
      : `${name} has ${model.lounges.length} lounge${model.lounges.length === 1 ? "" : "s"}. Prices are set dynamically, so compare the on-the-day rate against a Priority Pass membership for how often you fly.`;

  const miniSummary =
    model.cheapestWalkInPence !== null
      ? `${name} · lounges from ${formatPence(model.cheapestWalkInPence)}`
      : `${name} · lounge prices set dynamically`;

  const accessFacts = methods.map((m) => `${m.label}: ${m.detail}`);

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "UK airport lounges", url: `${siteUrl}/lounge-access` },
          { name, url: `${siteUrl}/lounge-access/${model.airport.slug}` },
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/lounge-access/${model.airport.slug}` })} />

      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <IataTile code={model.airport.iata} className="shrink-0" />
          <PageHeading>{name} airport lounges: access, price &amp; Priority Pass</PageHeading>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={model.verifiedAt} href={null} />
          <span className="hidden sm:inline-flex">
            <SourceCitation url={model.record.sourceUrl} label="Official lounge source" />
          </span>
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{accessFacts}</AnswerLead>
      </div>
      <MiniAnswerBar summary={miniSummary} verified />

      <AnswerPassage question={`How do I get into a lounge at ${name}?`}>
        {answer} All prices on this page are taken directly from the lounge operator&apos;s or
        airport&apos;s official page and date-stamped — confirm the live rate before you book.
      </AnswerPassage>

      {/* Lounges + access table */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Lounges at {name}</h2>
        <FeeGrid
          caption={`The lounges at ${name}, their published walk-in / pre-book from-price, and whether Priority Pass is accepted (verified ${model.verifiedAt}).`}
          columns={["Lounge", "Walk-in from", "Priority Pass", "Notes"]}
          numericColumns={[1]}
          rows={model.lounges.map((l) => [
            l.name,
            l.walkInPence !== null ? formatPence(l.walkInPence) : "Dynamic",
            l.priorityPass ? "Accepted" : "No",
            l.notes ?? "—",
          ])}
        />
      </section>

      {/* How access works here */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">How to get in at {name}</h2>
        <ul className="space-y-2 text-ink-muted">
          {methods.map((m) => (
            <li key={m.label}>
              <strong className="text-ink">{m.label}.</strong> {m.detail}
            </li>
          ))}
        </ul>
      </section>

      {/* Break-even value engine */}
      {model.breakEven && model.cheapestWalkInPence !== null ? (
        <BreakEvenCalculator
          walkInPence={model.cheapestWalkInPence}
          tiers={priorityPassTiers(model.priorityPass)}
          airportName={name}
        />
      ) : null}

      <SavesVerdict
        amount={
          model.breakEven?.verdict === "membership" && model.breakEven.savingsPence > 0
            ? formatPence(model.breakEven.savingsPence)
            : undefined
        }
        verdict={breakEvenVerdict(model)}
      />

      {/* Fail-closed, "Ad"-labelled Priority Pass block — renders nothing while dormant. */}
      <AffiliateBlock itemKey={model.airport.slug} />

      {/* Priority Pass tiers reference */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Priority Pass tiers</h2>
        <FeeGrid
          caption={`Published Priority Pass membership tiers (verified ${model.priorityPass.verifiedAt}). Compare against the walk-in prices above.`}
          columns={["Tier", "Annual fee", "Included visits", "Per extra visit"]}
          numericColumns={[1, 3]}
          rows={model.priorityPass.tiers.map((t) => [
            t.tier,
            formatPence(t.annualFeePence),
            t.includedVisits === null ? "Unlimited" : String(t.includedVisits),
            formatPence(t.perVisitPence),
          ])}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <FamilyLinks airportName={name} />

      <p className="text-sm">
        <Link href="/lounge-access" className="text-brand-accent underline underline-offset-4">
          ← All UK airport lounges
        </Link>
      </p>

      <SourcesBlock
        sources={[
          { label: `${name} lounge source`, url: model.record.sourceUrl, verifiedAt: model.record.verifiedAt },
          {
            label: "Priority Pass membership tiers",
            url: model.priorityPass.sourceUrl,
            verifiedAt: model.priorityPass.verifiedAt,
          },
        ]}
        method="Lounge names, walk-in prices and access methods come from the operator's or airport's own official page. Priority Pass tiers come from prioritypass.com. We never publish a price without an official source and a verification date."
      />
    </article>
  );
}
