export function EmailCaptureSlot({ formAction, hook }: { formAction?: string; hook: string }) {
  if (!formAction) return null;
  return (
    <form action={formAction} method="post" className="rounded-card bg-surface p-6">
      <p className="font-semibold text-ink">{hook}</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          name="fields[email]"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
          Notify me
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">No spam. Unsubscribe any time.</p>
    </form>
  );
}
