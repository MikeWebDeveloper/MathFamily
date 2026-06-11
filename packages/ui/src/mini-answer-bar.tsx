"use client";

import { useEffect, useState } from "react";

/** Slim sticky bar that appears once #mf-answer-anchor (the AnswerCard, or any
 *  element given that id) has scrolled above the viewport — the answer never
 *  leaves the screen. */
export function MiniAnswerBar({ summary, verified }: { summary: string; verified?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const anchor = document.getElementById("mf-answer-anchor");
    if (!anchor || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setShow(!e.isIntersecting && e.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);
  return (
    <div
      data-testid="mini-answer-bar"
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-200 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-t border-white/10 bg-brand/95 px-4 py-2.5 text-white backdrop-blur">
        <span className="mf-num truncate text-sm font-semibold">{summary}</span>
        {verified ? <span className="shrink-0 text-xs font-semibold text-emerald-300">✓ verified</span> : null}
      </div>
    </div>
  );
}
