import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#134e4a", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>RoamMath</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 16, opacity: 0.9 }}>Roaming, eSIM &amp; baggage costs abroad</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, color: "#99f6e4" }}>Every figure verified against official pages</div>
      </div>
    ),
    size
  );
}
