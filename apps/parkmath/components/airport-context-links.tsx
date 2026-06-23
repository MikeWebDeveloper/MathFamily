import Link from "next/link";
import { loadDropOffDataset, loadParkingDataset, loadLoungeDataset } from "@mathfamily/data";
import { qualifiesForAvoidPage } from "@/lib/avoid-content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";

type CurrentPage = 'drop-off' | 'avoid' | 'blue-badge' | 'parking-vs-drop-off' | 'options' | 'parking' | 'lounge';

interface LinkEntry {
  href: string;
  label: string;
  key: CurrentPage;
}

interface AirportContextLinksProps {
  slug: string;
  airportName: string;
  currentPage: CurrentPage;
}

export function AirportContextLinks({ slug, airportName, currentPage }: AirportContextLinksProps) {
  const record = loadDropOffDataset().records.find(r => r.airportSlug === slug);
  const hasAvoid = record ? qualifiesForAvoidPage(record) : false;
  const hasCompare = airportHasParkingVsDropOff(slug);
  const hasParking = loadParkingDataset().records.some(r => r.airportSlug === slug);
  const hasLounge = loadLoungeDataset().records.some(r => r.airportSlug === slug);

  const links: LinkEntry[] = [];
  links.push({ href: `/drop-off-charges/${slug}`, label: `${airportName} drop-off charges — current fee, time limit & penalty`, key: 'drop-off' });
  if (hasAvoid) links.push({ href: `/avoid-drop-off-charge/${slug}`, label: `How to avoid the ${airportName} drop-off charge`, key: 'avoid' });
  links.push({ href: `/blue-badge/${slug}`, label: `Blue Badge drop-off at ${airportName}: is it free?`, key: 'blue-badge' });
  if (hasCompare) links.push({ href: `/parking-vs-drop-off/${slug}`, label: `${airportName}: parking vs drop-off — which is cheaper?`, key: 'parking-vs-drop-off' });
  links.push({ href: `/airport-parking-options/${slug}`, label: `All ways to get to ${airportName} — cheapest option compared`, key: 'options' });
  if (hasParking) links.push({ href: `/airport-parking/${slug}`, label: `${airportName} parking prices compared`, key: 'parking' });
  if (hasLounge) links.push({ href: `/airport-lounges/${slug}`, label: `Lounges at ${airportName} — prices & Priority Pass`, key: 'lounge' });

  const visible = links.filter(l => l.key !== currentPage);

  if (visible.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-ink">More at this airport</h2>
      <ul className="space-y-1 text-sm">
        {visible.map(l => (
          <li key={l.key}>
            <Link href={l.href} className="text-brand-accent underline underline-offset-4">
              {l.label} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
