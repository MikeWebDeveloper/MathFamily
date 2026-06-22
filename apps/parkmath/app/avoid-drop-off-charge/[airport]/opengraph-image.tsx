import { ImageResponse } from "next/og";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { qualifiesForAvoidPage } from "@/lib/avoid-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return loadDropOffDataset()
    .records.filter(qualifiesForAvoidPage)
    .map((r) => ({ airport: r.airportSlug }));
}

export default async function OgImage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const airport = loadAirports().find((a) => a.slug === slug);
  const fee = record ? formatPence(record.bands[0]?.totalPence ?? 0) : "";
  const alt = record?.freeAlternative ?? null;
  const altLine = alt ? (isPublicTransportAlt(alt) ? `Use the ${alt.name} to the terminal` : `Use ${alt.name} — free for ${alt.minutesFree} min`) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, width: 56, height: 56, borderRadius: 14, backgroundColor: "#0d3158", padding: 14 }}>
            <div style={{ display: "flex", height: 7, borderRadius: 3, backgroundColor: "#2563eb" }} />
            <div style={{ display: "flex", height: 7, borderRadius: 3, backgroundColor: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.8 }}>How to avoid the {airport?.name ?? slug} drop-off charge</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 12 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#7fd1a8" }}>Save {fee}</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 18, opacity: 0.9 }}>{altLine}</div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#7fd1a8" }}>Verified {record?.verifiedAt} · ParkMath</div>
      </div>
    ),
    size
  );
}
