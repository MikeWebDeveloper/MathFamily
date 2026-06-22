import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. Try the energy bill estimator or pick your region.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/region" className="text-brand-accent underline underline-offset-4">Bills by region →</Link></li>
        <li><Link href="/" className="text-brand-accent underline underline-offset-4">Home →</Link></li>
      </ul>
    </section>
  );
}
