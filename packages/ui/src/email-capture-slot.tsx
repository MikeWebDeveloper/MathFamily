export function EmailCaptureSlot({ formAction, hook }: { formAction?: string; hook: string }) {
  if (!formAction) return null;
  return (
    <form action={formAction} method="post" className="rounded-card bg-surface p-6">
      <p className="font-semibold text-ink">{hook}</p>
      <div className="mt-3 flex gap-2">
        <label htmlFor="email-capture-input" className="sr-only">Email address</label>
        <input
          id="email-capture-input"
          type="email"
          name="fields[email]"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
        <button type="submit" className="mf-press inline-flex min-h-11 items-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50">
          Notify me
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">No spam. Unsubscribe any time.</p>
    </form>
  );
}
