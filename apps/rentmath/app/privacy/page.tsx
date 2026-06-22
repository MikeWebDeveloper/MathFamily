import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        RentMath does not set advertising cookies and does not require an account. We use
        privacy-friendly, aggregate analytics to understand which pages help people. If you join our
        email list we store your email address with our email provider solely to send the updates you
        asked for; unsubscribe links are in every email.
      </p>
      <p className="text-ink-muted">
        RentMath is an independent information tool — not a letting agent, landlord, broker or
        financial adviser. Rents, council-tax figures and bills shown are estimates carrying a source
        and a date next to the figure, but always confirm with the landlord and your local billing
        authority before you commit. Some pages may carry clearly-labelled commercial slots in
        future; we do not currently offer any regulated financial product such as insurance. Nothing
        on this site is financial advice.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
