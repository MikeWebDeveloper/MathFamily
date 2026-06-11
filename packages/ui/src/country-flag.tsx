import { FLAGS } from "./generated/flags";

/** Vendored circle-flag (MIT, HatScripts/circle-flags). Decorative by default. */
export function CountryFlag({ iso2, size = 20, className }: { iso2: string; size?: number; className?: string }) {
  const inner = FLAGS[iso2];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
