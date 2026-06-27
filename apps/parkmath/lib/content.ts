import { formatPence, loungeBreakEven } from "@mathfamily/engine";
import { isPublicTransportAlt, type DropOffRecord, type LoungeRecord, type PriorityPassTier } from "@mathfamily/data";

/**
 * The token people actually search. The dataset stores official names ("London Stansted",
 * "London Heathrow"), but GSC queries are "stansted drop off charges", "heathrow drop off fee" —
 * the leading "London " buries the discriminating token and dilutes the title/H1 match. Drop it
 * for the headline label, EXCEPT where "London" is the whole brand ("London City"). The official
 * name is still used everywhere in the body and structured data.
 */
export function searchName(airportName: string): string {
  // "London City" is its own brand — never reduce it to "City".
  if (airportName === "London City") return airportName;
  const stripped = airportName.replace(/^London\s+/, "");
  return stripped.length > 0 ? stripped : airportName;
}

/**
 * One unique, indexable sentence about the time limit / tier structure of THIS airport's charge —
 * the bit that differs most between pages (Stansted's £28-over-15-min step, Bristol's escalating
 * bands, Southend's flat 10-min express). Null for free airports and flat per-entry tariffs (where
 * "time limit" is meaningless). Pure; data-driven only.
 */
export function dropOffTimeLimitNote(record: DropOffRecord): string | null {
  if (record.isFree || isPerEntryTariff(record)) return null;
  const first = record.bands[0];
  if (!first) return null;
  if (record.bands.length >= 2) {
    const next = record.bands[1]!;
    return `The headline ${formatPence(first.totalPence)} covers up to ${first.upToMinutes} minutes; stay longer and it steps up to ${formatPence(next.totalPence)}${record.maxStayMinutes !== null ? ` (max stay ${record.maxStayMinutes} minutes)` : ""}.`;
  }
  const cap = record.maxStayMinutes ?? first.upToMinutes;
  return `You get up to ${cap} minutes for the ${formatPence(first.totalPence)} charge — there is no cheaper shorter band, so a 2-minute stop costs the same as the full ${cap} minutes.`;
}

