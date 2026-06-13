// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NewsCard } from "../src/news-card";
import { LatestUpdates } from "../src/latest-updates";
import type { NewsItem } from "@mathfamily/data";

afterEach(cleanup);

const item: NewsItem = {
  id: "heathrow-dropoff-fee-jun-2026", airportSlug: "heathrow", category: "fee-change",
  title: "Heathrow drop-off rises to £7", summary: "Now £7 at the forecourt.", body: null,
  change: { label: "Drop-off charge", from: "£6", to: "£7" },
  sourceUrl: "https://www.heathrow.com/x", sourceLabel: "Heathrow official",
  publishedAt: "2026-06-01", verifiedAt: "2026-06-02", supersedes: null
};

it("NewsCard shows title, dated summary, category and before→after, linked to its page", () => {
  render(<NewsCard item={item} href="/news/heathrow-dropoff-fee-jun-2026" />);
  expect(screen.getByText("Heathrow drop-off rises to £7")).toBeDefined();
  expect(screen.getByText(/Now £7/)).toBeDefined();
  expect(screen.getByText(/fee.change/i)).toBeDefined();
  expect(screen.getByText("£6")).toBeDefined();
  expect(screen.getByText("£7")).toBeDefined();
  expect(screen.getByRole("link").getAttribute("href")).toBe("/news/heathrow-dropoff-fee-jun-2026");
});

it("NewsCard renders an h2 headline when headingLevel='h2', h3 by default", () => {
  const { container, rerender } = render(<NewsCard item={item} href="/news/x" headingLevel="h2" />);
  expect(container.querySelector("h2")).not.toBeNull();
  expect(container.querySelector("h3")).toBeNull();
  rerender(<NewsCard item={item} href="/news/x" />);
  expect(container.querySelector("h3")).not.toBeNull();
});

it("shows the verified date when it differs from published", () => {
  const { container } = render(<NewsCard item={item} href="/news/x" />);
  expect(container.textContent).toMatch(/verified/i);
});

it("LatestUpdates renders a heading and one card per item; nothing when empty", () => {
  const { container, rerender } = render(<LatestUpdates items={[item]} heading="Latest at Heathrow" />);
  expect(screen.getByRole("heading", { name: "Latest at Heathrow" })).toBeDefined();
  expect(container.querySelectorAll("article")).toHaveLength(1);
  rerender(<LatestUpdates items={[]} heading="Latest at Heathrow" />);
  expect(container.innerHTML).toBe("");
});
