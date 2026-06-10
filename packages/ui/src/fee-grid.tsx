import type { ReactNode } from "react";

export function FeeGrid({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div
      className="overflow-hidden rounded-card border border-ink/10 bg-white"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {caption ? <caption className="px-5 pt-4 text-left text-xs text-ink-muted">{caption}</caption> : null}
          <thead className="border-b border-ink/10 bg-surface text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              {columns.map((c, j) => (
                <th key={c} scope="col" className={`px-5 py-3.5 font-semibold ${j > 0 ? "text-right" : ""}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr
                key={i}
                className="border-b border-ink/5 transition-colors duration-150 odd:bg-white even:bg-surface/40 hover:bg-brand-accent/[0.06]"
              >
                {cells.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-5 py-3.5 font-semibold text-ink">{cell}</th>
                  ) : (
                    <td key={j} className="mf-num px-5 py-3.5 text-right text-ink-muted">{cell}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