export function buildDropOffFaqs(record: DropOffRecord, airportName: string): { question: string; answer: string }[] {
  const search = searchName(airportName);
  // Number-first headline used by the conversational/AEO Q (matches "how much does it cost to drop
  // off at <airport>" pos 9, the exact phrasing answer engines extract — intel §1).
  const headline = record.isFree
    ? `Dropping off at ${search} Airport is free at the forecourt`
    : `It costs ${formatPence(record.bands[0]?.totalPence ?? 0)} to drop off at ${search} Airport — ${record.feeSummary.charAt(0).toLowerCase()}${record.feeSummary.slice(1)}`;
  const faqs: { question: string; answer: string }[] = [
    // Q1 matches the dominant query phrasing ("how much is it to drop off at <airport>") and uses the
    // searched token, not the "London …" prefix.
    { question: `How much is the drop-off charge at ${search} Airport?`, answer: `${record.feeSummary} (verified ${record.verifiedAt}, per the official ${airportName} page).` },
    // Q2 matches the conversational phrasing verbatim ("how much does it cost to drop off at <airport>")
    // with a number-first answer for answer-engine extraction.
    { question: `How much does it cost to drop off at ${search}?`, answer: `${headline} (verified ${record.verifiedAt}, per the official ${airportName} page).` }
  ];

  const timeLimit = dropOffTimeLimitNote(record);
  if (timeLimit) {
    faqs.push({
      question: `Is there a time limit on the ${search} drop-off zone?`,
      answer: timeLimit
    });
  }

  if (record.paymentDeadline) {
    faqs.push({
      question: `Can I pay the ${search} drop-off charge after I leave?`,
      answer: `Yes — pay by ${record.paymentDeadline}. ${record.penaltyNotes ?? ""}`.trim()
    });
    // When the airport's deadline says payment is online, add the exact "pay … online" Q-match
    // (GSC: "southend airport drop off payment online" pos 11.6, real payment-intent demand).
    if (/online/i.test(record.paymentDeadline)) {
      faqs.push({
        question: `Can I pay the ${search} drop-off charge online?`,
        answer: `Yes — ${search} Airport's drop-off charge is paid online (barrierless ANPR), not at a barrier. You can pay before your visit, on the day, or after you leave, by ${record.paymentDeadline.replace(/\s*\(online[^)]*\)/i, "")}. ${record.penaltyNotes ?? ""}`.trim()
      });
    }
  }

  // Penalty / PCN question — distinct per airport (Heathrow £80→£40 PCN, Bristol/Southend red-route
  // £100). Surfaces the real consequence of not paying, a high-intent query.
  if (record.penaltyPence !== null || record.penaltyNotes) {
    const penaltyLine = record.penaltyPence !== null ? `The penalty is ${formatPence(record.penaltyPence)}. ` : "";
    faqs.push({
      question: `What happens if you don't pay the ${search} drop-off fee?`,
      answer: `${penaltyLine}${record.penaltyNotes ?? "A Parking Charge Notice may be issued for non-payment."}`.trim()
    });
  }

  faqs.push({
    question: `Are Blue Badge holders exempt from the ${search} drop-off fee?`,
    answer: record.blueBadgePolicy
  });

  // Pick-up Q-match. GSC shows real, unaddressed pick-up demand on these pages ("free pick up
  // <airport>", "how much is pick up at <airport>") — the official source page covers BOTH actions
  // ("…/pick-up-and-drop-off/"), and pick-up uses the same forecourt charge. Answer is built only
  // from verified fields: the forecourt charge applies equally, and any free alternative doubles as
  // a free pick-up/waiting zone. Never fabricates a separate pick-up tariff.
  if (!record.isFree) {
    const alt = record.freeAlternative;
    const freeLine = alt
      ? isPublicTransportAlt(alt)
        ? ` For a free pick-up, arrive by the ${alt.name} instead of the forecourt.`
        : ` For free pick-up, the ${alt.name} gives ${alt.minutesFree} minutes free.`
      : "";
    faqs.push({
      question: `How much is pick-up at ${search} Airport?`,
      answer: `Pick-up uses the same forecourt as drop-off, so the same charge applies: ${record.feeSummary.charAt(0).toLowerCase()}${record.feeSummary.slice(1)}.${freeLine} Verified ${record.verifiedAt} against the official ${airportName} page.`.trim()
    });
  }

  if (record.freeAlternative) {
    const alt = record.freeAlternative;
    faqs.push({
      question: `How do I avoid the ${search} drop-off fee?`,
      answer: isPublicTransportAlt(alt)
        ? `Arrive by the ${alt.name} instead of using the forecourt. ${alt.details}`
        : `Use the ${alt.name} — free for ${alt.minutesFree} minutes. ${alt.details}`
    });
  } else if (!record.isFree) {
    // No free forecourt alternative is published — answer honestly rather than imply one exists.
    // Covers the "how to avoid the <airport> drop-off charge" query the title targets (e.g. Southend).
    faqs.push({
      question: `How do I avoid the ${search} drop-off fee?`,
      answer: `${airportName} doesn't publish a free drop-off zone, so there's no way to use the forecourt without paying ${formatPence(record.bands[0]?.totalPence ?? 0)}. The honest options are to keep the stop under the ${record.maxStayMinutes ?? record.bands[0]?.upToMinutes ?? "allowed"}-minute limit, pre-book parking if you're staying longer than a quick drop-off, or use public transport to the terminal. Don't stop on the surrounding red routes${record.penaltyPence !== null ? ` — that risks a ${formatPence(record.penaltyPence)} penalty` : ""}.`
    });
  }
  return faqs;
}

/** Unique, data-driven lounge FAQs. Surfaces each lounge's `notes` (operator/Priority Pass
 *  caveats) plus a membership break-even verdict, instead of two generic templated questions. */
export function buildLoungeFaqs(
  record: LoungeRecord,
  airportName: string,
  ppTiers: PriorityPassTier[]
): { question: string; answer: string }[] {
  const priced = record.lounges.filter((l) => l.walkInPence !== null);
  const cheapest = [...priced].sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  const ppLounges = record.lounges.filter((l) => l.priorityPass);
  const faqs: { question: string; answer: string }[] = [];

  faqs.push({
    question: `How much does an airport lounge cost at ${airportName}?`,
    answer: cheapest
      ? `Operator pre-book prices start at ${formatPence(cheapest.walkInPence!)} (${cheapest.name}), verified ${record.verifiedAt}. Walk-up rates on the day can be higher.`
      : `Walk-in prices aren't published for ${airportName} lounges — check the official lounge pages (verified ${record.verifiedAt}).`
  });

  faqs.push({
    question: `Which ${airportName} lounges accept Priority Pass?`,
    answer: ppLounges.length
      ? `${ppLounges.map((l) => l.name).join(", ")} accept Priority Pass at ${airportName}.`
      : `None of the tracked ${airportName} lounges currently list Priority Pass access.`
  });

  for (const lounge of record.lounges) {
    if (lounge.notes && lounge.notes.trim()) {
      const price = lounge.walkInPence !== null ? ` Pre-book from ${formatPence(lounge.walkInPence)}.` : "";
      faqs.push({
        question: `What should I know before visiting ${lounge.name} at ${airportName}?`,
        answer: `${lounge.notes}${price}`
      });
    }
  }

  if (cheapest) {
    const result = loungeBreakEven(cheapest.walkInPence!, 3, ppTiers);
    faqs.push({
      question: `Is a Priority Pass membership worth it at ${airportName}?`,
      answer:
        result.verdict === "membership" && result.savingsPence > 0
          ? `For frequent flyers, yes: at 3 visits a year a ${result.best?.tier} membership saves ${formatPence(result.savingsPence)} versus paying ${formatPence(cheapest.walkInPence!)} per visit (${cheapest.name}). Occasional visitors are better off paying on the day.`
          : `At 3 visits a year, paying per visit (${formatPence(result.payAsYouGoPence)}/year) beats membership at ${airportName} — it only pays off if you visit more often.`
    });
  }

  return faqs;
}

