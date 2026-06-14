"use client";

import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  brandName,
  brandPrefix,
  links
}: {
  brandName: string;
  brandPrefix?: string;
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="mf-header-shadow sticky top-0 z-40 border-b border-ink/10 bg-card/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgb(15 23 42 / 0.04), 0 6px 16px -10px rgb(15 23 42 / 0.18)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <a href="/" aria-label={`${brandName} home`} className="shrink-0 transition-opacity hover:opacity-80">
          {brandPrefix ? <BrandLogo prefix={brandPrefix} /> : (
            <span className="text-lg font-bold tracking-tight text-brand-strong">{brandName}</span>
          )}
        </a>

        {/* Desktop / tablet inline nav */}
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm font-medium text-ink-muted sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="-my-2 inline-flex min-h-11 items-center whitespace-nowrap py-2 transition-colors hover:text-brand-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Mobile disclosure */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mf-mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/5 sm:hidden"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mf-mobile-nav" aria-label="Mobile" className="border-t border-ink/10 bg-card px-4 pb-3 pt-1 sm:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex min-h-11 items-center border-b border-ink/5 text-sm font-medium text-ink last:border-b-0 hover:text-brand-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
