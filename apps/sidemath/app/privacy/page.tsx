import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        SideMath does not set advertising cookies and does not require an account. The calculator runs entirely in
        your browser — the income and expense figures you enter are never sent to us or stored. We use
        privacy-friendly, aggregate analytics to understand which pages help people.
      </p>
      <p className="text-ink-muted">
        If you join our email list we store your email address with our email provider solely to send the updates you
        asked for; unsubscribe links are in every email.
      </p>
      <p className="text-ink-muted">
        Some pages carry a clearly-labelled sponsored slot for accounting software. Any affiliate links will be
        labelled as such and never change the figures or estimates we publish.
      </p>
      <p className="text-ink-muted">
        Tax rates and thresholds shown are read from official gov.uk pages on the date shown next to each figure.
        SideMath provides simplified <strong>estimates, not tax advice</strong> — always confirm on gov.uk or with an
        accountant before relying on a number.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
