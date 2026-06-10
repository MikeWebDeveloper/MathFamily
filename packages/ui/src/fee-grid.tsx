import type { ReactNode } from "react";

export function FeeGrid({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink/10">
      <table className="w-full text-left text-sm">
        {caption ? <caption className="p-3 text-left text-xs text-ink-muted">{caption}</caption> : null}
        <thead className="bg-surface text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((cells, i) => (
            <tr key={i} className="hover:bg-surface">
              {cells.map((cell, j) => (
                <td key={j} className="px-4 py-3 tabular-nums">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
