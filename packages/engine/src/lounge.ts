export interface MembershipTier {
  tier: string;
  annualFeePence: number;
  includedVisits: number | null; // null = unlimited
  perVisitPence: number;
}

export interface LoungeBreakEven {
  visitsPerYear: number;
  payAsYouGoPence: number;
  tierCosts: { tier: string; totalPence: number }[];
  best: { tier: string; totalPence: number } | null;
  verdict: "payg" | "membership";
  savingsPence: number;
}

export function loungeBreakEven(walkInPence: number, visitsPerYear: number, tiers: MembershipTier[]): LoungeBreakEven {
  const visits = Math.max(1, Math.round(Number.isFinite(visitsPerYear) ? visitsPerYear : 1));
  const walkIn = Number.isInteger(walkInPence) && walkInPence > 0 ? walkInPence : 0;
  const payAsYouGoPence = walkIn * visits;

  const tierCosts = tiers.map((t) => {
    const extraVisits = t.includedVisits === null ? 0 : Math.max(0, visits - t.includedVisits);
    return { tier: t.tier, totalPence: t.annualFeePence + extraVisits * t.perVisitPence };
  });

  const best = [...tierCosts].sort((a, b) => a.totalPence - b.totalPence)[0] ?? null;
  const membershipWins = best !== null && best.totalPence < payAsYouGoPence;

  return {
    visitsPerYear: visits,
    payAsYouGoPence,
    tierCosts,
    best,
    verdict: membershipWins ? "membership" : "payg",
    savingsPence: membershipWins && best ? payAsYouGoPence - best.totalPence : 0
  };
}
