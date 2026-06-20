import { ImageResponse } from "next/og";
import { loadAirports, loadDropOffDataset, loadParkingDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { parkingVsDropOffModel, qualifiesForParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  const parking = loadParkingDataset().records;
  return loadDropOffDataset()
    .records.filter((dropOff) => {
      const p = parking.find((r) => r.airportSlug === dropOff.airportSlug);
      return p ? qualifiesForParkingVsDropOff({ dropOff, parking: p }) : false;
    })
    .map((r) => ({ airport: r.airportSlug }));
}

export default async function OgImage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const dropOff = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const parking = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  const airport = loadAirports().find((a) => a.slug === slug);
  const model = dropOff && parking && qualifiesForParkingVsDropOff({ dropOff, parking }) ? parkingVsDropOffModel({ dropOff, parking }) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, width: 56, height: 56, borderRadius: 14, backgroundColor: "#0d3158", padding: 14 }}>
            <div style={{ display: "flex", height: 7, borderRadius: 3, backgroundColor: "#2563eb" }} />
            <div style={{ display: "flex", height: 7, borderRadius: 3, backgroundColor: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.8 }}>Parking vs drop-off at {airport?.name ?? slug}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>One drop-off</div>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#7fd1a8" }}>{model ? formatPence(model.dropOffFeePence) : ""}</div>
          </div>
          <div style={{ display: "flex", fontSize: 48, opacity: 0.6 }}>vs</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>Park {model?.parkingDays ?? 7} days</div>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#ffffff" }}>{model ? formatPence(model.parkingPence) : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#7fd1a8" }}>Verified {model?.verifiedAt} · ParkMath</div>
      </div>
    ),
    size
  );
}
