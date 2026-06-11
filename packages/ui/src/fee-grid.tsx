import type { ReactNode } from "react";

export function FeeGrid({
  columns,
  rows,
  caption,
  highlightRow,
  numericColumns
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlightRow?: number;
  /** 0-based column indices holding numeric data. Omitted ⇒ every column > 0 is numeric (back-compat). */
  numericColumns?: number[];
}) {
  const isNumeric = (j: number) => (numericColumns ? numericColumns.includes(j) : j > 0);
  const numCell = "px-3 py-3 text-right text-sm font-medium text-ink mf-num sm:px-5 sm:py-3.5";
  const proseCell = "px-3 py-3 text-left text-sm text-ink-muted sm:px-5 sm:py-3.5";
  const winnerRow =
    "mf-winner-row bg-brand-accent/[0.07] font-semibold odd:bg-brand-accent/[0.07] even:bg-brand-accent/[0.07]";

  return (
    <div className="mf-edge overflow-hidden rounded-card bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
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
                className={`border-b border-ink/5 transition-[background-color,box-shadow] duration-150 odd:bg-white even:bg-surface/40 hover:bg-brand-accent/[0.06] hover:shadow-[inset_2px_0_0_0_var(--color-brand-accent)] ${
                  i === highlightRow ? winnerRow : ""
                }`}
              >
                {cells.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-5 py-3.5 font-semibold text-ink">{cell}</th>
                  ) : (
                    <td key={j} className={isNumeric(j) ? numCell : proseCell}>{cell}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < md : card-rows — no horizontal scroll, each row is one tappable-feeling card */}
      <div data-testid="fee-grid-cards" className="divide-y divide-ink/5 md:hidden">
        {rows.map((cells, i) => (
          <div
            key={i}
            data-testid="fee-grid-card"
            className={`px-4 py-3.5 ${i === highlightRow ? winnerRow : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-ink">{cells[0]}</span>
              {(() => {
                const heroIdx = cells.findIndex((_, j) => j > 0 && isNumeric(j));
                return heroIdx > 0 ? <span className="mf-num shrink-0 text-base font-semibold text-ink">{cells[heroIdx]}</span> : null;
              })()}
            </div>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {cells.map((cell, j) => {
                if (j === 0) return null;
                const heroIdx = cells.findIndex((_, k) => k > 0 && isNumeric(k));
                if (j === heroIdx) return null; // already shown as the hero figure
                return (
                  <div key={j} className="contents">
                    <dt className="text-ink-muted">{columns[j]}</dt>
                    <dd className={isNumeric(j) ? "mf-num text-right text-ink" : "text-ink"}>{cell}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
