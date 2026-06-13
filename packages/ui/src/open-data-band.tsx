/** OpenDataBand — server component.
 * Renders a "Download the data (CSV)" link group and a "Cite this table" line.
 */

export interface OpenDataBandProps {
  /** One or more CSV download links: { href, label } */
  downloads: { href: string; label: string }[];
  /** Short citation string, e.g. `ParkMath, "UK airport drop-off charges 2026", verified 2026-06-14, parkmath.co.uk` */
  citation: string;
}

export function OpenDataBand({ downloads, citation }: OpenDataBandProps) {
  return (
    <aside className="rounded-lg border border-ink/10 bg-surface-muted px-4 py-3 text-sm">
      <p className="font-medium text-ink">Download the data (CSV, no sign-up)</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {downloads.map(({ href, label }) => (
          <li key={href}>
            <a
              href={href}
              download
              className="text-brand-accent underline underline-offset-4 hover:opacity-80"
            >
              {label} →
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-ink-muted">
        <span className="font-medium text-ink">Cite: </span>
        <span className="select-all font-mono text-xs">{citation}</span>
      </p>
    </aside>
  );
}
