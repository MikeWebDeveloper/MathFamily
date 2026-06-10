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
