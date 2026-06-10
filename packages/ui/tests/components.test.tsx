// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailCaptureSlot } from "../src/email-capture-slot";
import { FeeStat } from "../src/fee-stat";
import { FreshnessBadge } from "../src/freshness-badge";

describe("FeeStat", () => {
  it("renders label, value and note", () => {
    render(<FeeStat label="Drop-off charge" value="£10" note="for up to 20 minutes" />);
    expect(screen.getByText("£10")).toBeDefined();
    expect(screen.getByText("for up to 20 minutes")).toBeDefined();
  });
});

describe("FreshnessBadge", () => {
  it("shows Verified for fresh data", () => {
    render(<FreshnessBadge verifiedAt="2026-06-01" now={new Date("2026-06-10T12:00:00Z")} />);
    expect(screen.getByText(/^Verified 1 Jun 2026$/)).toBeDefined();
  });
  it("shows Last verified for stale data", () => {
    render(<FreshnessBadge verifiedAt="2026-01-01" now={new Date("2026-06-10T12:00:00Z")} />);
    expect(screen.getByText(/^Last verified 1 Jan 2026$/)).toBeDefined();
  });
});

describe("EmailCaptureSlot", () => {
  it("renders nothing when no formAction is configured (slot pattern)", () => {
    const { container } = render(<EmailCaptureSlot hook="Get notified when fees change" />);
    expect(container.innerHTML).toBe("");
  });
  it("renders a form when configured", () => {
    render(<EmailCaptureSlot formAction="https://assets.mailerlite.com/forms/x" hook="Get notified when fees change" />);
    expect(screen.getByRole("textbox")).toBeDefined();
    expect(screen.getByLabelText("Email address")).toBeDefined();
  });
});

import { AnswerLead } from "../src/answer-lead";
import { SourcesBlock } from "../src/sources-block";

describe("AnswerLead", () => {
  it("renders the direct answer and key facts", () => {
    render(
      <AnswerLead answer="Dropping off at Gatwick costs £10 for up to 10 minutes.">
        {["Penalty: £100", "Free alternative: Long Stay (2h)"]}
      </AnswerLead>
    );
    expect(screen.getByText(/costs £10/)).toBeDefined();
    expect(screen.getByText("Penalty: £100")).toBeDefined();
  });
});

describe("SourcesBlock", () => {
  it("lists each source with its verification date", () => {
    render(
      <SourcesBlock
        sources={[{ label: "Official Gatwick drop-off page", url: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-10" }]}
        method="Fees read from the official airport page and re-checked on the date shown."
      />
    );
    expect(screen.getByRole("link", { name: /Official Gatwick/ })).toBeDefined();
    expect(screen.getByText(/2026-06-10/)).toBeDefined();
  });
});
