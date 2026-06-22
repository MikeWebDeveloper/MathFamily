import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        MoveMath does not set advertising cookies and does not require an account. We use privacy-friendly,
        aggregate analytics to understand which pages help people. If you join our email list we store your email
        address with our email provider solely to send the updates you asked for; unsubscribe links are in every email.
      </p>
      <p className="text-ink-muted">
        Some pages contain (or will contain) clearly-labelled sponsored links for removals, conveyancing and survey
        services. MoveMath does not promote, recommend or compare mortgages, insurance or any other product regulated
        by the Financial Conduct Authority.
      </p>
      <p className="text-ink-muted">
        Stamp Duty is calculated from public gov.uk rates; removals, conveyancing and survey figures are typical
        estimates from public consumer guides, verified on the date shown next to each figure. They are estimates, not
        quotes, and cover England &amp; Northern Ireland only. Nothing on this site is financial, tax or legal advice —
        always confirm your own figures with gov.uk and a solicitor or conveyancer before you commit.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
