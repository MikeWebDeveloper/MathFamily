import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "../app/privacy/page";

const html = renderToStaticMarkup(<PrivacyPage />);

describe("privacy page", () => {
  it("discloses affiliate links in the present tense, not as a future possibility", () => {
    expect(html).toContain("Some pages contain affiliate links");
    expect(html).not.toContain("in future");
    expect(html).toContain("AWIN");
  });
  it("names the processors the sign-up actually uses, and no newsletter service it does not", () => {
    expect(html).toContain("Resend");
    expect(html).toContain("Vercel");
    expect(html).not.toContain("MailerLite");
  });
  it("says what the booking-click analytics does with the IP address", () => {
    expect(html).toContain("IP address");
  });
  it("gives a working contact instead of a placeholder", () => {
    expect(html).toContain('href="mailto:hello@parkmath.co.uk"');
    expect(html).not.toContain("will be published when");
  });
});
