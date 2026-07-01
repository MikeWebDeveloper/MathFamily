import Link from "next/link";
export default function NotFound() {
  return <div className="space-y-4"><h1 className="text-h1 font-bold text-ink">Not found</h1><Link href="/" className="text-brand-accent underline">Home</Link></div>;
}
