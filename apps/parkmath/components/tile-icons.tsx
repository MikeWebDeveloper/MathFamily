const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CarIcon() {
  return (
    <svg {...base}>
      <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
export function ParkingIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 17V7h3.5a3 3 0 0 1 0 6H9" />
    </svg>
  );
}
export function LoungeIcon() {
  return (
    <svg {...base}>
      <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
      <path d="M3 13a2 2 0 0 1 2 2v3h14v-3a2 2 0 1 1 2-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M7 20v1M17 20v1" />
    </svg>
  );
}
export function PriceIndexIcon() {
  return (
    <svg {...base}>
      <path d="M4 4v16h16" />
      <path d="M7 14l3-3 3 2 4-5" />
    </svg>
  );
}
export function NewsIcon() {
  return (
    <svg {...base}>
      <path d="M4 5h13a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 9h6M8 13h6M8 17h4" />
    </svg>
  );
}
export function DataIcon() {
  return (
    <svg {...base}>
      <path d="M12 4v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}
