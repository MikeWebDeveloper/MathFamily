import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        BuildMath does not set advertising cookies and does not require an account. We use privacy-friendly,
        aggregate analytics to understand which pages help people. If you join our email list we store your
        email address with our email provider solely to send the updates you asked for; unsubscribe links are
        in every email.
      </p>
      <p className="text-ink-muted">
        Some pages may carry sponsored &ldquo;find local trades&rdquo; links in future, always clearly labelled
        as such — and a sponsored link will never change the cost ranges we show. The build-cost figures on this
        site are public-guide ranges, taken from named cost guides on the date shown next to each figure. They
        are estimates only, not quotes, and exclude VAT and professional fees unless stated. Always get itemised
        written quotes from vetted trades before you commit. Nothing on this site is financial advice.
      </p>
      <p className="text-ink-muted">Contact: contact details will be published when the operating company is registered.</p>
    </article>
  );
}
