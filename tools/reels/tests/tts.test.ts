import { describe, it, expect } from "vitest";
import { synthCommand, SYNTH_PY } from "../src/tts.mjs";

describe("synthCommand", () => {
  it("builds python argv pointing at synth.py and the script path", () => {
    const [cmd, args] = synthCommand("/tmp/review/stansted.json", "python3");
    expect(cmd).toBe("python3");
    expect(args[0]).toBe(SYNTH_PY);
    expect(args[1]).toBe("/tmp/review/stansted.json");
  });
});
