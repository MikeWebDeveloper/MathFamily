"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="space-y-4"><h1 className="text-h1 font-bold text-ink">Something went wrong</h1><button onClick={reset} className="text-brand-accent underline">Try again</button></div>;
}
