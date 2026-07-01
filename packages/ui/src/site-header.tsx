"use client";

import { useState, useEffect } from "react";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  brandName,
  brandPrefix,
  links,
  currentPath
}: {
  brandName: string;
  brandPrefix?: string;
  links: { label: string; href: string }[];
  /** Optional: pass the current pathname (e.g. from Next.js usePathname or the page props) to
   *  enable active-link highlighting. When omitted, the component reads window.location.pathname
   *  on the client so SSR renders without active state and hydration applies it. */
  currentPath?: string;
}) {
  const [open, setOpen] = useState(false);
  // SSR-safe: start with the prop value (can be passed from server), fall back to window on client.
  const [pathname, setPathname] = useState(currentPath ?? "");

  useEffect(() => {
    // If no prop was provided, read the actual current path on the client.
    if (!currentPath) {
      setPathname(window.location.pathname);
    }
  }, [currentPath]);

  const isActive = (href: string) => pathname ? (href === "/" ? pathname === "/" : pathname.startsWith(href)) : false;

  // Escape closes the mobile disclosure — the standard "escape route" a disclosure widget
  // is expected to honour, even though the trigger button itself already toggles it shut.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className="mf-header-shadow sticky top-0 z-40 border-b border-ink/10 bg-card/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgb(15 23 42 / 0.04), 0 6px 16px -10px rgb(15 23 42 / 0.18)" }}
    >
      {/* First focusable stop on the page: lets keyboard/screen-reader users bypass the
       *  header nav straight to <main id="main-content">. Visually hidden until focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <a href="/" aria-label={`${brandName} home`} className="shrink-0 transition-opacity hover:opacity-80">
          {brandPrefix ? <BrandLogo prefix={brandPrefix} /> : (
            <span className="text-lg font-bold tracking-tight text-brand-strong">{brandName}</span>
          )}
        </a>

        {/* Desktop / tablet inline nav */}
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm font-medium text-ink-muted sm:flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`-my-2 inline-flex min-h-11 items-center whitespace-nowrap py-2 transition-colors hover:text-accent-strong${active ? " font-semibold text-ink underline underline-offset-4 decoration-brand-accent/50" : ""}`}
              >
                {l.label}
              </a>
            );
          })}
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
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center border-b border-ink/5 text-sm font-medium last:border-b-0 hover:text-accent-strong${active ? " font-semibold text-accent-strong" : " text-ink"}`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
