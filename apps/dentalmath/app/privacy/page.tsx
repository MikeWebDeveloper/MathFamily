import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        DentalMath does not set advertising cookies and does not require an account. We use
        privacy-friendly, aggregate analytics to understand which pages help people. If you join our
        email list we store your email address with our email provider solely to send the updates you
        asked for; unsubscribe links are in every email.
      </p>
      <p className="text-ink-muted">
        Some pages may contain affiliate links in future, always clearly labelled as such. NHS band
        charges shown are taken from official NHS pages on the date shown next to each figure. Private
        prices are indicative ranges from public price guides and vary widely by practice, region and
        complexity — always get a written quote from your own dentist.
      </p>
      <p className="text-ink-muted">
        DentalMath is for general information only. It is not medical advice and not financial advice —
        always check with your dentist or NHS for your specific situation.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
