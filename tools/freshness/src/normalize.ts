import { createHash } from "node:crypto";

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g, // ISO dates
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
];

const BOILERPLATE = /\b(?:we value your privacy|accept all|reject all|cookie|cookies|consent)\b[^.]*\.?/gi;

export function normalizeText(input: string): string {
  let text = input.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(BOILERPLATE, " ");
  for (const pattern of DATE_PATTERNS) text = text.replace(pattern, " ");
  return text.replace(/\s+/g, " ").trim();
}

export function contentFingerprint(body: Buffer): string {
  const isPdf = body.subarray(0, 5).toString("latin1") === "%PDF-";
  const material = isPdf ? body : Buffer.from(normalizeText(body.toString("utf8")), "utf8");
  return createHash("sha256").update(material).digest("hex");
}
