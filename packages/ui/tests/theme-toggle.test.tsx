// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "../src/theme-toggle";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

beforeEach(() => {
  // Start each test in light mode
  document.documentElement.dataset.theme = "light";
});

describe("ThemeToggle", () => {
  it("renders a button with accessible label", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toMatch(/switch to dark mode/i);
  });

  it("flips data-theme to dark when clicked in light mode", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("flips data-theme back to light when clicked twice", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists theme choice to localStorage", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(localStorage.getItem("theme")).toBe("dark");
    fireEvent.click(btn);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("sets aria-pressed=true when dark", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });
});
