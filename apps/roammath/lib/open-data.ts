import { loadRoamingDataset, loadBaggageDataset } from "@mathfamily/data";

const gbp = (pence: number | null | undefined) => (pence === null || pence === undefined ? "" : (pence / 100).toFixed(2));

export function roamingCsv(): { header: string[]; rows: (string | number | null)[][] } {
  const { destinations, networkSources } = loadRoamingDataset();
  const src = new Map(networkSources.map((s) => [s.network, s]));
  const header = ["country","iso2","network","included","daily_pass_gbp","pass_name","verified_at","source_url"];
  const rows = destinations.flatMap((d) =>
    d.perNetwork.map((n) => {
      const s = src.get(n.network);
      return [d.countryName, d.iso2, n.network, n.included ? "yes" : "no", gbp(n.dailyPassPence), n.passName ?? "", s?.verifiedAt ?? "", s?.sourceUrl ?? ""];
    })
  );
  return { header, rows };
}

export function baggageCsv(): { header: string[]; rows: (string | number | null)[][] } {
  const { records } = loadBaggageDataset();
  const header = ["airline","item","min_gbp","max_gbp","note","verified_at","source_url"];
  const rows = records.flatMap((r) =>
    r.fees.map((f) => [r.airlineName, f.item, gbp(f.minPence), gbp(f.maxPence), f.note ?? "", r.verifiedAt, r.sourceUrl])
  );
  return { header, rows };
}
