// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { GlintController } from "../src/glint-controller";

afterEach(cleanup);

describe("GlintController", () => {
  it("renders nothing and does not throw (no IntersectionObserver in jsdom)", () => {
    const { container } = render(<GlintController />);
    expect(container.firstChild).toBeNull();
  });
});
