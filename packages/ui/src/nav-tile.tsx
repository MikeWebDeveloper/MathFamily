import type { CSSProperties, ReactNode } from "react";

export interface NavTileData {
  href: string;
  title: string;
  descriptor?: string;
  icon?: ReactNode;
  download?: boolean;
}

type Variant = "primary" | "secondary";

export function NavTile({ href, title, descriptor, icon, download, variant = "primary" }: NavTileData & { variant?: Variant }) {
  if (variant === "secondary") {
    return (
      <a
        href={href}
        {...(download ? { download: "" } : {})}
        className="mf-edge mf-sheen mf-press group flex items-center gap-2.5 rounded-card bg-card p-4 text-sm outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {icon ? <span aria-hidden className="shrink-0 text-accent-strong/80">{icon}</span> : null}
        <span className="font-semibold text-ink transition-colors group-hover:text-accent-strong">{title}</span>
      </a>
    );
  }
  return (
    <a
      href={href}
      {...(download ? { download: "" } : {})}
      className="mf-glint mf-sheen mf-press group relative flex h-full flex-col gap-2 rounded-card bg-brand p-5 text-white outline-none ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/50"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
      <span aria-hidden className="mf-glint__sweep" />
      {icon ? <span aria-hidden className="text-white/90">{icon}</span> : null}
      <span className="text-base font-semibold">{title}</span>
      {descriptor ? <span className="text-sm text-white/70">{descriptor}</span> : null}
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-white/90">
        Open <span aria-hidden>→</span>
      </span>
    </a>
  );
}

export function NavTileGrid({ tiles, variant = "primary" }: { tiles: NavTileData[]; variant?: Variant }) {
  const cols = variant === "primary" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {tiles.map((t, i) => (
        <div key={t.href} className="mf-reveal h-full" style={{ "--mf-delay": `${i * 40}ms` } as CSSProperties}>
          <NavTile {...t} variant={variant} />
        </div>
      ))}
    </div>
  );
}
