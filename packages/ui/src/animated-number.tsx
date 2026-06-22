"use client";

import { useEffect, useRef, useState } from "react";

/** Count-up numeric output. Defaults to 250ms ease-out; calculator sites pass
 *  `dur={500}` for a more deliberate "machine arriving at truth" feel.
 *  Instant under reduced motion, on first render, or when either side is null.
 *
 *  @param dur  Animation duration in ms (default 250). Ignored under reduced-motion.
 */
export function AnimatedNumber({
  pence,
  render,
  dur = 250,
}: {
  pence: number | null;
  render: (pence: number | null) => string;
  dur?: number;
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
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (pence - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pence, dur]);
  return <span className="mf-num">{render(display)}</span>;
}
