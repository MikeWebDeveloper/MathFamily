import { formatPence } from "@mathfamily/engine";
import { AnswerPassage } from "@mathfamily/ui";
import type { AbroadModel } from "../lib/abroad-content";

export function AbroadAnswer({ model, roammathUrl }: { model: AbroadModel; roammathUrl?: string }) {
  const { airport, cheapestParkingPence, cheapestParkingName, dropOff, roaming, baggage } = model;
  const parkClause =
    cheapestParkingPence !== null
      ? `a week's parking is ${formatPence(cheapestParkingPence)} (cheapest verified pre-book${cheapestParkingName ? `, ${cheapestParkingName}` : ""})`
      : null;
  const dropClause = dropOff.isFree
    ? "drop-off is free at the forecourt"
    : dropOff.chargePence !== null
      ? `drop-off costs ${formatPence(dropOff.chargePence)}`
      : null;
  const lead = [parkClause, dropClause].filter(Boolean).join(" — or ");
  const baggageClause =
    baggage.cabinMinPence !== null && baggage.cabinMaxPence !== null
      ? ` One cabin bag adds ${formatPence(baggage.cabinMinPence)}–${formatPence(baggage.cabinMaxPence)} depending on airline.`
      : "";

  return (
    <div className="space-y-6">
      <AnswerPassage question={`How much to drive to ${airport.name} and go abroad?`}>
        {`Getting to ${airport.name}: ${lead || "see the airport's own pages"}. Using your phone abroad is included on the major UK networks for ${roaming.includedCount} of the ${roaming.totalDestinations} destinations we track${roaming.rowDailyFromPence !== null ? `, or from ${formatPence(roaming.rowDailyFromPence)} a day where it isn't` : ""}.${baggageClause} All figures are official and date-stamped.`}
      </AnswerPassage>

      {/* Parking & drop-off mini panel — airport-specific (the unique substance) */}
      <div className="rounded-card border border-ink/10 bg-card p-4">
        <h3 className="text-sm font-semibold text-ink">Getting to {airport.name}</h3>
        <ul className="mt-2 space-y-1 text-sm text-ink-muted">
          {cheapestParkingPence !== null ? (
            <li>
              Cheapest 7-day parking: <span className="font-medium text-ink">{formatPence(cheapestParkingPence)}</span>{" "}
              <a href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                full parking comparison →
              </a>
            </li>
          ) : null}
          <li>
            Drop-off:{" "}
            <span className="font-medium text-ink">
              {dropOff.isFree ? "Free" : dropOff.chargePence !== null ? formatPence(dropOff.chargePence) : "see page"}
            </span>{" "}
            <a href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
              drop-off details →
            </a>
          </li>
        </ul>
      </div>

      {/* Compact roaming summary + RoamMath CTA — NOT a per-destination table */}
      <div className="rounded-card border border-ink/10 bg-surface-muted p-4">
        <h3 className="text-sm font-semibold text-ink">Using your phone abroad</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Roaming is included on the major UK networks for {roaming.includedCount} of {roaming.totalDestinations} tracked destinations
          {roaming.rowDailyFromPence !== null ? (
            <>
              , or from <span className="font-medium text-ink">{formatPence(roaming.rowDailyFromPence)}/day</span> elsewhere
            </>
          ) : null}
          .
        </p>
        {roammathUrl ? (
          <p className="mt-2 text-sm">
            <a href={`${roammathUrl}/roaming`} rel="noopener noreferrer" className="font-medium text-brand-accent underline underline-offset-4">
              See the exact cost for your destination → RoamMath
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
