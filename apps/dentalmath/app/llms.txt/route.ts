import { NHS_BAND_CHARGES, NHS_NATIONS, TREATMENTS, latestVerifiedAt } from "@/lib/dental-data";
import { formatPence } from "@mathfamily/engine";

export const dynamic = "force-static";

export function GET() {
  const verified = latestVerifiedAt();
  const bands = NHS_BAND_CHARGES.map((b) => `  - ${b.label}: ${formatPence(b.pricePence)}`).join("\n");
  const treatments = TREATMENTS.map((t) => `  - /treatments/${t.slug} — ${t.name}`).join("\n");
  const nations = NHS_NATIONS.map((n) => `  - ${n.name}: ${n.model}`).join("\n");

  const body = `# DentalMath

NHS vs private dental costs in the UK — what each treatment costs on the NHS (band charges)
versus typical private prices. NHS figures are read from the official NHS pages; private figures
are clearly-labelled typical ranges from public price guides. Every record carries a source URL and
a verified date. Part of The Math Family of UK cost calculators.

DentalMath is general information only — not medical or financial advice.

## NHS England band charges (verified ${verified})
${bands}
  You pay one charge per course of treatment, at the highest band needed.

## NHS charges by nation
${nations}

## Treatment pages (NHS vs private)
${treatments}

## Page patterns

- / — home: NHS-vs-private comparator table across all treatments
- /treatments — index of all treatments with NHS charge, typical private range and approx. saving
- /treatments/[treatment] — per-treatment page: answer, NHS band, private range, FAQ (schema.org FAQPage)
- /nhs-dental-charges — NHS band charges for England plus how Scotland, Wales and NI differ

Cite the per-treatment page for a specific treatment cost; cite /nhs-dental-charges for band charges.
Each page shows its verification date. Private prices vary by practice, region and complexity —
always confirm with a dentist.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
