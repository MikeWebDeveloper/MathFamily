import { formatPence } from "@mathfamily/engine";
import { isPublicTransportAlt, type DropOffRecord, type LoungeRecord, type NewsItem, type ParkingRecord } from "@mathfamily/data";
import { isPerEntryTariff, searchName } from "./content";
import { parkingPageModel } from "./parking-content";

/**
 * SERP <title>/<meta description> builders. Every route used to hand-roll its strings and most ran
 * long: a 2026-10-17 crawl of all 242 sitemap URLs found ~200 titles over 60 rendered characters
 * and most descriptions over 155, so Google was truncating the very figures that make a snippet
 * worth clicking. Each builder lists its wording from most to least descriptive and keeps the
 * first that fits, so short airport names keep the full phrasing and "Teesside International"
 * degrades gracefully instead of getting cut mid-word. Figures come only from the record.
 *
 * Per-airport dataset overrides (seoTitle, blueBadgeSeoTitle, optionsSeoTitle, ...) are still used
 * verbatim — they are hand-tuned against GSC queries and live in the reviewed dataset, not here.
 */

/** The root layout's title template ("%s | ParkMath", app/layout.tsx) appends this to every title. */
export const TITLE_SUFFIX = " | ParkMath";
/** Rendered budgets. Google cuts titles at ~60 characters (incl. the suffix) and snippets at ~155. */
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 155;

export interface PageMeta {
  title: string;
  description: string;
}

/** Length of a page title as rendered, i.e. with the layout's " | ParkMath" suffix. */
export function renderedTitleLength(title: string): number {
  return title.length + TITLE_SUFFIX.length;
}

/** The first (most descriptive) candidate whose rendered title fits; else the last (shortest). */
export function fitTitle(candidates: readonly [string, ...string[]]): string {
  return candidates.find((c) => renderedTitleLength(c) <= MAX_TITLE_LENGTH) ?? candidates.at(-1) ?? candidates[0];
}

/** The lead sentence plus, in order, each optional sentence that still fits. Never cuts a sentence. */
export function fitDescription(lead: string, optional: readonly (string | null)[] = []): string {
  return optional.reduce<string>(
    (acc, s) => (s && `${acc} ${s}`.length <= MAX_DESCRIPTION_LENGTH ? `${acc} ${s}` : acc),
    lead
  );
}

/** Whole sentences of free text (e.g. a news summary) up to the budget; a lone over-long first
 *  sentence is cut at a word boundary with an ellipsis rather than left for Google to truncate. */
