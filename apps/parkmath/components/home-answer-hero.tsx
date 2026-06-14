"use client";

import { useEffect, useState } from "react";
import { AnswerCard } from "@mathfamily/ui";
import { formatPence } from "@mathfamily/engine";

/** The bento hero answer with an entrance count-up. Lives in a client boundary
 *  so the formatter never crosses RSC. State is initialised to the final value,
 *  so SSR / no-JS / a throttled rAF all show the correct figure — the rise is
 *  pure enhancement. Instant under reduced motion. */
export function HomeAnswerHero({
  label,
  pence,
  note,
  compareHref,
  compareCount
}: {
  label: string;
  pence: number;
  note: string;
  compareHref: string;
  compareCount: number;
}) {
  const [value, setValue] = useState(pence);
  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(pence);
      return;
    }
    let raf = 0;
    let start = 0;
    const dur = 700;
    const tick = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / dur);
      setValue(Math.round(pence * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pence]);

  return (
    <AnswerCard
      label={label}
      value={formatPence(value)}
      note={note}
      footer={
        <a href={compareHref} className="font-semibold text-white underline-offset-2 hover:underline">
          Compare all {compareCount} airports <span aria-hidden>→</span>
        </a>
      }
    />
  );
}
