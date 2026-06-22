import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#1e3a5f", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", width: 84, height: 84, borderRadius: 20, backgroundColor: "#16304f", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
            🏡
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>MoveMath</div>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 16, opacity: 0.9 }}>The real cost of moving home in the UK</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, color: "#93c5fd" }}>Stamp Duty + removals + conveyancing + surveys — estimates from public sources</div>
      </div>
    ),
    size
  );
}
