const EARTH_RADIUS_KM = 6371;

/** Minimal geo-locatable shape — any record carrying decimal-degree coordinates. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Great-circle distance between two lat/lng points, in kilometres (haversine). */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface NearestResult<T> {
  airport: T;
  distanceKm: number;
}

/** The `n` items closest to (lat, lng), nearest first. Ties keep input order.
 *  Generic over any `{ lat, lng }` record so the engine stays decoupled from the data package. */
export function nearestAirports<T extends GeoPoint>(lat: number, lng: number, airports: T[], n: number): NearestResult<T>[] {
  return airports
    .map((airport) => ({ airport, distanceKm: haversineKm(lat, lng, airport.lat, airport.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Math.max(0, n));
}
