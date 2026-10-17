import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The skip link lives in the shared SiteHeader, but its target id lives in each app's root
// layout, so neither file's own tests can see the two drift apart (ParkMath shipped a
// SiteHeader link to #main-content with <main id="main">, plus a second, duplicate link).
const read = (p: string) => readFileSync(join(__dirname, p), "utf8");
const header = read("../../../packages/ui/src/site-header.tsx");
const layout = read("../app/layout.tsx");

describe("skip link", () => {
  it("targets the id that the root layout gives <main>", () => {
    const target = header.match(/href="#([\w-]+)"/)?.[1];
    expect(target).toBeTruthy();
    expect(layout).toContain(`<main id="${target}"`);
  });
  it("is rendered once — by SiteHeader, not duplicated in the layout", () => {
    expect(layout).not.toContain("Skip to content");
  });
});
