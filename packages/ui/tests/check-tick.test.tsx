// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { CheckTick } from "../src/check-tick";

afterEach(cleanup);

it("renders an aria-hidden svg with a draw-animated tick path", () => {
  const { container } = render(<CheckTick />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector(".mf-tick")).not.toBeNull();
});
