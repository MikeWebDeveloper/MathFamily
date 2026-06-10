export interface ParkingPrice {
  days: number;
  totalPence: number;
}

export interface ParkingTariffProduct {
  productType: "gate" | "prebook" | "meet-greet" | "park-ride";
  name: string;
  prices: ParkingPrice[];
  snapshotDate: string | null;
}

export interface ParkingTariff {
  products: ParkingTariffProduct[];
  verifiedAt: string; // YYYY-MM-DD
}

export type ParkingWarningCode = "PREBOOK_SNAPSHOT" | "DATA_UNVERIFIED_RECENTLY" | "DURATION_NOT_COVERED";

export interface ParkingWarning {
  code: ParkingWarningCode;
  message: string;
}

export interface ParkingOption {
  productType: ParkingTariffProduct["productType"];
  name: string;
  totalPence: number;
  snapshotDate: string | null;
}

export interface ParkingComparison {
  days: number;
  options: ParkingOption[]; // cheapest first
  gate: ParkingOption | null;
  cheapest: ParkingOption | null;
  savingsVsGatePence: number | null;
  warnings: ParkingWarning[];
}

const STALE_AFTER_DAYS = 60;

export function compareParking(tariff: ParkingTariff, requestedDays: number, now: Date = new Date()): ParkingComparison {
  const warnings: ParkingWarning[] = [];
  const days = Math.max(1, Math.round(Number.isFinite(requestedDays) ? requestedDays : 1));

  const verified = new Date(`${tariff.verifiedAt}T00:00:00Z`).getTime();
  const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
  if (Number.isNaN(ageDays) || ageDays > STALE_AFTER_DAYS) {
    warnings.push({
      code: "DATA_UNVERIFIED_RECENTLY",
      message: `Last verified ${tariff.verifiedAt} — check live prices before you book.`
    });
  }

  const options: ParkingOption[] = [];
  for (const product of tariff.products) {
    const price = product.prices.find((p) => p.days === days);
    if (!price) continue;
    options.push({ productType: product.productType, name: product.name, totalPence: price.totalPence, snapshotDate: product.snapshotDate });
  }
  options.sort((a, b) => a.totalPence - b.totalPence);

  if (options.length === 0) {
    warnings.push({ code: "DURATION_NOT_COVERED", message: `No published prices for ${days} day(s) — see the official site.` });
  }
  if (options.some((o) => o.productType === "prebook")) {
    const snap = options.find((o) => o.productType === "prebook")?.snapshotDate;
    warnings.push({
      code: "PREBOOK_SNAPSHOT",
      message: `Pre-book prices are a snapshot${snap ? ` from ${snap}` : ""} — live prices vary by date.`
    });
  }

  const gate = options.find((o) => o.productType === "gate") ?? null;
  const cheapest = options[0] ?? null;
  const savingsVsGatePence = gate && cheapest && gate !== cheapest ? gate.totalPence - cheapest.totalPence : null;

  return { days, options, gate, cheapest, savingsVsGatePence, warnings };
}
