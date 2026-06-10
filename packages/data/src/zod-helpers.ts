import { z } from "zod";

export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");

export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");

export const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");
