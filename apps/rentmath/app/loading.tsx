export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <div className="mf-skeleton h-10 w-3/4" aria-hidden />
      <div className="mf-skeleton h-28 w-full" aria-hidden />
      <div className="mf-skeleton h-48 w-full" aria-hidden />
    </div>
  );
}
