import { ImageResponse } from "next/og";
import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { parkingPageModel } from "@/lib/parking-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return loadParkingDataset().records.map((r) => ({ airport: r.airportSlug }));
}

export default async function OgImage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  const airport = loadAirports().find((a) => a.slug === slug);
  const m = record ? parkingPageModel(record, 7) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 36, opacity: 0.8 }}>{airport?.name ?? slug} parking · 7 days</div>
        <div style={{ display: "flex", fontSize: 120, fontWeight: 700, marginTop: 12 }}>{m?.cheapest ? `from ${formatPence(m.cheapest.totalPence)}` : "compared"}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 18, opacity: 0.85 }}>{m?.cheapest?.name ?? ""}</div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#7fd1a8" }}>Verified {record?.verifiedAt} · ParkMath</div>
      </div>
    ),
    size
  );
}
