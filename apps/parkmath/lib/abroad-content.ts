import {
  loadAirports,
  loadDropOffDataset,
  loadParkingDataset,
  loadBaggageDataset,
  loadRoamingDataset,
  type Airport
} from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { parkingPageModel } from "./parking-content";

export interface AbroadModel {
  airport: Airport;
  hasParking: boolean;
  cheapestParkingPence: number | null; // cheapest 7-day pre-book
  cheapestParkingName: string | null;
  gateParkingPence: number | null;
  dropOff: { isFree: boolean; chargePence: number | null };
  roaming: { totalDestinations: number; includedCount: number; rowDailyFromPence: number | null };
  baggage: { cabinMinPence: number | null; cabinMaxPence: number | null };
  verifiedAt: string;
  faqs: { question: string; answer: string }[];
}

/** Union of every airport that has a drop-off OR parking record. */
export function abroadAirportSlugs(): string[] {
  const slugs = new Set(loadDropOffDataset().records.map((r) => r.airportSlug));
  for (const r of loadParkingDataset().records) slugs.add(r.airportSlug);
  return [...slugs];
}

export function abroadModel(slug: string): AbroadModel | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  if (!airport) return null;

  const parkingRecord = loadParkingDataset().records.find((r) => r.airportSlug === slug) ?? null;
  const dropOffRecord = loadDropOffDataset().records.find((r) => r.airportSlug === slug) ?? null;
  if (!parkingRecord && !dropOffRecord) return null;

  // Parking: cheapest 7-day pre-book + gate, via the existing model.
  const pm = parkingRecord ? parkingPageModel(parkingRecord, 7) : null;
  const cheapestParkingPence = pm?.cheapest?.totalPence ?? null;
  const cheapestParkingName = pm?.cheapest?.name ?? null;
  const gateParkingPence = pm?.gate?.totalPence ?? null;

  // Drop-off: first band charge, or free.
  const dropOff = dropOffRecord
    ? { isFree: dropOffRecord.isFree, chargePence: dropOffRecord.isFree ? null : (dropOffRecord.bands[0]?.totalPence ?? null) }
    : { isFree: false, chargePence: null };

  // Roaming summary — airport-independent. Derived ONLY from the `included` flag
  // (the dataset does not label EU vs rest-of-world; do not assert "EU is free").
  const roam = loadRoamingDataset();
  const totalDestinations = roam.destinations.length;
  const includedCount = roam.destinations.filter((d) => d.perNetwork.some((n) => n.included)).length;
  const rowPasses = roam.destinations
    .filter((d) => !d.perNetwork.some((n) => n.included))
    .flatMap((d) => d.perNetwork.map((n) => n.dailyPassPence))
    .filter((p): p is number => p !== null && p > 0);
  const rowDailyFromPence = rowPasses.length ? Math.min(...rowPasses) : null;

  // Baggage cabin range across all airlines.
  const bag = loadBaggageDataset();
  const cabinFees = bag.records.flatMap((r) => r.fees.filter((f) => f.item.toLowerCase().includes("cabin")));
  const cabinMins = cabinFees.map((f) => f.minPence).filter((p): p is number => p !== null);
  const cabinMaxs = cabinFees.map((f) => f.maxPence).filter((p): p is number => p !== null);
  const baggage = {
    cabinMinPence: cabinMins.length ? Math.min(...cabinMins) : null,
    cabinMaxPence: cabinMaxs.length ? Math.max(...cabinMaxs) : null
  };

  // Latest verified date across every source used (ISO dates sort lexicographically).
  const dates = [
    parkingRecord?.verifiedAt,
    dropOffRecord?.verifiedAt,
    bag.lastUpdated,
    ...roam.networkSources.map((s) => s.verifiedAt)
  ].filter((d): d is string => Boolean(d));
  const verifiedAt = dates.sort().at(-1) ?? roam.lastUpdated;

  const faqs = [
    {
      question: `What's the cheapest way to get to ${airport.name} for a trip abroad?`,
      answer:
        cheapestParkingPence !== null
          ? `Pre-booked parking from ${cheapestParkingName} at ${formatPence(cheapestParkingPence)} for 7 days, or a drop-off ${dropOff.isFree ? "(free at the forecourt)" : dropOff.chargePence !== null ? `charge of ${formatPence(dropOff.chargePence)}` : ""}.`
          : dropOff.isFree
            ? `Drop-off is free at the forecourt; ${airport.name} parking prices aren't in our verified data yet.`
            : `A drop-off ${dropOff.chargePence !== null ? `charge of ${formatPence(dropOff.chargePence)}` : "fee applies"}.`
    },
    {
      question: `Will using my phone abroad cost extra from ${airport.name}?`,
      answer: `Roaming is included on the major UK networks for ${includedCount} of the ${totalDestinations} destinations we track${rowDailyFromPence !== null ? `; elsewhere, daily passes start from ${formatPence(rowDailyFromPence)} per day` : ""}. Check the exact cost for your destination on RoamMath.`
    },
    {
      question: `How much is a bag on top?`,
      answer:
        baggage.cabinMinPence !== null && baggage.cabinMaxPence !== null
          ? `A cabin bag ranges ${formatPence(baggage.cabinMinPence)}–${formatPence(baggage.cabinMaxPence)} across the airlines we track, depending on carrier and fare.`
          : `Cabin-bag fees vary by airline — see RoamMath's baggage comparison.`
    }
  ];

  return {
    airport,
    hasParking: parkingRecord !== null,
    cheapestParkingPence,
    cheapestParkingName,
    gateParkingPence,
    dropOff,
    roaming: { totalDestinations, includedCount, rowDailyFromPence },
    baggage,
    verifiedAt,
    faqs
  };
}
