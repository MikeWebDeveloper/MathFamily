import { BrandLogo } from "./brand-logo";

export function SiteHeader({
  brandName,
  brandPrefix,
  links
}: {
  brandName: string;
  brandPrefix?: string;
  links: { label: string; href: string }[];
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-ink/10 bg-white/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgb(15 23 42 / 0.04), 0 6px 16px -10px rgb(15 23 42 / 0.18)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <a href="/" aria-label={`${brandName} home`} className="transition-opacity hover:opacity-80">
          {brandPrefix ? <BrandLogo prefix={brandPrefix} /> : (
            <span className="text-lg font-bold tracking-tight text-brand">{brandName}</span>
          )}
        </a>
        <nav aria-label="Main" className="flex gap-5 text-sm font-medium text-ink-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
