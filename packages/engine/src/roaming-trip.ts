export interface NetworkRoamingOption {
  network: string;
  included: boolean;
  dailyPassPence: number | null;
  passName: string | null;
  fairUseNote: string | null;
}

export interface EsimBundleOption {
  provider: string;
  bundleName: string;
  dataGb: number | null; // null = unlimited
  validityDays: number;
  totalPence: number;
  snapshotDate: string;
}

export type RoamingWarningCode = "ESIM_SNAPSHOT" | "NO_ESIM_COVERS" | "FAIR_USE";

export interface RoamingWarning {
  code: RoamingWarningCode;
  message: string;
}

export interface NetworkCost {
  network: string;
  totalPence: number | null; // null when no published pass covers the destination
  included: boolean;
  note: string | null;
}

export interface RoamingTripResult {
  days: number;
  dataGbNeeded: number;
  networkCosts: NetworkCost[]; // cheapest first; null-cost entries last
  cheapestNetwork: NetworkCost | null;
  esimChoice: EsimBundleOption | null;
  verdict: "network" | "esim" | "unknown";
  savingsPence: number;
  warnings: RoamingWarning[];
}

export function roamingTripCost(
  networks: NetworkRoamingOption[],
  esims: EsimBundleOption[],
  tripDays: number,
  dataGbNeeded: number
): RoamingTripResult {
  const days = Math.max(1, Math.round(Number.isFinite(tripDays) ? tripDays : 1));
  const dataGb = Math.max(0, Number.isFinite(dataGbNeeded) ? dataGbNeeded : 0);
  const warnings: RoamingWarning[] = [];

  const networkCosts: NetworkCost[] = networks.map((n) => {
    if (n.included) return { network: n.network, totalPence: 0, included: true, note: n.fairUseNote };
    if (n.dailyPassPence === null || !Number.isInteger(n.dailyPassPence) || n.dailyPassPence < 0) {
      return { network: n.network, totalPence: null, included: false, note: n.fairUseNote };
    }
    return { network: n.network, totalPence: n.dailyPassPence * days, included: false, note: n.fairUseNote };
  });
  networkCosts.sort((a, b) => (a.totalPence ?? Number.MAX_SAFE_INTEGER) - (b.totalPence ?? Number.MAX_SAFE_INTEGER));
  const cheapestNetwork = networkCosts.find((n) => n.totalPence !== null) ?? null;

  const eligible = esims.filter(
    (e) => e.validityDays >= days && (e.dataGb === null || e.dataGb >= dataGb) && Number.isInteger(e.totalPence) && e.totalPence >= 0
  );
  eligible.sort((a, b) => a.totalPence - b.totalPence);
  const esimChoice = eligible[0] ?? null;

  if (esimChoice) {
    warnings.push({
      code: "ESIM_SNAPSHOT",
      message: `eSIM prices are snapshots from ${esimChoice.snapshotDate} — live prices vary.`
    });
  } else {
    warnings.push({
      code: "NO_ESIM_COVERS",
      message: `No tracked eSIM bundle covers ${days} days with ${dataGb}GB — check the providers directly.`
    });
  }
  const fairUse = networks.find((n) => n.included && n.fairUseNote);
  if (fairUse?.fairUseNote) {
    warnings.push({ code: "FAIR_USE", message: `${fairUse.network.toUpperCase()}: ${fairUse.fairUseNote}.` });
  }

  let verdict: RoamingTripResult["verdict"] = "unknown";
  let savingsPence = 0;
  if (cheapestNetwork?.totalPence !== null && cheapestNetwork !== null && esimChoice) {
    if (cheapestNetwork.totalPence <= esimChoice.totalPence) {
      verdict = "network";
      savingsPence = 0;
    } else {
      verdict = "esim";
      savingsPence = cheapestNetwork.totalPence - esimChoice.totalPence;
    }
  } else if (cheapestNetwork) {
    verdict = "network";
  } else if (esimChoice) {
    verdict = "esim";
  }

  return { days, dataGbNeeded: dataGb, networkCosts, cheapestNetwork, esimChoice, verdict, savingsPence, warnings };
}
