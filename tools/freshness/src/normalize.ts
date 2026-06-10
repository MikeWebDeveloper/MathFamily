import { createHash } from "node:crypto";

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g, // ISO dates
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
];

const BOILERPLATE_WORDS = /(?:we value your privacy|accept all|reject all|cookie|cookies|consent)/i;
const PRICE_SIGNAL = /[£€$]\s?\d/;
// A standalone wall-clock token on its own line (e.g. "23:15" or "23:15:42").
// Several airport templates inject a live HH:MM clock in the header nav that ticks
// every minute. It is never a price (no currency symbol) and never a band label,
// so a line that is *only* a clock is safe to drop. Anchored to the full trimmed
// line so inline times ("Open 09:00 to 17:00") are untouched.
const STANDALONE_CLOCK = /^([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export function normalizeText(input: string): string {
  // Strip scripts and styles first
  let text = input.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  // Convert tags to newlines so structural boundaries survive
  text = text.replace(/<[^>]+>/g, "\n");
  // Process per-line: drop a line only if it contains boilerplate AND no price signal
  const lines = text.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (STANDALONE_CLOCK.test(trimmed)) return false; // live header wall-clock — not a price
    if (BOILERPLATE_WORDS.test(trimmed) && !PRICE_SIGNAL.test(trimmed)) return false;
    return true;
  });
  text = lines.join("\n");
  // Strip date patterns
  for (const pattern of DATE_PATTERNS) text = text.replace(pattern, " ");
  return text.replace(/\s+/g, " ").trim();
}

export function contentFingerprint(body: Buffer): string {
  const isPdf = body.subarray(0, 5).toString("latin1") === "%PDF-";
  const material = isPdf ? body : Buffer.from(normalizeText(body.toString("utf8")), "utf8");
  return createHash("sha256").update(material).digest("hex");
}
