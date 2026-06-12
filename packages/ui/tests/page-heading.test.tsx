// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PageHeading } from "../src/page-heading";

afterEach(cleanup);

describe("PageHeading", () => {
  it("renders an h1 with text-h1 and text-balance", () => {
    const { getByRole } = render(<PageHeading>Test heading</PageHeading>);
    const h1 = getByRole("heading", { level: 1 });
    expect(h1.tagName).toBe("H1");
    expect(h1.className).toContain("text-h1");
    expect(h1.className).toContain("text-balance");
  });
});
