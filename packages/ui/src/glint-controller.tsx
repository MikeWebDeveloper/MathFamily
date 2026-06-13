"use client";

import { useEffect } from "react";

/**
 * Mount once per page (next to ScrollReveal). Fires a slow, occasional sweep on every
 * `.mf-glint` element at a randomised interval (~10s ±35%), and pauses while off-screen.
 * Inert under reduced motion or when IntersectionObserver is unavailable (jsdom/SSR).
 */
export function GlintController() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mf-glint"));
    if (nodes.length === 0) return;

    const visible = new WeakSet<HTMLElement>();
    const timers = new Map<HTMLElement, number>();
    const SWEEP_MS = 2000;
    const BASE_MS = 10000;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
    });
    nodes.forEach((n) => io.observe(n));

    const schedule = (n: HTMLElement) => {
      const jitter = BASE_MS * 0.35 * (Math.random() * 2 - 1);
      const delay = Math.max(4000, BASE_MS + jitter);
      timers.set(
        n,
        window.setTimeout(() => {
          if (visible.has(n)) {
            n.classList.add("is-glinting");
            window.setTimeout(() => n.classList.remove("is-glinting"), SWEEP_MS);
          }
          schedule(n);
        }, delay),
      );
    };
    nodes.forEach(schedule);

    return () => {
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return null;
}
