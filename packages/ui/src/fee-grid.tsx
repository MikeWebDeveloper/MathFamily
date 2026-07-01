import type { ReactNode } from "react";

export function FeeGrid({
  columns,
  rows,
  caption,
  highlightRow,
  numericColumns,
  rowHref,
  highlightColumn,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlightRow?: number;
  /** 0-based column indices holding numeric data. Omitted ⇒ every column > 0 is numeric (back-compat). */
  numericColumns?: number[];
  /** Optional per-row URL factory. When provided, each card becomes a whole-card link and the
   *  table name cell becomes an anchor. Rows where the factory returns undefined are not linked. */
  rowHref?: (rowIndex: number) => string | undefined;
  /** 0-based column index to tint with .mf-col-hi (brand-accent 6% background). */
  highlightColumn?: number;
}) {
  const isNumeric = (j: number) => (numericColumns ? numericColumns.includes(j) : j > 0);
  const colHi = (j: number) => (j === highlightColumn ? " mf-col-hi" : "");
  const numCell = (j: number) => j === 1
    ? "px-3 py-3 text-right text-sm font-bold text-ink mf-num sm:px-5 sm:py-3.5"
    : "px-3 py-3 text-right text-sm font-medium text-ink mf-num sm:px-5 sm:py-3.5";
  const proseCell = "px-3 py-3 text-left text-sm text-ink-muted sm:px-5 sm:py-3.5";
  const winnerRow =
    "mf-winner-row bg-brand-accent/[0.07] font-semibold odd:bg-brand-accent/[0.07] even:bg-brand-accent/[0.07]";

  return (
    <div className="mf-edge overflow-hidden rounded-card bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      {caption ? <p className="px-4 pt-4 text-xs text-ink-muted sm:px-5">{caption}</p> : null}

      {/* md+ : the precise instrument table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="border-b border-ink/10 bg-surface text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              {columns.map((c, j) => (
                <th key={c} scope="col" className={`px-5 py-3.5 font-semibold ${isNumeric(j) ? "text-right" : ""}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr
                key={i}
                className={`border-b border-ink/5 transition-[background-color,box-shadow] duration-150 odd:bg-card even:bg-surface/40 hover:bg-brand-accent/[0.06] hover:shadow-[inset_2px_0_0_0_var(--color-brand-accent)] ${
                  i === highlightRow ? winnerRow : ""
                }`}
              >
                {cells.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-5 py-3.5 font-semibold text-ink">
                      {rowHref?.(i) ? (
                        <a href={rowHref(i)!} className="mf-press text-ink no-underline outline-none hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-brand-accent/40">{cell}</a>
                      ) : cell}
                    </th>
                  ) : (
                    <td key={j} className={`${isNumeric(j) ? numCell(j) : proseCell}${colHi(j)}`}>{cell}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < md : card-rows — no horizontal scroll, each row is one tappable-feeling card */}
      <div data-testid="fee-grid-cards" className="divide-y divide-ink/5 md:hidden">
        {rows.map((cells, i) => {
          // On a single-numeric-column grid (e.g. per-network roaming tables) the row's own
          // context already disambiguates the hero figure, so no caption is needed. On a
          // multi-numeric-column grid (e.g. cabin + checked bag fees) the hero figure is
          // ambiguous without its column name — show a small caption for it there only.
          const numericIdxs = cells.map((_, j) => j).filter((j) => j > 0 && isNumeric(j));
          const heroIdx = numericIdxs[0] ?? -1;
          const heroNeedsLabel = numericIdxs.length > 1;
          return (
            <div
              key={i}
              data-testid="fee-grid-card"
              className={`px-4 py-3.5${rowHref?.(i) ? " relative" : ""} ${i === highlightRow ? winnerRow : ""}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                {rowHref?.(i) ? (
                  <a href={rowHref(i)!} className="mf-row-link font-semibold text-ink">{cells[0]}</a>
                ) : (
                  <span className="font-semibold text-ink">{cells[0]}</span>
                )}
                {heroIdx > 0 ? (
                  <span className="shrink-0 text-right">
                    {heroNeedsLabel ? (
                      <span className="block text-[11px] font-medium text-ink-muted">{columns[heroIdx]}</span>
                    ) : null}
                    <span className="mf-num block text-lg font-bold text-ink">{cells[heroIdx]}</span>
                  </span>
                ) : null}
              </div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                {cells.map((cell, j) => {
                  if (j === 0 || j === heroIdx) return null; // heroIdx already shown as the hero figure
                  return (
                    <div key={j} className="contents">
                      <dt className="text-ink-muted">{columns[j]}</dt>
                      <dd className={isNumeric(j) ? "mf-num text-right text-ink" : "text-ink"}>{cell}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
