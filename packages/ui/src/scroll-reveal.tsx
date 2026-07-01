"use client";

import { useEffect } from "react";

/**
 * Mount once per page. Observes every `.mf-reveal` element and adds `.mf-in`
 * when it scrolls into view, producing the staggered rise-in. Also toggles
 * `.mf-paused` on `[data-mf-loop]` elements so infinite loop animations
 * (edge shine, radar pulse) pause while off-screen. No-JS and reduced-motion
 * users see content immediately (handled in tokens.css).
 */
export function ScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mf-reveal:not(.mf-in)"));
    const loops = Array.from(document.querySelectorAll<HTMLElement>("[data-mf-loop]"));

    const reduced =
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      nodes.forEach((n) => n.classList.add("mf-in"));
      return;
    }

    let observer: IntersectionObserver | null = null;
    if (nodes.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("mf-in");
              observer?.unobserve(entry.target);
            }
          }
        },
        // Generous rootMargin: reveal ~200px BEFORE a section enters the viewport
        // (rather than requiring it to already be 8% in), so a fast flick/jump
        // scroll can't outrun the observer and leave content visibly blank —
        // the section is already revealed by the time it's actually on-screen.
        { rootMargin: "200px 0px", threshold: 0 }
      );
      nodes.forEach((n) => observer?.observe(n));
    }

    // Looping animations (edge shine, radar pulse) pause while off-screen.
    let loopObserver: IntersectionObserver | null = null;
    if (loops.length > 0) {
      loopObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("mf-paused", !entry.isIntersecting);
        }
      });
      loops.forEach((n) => loopObserver?.observe(n));
    }

    // Safety net: content must NEVER stay invisible. If the observer hasn't
    // revealed a node within 1.5s (odd scroll containers, layout quirks), force it.
    const fallback = window.setTimeout(() => nodes.forEach((n) => n.classList.add("mf-in")), 1500);

    return () => {
      observer?.disconnect();
      loopObserver?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