/** Answer-first summary for the drop-off index page: how many airports are free, and the
 *  cheapest/most-expensive of those that charge. Pure + unit-tested. */
export function dropOffIndexSummary(rows: { name: string; isFree: boolean; feePence: number }[]): string {
  const freeCount = rows.filter((r) => r.isFree).length;
  const paid = rows.filter((r) => !r.isFree).sort((a, b) => a.feePence - b.feePence);
  if (paid.length === 0) return `All ${rows.length} major UK airports let you drop off free.`;
  const cheapest = paid[0]!;
  const dearest = paid[paid.length - 1]!;
  return `${freeCount} of ${rows.length} major UK airports let you drop off free. Of those that charge, the cheapest is ${cheapest.name} at ${formatPence(cheapest.feePence)}; the most expensive is ${dearest.name} at ${formatPence(dearest.feePence)} (per drop-off, 2026).`;
}

/** The airport with the highest HEADLINE drop-off charge — the first/standard band (`bands[0]`),
 *  NOT a long-stay tier or overstay penalty. Mirrors how the table, trendNote and feeBySlug all
 *  rank (always `bands[0]`), so the home hero can't accidentally headline a 2-hour tariff (e.g.
 *  Bristol's £60/120-min band) instead of the real drop-off fee. Returns null when nothing charges. */
export function dearestDropOff(
  records: Pick<DropOffRecord, "airportSlug" | "isFree" | "bands">[]
): { airportSlug: string; pence: number; upToMinutes: number } | null {
  let best: { airportSlug: string; pence: number; upToMinutes: number } | null = null;
  for (const r of records) {
    if (r.isFree) continue;
    const headline = r.bands[0];
    if (!headline) continue;
    if (best === null || headline.totalPence > best.pence) {
      best = { airportSlug: r.airportSlug, pence: headline.totalPence, upToMinutes: headline.upToMinutes };
    }
  }
  return best;
}

export function trendNote(record: DropOffRecord): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  if (record.priorYearFeePence === 0) return `New charge for 2026 (${formatPence(current)})`;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return `Unchanged vs 2025 (${formatPence(current)})`;
  const direction = diff > 0 ? "Up" : "Down";
  return `${direction} ${formatPence(Math.abs(diff))} vs 2025 (${formatPence(record.priorYearFeePence)} → ${formatPence(current)})`;
}

/** A short confidence delta vs last year, or null when not comparable. */
export function freshnessDelta(record: Pick<DropOffRecord, "isFree" | "bands" | "priorYearFeePence">): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return "Unchanged vs last year";
  const fmt = (p: number) => `£${(p / 100).toFixed(2)}`;
  return diff > 0 ? `Up ${fmt(diff)} vs last year` : `Down ${fmt(-diff)} vs last year`;
}

/** The payment-deadline caveat text, driven by the real data (never generic copy). */
export function paymentDeadlineChip(record: Pick<DropOffRecord, "paymentDeadline">): string | null {
  return record.paymentDeadline ? `Pay by: ${record.paymentDeadline}` : null;
}

/**
 * Effective £-per-minute for the HEADLINE band — the "you're charged by the minute" data-PR metric.
 * It is the headline fee divided by the minutes you actually get for it (`bands[0].upToMinutes`),
 * i.e. the worst-case £/min if you only stop for a moment. Returns null when this framing is
 * meaningless: free airports (0) and flat per-entry tariffs (the charge isn't time-based, so
 * "per minute" would mislead — e.g. Heathrow's nominal 1-minute band).
 */
