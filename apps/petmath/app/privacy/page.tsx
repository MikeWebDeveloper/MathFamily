import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        PetMath does not set advertising cookies and does not require an account. We use privacy-friendly,
        aggregate analytics to understand which pages help people. If you join our email list we store your email
        address with our email provider solely to send the updates you asked for; unsubscribe links are in every
        email.
      </p>
      <p className="text-ink-muted">
        Some pages may contain clearly-labelled sponsored links to pet-food subscriptions in future; we will never
        carry pet-insurance affiliate links. Cost figures are taken from the PDSA Animal Wellbeing report and the
        Association of British Insurers on the date shown next to each figure — always confirm current prices with
        the provider. Nothing on this site is financial, insurance or veterinary advice.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
