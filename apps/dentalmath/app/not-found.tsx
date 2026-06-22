import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. Try one of these instead.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/treatments" className="text-brand-accent underline underline-offset-4">Treatment costs →</Link></li>
        <li><Link href="/nhs-dental-charges" className="text-brand-accent underline underline-offset-4">NHS dental charges →</Link></li>
        <li><Link href="/" className="text-brand-accent underline underline-offset-4">Home →</Link></li>
      </ul>
    </section>
  );
}
