import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#14532d", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, width: 84, height: 84, borderRadius: 20, backgroundColor: "#0f3f23", padding: 20 }}>
            <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: "#16a34a" }} />
            <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>EnergyMath</div>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 16, opacity: 0.9 }}>UK home energy bills on the Ofgem price cap</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, color: "#86efac" }}>Every rate sourced from Ofgem &amp; date-stamped</div>
      </div>
    ),
    size
  );
}
