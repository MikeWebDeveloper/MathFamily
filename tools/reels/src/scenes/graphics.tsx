import { AbsoluteFill } from "remotion";
import type { BrandTheme } from "./theme";
import { SANS, MONO } from "./theme";

// Flat, on-brand graphic atoms (DESIGN.md: flat, no gradients, instrument-panel). Motion lives in Reel.tsx.

/** Navy/teal field with a few flat decorative discs + a dashed "runway" line. Purely decorative. */
export const BrandBackdrop: React.FC<{ theme: BrandTheme }> = ({ theme }) => (
  <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -260, right: -200, width: 620, height: 620, borderRadius: "50%", background: theme.decor }} />
    <div style={{ position: "absolute", bottom: -320, left: -240, width: 720, height: 720, borderRadius: "50%", background: theme.decor }} />
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      <line x1="80" y1="0" x2="80" y2="1920" stroke={theme.decor} strokeWidth="6" strokeDasharray="34 30" />
    </svg>
  </AbsoluteFill>
);

/** Brand wordmark with an accent "P" tile. */
export const Wordmark: React.FC<{ theme: BrandTheme; name: string }> = ({ theme, name }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 56, height: 56, borderRadius: 14, background: theme.accent, color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {name.charAt(0)}
    </div>
    <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#fff", letterSpacing: 0.5 }}>{name}</span>
  </div>
);

/** Thin bottom progress bar (0..1). */
export const ProgressBar: React.FC<{ theme: BrandTheme; progress: number }> = ({ theme, progress }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: theme.decor }}>
    <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: theme.accentBright }} />
  </div>
);

/** Parking-ticket motif: white card with side notches + a dashed divider. */
export const Ticket: React.FC<{ theme: BrandTheme; children: React.ReactNode }> = ({ theme, children }) => (
  <div style={{ position: "relative", background: theme.paper, borderRadius: 28, padding: "56px 64px", minWidth: 620, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
    <div style={{ position: "absolute", top: "50%", left: -26, width: 52, height: 52, marginTop: -26, borderRadius: "50%", background: theme.bg }} />
    <div style={{ position: "absolute", top: "50%", right: -26, width: 52, height: 52, marginTop: -26, borderRadius: "50%", background: theme.bg }} />
    {children}
  </div>
);

/** Rounded "stamp" (FREE / SAVED), slightly rotated for a playful pop. */
export const Stamp: React.FC<{ theme: BrandTheme; label: string; color?: string }> = ({ theme, label, color }) => {
  const c = color ?? theme.good;
  return (
    <div style={{ display: "inline-block", transform: "rotate(-7deg)", border: `6px solid ${c}`, color: c, borderRadius: 18, padding: "10px 26px", fontFamily: SANS, fontWeight: 700, fontSize: 52, letterSpacing: 4, textTransform: "uppercase", background: "rgba(255,255,255,0.04)" }}>
      {label}
    </div>
  );
};

/** Rounded pill (verified / note). */
export const Pill: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: color, color: "#062b16", borderRadius: 999, padding: "16px 30px", fontFamily: SANS, fontWeight: 600, fontSize: 30 }}>
    {children}
  </div>
);

type GlyphName = "plane" | "car" | "clock" | "tick" | "parking" | "ticket";

/** Minimal flat glyphs. Stroke/labels use `color`. */
export const Glyph: React.FC<{ name: GlyphName; size?: number; color: string }> = ({ name, size = 120, color }) => {
  const s = { width: size, height: size, display: "block" } as const;
  if (name === "parking") {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.22, background: color, color: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: size * 0.62 }}>P</div>
    );
  }
  if (name === "ticket") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
        <path d="M13 6v12" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === "tick") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (name === "car") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.6h7.2a2 2 0 0 1 1.9 1.4L19 16" />
        <path d="M3 16h18v3h-2v-2H5v2H3z" /><circle cx="7.5" cy="18.5" r="1.4" /><circle cx="16.5" cy="18.5" r="1.4" />
      </svg>
    );
  }
  // plane
  return (
    <svg style={s} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5z" />
    </svg>
  );
};

export const FONT = { SANS, MONO };
