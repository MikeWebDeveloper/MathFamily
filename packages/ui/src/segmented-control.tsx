"use client";

/** Slim segmented control (radiogroup). Client-only enhancement; render an SSR default sort behind it. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex rounded-full bg-ink/5 p-0.5 text-xs font-semibold ${className ?? ""}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`mf-press inline-flex min-h-11 items-center rounded-full px-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent ${o.value === value ? "bg-card text-brand-strong shadow-sm" : "text-ink-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
