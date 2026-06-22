/** App-local disclosure line shown on the home + spoke pages. The shared SiteFooter carries the
 *  generic "Not financial advice" line; this adds the PetMath-specific source + scope disclosure. */
export function DisclosureNote() {
  return (
    <p className="text-xs leading-relaxed text-ink-muted">
      Figures are minimum essential-care estimates from the PDSA Animal Wellbeing report (calculated 2024,
      verified on the date shown by each figure) and, for the insurance reference line, the Association of British
      Insurers. They cover food, routine vet care and one-off set-up only — emergency vet treatment, grooming,
      training and boarding are extra. Always confirm current prices with the provider. PetMath is not financial,
      insurance or veterinary advice.
    </p>
  );
}
