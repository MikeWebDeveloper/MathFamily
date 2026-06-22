"use client";

import Link from "next/link";
import { PageHeading } from "@mathfamily/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="space-y-6 py-8">
      <PageHeading>Something went wrong</PageHeading>
      <p className="text-lead text-ink-muted">
        We hit an unexpected error loading this page. Nothing you entered is stored — try again, or head back to the
        take-home calculator.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={reset}
          className="rounded-card bg-brand px-4 py-2 font-semibold text-white transition-colors hover:bg-brand/90 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        >
          Try again
        </button>
        <Link href="/" className="text-brand-accent underline underline-offset-4">Back to home →</Link>
      </div>
    </section>
  );
}
