"use client";

import { useMemo, useState } from "react";

export interface EmbedAirportOption {
  slug: string;
  name: string;
}

interface EmbedBuilderProps {
  siteUrl: string;
  airports: EmbedAirportOption[];
}

/** Build the embed src + snippets client-side so the airport picker updates the live preview and the
 *  copy-paste code instantly. Mirrors lib/embed.ts's builders (kept tiny + dependency-free here so it
 *  stays a small client island). */
function srcFor(siteUrl: string, slug: string): string {
  const base = `${siteUrl}/embed/drop-off-charges`;
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}

function iframeSnippet(siteUrl: string, slug: string): string {
  const src = srcFor(siteUrl, slug);
  const height = slug ? 200 : 640;
  return `<iframe src="${src}" title="UK airport drop-off charges — ParkMath" width="100%" height="${height}" style="border:1px solid #e2e8f0;border-radius:10px;max-width:640px" loading="lazy"></iframe>`;
}

function scriptSnippet(siteUrl: string, slug: string): string {
  const src = srcFor(siteUrl, slug);
  return `<iframe id="parkmath-embed" src="${src}" title="UK airport drop-off charges — ParkMath" width="100%" height="640" scrolling="no" style="border:1px solid #e2e8f0;border-radius:10px;max-width:640px"></iframe>
<script>window.addEventListener("message",function(e){if(e.data&&e.data.type==="parkmath-embed-height"){var f=document.getElementById("parkmath-embed");if(f)f.style.height=e.data.height+"px";}});</script>`;
}

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked — the code is still selectable below */
            }
          }}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-brand-accent/40 px-3 py-1 text-xs font-semibold text-brand-accent hover:bg-brand-accent/5"
          aria-live="polite"
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
      </div>
      <pre className="select-all overflow-x-auto rounded-lg border border-ink/10 bg-surface-muted p-3 text-xs leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function EmbedBuilder({ siteUrl, airports }: EmbedBuilderProps) {
  const [slug, setSlug] = useState("");
  const src = useMemo(() => srcFor(siteUrl, slug), [siteUrl, slug]);
  const iframe = useMemo(() => iframeSnippet(siteUrl, slug), [siteUrl, slug]);
  const script = useMemo(() => scriptSnippet(siteUrl, slug), [siteUrl, slug]);
  const previewHeight = slug ? 200 : 640;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="embed-airport" className="text-sm font-semibold text-ink">
          What to show
        </label>
        <select
          id="embed-airport"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="min-h-[44px] w-full max-w-sm rounded-md border border-ink/20 bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="">The full league table (all UK airports)</option>
          {airports.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} — single fee
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-ink">Live preview</h3>
        <div className="overflow-hidden rounded-lg border border-ink/10">
          {/* Same iframe a publisher gets. key forces a reload when the source changes. */}
          <iframe
            key={src}
            src={src}
            title="ParkMath drop-off charges widget preview"
            width="100%"
            height={previewHeight}
            className="block w-full"
            style={{ border: "0", maxWidth: 640 }}
          />
        </div>
      </div>

      <CopyBlock label="Paste this (basic iframe)" code={iframe} />

      <details className="rounded-lg border border-ink/10 bg-surface-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Want it to auto-fit its height? Use the script version
        </summary>
        <div className="mt-3">
          <CopyBlock label="iframe + auto-resize script" code={script} />
        </div>
      </details>
    </div>
  );
}
