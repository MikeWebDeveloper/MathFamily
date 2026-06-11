import type { ReactNode } from "react";

/** The one-per-page hero answer: navy showpiece with the shining edge.
 *  Carries id="mf-answer-anchor" — MiniAnswerBar observes it. */
export function AnswerCard({
  label,
  value,
  note,
  footer
}: {
  label: string;
  value: string;
  note?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      id="mf-answer-anchor"
      data-mf-loop
      className="mf-edge-shine mf-rise-in relative overflow-hidden rounded-card bg-brand p-5 sm:p-7 text-white"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mf-num-display mt-2 text-display font-bold">{value}</p>
      {note ? <p className="mt-3 text-sm text-white/80">{note}</p> : null}
      {footer ? <div className="mt-4 border-t border-white/15 pt-3 text-sm text-white/80">{footer}</div> : null}
    </div>
  );
}
