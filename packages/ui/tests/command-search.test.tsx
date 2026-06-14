// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommandSearch } from "../src/command-search";
afterEach(cleanup);

it("renders an accessible input with the ⌘K hint", () => {
  render(<CommandSearch value="" onChange={() => {}} ariaLabel="Search airports" />);
  expect(screen.getByLabelText("Search airports")).toBeTruthy();
  expect(screen.getByText("⌘K")).toBeTruthy();
});

it("calls onChange as the user types", () => {
  const onChange = vi.fn();
  render(<CommandSearch value="" onChange={onChange} ariaLabel="Search" />);
  fireEvent.change(screen.getByLabelText("Search"), { target: { value: "lhr" } });
  expect(onChange).toHaveBeenCalledWith("lhr");
});

it("submits on Enter", () => {
  const onSubmit = vi.fn();
  render(<CommandSearch value="gatwick" onChange={() => {}} ariaLabel="Search" onSubmit={onSubmit} />);
  fireEvent.keyDown(screen.getByLabelText("Search"), { key: "Enter" });
  expect(onSubmit).toHaveBeenCalledWith("gatwick");
});

it("focuses the input on ⌘K", () => {
  render(<CommandSearch value="" onChange={() => {}} ariaLabel="Search" />);
  const input = screen.getByLabelText("Search");
  expect(document.activeElement).not.toBe(input);
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  expect(document.activeElement).toBe(input);
});

it("can opt out of the hint", () => {
  render(<CommandSearch value="" onChange={() => {}} ariaLabel="Search" hint={null} />);
  expect(screen.queryByText("⌘K")).toBeNull();
});
