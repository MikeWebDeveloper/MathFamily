import { describe, expect, it } from "vitest";
import { toCsv } from "../lib/csv";

describe("toCsv", () => {
  it("joins header + rows with CRLF and a trailing newline", () => {
    expect(toCsv(["a", "b"], [[1, 2], [3, 4]])).toBe("a,b\r\n1,2\r\n3,4\r\n");
  });
  it("quotes cells containing commas, quotes or newlines (RFC 4180)", () => {
    expect(toCsv(["x"], [["a,b"]])).toBe('x\r\n"a,b"\r\n');
    expect(toCsv(["x"], [['he said "hi"']])).toBe('x\r\n"he said ""hi"""\r\n');
    expect(toCsv(["x"], [["line1\nline2"]])).toBe('x\r\n"line1\nline2"\r\n');
  });
  it("renders null and undefined as empty cells", () => {
    expect(toCsv(["x", "y"], [[null, 5]])).toBe("x,y\r\n,5\r\n");
  });
});
