/**
 * Prominent, non-dismissable advice disclaimer. Rendered on the home page and every spoke.
 * The shared SiteFooter only says "Not financial advice"; MoveMath touches tax + legal territory,
 * so we surface a fuller line in-page. Kept app-local (the shared package is read-only).
 */
export function AdviceDisclaimer() {
  return (
    <p
      data-testid="advice-disclaimer"
      className="rounded-card border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-sm text-ink-muted"
    >
      <strong className="text-ink">Estimates only — not financial, tax or legal advice.</strong>{" "}
      Figures cover England &amp; Northern Ireland and are typical estimates, not quotes. Stamp Duty
      is calculated from public{" "}
      <a href="https://www.gov.uk/stamp-duty-land-tax" className="font-medium text-brand-accent underline underline-offset-4">
        gov.uk
      </a>{" "}
      rates; always confirm your own figures with gov.uk and a solicitor or conveyancer before you commit.
    </p>
  );
}
