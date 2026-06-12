import type { ReactNode } from "react";
import { AnimatedNumber } from "./animated-number";

/** The one-per-page hero answer: navy showpiece with the shining edge.
 *  Carries id="mf-answer-anchor" — MiniAnswerBar observes it.
 *
 *  Optional count-up: pass `pence` (raw integer pence value) + `render`
 *  (formatter) to activate a one-shot count-up animation on first paint.
 *  Reduced-motion and JS-off both stay instant/static. Call sites that
 *  only pass `value` are completely unaffected. */
export function AnswerCard({
  label,
  value,
  note,
  footer,
  pence,
  render
}: {
  label: string;
  value: string;
  note?: string;
  footer?: ReactNode;
  pence?: number | null;
  render?: (p: number | null) => string;
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
      <p className="mf-num-display mt-2 text-display font-bold">
        {pence != null && render != null
          ? <AnimatedNumber pence={pence} render={render} />
          : value}
      </p>
      {note ? <p className="mt-3 text-sm text-white/80">{note}</p> : null}
      {footer ? <div className="mt-4 border-t border-white/15 pt-3 text-sm text-white/80">{footer}</div> : null}
    </div>
  );
}
