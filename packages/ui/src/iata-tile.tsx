/** Small monogram tile carrying an IATA (or any 3-letter) code. Decorative anchor for list rows. */
export function IataTile({ code, className }: { code: string; className?: string }) {
  return (
    <span aria-hidden className={`mf-num inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md bg-brand/5 px-1.5 text-[11px] font-semibold tracking-wide text-brand-strong ring-1 ring-brand-strong/15 ${className ?? ""}`}>{code}</span>
  );
}
