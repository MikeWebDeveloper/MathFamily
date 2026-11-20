import { STALE_AFTER_DAYS } from "@mathfamily/engine";

/**
 * The two dates an airport page carries, kept apart on purpose.
 *
 * - `verifiedAt` is when the page's figures were last checked against the airport's official page.
 *   It is the only date a "Verified …" badge or a "verified on …" sentence may show.
 * - `dateModified` is when the page last changed. A newer news item shown on the page moves it,
 *   so it feeds the WebPage JSON-LD, not the verified claim.
 *
 * Until Nov 2026 the four news-carrying routes used the newer of the two for both. The Stansted page
 * then said its £10 charge "was verified on 17 October" when it was last checked on 3 September (the
 * 17 Oct date was a news item's), and the 78-day-old figure lost the stale label the FreshnessBadge
 * shows past STALE_AFTER_DAYS.
 */
export interface PageDates {
  verifiedAt: string;
  dateModified: string;
  /** Past the engine's stale threshold, the same cut-off the FreshnessBadge and quote warnings use. */
  stale: boolean;
}

export function pageDates(recordVerifiedAt: string, newsVerifiedAt?: string | null, now: Date = new Date()): PageDates {
  const ageDays = Math.floor((now.getTime() - Date.parse(`${recordVerifiedAt}T00:00:00Z`)) / 86_400_000);
  return {
    verifiedAt: recordVerifiedAt,
    dateModified: newsVerifiedAt && newsVerifiedAt > recordVerifiedAt ? newsVerifiedAt : recordVerifiedAt,
    // NaN (an unreadable date) fails the comparison, so it counts as stale.
    stale: !(ageDays <= STALE_AFTER_DAYS)
  };
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** The drop-off page's above-the-fold freshness line. It claims "current information" only while the
 *  figure is inside the freshness window; past it, it gives the real date and points to the source. */
export function dropOffVerifiedSentence(searchName: string, airportName: string, dates: PageDates): string {
  const when = longDate(dates.verifiedAt);
  return dates.stale
    ? `${searchName} Airport's drop-off charge was last verified on ${when}, so check the official ${airportName} page before you travel.`
    : `Yes, this is current information: ${searchName} Airport's drop-off charge was verified on ${when} against the official ${airportName} page.`;
}
