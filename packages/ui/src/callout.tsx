import type { ReactNode } from "react";

// tint backgrounds use Tailwind palette values (outside the token system) — revisit at design-system refinement
const styles = {
  free: "border-positive/30 bg-green-50",
  warning: "border-warning/30 bg-amber-50",
  info: "border-brand-accent/30 bg-blue-50"
} as const;

export function Callout({ variant, title, children }: { variant: keyof typeof styles; title: string; children: ReactNode }) {
  return (
    <div className={`rounded-card border p-4 ${styles[variant]}`}>
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-1 text-sm text-ink-muted">{children}</div>
    </div>
  );
}
