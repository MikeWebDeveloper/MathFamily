import type { ReactNode } from "react";

const styles = {
  free: { wrap: "border-positive/25 bg-green-50", dot: "bg-positive", glow: "0 0 0 1px rgb(22 163 74 / 0.06), var(--shadow-card)" },
  warning: { wrap: "border-warning/25 bg-amber-50", dot: "bg-warning", glow: "0 0 0 1px rgb(180 83 9 / 0.06), var(--shadow-card)" },
  info: { wrap: "border-brand-accent/25 bg-blue-50", dot: "bg-brand-accent", glow: "0 0 0 1px rgb(37 99 235 / 0.06), var(--shadow-card)" }
} as const;

export function Callout({ variant, title, children }: { variant: keyof typeof styles; title: string; children: ReactNode }) {
  const s = styles[variant];
  return (
    <div className={`rounded-card border p-5 ${s.wrap}`} style={{ boxShadow: s.glow }}>
      <div className="flex items-start gap-3">
        <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <div className="mt-1 text-sm leading-relaxed text-ink-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}
