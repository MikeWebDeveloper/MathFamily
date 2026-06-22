import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#1e3a8a", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, width: 84, height: 84, borderRadius: 20, backgroundColor: "#16306e", padding: 18 }}>
            <div style={{ display: "flex", width: 12, height: 22, borderRadius: 4, backgroundColor: "#2563eb" }} />
            <div style={{ display: "flex", width: 12, height: 36, borderRadius: 4, backgroundColor: "#ffffff" }} />
            <div style={{ display: "flex", width: 12, height: 48, borderRadius: 4, backgroundColor: "#2563eb" }} />
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700 }}>BroadbandMath</div>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 16, opacity: 0.9 }}>The real cost of UK broadband, after the price rises</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, color: "#bfdbfe" }}>Advertised price vs true cost — sourced &amp; date-stamped</div>
      </div>
    ),
    size
  );
}
