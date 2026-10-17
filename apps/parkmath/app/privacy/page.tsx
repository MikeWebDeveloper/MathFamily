import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

/** Bump when the wording below changes, so readers can see how current the policy is. */
const LAST_UPDATED = "17 October 2026";

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-sm text-ink-muted">Last updated {LAST_UPDATED}.</p>
      <p className="text-ink-muted">
        ParkMath does not set advertising or tracking cookies on its pages and does not require an account. We use
        privacy-friendly, cookie-free analytics (Cloudflare Web Analytics and our own self-hosted Umami) to understand
        which pages help people. Like any website, these see your IP address and browser type when a page loads, and
        we use them only to estimate your country and to filter out bots. When you click a booking link we also count
        the click (which airport and which link) the same way.
      </p>
      <p className="text-ink-muted">
        Some pages contain affiliate links, for example to pre-book airport parking, and they are always labelled. If
        you book through one, ParkMath may earn a commission at no extra cost to you; it never changes which option we
        show as cheapest or how we rank anything. Following an affiliate link takes you through our affiliate network,
        AWIN, so the booking can be credited to us: AWIN and the company you book with may set their own cookies on
        their sites, under their own privacy policies. Our pages also load a script from AWIN that supports this
        tracking.
      </p>
      <p className="text-ink-muted">
        If you join our email list, we keep your email address, the page you signed up on and the time, on the basis
        of the consent you give at sign-up, and use it only to send the UK airport drop-off fee updates you asked for.
        Your sign-up is delivered to our own inbox by our email-delivery provider (Resend) and recorded in our hosting
        provider&apos;s (Vercel) logs. If we move the list to a newsletter service, we will name it here first. We
        never sell or share your address, every email will include an unsubscribe link, and you can withdraw consent
        at any time.
      </p>
      <p className="text-ink-muted">
        Prices and fees shown are verified against official airport pages on the date shown next to each figure, but
        always confirm with the airport before you travel. Nothing on this site is financial advice.
      </p>
      <p className="text-ink-muted">
        Questions, or want your email address removed? Email{" "}
        <a className="underline" href="mailto:hello@parkmath.co.uk">
          hello@parkmath.co.uk
        </a>
        .
      </p>
    </article>
  );
}
