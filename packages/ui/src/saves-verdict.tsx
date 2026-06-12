/** The family signature: a sourced "Saves £X" verdict. Tinted card, bold mono figure + plain sentence. */
export function SavesVerdict({ amount, verdict }: { amount?: string; verdict: string }) {
  return (
    <div className="mf-edge mf-rise-in flex items-center gap-4 rounded-card border-l-4 border-l-positive bg-positive/[0.06] p-4 sm:p-5">
      {amount ? (
        <div className="shrink-0 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-positive/80">Saves</p>
          <p className="mf-num text-2xl font-bold text-positive sm:text-3xl">{amount}</p>
        </div>
      ) : null}
      <p className="text-sm font-medium leading-snug text-ink sm:text-base">{verdict}</p>
    </div>
  );
}
