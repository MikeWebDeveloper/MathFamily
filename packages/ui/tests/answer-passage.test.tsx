// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AnswerPassage } from "../src/answer-passage";

afterEach(cleanup);

it("renders a question-form H2 and a passage, both carrying mf-speakable", () => {
  const { container } = render(
    <AnswerPassage question="How much is parking at Heathrow?">Short answer text.</AnswerPassage>
  );
  const h2 = container.querySelector("h2");
  expect(h2?.textContent).toContain("How much");
  expect(h2?.classList.contains("mf-speakable")).toBe(true);
  const passage = container.querySelector("p.mf-speakable");
  expect(passage?.textContent).toContain("Short answer text.");
  expect(container.querySelectorAll(".mf-speakable").length).toBe(2);
});
