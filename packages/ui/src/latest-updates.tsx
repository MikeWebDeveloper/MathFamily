import type { NewsItem } from "@mathfamily/data";
import { NewsCard } from "./news-card";

/** Inline "Latest updates" block. Renders nothing when there are no items. */
export function LatestUpdates({ items, heading }: { items: NewsItem[]; heading: string }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-h2 font-semibold text-ink">{heading}</h2>
      <div className="space-y-3">
        {items.map((i) => (
          <NewsCard key={i.id} item={i} href={`/news/${i.id}`} />
        ))}
      </div>
    </section>
  );
}
