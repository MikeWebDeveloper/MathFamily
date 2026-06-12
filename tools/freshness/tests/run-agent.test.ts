import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sh = join(dirname(fileURLToPath(import.meta.url)), "..", "run-agent.sh");
const printCmd = (args: string[]) =>
  execFileSync(sh, args, { env: { ...process.env, PRINT_CMD: "1" }, encoding: "utf8" });

// PRINT_CMD=1 uses `printf '%q '` which shell-quotes spaces as backslash-space.
// Assertions use the shell-quoted form that the script actually emits.
describe("run-agent.sh news modes", () => {
  it("news mode routes to /news-watch check", () => {
    expect(printCmd(["news", "news:bristol"])).toContain("/news-watch\\ check\\ news:bristol");
  });
  it("news-sweep mode routes to /news-watch sweep", () => {
    expect(printCmd(["news-sweep"])).toContain("/news-watch\\ sweep");
  });
  it("freshness modes still route to /freshness", () => {
    expect(printCmd(["sweep"])).toContain("/freshness\\ sweep");
  });
});
