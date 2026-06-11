/** Decorative page-top atmosphere: masked dot grid + two slow-drifting blobs.
 *  Mount once per layout inside a `relative` body wrapper, before <main>. */
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
      <div className="mf-grid-bg absolute inset-0" />
      <div
        className="mf-blob absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-brand) 14%, transparent)" }}
      />
      <div
        className="mf-blob-2 absolute top-32 left-[-12%] h-[360px] w-[360px] rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-brand-accent) 10%, transparent)" }}
      />
    </div>
  );
}
