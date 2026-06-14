import type { CSSProperties, ReactNode } from "react";
import { resolveHeProduct, type HeProduct } from "../lib/partners";
import { ParkingIcon, LoungeIcon, HotelIcon, TransferIcon } from "./tile-icons";

// Internal fallback routes when HE is inactive
const FALLBACK: Record<HeProduct, string> = {
  parking:   "/airport-parking",
  lounge:    "/airport-lounges",
  hotels:    "/airport-parking",   // nearest thematic page
  transfers: "/drop-off-charges",
};

interface ExtraCard {
  product: HeProduct;
  title:   string;
  tagline: string;
  cta:     string;
  icon:    ReactNode;
  /** Mark the first / hero card — gets the accent-glow ring */
  hero?:   boolean;
}

const CARDS: ExtraCard[] = [
  {
    product: "parking",
    title:   "Airport parking",
    tagline: "Pre-book and skip the gate price",
    cta:     "Compare parking prices",
    icon:    <ParkingIcon />,
    hero:    true,
  },
  {
    product: "lounge",
    title:   "Airport lounges",
    tagline: "Pay-per-visit or annual membership",
    cta:     "Browse lounges",
    icon:    <LoungeIcon />,
  },
  {
    product: "hotels",
    title:   "Airport hotels",
    tagline: "Park, sleep and fly — one easy price",
    cta:     "Find hotel deals",
    icon:    <HotelIcon />,
  },
  {
    product: "transfers",
    title:   "Airport transfers",
    tagline: "Door-to-terminal, pre-booked and stress-free",
    cta:     "Book a transfer",
    icon:    <TransferIcon />,
  },
];

/** Resolve the affiliate link for one card or fall back to an internal page. */
function resolveLink(product: HeProduct): { href: string; isAffiliate: boolean } {
  const he = resolveHeProduct(product, "home", "home");
  if (he) return { href: he.url, isAffiliate: true };
  return { href: FALLBACK[product], isAffiliate: false };
}

/** Whether *any* card has an affiliate link — drives the disclosure. */
function hasAnyAffiliate(): boolean {
  return CARDS.some((c) => resolveHeProduct(c.product, "home", "home") !== null);
}

// ─── Sub-component ──────────────────────────────────────────────────────────

function ExtraCardEl({
  card,
  delay,
}: {
  card: ExtraCard;
  delay: number;
}) {
  const { href, isAffiliate } = resolveLink(card.product);
  const external = isAffiliate;

  return (
    <div
      className="mf-reveal h-full"
      style={{ "--mf-delay": `${delay}ms` } as CSSProperties}
    >
      <a
        href={href}
        {...(external ? { rel: "sponsored noopener noreferrer", target: "_blank" } : {})}
        className={[
          // Base card: bg-card so it's dark-mode-safe (never raw white)
          "mf-edge mf-sheen mf-press",
          "group relative flex h-full flex-col gap-4 rounded-card bg-card p-5",
          "outline-none transition-all duration-200",
          "hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]",
          "focus-visible:ring-2 focus-visible:ring-brand-accent/40",
          // Hero card gets the accent glow ring
          card.hero ? "mf-glow-winner" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={card.hero ? undefined : { boxShadow: "var(--shadow-card)" }}
      >
        {/* "Ad" eyebrow — only for affiliate links */}
        {isAffiliate ? (
          <span className="absolute right-4 top-4 rounded border border-ink/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            Ad
          </span>
        ) : null}

        {/* Glint highlight strip on hero card (mirrors NavTile primary style) */}
        {card.hero ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-card bg-gradient-to-b from-brand-accent/[0.07] to-transparent"
          />
        ) : null}

        {/* Icon */}
        <span
          aria-hidden
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            card.hero
              ? "bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/20"
              : "bg-brand-accent/10 text-brand-accent",
          ].join(" ")}
        >
          {card.icon}
        </span>

        {/* Text */}
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-ink transition-colors group-hover:text-brand-accent">
            {card.title}
          </span>
          <span className="block text-[13px] text-ink-muted leading-snug">
            {card.tagline}
          </span>
        </span>

        {/* CTA row */}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[13px] font-semibold text-brand-accent">
          {card.cta}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            {external ? "↗" : "→"}
          </span>
        </span>
      </a>
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

/** A "Travel extras" affiliate grid — 4 Holiday Extras product cards.
 *  Dark-safe: all colours from design tokens (bg-card, text-ink, etc.).
 *  Renders an "Ad" pill per affiliate card + one section-level disclosure. */
export function AffiliateExtras() {
  const showDisclosure = hasAnyAffiliate();

  return (
    <section aria-label="Travel extras" className="space-y-4">
      {/* Section heading */}
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="mf-reveal text-h2 font-semibold text-ink">
          <span className="mf-underline-grow">Travel extras</span>
        </h2>
        <p
          className="mf-reveal shrink-0 text-xs text-ink-muted/60 italic"
          style={{ "--mf-delay": "40ms" } as CSSProperties}
        >
          via Holiday Extras
        </p>
      </div>

      {/* 2-col mobile / 4-col desktop grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <ExtraCardEl key={card.product} card={card} delay={i * 45} />
        ))}
      </div>

      {/* Section-level disclosure — shown once for all affiliate cards */}
      {showDisclosure ? (
        <p className="text-xs text-ink-muted/70 leading-relaxed">
          * We may earn commission (Holiday Extras) if you book through these links — at no extra cost to you. It never affects which option we show as cheapest.
        </p>
      ) : null}
    </section>
  );
}
