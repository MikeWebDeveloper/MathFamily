import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        EnergyMath does not set advertising cookies and does not require an account. We use
        privacy-friendly, aggregate analytics to understand which pages help people. If you join our
        email list we store your email address with our email provider solely to send the updates
        you asked for; unsubscribe links are in every email.
      </p>
      <p className="text-ink-muted">
        Some pages contain affiliate placeholders (solar, heat-pump and energy-switching partners),
        always labelled &ldquo;Ad&rdquo;. These are not yet live and carry no tracking. Prices and
        rates shown are estimates based on the published Ofgem price cap, verified on the date shown
        next to each figure — always confirm current prices with your supplier. Nothing on this site
        is financial, tax or investment advice.
      </p>
      <p className="text-ink-muted">
        Contact: privacy contact details will be published when the operating company is registered.
      </p>
    </article>
  );
}
