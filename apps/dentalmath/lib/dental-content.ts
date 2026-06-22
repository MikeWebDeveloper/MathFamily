import { formatPence } from "@mathfamily/engine";
import { bandFor, type NhsBandCharge, type PriceRange, type TreatmentRecord } from "./dental-data";

/** Verdict for a treatment comparison. NHS is always at least as cheap as private for the
 *  patient (it is a flat subsidised charge), so "saving" = private midpoint − NHS charge. */
export interface TreatmentComparison {
  treatment: TreatmentRecord;
  band: NhsBandCharge;
  /** NHS England patient charge, in pence. */
  nhsPence: number;
  /** Midpoint of the typical private range, in pence (used for the headline saving). */
  privateMidPence: number;
  /** Estimated saving going NHS vs the private midpoint, in pence (never negative). */
  savingPence: number;
  /** Headline answer sentence. */
  answer: string;
}

/** Format a private price range, e.g. "£90–£250". */
export function formatRange(range: PriceRange): string {
  if (range.minPence === range.maxPence) return formatPence(range.minPence);
  return `${formatPence(range.minPence)}–${formatPence(range.maxPence)}`;
}

function midpoint(range: PriceRange): number {
  return Math.round((range.minPence + range.maxPence) / 2);
}

export function compareTreatment(treatment: TreatmentRecord): TreatmentComparison {
  const band = bandFor(treatment);
  const nhsPence = band.pricePence;
  const privateMidPence = midpoint(treatment.privatePrice);
  const savingPence = Math.max(0, privateMidPence - nhsPence);

  const answer =
    `On the NHS in England, ${treatment.name.toLowerCase()} falls under ${band.label}, so you pay ${formatPence(nhsPence)} ` +
    `for the whole course of treatment. Privately it typically costs ${formatRange(treatment.privatePrice)} — ` +
    (savingPence > 0
      ? `going NHS saves roughly ${formatPence(savingPence)} versus a mid-range private price.`
      : `the NHS charge is in line with the private range.`);

  return { treatment, band, nhsPence, privateMidPence, savingPence, answer };
}

/** Build FAQ items for a treatment spoke from verified dataset facts only. */
export function buildTreatmentFaqs(treatment: TreatmentRecord): { question: string; answer: string }[] {
  const c = compareTreatment(treatment);
  return [
    {
      question: `How much does ${treatment.name.toLowerCase()} cost on the NHS?`,
      answer: `It falls under NHS England ${c.band.label}, so you pay ${formatPence(c.nhsPence)} for the course of treatment (the same flat charge however many appointments it takes). Check-ups and treatment are free if you qualify for an exemption.`,
    },
    {
      question: `How much does ${treatment.name.toLowerCase()} cost privately?`,
      answer: `Typical UK private prices are ${formatRange(treatment.privatePrice)}. ${treatment.privateNote} These are indicative ranges from public price guides — always get a written quote from your own dentist.`,
    },
    {
      question: `Is it worth going private for ${treatment.name.toLowerCase()}?`,
      answer:
        c.savingPence > 0
          ? `Purely on price, the NHS charge (${formatPence(c.nhsPence)}) is well below the private range, saving roughly ${formatPence(c.savingPence)} versus a mid-range private fee. People choose private for shorter waits, more appointment choice, or materials not available on the NHS.`
          : `On price the NHS charge (${formatPence(c.nhsPence)}) is broadly in line with private fees here. People still choose private for shorter waits or more appointment choice.`,
    },
  ];
}
