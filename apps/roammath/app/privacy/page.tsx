import type { Metadata } from "next";
import { CONTACT_EMAIL } from "../../lib/site";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

/** Bump when the wording below changes, so readers can see how current the policy is. */
const LAST_UPDATED = "2 November 2026";

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-sm text-ink-muted">Last updated {LAST_UPDATED}.</p>
      <p className="text-ink-muted">
        RoamMath does not set advertising or tracking cookies on its pages and does not require an account. We use
        privacy-friendly, cookie-free analytics (Cloudflare Web Analytics and our own self-hosted Umami) to understand
        which pages help people. Like any website, these see your IP address and browser type when a page loads, and
        we use them only to estimate your country and to filter out bots. When you click a booking link we also count
        the click (which country and which link) the same way.
      </p>
      <p className="text-ink-muted">
        Some pages may contain affiliate links (for eSIMs, car hire or travel insurance), always clearly labelled
        &quot;Affiliate link&quot; next to the link itself. If you buy through one, RoamMath may earn a commission at
        no extra cost to you; it never changes which option we show as cheapest. Following an affiliate link takes you
        through our affiliate network (for example AWIN or Impact) so the sale can be credited to us: the network and
        the company you buy from may set their own cookies on their sites, under their own privacy policies. See our{" "}
        <a className="underline" href="/affiliate-disclosure">
          affiliate disclosure
        </a>
        .
      </p>
      <p className="text-ink-muted">
        RoamMath does not currently run a mailing list or collect your email address on its pages. If we add one, we
        will explain here what we keep, why, and which provider handles it before anyone is asked to sign up.
      </p>
      <p className="text-ink-muted">
        Prices and fees shown are verified against official network, eSIM and airline pages on the date shown next to
        each figure, but always confirm with the provider before you travel. Nothing on this site is financial advice.
      </p>
      <p className="text-ink-muted">
        Questions about privacy, or want us to delete something we hold about you? Email{" "}
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
