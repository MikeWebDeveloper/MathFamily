"use client";

/** Shared themed range input: thumb-friendly, focus-visible ring + active glow, brand accent. */
export function RangeSlider({
  min,
  max,
  value,
  onChange,
  ariaLabel,
  ariaValuetext,
  ariaDescribedby,
  className
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValuetext: string;
  ariaDescribedby?: string;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel}
      aria-valuetext={ariaValuetext}
      aria-describedby={ariaDescribedby}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-2 w-full cursor-pointer accent-brand-accent transition-shadow focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand-accent)_25%,transparent)] active:shadow-[0_0_12px_color-mix(in_srgb,var(--color-brand-accent)_45%,transparent)] ${className ?? ""}`}
    />
  );
}
