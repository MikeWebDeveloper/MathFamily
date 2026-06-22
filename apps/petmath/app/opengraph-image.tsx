import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#14532d", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, width: 84, height: 84, borderRadius: 20, backgroundColor: "#0f3d22" }}>
            <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, backgroundColor: "#16a34a" }} />
            <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, backgroundColor: "#ffffff" }} />
            <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, backgroundColor: "#16a34a" }} />
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>PetMath</div>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 16, opacity: 0.9 }}>What a pet really costs over its lifetime</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, color: "#86efac" }}>Built from PDSA figures · a source and date on every number</div>
      </div>
    ),
    size
  );
}
