import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        RoamMath does not set advertising cookies and does not require an account. We use privacy-friendly,
        aggregate analytics to understand which pages help people. If you join our email list we store your email
        address with our email provider solely to send the updates you asked for; unsubscribe links are in every
        email.
      </p>
      <p className="text-ink-muted">
        Some pages may contain affiliate links (for eSIMs, car hire or travel insurance) — always clearly
        labelled &quot;Affiliate link&quot; next to the link itself, and never affecting which option we show as
        cheapest. Prices and fees shown are
        verified against official network, eSIM and airline pages on the date shown next to each figure, but always confirm with the
        provider before you travel. Nothing on this site is financial advice.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
