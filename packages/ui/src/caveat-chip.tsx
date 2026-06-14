import type { ReactNode } from "react";

/** Amber inline caveat — surfaces what competitors bury in footnotes. */
export function CaveatChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-warning/[0.12] px-2.5 py-1 text-xs font-semibold text-warning ring-1 ring-warning/25">
      <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3 shrink-0 fill-current">
        <path d="M8 1.5 15 14H1L8 1.5Zm-.75 5h1.5v4h-1.5v-4Zm0 5h1.5v1.5h-1.5V11.5Z" />
      </svg>
      {children}
    </span>
  );
}
