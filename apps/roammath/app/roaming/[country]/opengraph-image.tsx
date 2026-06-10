import { ImageResponse } from "next/og";
import { loadRoamingDataset, loadEsimDataset } from "@mathfamily/data";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import { NETWORK_LABELS } from "@/lib/roaming-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return loadRoamingDataset().destinations.map((d) => ({ country: d.countrySlug }));
}

export default async function OgImage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const roamingDataset = loadRoamingDataset();
  const destination = roamingDataset.destinations.find((d) => d.countrySlug === slug);
  const esim = loadEsimDataset().records.find((r) => r.countrySlug === slug) ?? null;

  const latestVerified = roamingDataset.networkSources.map((s) => s.verifiedAt).sort().at(-1) ?? "";

  let answerLine = "compared";
  if (destination) {
    const r = roamingTripCost(destination.perNetwork, esim?.bundles ?? [], 7, 5);
    const includedNetworks = destination.perNetwork.filter((n) => n.included);
    const parts: string[] = [];
    if (includedNetworks.length > 0) {
      const names = includedNetworks.map((n) => NETWORK_LABELS[n.network] ?? n.network).join(" & ");
      parts.push(`${names}: included`);
    }
    if (r.esimChoice) {
      const converted = r.esimChoice.bundleName.includes("(converted)") ? " (converted)" : "";
      parts.push(`eSIM from ${formatPence(r.esimChoice.totalPence)}${converted}`);
    } else if (r.cheapestNetwork?.totalPence !== null && r.cheapestNetwork !== null && includedNetworks.length === 0) {
      const name = NETWORK_LABELS[r.cheapestNetwork.network] ?? r.cheapestNetwork.network;
      parts.push(`from ${formatPence(r.cheapestNetwork.totalPence)} (${name})`);
    }
    answerLine = parts.join(" · ") || "compared";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          backgroundColor: "#134e4a",
          color: "white",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", fontSize: 36, opacity: 0.8 }}>
          {destination?.countryName ?? slug} roaming · 7 days · 5GB
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, marginTop: 16 }}>
          {answerLine}
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#99f6e4" }}>
          Verified {latestVerified} · RoamMath
        </div>
      </div>
    ),
    size
  );
}
