"use client";

import { useCallback, useEffect, useState } from "react";

/** sessionStorage key — shared across all three content templates so dismissing the bar on one page
 *  (e.g. the drop-off page) keeps it dismissed for the rest of that browsing session, rather than
 *  re-appearing and re-annoying the same visitor on the very next page they click through to. */
const DISMISS_KEY = "mf-sticky-booking-dismissed";

/** Slim, mobile-only sticky bottom bar (CRO board `parkmath-cro-review-2026-08-02.md`, rec #2):
 *  the merchant block sits 36-51% down these page templates, so a visitor who doesn't scroll that
 *  far never sees a booking option at all. This shortens that path without a hard sell — it appears
 *  only after ~1 viewport of scroll, is dismissible, and its CTA smooth-scrolls to the EXISTING
 *  in-page merchant block (never a new/reordered list, never a direct `/go` link — the click stays
 *  informed and the `/go` event only fires from the real merchant CTA, not from this shortcut).
 *
 *  ≤64px tall, safe-area aware, and reserves its own height via a spacer div so it never covers
 *  content or shifts layout on load (it's not rendered/visible until the user has already scrolled
 *  past the threshold, so there's no first-paint CLS — only a user-triggered, animated reveal). */
export function StickyBookingBar({
  airportName,
  targetId,
  hook,
}: {
  airportName: string;
  /** id of the in-page merchant block to scroll to, e.g. "mf-merchant-block". */
  targetId: string;
  /** Optional factual override — must trace to a real figure already on the page. Falls back to a
   *  plain, non-numeric hook (no invented "X% off" — every price claim on this site is verified). */
  hook?: string;
}) {
  const [pastThreshold, setPastThreshold] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Every template this bar ships on already renders `<MiniAnswerBar>` (packages/ui), an existing
  // fixed-bottom, full-width strip with NO dismiss and a higher z-index (z-50) that appears once the
  // page's #mf-answer-anchor scrolls off-screen — which happens well before this bar's own 0.9-viewport
  // threshold on every page it's paired with. Left uncoordinated the two collide: MiniAnswerBar sits on
  // top and silently eats every tap on this bar's Compare/Dismiss buttons. Rather than ship a second,
  // competing floating bar, this bar stacks itself directly above MiniAnswerBar's measured height
  // whenever MiniAnswerBar is showing, so the two read as one coordinated bottom region — never an
  // overlap, and the guardrail against a page carrying two independent sticky surfaces still holds in
  // spirit (one bottom region, not two competing ones).
  const [stackOffsetPx, setStackOffsetPx] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // Storage can throw in locked-down/private-browsing contexts — fail open (bar can still show).
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      setPastThreshold(window.scrollY > window.innerHeight * 0.9);
      const miniBar = document.querySelector('[data-testid="mini-answer-bar"]');
      const isMiniBarShown = miniBar ? miniBar.getAttribute("aria-hidden") === "false" : false;
      setStackOffsetPx(isMiniBarShown ? (miniBar as HTMLElement).offsetHeight : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Best-effort only — worst case the bar re-shows next session, never breaks anything.
    }
  }, []);

  const scrollToMerchants = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [targetId],
  );

  const visible = pastThreshold && !dismissed;
  // ~52px is this bar's own rendered height (py-2 + text line + safe-area padding) — used only for
  // the spacer's reserved space; the bar itself is height-auto so this never has to be exact.
  const spacerHeight = visible ? 52 + stackOffsetPx : 0;

  return (
    <>
      {/* Spacer: reserves the bar's height (plus any stacked MiniAnswerBar height) only while it's
          actually shown, so content is never hidden underneath it — this is a user-triggered reveal
          (post-scroll), not a load-time layout shift. */}
      <div aria-hidden className="sm:hidden" style={{ height: spacerHeight }} />
      <div
        role="region"
        aria-label={`Compare ${airportName} parking prices`}
        aria-hidden={!visible}
        className={`fixed inset-x-0 z-40 flex items-center gap-2 border-t border-ink/10 bg-card/95 px-3 py-2 shadow-[0_-6px_16px_-8px_rgb(15_23_42_/0.25)] backdrop-blur-md transition-[transform,bottom] duration-200 sm:hidden ${
          visible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        style={{
          bottom: stackOffsetPx,
          paddingBottom: stackOffsetPx > 0 ? "0.5rem" : "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {hook ?? `Parking at ${airportName} — compare pre-book prices`}
        </p>
        <a
          href={`#${targetId}`}
          onClick={scrollToMerchants}
          tabIndex={visible ? 0 : -1}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-card bg-brand-accent px-4 text-sm font-semibold text-white"
        >
          Compare
        </a>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted"
        >
          <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </>
  );
}
