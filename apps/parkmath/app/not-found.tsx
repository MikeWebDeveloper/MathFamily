import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. The airport you&apos;re after might be listed under a slightly
        different name — try one of these.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/drop-off-charges" className="text-brand-accent underline underline-offset-4">Drop-off charges →</Link></li>
        <li><Link href="/airport-parking" className="text-brand-accent underline underline-offset-4">Airport parking →</Link></li>
        <li><Link href="/airport-lounges" className="text-brand-accent underline underline-offset-4">Airport lounges →</Link></li>
        <li><Link href="/news" className="text-brand-accent underline underline-offset-4">Latest updates →</Link></li>
        <li><Link href="/" className="text-brand-accent underline underline-offset-4">Home →</Link></li>
      </ul>
    </section>
  );
}
