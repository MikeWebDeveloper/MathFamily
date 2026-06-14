"use client";

import { useEffect, useRef } from "react";

/** Command-style search field: leading search icon, a ⌘K affordance, soft
 *  surface. Controlled (value + onChange). The hero input for the modern
 *  dashboard. Press ⌘K / Ctrl-K anywhere to focus it (set hotkey={false} to
 *  opt out — e.g. when more than one is mounted). */
export function CommandSearch({
  value,
  onChange,
  placeholder = "Search…",
  hint = "⌘K",
  ariaLabel = "Search",
  onSubmit,
  hotkey = true
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string | null;
  ariaLabel?: string;
  onSubmit?: (v: string) => void;
  hotkey?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 inline-flex -translate-y-1/2 text-ink-muted">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </span>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit(value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-feature border border-ink/15 bg-card py-3 pl-11 pr-16 text-base text-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        style={{ boxShadow: "var(--shadow-soft)" }}
      />
      {hint ? (
        <kbd
          aria-hidden
          className="mf-num pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-ink/10 px-1.5 py-0.5 text-[11px] text-ink-muted"
        >
          {hint}
        </kbd>
      ) : null}
    </div>
  );
}
