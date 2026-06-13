/** Visually-hidden status announcer for assistive tech. Use `polite` (default) for
 *  non-urgent updates (results loaded) and `alert` for errors that should interrupt. */
export function LiveRegion({
  message,
  variant = "polite",
  className,
}: {
  message: string;
  variant?: "polite" | "alert";
  className?: string;
}) {
  if (!message) return null;
  const common = ["sr-only", className].filter(Boolean).join(" ");
  if (variant === "alert") {
    return <div role="alert" aria-atomic="true" className={common}>{message}</div>;
  }
  return <div aria-live="polite" aria-atomic="true" className={common}>{message}</div>;
}
