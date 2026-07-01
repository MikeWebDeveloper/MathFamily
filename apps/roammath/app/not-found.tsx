import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. The destination you&apos;re after might be listed under a slightly
        different name — try one of these.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/roaming" className="text-accent-strong underline underline-offset-4">Roaming costs →</Link></li>
        <li><Link href="/baggage-fees" className="text-accent-strong underline underline-offset-4">Baggage fees →</Link></li>
        <li><Link href="/news" className="text-accent-strong underline underline-offset-4">Latest updates →</Link></li>
        <li><Link href="/" className="text-accent-strong underline underline-offset-4">Home →</Link></li>
      </ul>
    </section>
  );
}
