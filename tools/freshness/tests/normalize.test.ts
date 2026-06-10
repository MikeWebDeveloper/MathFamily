import { describe, expect, it } from "vitest";
import { contentFingerprint, normalizeText } from "../src/normalize";

describe("normalizeText", () => {
  it("strips HTML tags and collapses whitespace", () => {
    expect(normalizeText("<p>Drop-off:\n  <b>£10</b></p>")).toBe("Drop-off: £10");
  });
  it("removes date-like strings so daily date churn doesn't trigger", () => {
    const a = normalizeText("Prices correct on 1 April 2026. Fee £10. Updated 2026-04-01.");
    const b = normalizeText("Prices correct on 2 May 2026. Fee £10. Updated 2026-05-02.");
    expect(a).toBe(b);
  });
  it("removes cookie-banner boilerplate lines", () => {
    const a = normalizeText("We value your privacy. Accept All.\nFee £10");
    expect(a).toContain("Fee £10");
    expect(a.toLowerCase()).not.toContain("privacy");
  });
  it("cookie banner followed by a price table keeps the prices", () => {
    const html = "<div>We use cookies. Accept All</div><table><tr><td>Drop-off</td><td>£4.00</td></tr></table>";
    const out = normalizeText(html);
    expect(out).toContain("£4.00");
    expect(out.toLowerCase()).not.toContain("cookies");
  });
  it("a price change is never masked by boilerplate stripping", () => {
    const a = normalizeText("cookies and parking fees £5 apply at all times");
    const b = normalizeText("cookies and parking fees £8 apply at all times");
    expect(a).not.toBe(b);
  });
  it("a real fee change produces different output", () => {
    expect(normalizeText("Fee £10 for 10 minutes")).not.toBe(normalizeText("Fee £12 for 10 minutes"));
  });

  // Several airport templates (Exeter/Bournemouth/Norwich, shared "Regional & City Airports"
  // theme) inject a live HH:MM wall-clock as a standalone line in the header nav. It changes
  // every minute and is not a price — strip it so it doesn't trigger false changes.
  it("strips a standalone live-clock HH:MM token so minute churn doesn't trigger", () => {
    const at2315 = normalizeText("Special Assistance\n23:15\nCar Parking\nDrop-off £4.00");
    const at0902 = normalizeText("Special Assistance\n09:02\nCar Parking\nDrop-off £4.00");
    expect(at2315).toBe(at0902);
    expect(at2315).toContain("£4.00");
    expect(at2315).not.toMatch(/\b\d{1,2}:\d{2}\b/); // no clock survives
  });
  it("strips a standalone HH:MM:SS clock too", () => {
    expect(normalizeText("Header\n23:15:42\nFooter")).toBe(normalizeText("Header\n09:02:07\nFooter"));
  });
  it("a real price change is NEVER masked by clock stripping (guard)", () => {
    expect(normalizeText("Special Assistance\n23:15\nDrop-off £4.00")).not.toBe(
      normalizeText("Special Assistance\n23:15\nDrop-off £6.00")
    );
  });
  it("does not eat a time that is part of an opening-hours range or inline text (guard)", () => {
    // inline times carry surrounding content, so they are not standalone-clock lines
    expect(normalizeText("Open 09:00 to 17:00 daily")).toContain("09:00");
    expect(normalizeText("Last entry 14:30")).toContain("14:30");
  });
  it("does not eat band labels or prices that merely contain digits (guard)", () => {
    const out = normalizeText("0 - 10 minutes\n£5.00\nUp to 1 hour\n£12.00");
    expect(out).toContain("£5.00");
    expect(out).toContain("£12.00");
    expect(out).toContain("0 - 10 minutes");
  });
});

describe("contentFingerprint", () => {
  it("is stable for equivalent content and differs for changed fees", () => {
    const a = contentFingerprint(Buffer.from("<p>Fee £10</p>  \n"));
    const b = contentFingerprint(Buffer.from("<p>Fee  £10</p>"));
    const c = contentFingerprint(Buffer.from("<p>Fee £12</p>"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it("hashes PDF bytes directly", () => {
    const pdf = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from([1, 2, 3])]);
    expect(contentFingerprint(pdf)).toMatch(/^[a-f0-9]{64}$/);
    expect(contentFingerprint(pdf)).not.toBe(contentFingerprint(Buffer.from("%PDF-1.7\nX")));
  });
});
