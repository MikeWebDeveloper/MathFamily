"use client";

import { useEffect, useState } from "react";
import { CheckTick } from "./check-tick";

/** Slim sticky bar that appears once #mf-answer-anchor (the AnswerCard, or any
 *  element given that id) has scrolled above the viewport — the answer never
 *  leaves the screen.
 *  my-0! — parent `space-y-*` margins enter the position equation of a
 *  bottom-fixed element and would leave a sliver of the bar visible. */
export function MiniAnswerBar({ summary, verified }: { summary: string; verified?: boolean }) {
  const [show, setShow] = useState(false);
  const [liveSummary, setLiveSummary] = useState(summary);
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
  useEffect(() => {
    const onLive = (e: Event) => setLiveSummary((e as CustomEvent<string>).detail || summary);
    window.addEventListener("mf-live-answer", onLive);
    return () => window.removeEventListener("mf-live-answer", onLive);
  }, [summary]);
  return (
    <div
      data-testid="mini-answer-bar"
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-50 my-0! transition-transform duration-200 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-t border-white/10 bg-brand/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-white backdrop-blur">
        <span className="mf-num truncate text-sm font-semibold">{liveSummary}</span>
        {verified ? <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300"><CheckTick className="h-3.5 w-3.5 text-emerald-300" /> verified</span> : null}
      </div>
    </div>
  );
}