export function dropOffPerMinutePence(record: Pick<DropOffRecord, "isFree" | "bands"> & Partial<DropOffRecord>): number | null {
  if (record.isFree) return null;
  const first = record.bands[0];
  if (!first || first.upToMinutes <= 0) return null;
  if (isPerEntryTariff(record as DropOffRecord)) return null;
  return first.totalPence / first.upToMinutes;
}

export interface LeagueEntry {
  airportSlug: string;
  name: string;
  /** headline fee pence (bands[0]); 0 when free */
  feePence: number;
  /** minutes the headline fee buys (bands[0].upToMinutes); 0 when free/per-entry */
  minutes: number;
  /** effective £/min in pence, or null when not a time-based charge (free / per-entry) */
  perMinutePence: number | null;
  isFree: boolean;
  isPerEntry: boolean;
}

/**
 * Build the £-per-minute league table: every airport, with the worst-value-per-minute first.
 * Time-based tariffs are ranked by £/min (descending); per-entry and free airports are ranked
 * last (they have no honest per-minute figure) and sorted among themselves by headline fee.
 * Pure + unit-tested — drives the public "most & least expensive to drop off" ranking.
 */
export function buildDropOffLeague(
  records: (Pick<DropOffRecord, "airportSlug" | "isFree" | "bands"> & Partial<DropOffRecord>)[],
  nameFor: (slug: string) => string
): LeagueEntry[] {
  const entries: LeagueEntry[] = records.map((r) => {
    const first = r.bands[0];
    const perEntry = !r.isFree && isPerEntryTariff(r as DropOffRecord);
    return {
      airportSlug: r.airportSlug,
      name: nameFor(r.airportSlug),
      feePence: r.isFree ? 0 : (first?.totalPence ?? 0),
      minutes: r.isFree || perEntry ? 0 : (first?.upToMinutes ?? 0),
      perMinutePence: dropOffPerMinutePence(r),
      isFree: r.isFree,
      isPerEntry: perEntry
    };
  });
  return entries.sort((a, b) => {
    // Time-based (has a per-minute figure) always ranks above per-entry/free.
    if (a.perMinutePence !== null && b.perMinutePence !== null) return b.perMinutePence - a.perMinutePence;
    if (a.perMinutePence !== null) return -1;
    if (b.perMinutePence !== null) return 1;
    // Among non-per-minute (per-entry / free): dearer headline fee first.
    return b.feePence - a.feePence;
  });
}

/**
 * Number-first, source-cited answer paragraph for the comparison hub (GEO/AEO citation asset).
 * Leads with hard numbers (how many airports charge, the dearest & cheapest headline fee, and the
 * worst £/min) so an answer engine can lift one self-contained, sourced sentence. Pure + tested.
 */
