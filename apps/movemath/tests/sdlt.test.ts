import { describe, expect, it } from "vitest";
import { calculateSdlt, FTB_RELIEF_CLIFF_PENCE } from "../lib/sdlt";

const p = (pounds: number) => pounds * 100;

describe("calculateSdlt — standard (home mover)", () => {
  it("charges £0 up to the £125k nil-rate band", () => {
    expect(calculateSdlt(p(125_000), "home-mover").totalTaxPence).toBe(0);
  });

  it("£250,000: 0% to 125k + 2% on next 125k = £2,500", () => {
    // 125,000 * 0.02 = 2,500
    expect(calculateSdlt(p(250_000), "home-mover").totalTaxPence).toBe(p(2_500));
  });

  it("£350,000: 2% slice (125k) + 5% slice (100k) = £2,500 + £5,000 = £7,500", () => {
    expect(calculateSdlt(p(350_000), "home-mover").totalTaxPence).toBe(p(7_500));
  });

  it("£925,000: 2% on 125k + 5% on 675k = £2,500 + £33,750 = £36,250", () => {
    expect(calculateSdlt(p(925_000), "home-mover").totalTaxPence).toBe(p(36_250));
  });
});

describe("calculateSdlt — first-time buyer", () => {
  it("£250,000: £0 (relief covers up to £300k)", () => {
    expect(calculateSdlt(p(250_000), "first-time-buyer").totalTaxPence).toBe(0);
  });

  it("£450,000: 0% to 300k + 5% on 150k = £7,500", () => {
    expect(calculateSdlt(p(450_000), "first-time-buyer").totalTaxPence).toBe(p(7_500));
  });

  it("loses relief above £500k — standard rates apply to the whole price", () => {
    const ftb = calculateSdlt(p(550_000), "first-time-buyer");
    const mover = calculateSdlt(p(550_000), "home-mover");
    expect(ftb.ftbReliefLost).toBe(true);
    expect(ftb.totalTaxPence).toBe(mover.totalTaxPence);
  });

  it("relief still applies at exactly £500k (the cliff boundary)", () => {
    const ftb = calculateSdlt(FTB_RELIEF_CLIFF_PENCE, "first-time-buyer");
    expect(ftb.ftbReliefLost).toBe(false);
    // 0% to 300k + 5% on 200k = £10,000
    expect(ftb.totalTaxPence).toBe(p(10_000));
  });
});

describe("calculateSdlt — additional property (+5% surcharge)", () => {
  it("£250,000: standard £2,500 + 5% surcharge on whole £250k (£12,500) = £15,000", () => {
    expect(calculateSdlt(p(250_000), "additional-property").totalTaxPence).toBe(p(15_000));
  });

  it("surcharge does not apply at/under £40,000", () => {
    const at40k = calculateSdlt(p(40_000), "additional-property");
    // Standard rate at £40k is 0% (under nil-rate band) and no surcharge → £0
    expect(at40k.totalTaxPence).toBe(0);
  });

  it("additional always costs more than standard above £40k", () => {
    const add = calculateSdlt(p(300_000), "additional-property").totalTaxPence;
    const std = calculateSdlt(p(300_000), "home-mover").totalTaxPence;
    expect(add).toBeGreaterThan(std);
  });
});

describe("calculateSdlt — invariants", () => {
  it("effective rate is between 0 and the top marginal rate", () => {
    const r = calculateSdlt(p(2_000_000), "home-mover");
    expect(r.effectiveRate).toBeGreaterThan(0);
    expect(r.effectiveRate).toBeLessThan(0.17);
  });

  it("zero price → zero tax, zero effective rate", () => {
    const r = calculateSdlt(0, "home-mover");
    expect(r.totalTaxPence).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });
});
