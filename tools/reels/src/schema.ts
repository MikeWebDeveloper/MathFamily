import { z } from "zod";

export const BRANDS = ["parkmath", "roammath"] as const;
export const FORMATS = ["shock-fee", "how-to", "news"] as const;
export const SCENE_KINDS = ["intro", "stat", "alternative", "verified", "cta"] as const;

const BRAND_DOMAIN: Record<(typeof BRANDS)[number], string> = {
  parkmath: "parkmath.co.uk",
  roammath: "roammath.co.uk"
};

// Anything that would make a social asset an affiliate placement (governance CAN'T rule).
const AFFILIATE = /(awin1\.com|cread\.php|awclick\.php|awinmid=|[?&]ref=)/i;

const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

export const FigureSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  pence: z.number().int().nonnegative()
});
export type Figure = z.infer<typeof FigureSchema>;

export const SceneSchema = z.strictObject({
  kind: z.enum(SCENE_KINDS),
  onScreenText: z.string().min(1),
  figureIds: z.array(z.string().min(1)),
  durationHintMs: z.number().int().positive()
});
export type Scene = z.infer<typeof SceneSchema>;

export const ReelScriptSchema = z
  .strictObject({
    version: z.string().min(1),
    brand: z.enum(BRANDS),
    format: z.enum(FORMATS),
    slug: Slug,
    figures: z.array(FigureSchema).min(1),
    scenes: z.array(SceneSchema).min(2),
    narration: z.string().min(1),
    captions: z.array(z.string().min(1)).min(1),
    cta: z.string().min(1),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate
  })
  .superRefine((s, ctx) => {
    // Governance: no affiliate link in any spoken or visible copy.
    const copy = [s.narration, s.cta, ...s.captions, ...s.scenes.map((x) => x.onScreenText)].join("\n");
    if (AFFILIATE.test(copy)) {
      ctx.addIssue({ code: "custom", message: "affiliate/merchant link is not allowed in reel copy" });
    }
    // Governance: the brand domain must be present (narration or cta).
    const domain = BRAND_DOMAIN[s.brand];
    if (!`${s.narration}\n${s.cta}`.includes(domain)) {
      ctx.addIssue({ code: "custom", message: `brand domain ${domain} must appear in narration or cta` });
    }
    // Integrity: every scene figureId must reference a declared figure.
    const ids = new Set(s.figures.map((f) => f.id));
    for (const scene of s.scenes) {
      for (const fid of scene.figureIds) {
        if (!ids.has(fid)) ctx.addIssue({ code: "custom", path: ["scenes"], message: `figureIds references unknown figure '${fid}'` });
      }
    }
  });
export type ReelScript = z.infer<typeof ReelScriptSchema>;
