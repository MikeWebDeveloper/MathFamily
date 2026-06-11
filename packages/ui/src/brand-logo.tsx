"use client";

import { useEffect, useState } from "react";

/** The =Math family glyph: a calculator key carrying an equals sign.
 *  Top bar takes the brand accent (per-brand); bottom bar is constant white. */
export function MathGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="mf-logo-tile shrink-0">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--color-brand)" />
      <rect x="9" y="11.5" width="14" height="3.4" rx="1.7" fill="var(--color-brand-accent)" className="mf-logo-bar-top" />
      <rect x="9" y="17.5" width="14" height="3.4" rx="1.7" fill="#ffffff" className="mf-logo-bar-bottom" />
    </svg>
  );
}

/** Family wordmark: [=] {Prefix}Math. Entrance animation runs once per session. */
export function BrandLogo({ prefix }: { prefix: string }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("mf-logo-seen")) {
        sessionStorage.setItem("mf-logo-seen", "1");
        setAnimate(true);
      }
    } catch {
      /* storage unavailable — render static */
    }
  }, []);
  return (
    <span className={`inline-flex items-center gap-2 ${animate ? "mf-logo-animate" : ""}`}>
      <MathGlyph />
      <span className="text-lg font-bold tracking-tight">
        <span className="text-brand">{prefix}</span>
        <span className="text-ink">Math</span>
      </span>
    </span>
  );
}
