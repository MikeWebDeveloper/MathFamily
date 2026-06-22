import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function NotFound() {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Page not found</PageHeading>
      <p className="text-lead text-ink-muted">
        That page doesn&apos;t exist or has moved. Try the take-home calculator or one of the side-hustle guides.
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li><Link href="/take-home" className="text-brand-accent underline underline-offset-4">Take-home calculator →</Link></li>
        <li><Link href="/take-home#trades" className="text-brand-accent underline underline-offset-4">By trade →</Link></li>
        <li><Link href="/" className="text-brand-accent underline underline-offset-4">Home →</Link></li>
      </ul>
    </section>
  );
}
