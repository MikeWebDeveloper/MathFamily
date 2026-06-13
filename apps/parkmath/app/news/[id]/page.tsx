import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadNewsDataset, newsById, loadAirports } from "@mathfamily/data";
import { newsArticleLd, breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { PageHeading, SourceCitation } from "@mathfamily/ui";

export const dynamicParams = false;
export function generateStaticParams() {
  return loadNewsDataset().items.map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = newsById(id);
  if (!item) return {};
  return {
    title: `${item.title} — ParkMath update`,
    description: item.summary,
    alternates: { canonical: `/news/${id}` },
    openGraph: { type: "article", publishedTime: item.publishedAt, modifiedTime: item.verifiedAt }
  };
}

export default async function NewsItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = newsById(id);
  if (!item) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/news/${item.id}`;
  const airport = item.airportSlug ? loadAirports().find((a) => a.slug === item.airportSlug) : null;
  const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <article className="space-y-5">
      <JsonLd data={newsArticleLd({ headline: item.title, description: item.summary, url, datePublished: item.publishedAt, dateModified: item.verifiedAt, sourceUrl: item.sourceUrl, siteUrl, imageUrl: `${siteUrl}/opengraph-image` })} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl }, { name: "Updates", url: `${siteUrl}/news` }, { name: item.title, url }
      ])} />

      <header className="space-y-3">
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <Link href="/news" className="text-brand-accent underline underline-offset-4">Updates</Link> ·
          <time dateTime={item.publishedAt}>{fmt(item.publishedAt)}</time>
        </p>
        <PageHeading>{item.title}</PageHeading>
        <p className="text-lead text-ink">{item.summary}</p>
        <SourceCitation url={item.sourceUrl} label={item.sourceLabel} />
      </header>

      {item.change ? (
        <div className="mf-edge rounded-card bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{item.change.label}</p>
          <p className="mf-num mt-1 text-2xl font-bold text-ink">
            <span className="text-ink-muted line-through">{item.change.from}</span> <span aria-hidden>→</span> {item.change.to}
          </p>
        </div>
      ) : null}

      {item.body ? <div className="prose-sm max-w-none text-ink">{item.body}</div> : null}

      {airport ? (
        <p className="text-sm">
          <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
            See {airport.name}&apos;s current drop-off charge →
          </Link>
        </p>
      ) : null}
      <p className="text-sm">
        <Link href="/news" className="text-brand-accent underline underline-offset-4">← All updates</Link>
      </p>
    </article>
  );
}
