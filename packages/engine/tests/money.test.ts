import { describe, expect, it } from "vitest";
import { formatPence } from "../src/money";

describe("formatPence", () => {
  it("formats whole pounds without decimals", () => {
    expect(formatPence(1000)).toBe("£10");
  });
  it("formats pence with two decimals", () => {
    expect(formatPence(750)).toBe("£7.50");
  });
  it("formats zero as £0", () => {
    expect(formatPence(0)).toBe("£0");
  });
  it("adds thousands separators", () => {
    expect(formatPence(2800000)).toBe("£28,000");
  });
  it("zero-pads single-digit pence remainders", () => {
    expect(formatPence(705)).toBe("£7.05");
  });
  it("throws on non-integer input (programmer error, not user input)", () => {
    expect(() => formatPence(10.5)).toThrow();
  });
  it("throws on negative input", () => {
    expect(() => formatPence(-100)).toThrow();
  });
});
