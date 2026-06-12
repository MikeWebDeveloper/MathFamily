import type { Metadata } from "next";
import Link from "next/link";
import { recentNews } from "@mathfamily/data";
import { itemListLd, breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { NewsCard, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport updates & news — drop-off, parking & lounge changes",
  description:
    "Dated, official-sourced updates to UK airport drop-off charges, parking, lounges and operations — verified and tracked by ParkMath.",
  alternates: { canonical: "/news" },
};

export default function NewsHubPage() {
  const items = recentNews();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Updates", url: `${siteUrl}/news` },
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "UK airport updates",
          items: items.map((i) => ({
            name: i.title,
            url: `${siteUrl}/news/${i.id}`,
          })),
        })}
      />
      <header className="space-y-2">
        <PageHeading>UK airport updates</PageHeading>
        <p className="text-ink-muted">
          Every change we track — drop-off fees, parking, lounges and airport
          operations — dated and sourced from official pages.
        </p>
      </header>
      {items.length === 0 ? (
        <p className="rounded-card bg-surface p-6 text-sm text-ink-muted">
          No updates published yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <NewsCard key={i.id} item={i} href={`/news/${i.id}`} />
          ))}
        </div>
      )}
      <p className="text-sm">
        <Link
          href="/drop-off-charges"
          className="text-brand-accent underline underline-offset-4"
        >
          Compare every UK airport&apos;s drop-off charge →
        </Link>
      </p>
    </article>
  );
}
