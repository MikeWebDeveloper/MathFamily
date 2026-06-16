import type { ReelScript } from "../schema";

export const THEME: Record<ReelScript["brand"], { ink: string; surface: string; accent: string; verified: string }> = {
  parkmath: { ink: "#0A2540", surface: "#F8FAFC", accent: "#2563EB", verified: "#16A34A" },
  roammath: { ink: "#134E4A", surface: "#F8FAFC", accent: "#0D9488", verified: "#16A34A" }
};
export const MONO = "IBM Plex Mono, monospace";
export const SANS = "IBM Plex Sans, sans-serif";
