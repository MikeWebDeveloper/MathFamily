"use client";

import { useEffect, useRef, useState } from "react";

/** Count-up numeric output (~250ms, ease-out). Instant under reduced motion,
 *  on first render, or when either side of the transition is null. */
export function AnimatedNumber({
  pence,
  render
}: {
  pence: number | null;
  render: (pence: number | null) => string;
}) {
  const [display, setDisplay] = useState(pence);
  const prev = useRef(pence);
  useEffect(() => {
    const from = prev.current;
    prev.current = pence;
    if (
      pence === null ||
      from === null ||
      from === pence ||
      (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setDisplay(pence);
      return;
    }
    const start = performance.now();
    const dur = 250;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (pence - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pence]);
  return <span className="mf-num">{render(display)}</span>;
}