export function dropOffHubAnswer(
  league: LeagueEntry[],
  verifiedDate: string
): string {
  const charging = league.filter((e) => !e.isFree);
  const free = league.filter((e) => e.isFree);
  const byFee = [...charging].sort((a, b) => a.feePence - b.feePence);
  const cheapest = byFee[0];
  const dearest = byFee[byFee.length - 1];
  const perMin = league.filter((e) => e.perMinutePence !== null);
  const worstPerMin = perMin[0]; // league is already £/min-descending
  const fmtVerified = new Date(`${verifiedDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  });
  const total = league.length;
  const parts: string[] = [];
  parts.push(
    `As of ${fmtVerified}, ${charging.length} of the ${total} largest UK airports charge to drop a passenger off at the terminal${free.length ? `; ${free.length} still let you drop off free` : ""}.`
  );
  if (dearest && cheapest) {
    parts.push(
      `The most expensive headline fee is ${dearest.name} at ${formatPence(dearest.feePence)}, and the cheapest charge is ${cheapest.name} at ${formatPence(cheapest.feePence)}.`
    );
  }
  if (worstPerMin && worstPerMin.perMinutePence !== null) {
    parts.push(
      `Measured per minute of allowance, the worst value is ${worstPerMin.name} at ${formatPence(Math.round(worstPerMin.perMinutePence))}/minute (${formatPence(worstPerMin.feePence)} for up to ${worstPerMin.minutes} minutes).`
    );
  }
  parts.push("Every figure is read from each airport's own official page and date-stamped below.");
  return parts.join(" ");
}

export function isPerEntryTariff(record: DropOffRecord): boolean {
  const first = record.bands[0];
  return !record.isFree && record.bands.length === 1 && first !== undefined && first.upToMinutes <= 1;
}

/**
 * Concrete "(£X for up to Y minutes)" anchor for the headline answer — but ONLY when it adds
 * something. Returns null when:
 *  - the record is free / has no band;
 *  - it's a flat per-entry tariff (the "for up to 1 minute" framing is misleading — the charge
 *    is per entry, not per minute);
 *  - feeSummary already states that exact "£X for up to Y minutes…" phrasing (appending it would
 *    duplicate the price, e.g. "…max stay 30 minutes) (£10 for up to 10 minutes)").
 */
export function bandPriceParenthetical(record: DropOffRecord): string | null {
  const first = record.bands[0];
  if (record.isFree || !first || isPerEntryTariff(record)) return null;
  const price = formatPence(first.totalPence);
  const phrase = `${price} for up to ${first.upToMinutes} minute`; // matches "minute" and "minutes"
  if (record.feeSummary.toLowerCase().includes(phrase.toLowerCase())) return null;
  return `${price} for up to ${first.upToMinutes} minutes`;
}

/**
 * One citable row of the UK Airport Drop-Off Price Index — every figure read straight from the
 * record (NO new/derived prices beyond the per-minute metric the league already exposes), each
 * carrying its own source URL + verified date so the row is independently citable.
 */
export interface PriceIndexRow {
  rank: number;
  airportSlug: string;
  airportName: string;
  iata: string;
  isFree: boolean;
  feePence: number; // 0 when free — the HEADLINE band only
  fee: string; // "Free" | "£10.00"
  upToMinutes: number | null; // band[0].upToMinutes; null when free/per-entry
  timeLabel: string; // "10 min" | "Per entry" | "—"
  perMinutePence: number | null;
  perMinLabel: string; // "£1.00/min" | "Flat" | "Free"
  penaltyPence: number | null;
  penaltyLabel: string; // "£100.00" | "—"
  freeAlternative: string; // human label or "—"
  yoy: string | null; // trendNote, when a prior-year figure exists
  sourceUrl: string;
  verifiedAt: string;
}

/**
 * Build the ranked Price Index: free airports first (rank ascending), then charging airports
 * cheapest→dearest by HEADLINE fee. Pure + unit-tested. Reuses the same band/per-minute logic as
 * the league table so the two never disagree. `nameFor`/`iataFor` resolve airport metadata so this
 * stays correct if the dataset changes. NEVER invents or rounds a published price.
 */
export function buildPriceIndex(
  records: DropOffRecord[],
  nameFor: (slug: string) => string,
  iataFor: (slug: string) => string
): PriceIndexRow[] {
  const sorted = [...records].sort((a, b) => {
    // Free airports first (a £0 forecourt is the cheapest possible "fee").
    if (a.isFree && !b.isFree) return -1;
    if (b.isFree && !a.isFree) return 1;
    const fa = a.bands[0]?.totalPence ?? 0;
    const fb = b.bands[0]?.totalPence ?? 0;
    if (fa !== fb) return fa - fb; // cheapest charge first
    return nameFor(a.airportSlug).localeCompare(nameFor(b.airportSlug));
  });
  return sorted.map((r, i) => {
    const first = r.bands[0];
    const perEntry = !r.isFree && isPerEntryTariff(r);
    const perMin = dropOffPerMinutePence(r);
    const feePence = r.isFree ? 0 : (first?.totalPence ?? 0);
    return {
      rank: i + 1,
      airportSlug: r.airportSlug,
      airportName: nameFor(r.airportSlug),
      iata: iataFor(r.airportSlug),
      isFree: r.isFree,
      feePence,
      fee: r.isFree ? "Free" : formatPence(feePence),
      upToMinutes: r.isFree || perEntry ? null : (first?.upToMinutes ?? null),
      timeLabel: r.isFree ? "—" : perEntry ? "Per entry" : first ? `${first.upToMinutes} min` : "—",
      perMinutePence: perMin,
      perMinLabel: perMin !== null ? `${formatPence(Math.round(perMin))}/min` : r.isFree ? "Free" : "Flat",
      penaltyPence: r.penaltyPence,
      penaltyLabel: r.penaltyPence !== null ? formatPence(r.penaltyPence) : "—",
      freeAlternative: r.freeAlternative
        ? isPublicTransportAlt(r.freeAlternative)
          ? `${r.freeAlternative.name} (public transport)`
          : `${r.freeAlternative.name} (${r.freeAlternative.minutesFree} min)`
        : "—",
      yoy: trendNote(r),
      sourceUrl: r.sourceUrl,
      verifiedAt: r.verifiedAt
    };
  });
}
