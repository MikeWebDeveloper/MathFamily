import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadEnvFile } from "../src/load-env";

const tmp = join(tmpdir(), `reels-loadenv-${process.pid}.env`);

describe("loadEnvFile", () => {
  afterEach(() => {
    rmSync(tmp, { force: true });
    for (const k of ["LE_A", "LE_B", "LE_C"]) delete process.env[k];
  });

  it("returns [] when the file does not exist", () => {
    expect(loadEnvFile(join(tmpdir(), "reels-loadenv-missing-xyz.env"))).toEqual([]);
  });

  it("sets KEY=VALUE for new keys, skipping comments and blank lines", () => {
    writeFileSync(tmp, "# a comment\n\nLE_A=hello\nLE_B = world \n");
    expect(loadEnvFile(tmp).sort()).toEqual(["LE_A", "LE_B"]);
    expect(process.env.LE_A).toBe("hello");
    expect(process.env.LE_B).toBe("world");
  });

  it("never overrides a key already set in the shell environment", () => {
    process.env.LE_C = "from-shell";
    writeFileSync(tmp, "LE_C=from-file");
    expect(loadEnvFile(tmp)).not.toContain("LE_C");
    expect(process.env.LE_C).toBe("from-shell");
  });

  it("fills a key present-but-empty in the environment", () => {
    process.env.LE_A = "";
    writeFileSync(tmp, "LE_A=filled");
    expect(loadEnvFile(tmp)).toContain("LE_A");
    expect(process.env.LE_A).toBe("filled");
  });

  it("strips one layer of surrounding quotes", () => {
    writeFileSync(tmp, `LE_A="quoted"\nLE_B='single'`);
    loadEnvFile(tmp);
    expect(process.env.LE_A).toBe("quoted");
    expect(process.env.LE_B).toBe("single");
  });
});
