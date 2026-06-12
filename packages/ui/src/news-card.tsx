import type { NewsItem } from "@mathfamily/data";

const CATEGORY_LABEL: Record<NewsItem["category"], string> = {
  "fee-change": "Fee change", parking: "Parking", lounge: "Lounge", "terminal-works": "Terminal works",
  "drop-off-zone": "Drop-off zone", strike: "Strike", closure: "Closure", "rule-change": "Rule change",
  delay: "Delay", other: "Update"
};

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** A single news item as a tappable card. Answer-first: headline + dated summary + before→after. */
export function NewsCard({ item, href }: { item: NewsItem; href: string }) {
  return (
    <article className="mf-edge mf-sheen mf-press rounded-card bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 sm:p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <a href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand/5 px-2 py-0.5 font-semibold text-brand ring-1 ring-brand/10">{CATEGORY_LABEL[item.category]}</span>
          <time dateTime={item.publishedAt} className="text-ink-muted">{fmtDate(item.publishedAt)}</time>
        </div>
        <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{item.summary}</p>
        {item.change ? (
          <p className="mf-num mt-2 inline-flex items-center gap-2 text-sm">
            <span className="text-ink-muted">{item.change.label}:</span>
            <span className="text-ink-muted line-through">{item.change.from}</span>
            <span aria-hidden>→</span>
            <span className="font-semibold text-ink">{item.change.to}</span>
          </p>
        ) : null}
      </a>
    </article>
  );
}
