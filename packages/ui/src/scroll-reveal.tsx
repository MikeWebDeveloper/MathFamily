"use client";

import { useEffect } from "react";

/**
 * Mount once per page. Observes every `.mf-reveal` element and adds `.mf-in`
 * when it scrolls into view, producing the staggered rise-in. No-JS and
 * reduced-motion users see content immediately (handled in tokens.css).
 */
export function ScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mf-reveal:not(.mf-in)"));
    if (nodes.length === 0) return;

    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("mf-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("mf-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    nodes.forEach((n) => observer.observe(n));

    // Safety net: content must NEVER stay invisible. If the observer hasn't
    // revealed a node within 1.5s (odd scroll containers, layout quirks), force it.
    const fallback = window.setTimeout(() => nodes.forEach((n) => n.classList.add("mf-in")), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
