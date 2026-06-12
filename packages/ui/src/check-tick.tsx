/** Brand check tick — the FreshnessBadge/MiniAnswerBar verified mark. Draws itself once (mf-tick). */
export function CheckTick({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={className ?? "h-3 w-3 shrink-0"} fill="none">
      <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mf-tick" />
    </svg>
  );
}
