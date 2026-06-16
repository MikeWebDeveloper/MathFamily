import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import type { ReelScript } from "../schema";

// Real brand type (DESIGN.md): IBM Plex Sans for copy, IBM Plex Mono for every figure.
// Subset to the weights we use (latin) so each render makes a handful of font requests, not ~80.
export const SANS = loadSans("normal", { weights: ["400", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;
export const MONO = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;

export interface BrandTheme {
  bg: string;        // reel background (navy / teal)
  decor: string;     // slightly lighter bg for flat decorative shapes
  accent: string;    // brand action colour
  accentBright: string; // accent that reads on the dark bg
  good: string;      // "free / saving" green (bright for dark bg)
  warn: string;      // "shock fee" amber (bright for dark bg)
  paper: string;     // ticket / card surface
  verified: string;  // verified-pill green
}

// ParkMath navy, RoamMath teal — same components, swapped tokens (DESIGN.md).
export const THEME: Record<ReelScript["brand"], BrandTheme> = {
  parkmath: { bg: "#0A2540", decor: "#103155", accent: "#2563EB", accentBright: "#5B9DF9", good: "#34D399", warn: "#FBBF24", paper: "#FFFFFF", verified: "#16A34A" },
  roammath: { bg: "#134E4A", decor: "#1B6058", accent: "#0D9488", accentBright: "#2DD4BF", good: "#34D399", warn: "#FBBF24", paper: "#FFFFFF", verified: "#16A34A" }
};