export function clampToSentences(text: string, max = MAX_DESCRIPTION_LENGTH): string {
  let out = "";
  for (const s of text.trim().split(/(?<=[.!?])\s+/)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out || `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** The latest ISO date among the records a page shows — its honest dateModified. */
export function latestDate(first: string, ...rest: (string | null | undefined)[]): string {
  return rest.reduce<string>((max, d) => (d && d > max ? d : max), first);
}

/** The headline drop-off price in a few words: "free", "£7 per entry" or "£10 for up to 10 min". */
export function dropOffFeePhrase(record: DropOffRecord): string {
  const first = record.bands[0];
  if (record.isFree || !first) return "free";
  const price = formatPence(first.totalPence);
  return isPerEntryTariff(record) ? `${price} per entry` : `${price} for up to ${first.upToMinutes} min`;
}

/** The way round the charge — a public-transport alternative isn't "free", so it's phrased apart. */
function freeAlternativeSentence(record: DropOffRecord): string | null {
  const alt = record.freeAlternative;
  if (!alt) return null;
  return isPublicTransportAlt(alt) ? `Or skip the forecourt: ${alt.name}.` : `Free alternative: ${alt.name}.`;
}

export function dropOffMeta(airportName: string, record: DropOffRecord): PageMeta {
  const sn = searchName(airportName);
  const fee = record.isFree ? "free" : `${formatPence(record.bands[0]?.totalPence ?? 0)} fee`;
  // The fuller verified summary when it is short enough to leave room, else the headline band.
  const summaryLead = `${sn} Airport drop-off charges: ${record.feeSummary.replace(/\.$/, "")}.`;
  return {
    title:
      record.seoTitle ??
      fitTitle([
        `${sn} Airport drop-off charges 2026 — ${fee}`,
        `${sn} drop-off charges 2026 — ${fee}`,
        `${sn} drop-off charge — ${fee}`,
        `${sn} drop-off — ${fee}`
      ]),
    description:
      record.seoDescription ??
      fitDescription(summaryLead.length <= 110 ? summaryLead : `${sn} Airport drop-off: ${dropOffFeePhrase(record)}.`, [
        freeAlternativeSentence(record),
        "Time limit, penalty and Blue Badge rules.",
        `Verified ${record.verifiedAt}.`
      ])
  };
}

export function avoidDropOffMeta(airportName: string, record: DropOffRecord): PageMeta {
  const sn = searchName(airportName);
  const alt = record.freeAlternative;
  const fee = formatPence(record.bands[0]?.totalPence ?? 0);
  const how = alt ? (isPublicTransportAlt(alt) ? `take the ${alt.name}` : `use the ${alt.name}`) : null;
  return {
    title: fitTitle([
      `How to avoid the ${airportName} drop-off charge 2026`,
      `How to avoid the ${sn} drop-off charge 2026`,
      `Avoid the ${sn} drop-off charge (2026)`,
      `Avoid the ${sn} drop-off fee`
    ]),
    description: fitDescription(how ? `Skip the ${fee} ${sn} drop-off fee: ${how}.` : `Skip the ${fee} ${sn} drop-off fee.`, [
      "Plus the Blue Badge rules.",
      `Verified ${record.verifiedAt}.`
    ])
  };
}

export function blueBadgeMeta(airportName: string, record: DropOffRecord, statusLabel: string): PageMeta {
  const sn = searchName(airportName);
  return {
    title:
      record.blueBadgeSeoTitle ??
      fitTitle([
        `Blue Badge drop-off at ${airportName} 2026 — is it free?`,
        `Blue Badge drop-off at ${sn} 2026 — is it free?`,
        `${sn} Blue Badge drop-off — is it free?`,
        `${sn} Blue Badge drop-off 2026`
      ]),
    description:
      record.blueBadgeSeoDescription ??
      fitDescription(`Blue Badge drop-off at ${airportName}: ${statusLabel.toLowerCase()}.`, [
        "The exact policy, how to claim it, and the free option for everyone.",
        `Verified ${record.verifiedAt}.`
      ])
  };
}

export function optionsMeta(airportName: string, dropOff: DropOffRecord, parking: ParkingRecord | null): PageMeta {
  const sn = searchName(airportName);
  const fee = dropOff.isFree ? "Drop-off is free" : `Drop-off is ${dropOffFeePhrase(dropOff)}`;
  return {
    title:
      dropOff.optionsSeoTitle ??
      fitTitle([
        `Park or get dropped off at ${sn} Airport? 2026`,
        `Park or get dropped off at ${sn}? 2026`,
        `Park or drop off at ${sn}? 2026`,
        `${sn}: park or drop off?`
      ]),
    description:
      dropOff.optionsSeoDescription ??
      fitDescription(`Is it cheaper to park or get dropped off at ${sn} Airport? ${fee}.`, [
        freeAlternativeSentence(dropOff),
        "Verified break-even by trip length vs gate and pre-book parking.",
        `Updated ${latestDate(dropOff.verifiedAt, parking?.verifiedAt)}.`
      ])
  };
}

/** Short "cheapest is X at £Y" lead from the verified comparison, shared by both parking routes. */
function cheapestParkingLead(record: ParkingRecord, days: number, where: string): string {
  const m = parkingPageModel(record, days);
  if (!m.cheapest) return `No published ${days}-day parking price at ${where} — check the official site.`;
  const saving = m.savingsVsGatePence ? `, ${formatPence(m.savingsVsGatePence)} less than the gate` : "";
  return `Cheapest ${days}-day parking at ${where}: ${m.cheapest.name} at ${formatPence(m.cheapest.totalPence)}${saving}.`;
}

export function parkingMeta(airportName: string, record: ParkingRecord): PageMeta {
  const sn = searchName(airportName);
  return {
    title: fitTitle([
      `${airportName} parking prices 2026 — gate vs pre-book`,
      `${sn} parking prices 2026 — gate vs pre-book`,
      `${sn} parking 2026 — gate vs pre-book`,
      `${sn} parking prices 2026`
    ]),
    description: fitDescription(cheapestParkingLead(record, 7, sn), [
      "Compared for 3, 7 and 14 days.",
      `Verified ${record.verifiedAt}.`
    ])
  };
}

export function parkingDurationMeta(airportName: string, record: ParkingRecord, days: number): PageMeta {
  const sn = searchName(airportName);
  return {
    title: fitTitle([
      `${days}-day parking at ${airportName} — cheapest price`,
      `${days}-day parking at ${sn} — cheapest price`,
      `${days}-day ${sn} parking — cheapest price`,
      `${days}-day parking at ${sn}`
    ]),
    description: fitDescription(cheapestParkingLead(record, days, sn), [
      `Gate vs pre-book for ${days} days.`,
      `Verified ${record.verifiedAt}.`
    ])
  };
}

export function loungeMeta(airportName: string, record: LoungeRecord): PageMeta {
  const sn = searchName(airportName);
  const cheapest = record.lounges
    .filter((l) => l.walkInPence !== null)
    .sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  return {
    title: fitTitle([
      `${airportName} lounges 2026 — prices & Priority Pass`,
      `${sn} lounges 2026 — prices & Priority Pass`,
      `${sn} airport lounges 2026 — prices`,
      `${sn} lounges 2026`
    ]),
    description: fitDescription(
      `${airportName} lounge pre-book prices${cheapest ? ` from ${formatPence(cheapest.walkInPence!)}` : ""}, which take Priority Pass, and when membership beats paying per visit.`,
      [`Verified ${record.verifiedAt}.`]
    )
  };
}

export function abroadMeta(airportName: string): PageMeta {
  const sn = searchName(airportName);
  return {
    title: fitTitle([
      `Going abroad from ${airportName}? Total trip cost 2026`,
      `Going abroad from ${sn}? Total trip cost 2026`,
      `Going abroad from ${sn}? Trip cost 2026`,
      `Abroad from ${sn}: total cost`
    ]),
    description: fitDescription(
      `What it costs to drive to ${sn} and go abroad: cheapest parking or drop-off, phone roaming and baggage.`,
      ["Every figure verified and date-stamped."]
    )
  };
}

export function newsMeta(item: Pick<NewsItem, "title" | "summary">): PageMeta {
  // The old " — ParkMath update" suffix doubled the brand with the layout's " | ParkMath".
  return { title: item.title, description: clampToSentences(item.summary) };
}

/** Hub (non-airport) pages. Kept here, not inline in each page.tsx, so one test guards them all. */
export const HUB_META = {
  about: {
    title: "About ParkMath — who runs it and why",
    description:
      "ParkMath is run by its founder, Mike, to keep every UK airport drop-off and parking charge current, checked against each airport's own official page."
  },
  abroad: {
    title: "Going abroad? Total trip cost from UK airports",
    description:
      "The combined cost of driving to a UK airport and going abroad: parking or drop-off, phone roaming and baggage — verified per airport."
  },
  airportLounges: {
    title: "UK airport lounges — prices & Priority Pass",
    description:
      "Pre-book from-prices for lounges at major UK airports, which lounges take Priority Pass, and break-even calculators for membership."
  },
  airportParking: {
    title: "UK airport parking — gate vs pre-book prices",
    description:
      "Drive-up gate vs pre-book parking prices at major UK airports for 3, 7 and 14 days, verified against official tariffs and dated snapshots."
  },
  airportParkingOptions: {
    title: "UK airport parking options 2026, compared",
    description:
      "The cheapest way to park or drop off at every UK airport: forecourt drop-off, the free alternative, gate parking, Park & Ride and Meet & Greet."
  },
  avoidDropOffCharge: {
    title: "How to avoid UK airport drop-off charges 2026",
    description:
      "The verified free alternative at every UK airport that charges to drop off: where to park free, for how long, and how much you save."
  },
  blueBadge: {
    title: "Blue Badge airport drop-off 2026: is it free?",
    description:
      "Blue Badge drop-off at every UK airport: where the charge is waived, where there's a free window or only a concession — read from each airport's own page."
  },
  dropOffCharges: {
    title: "UK airport drop-off charges 2026 — every airport",
    description:
      "Every major UK airport's drop-off charge for 2026 in one sortable table: fee, time limit, £ per minute, penalty and the free alternative, all verified."
  },
  dropOffPriceIndex: {
    title: "UK Airport Drop-Off Price Index 2026",
    description:
      "Every major UK airport's drop-off charge ranked cheapest to dearest, each figure date-stamped and sourced to the airport's own page. Free to cite."
  },
  embed: {
    title: "Embed the UK airport drop-off table — free widget",
    description:
      "Add the live, verified UK airport drop-off charges table to your site with one line of code. Free iframe or script embed, always up to date."
  },
  methodology: {
    title: "How we verify every figure — methodology",
    description:
      "How ParkMath keeps UK airport drop-off and parking fees current: every figure read from the airport's own page, date-stamped and re-checked on a schedule."
  },
  news: {
    title: "UK airport news — drop-off & parking changes",
    description:
      "Dated, official-sourced updates to UK airport drop-off charges, parking, lounges and operations — verified and tracked by ParkMath."
  },
  parkingPriceIndex: {
    title: "UK Airport Parking & Drop-off Price Index 2026",
    description:
      "The 2026 index of UK airport drop-off charges and pre-book parking prices, verified against official sources and date-stamped. Raw data free to download."
  },
  parkingVsDropOff: {
    title: "Parking vs drop-off: which is cheaper? (2026)",
    description:
      "Should you park or get dropped off? The forecourt drop-off charge against drive-up parking at every UK airport we cover, from official figures."
  },
  press: {
    title: "Press & data — UK airport drop-off & parking",
    description:
      "Free-to-cite data for journalists: the UK Airport Drop-Off Price Index, an embeddable widget, the raw CSV, key figures and contact. Independent, CC BY 4.0."
  }
} satisfies Record<string, PageMeta>;
