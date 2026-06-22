import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. Try the cost-to-move calculator or one of our worked examples.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/" className="text-brand-accent underline underline-offset-4">Cost calculator →</Link></li>
        <li><Link href="/buying" className="text-brand-accent underline underline-offset-4">Worked examples →</Link></li>
        <li><Link href="/privacy" className="text-brand-accent underline underline-offset-4">Privacy →</Link></li>
      </ul>
    </section>
  );
}
