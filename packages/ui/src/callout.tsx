import type { ReactNode } from "react";

const styles = {
  free: { wrap: "border-positive/25 bg-green-50 dark:bg-positive/[0.08] dark:border-positive/20", dot: "bg-positive", glow: "0 0 0 1px rgb(22 163 74 / 0.06), var(--shadow-card)" },
  warning: { wrap: "border-warning/25 bg-amber-50 dark:bg-warning/[0.08] dark:border-warning/20", dot: "bg-warning", glow: "0 0 0 1px rgb(180 83 9 / 0.06), var(--shadow-card)" },
  info: { wrap: "border-brand-accent/25 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20", dot: "bg-brand-accent", glow: "0 0 0 1px rgb(37 99 235 / 0.06), var(--shadow-card)" }
} as const;

export function Callout({
  variant,
  title,
  children,
  titleAs = "p"
}: {
  variant: keyof typeof styles;
  title: string;
  children: ReactNode;
  /** Most Callouts are a transient aside (a conditional warning, a data-quality note) and
   *  correctly render their title as a plain `<p>` — promoting every one to a heading would
   *  spam the page's heading outline. When a call site genuinely uses a Callout as a page
   *  section (e.g. a "Heat pump vs gas boiler" comparison block that would otherwise be the
   *  only unlabelled section on the page), pass `titleAs="h2"` / `"h3"` so it's discoverable
   *  by screen-reader heading navigation. No visual change either way. */
  titleAs?: "p" | "h2" | "h3";
}) {
  const s = styles[variant];
  const Title = titleAs;
  return (
    <div className={`rounded-card border p-5 ${s.wrap}`} style={{ boxShadow: s.glow }}>
      <div className="flex items-start gap-3">
        <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div>
          <Title className="font-semibold text-ink">{title}</Title>
          <div className="mt-1 text-sm leading-relaxed text-ink-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}
