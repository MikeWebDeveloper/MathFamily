"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedNumber, CaveatChip } from "@mathfamily/ui";
import { formatPence } from "@mathfamily/engine";
import type { FinishLevel, ProjectType, Region } from "../lib/data/types";
import { estimate } from "../lib/estimate";

interface CostEstimatorProps {
  projects: ProjectType[];
  regions: Region[];
  finishLevels: FinishLevel[];
  /** Optional fixed project (spoke pages lock the project and only vary region/finish/area). */
  lockedProjectSlug?: string;
  /** Honest data-provenance note: figures are transcribed indicative ranges, not live-verified. */
  snapshotNote?: string;
}

export function CostEstimator({ projects, regions, finishLevels, lockedProjectSlug, snapshotNote }: CostEstimatorProps) {
  const initialProject =
    projects.find((p) => p.slug === lockedProjectSlug) ?? projects[0]!;
  const defaultRegion = regions.find((r) => r.slug === "midlands") ?? regions[0]!;
  const defaultFinish = finishLevels.find((f) => f.slug === "standard") ?? finishLevels[0]!;

  const [projectSlug, setProjectSlug] = useState(initialProject.slug);
  const [regionSlug, setRegionSlug] = useState(defaultRegion.slug);
  const [finishSlug, setFinishSlug] = useState(defaultFinish.slug);
  const [area, setArea] = useState(initialProject.defaultArea);

  const project = projects.find((p) => p.slug === projectSlug) ?? initialProject;
  const region = regions.find((r) => r.slug === regionSlug) ?? defaultRegion;
  const finish = finishLevels.find((f) => f.slug === finishSlug) ?? defaultFinish;

  const result = estimate({ project, region, finish, areaSqm: area });
  const isPerSqm = project.pricing === "perSqm";

  return (
    <section
      aria-label="Build cost estimator"
      className="mf-edge space-y-5 rounded-card bg-card p-4 sm:p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-wrap gap-4">
        {/* Project type (hidden/locked on spoke pages) */}
        {!lockedProjectSlug && (
          <label className="flex min-w-48 flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-ink-muted">Project type</span>
            <select
              value={projectSlug}
              onChange={(e) => {
                const next = projects.find((p) => p.slug === e.target.value);
                setProjectSlug(e.target.value);
                if (next) setArea(next.defaultArea);
              }}
              className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
            >
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </label>
        )}

        {/* Region */}
        <label className="flex min-w-44 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Region</span>
          <select
            value={regionSlug}
            onChange={(e) => setRegionSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </label>

        {/* Finish level */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Finish</span>
          <div className="flex gap-1">
            {finishLevels.map((f) => (
              <button
                key={f.slug}
                type="button"
                onClick={() => setFinishSlug(f.slug)}
                className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  finishSlug === f.slug
                    ? "bg-brand-accent text-white"
                    : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floor area — only for per-m² projects */}
      {isPerSqm && (
        <label className="block text-sm text-ink-muted">
          Floor area: <strong className="mf-num text-ink">{area} m²</strong>
          <input
            type="range"
            min={project.typicalAreaLow}
            max={project.typicalAreaHigh}
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className="mt-1 block w-full accent-brand-accent"
            aria-label="Floor area in square metres"
          />
          <span className="text-xs text-ink-muted">
            Typical {project.name.toLowerCase()}: {project.typicalAreaLow}–{project.typicalAreaHigh} m²
          </span>
        </label>
      )}

      {/* Result */}
      <div
        aria-live="polite"
        data-testid="estimate-result"
        className="mf-fade-in space-y-2 rounded-xl bg-surface p-4"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Estimated cost range{isPerSqm ? ` · ${area} m²` : ""} · {region.name} · {finish.name} finish
        </p>
        <p className="text-3xl font-bold tracking-tight text-ink">
          <AnimatedNumber pence={result.lowPence} render={(p) => (p === null ? "—" : formatPence(p))} />
          {" – "}
          <AnimatedNumber pence={result.highPence} render={(p) => (p === null ? "—" : formatPence(p))} />
        </p>
        <p className="text-sm text-ink-muted">
          Midpoint ≈ {result.midFormatted}. Build cost only — excludes VAT, professional fees and fit-out unless noted.
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        <li><CaveatChip>Estimate only — get written quotes</CaveatChip></li>
        <li><CaveatChip>Indicative ranges — not live-verified</CaveatChip></li>
        {finish.slug === "premium" && <li><CaveatChip>Premium specs can exceed this range</CaveatChip></li>}
      </ul>

      {snapshotNote && (
        <p className="text-xs text-ink-muted" data-testid="snapshot-note">
          {snapshotNote}
        </p>
      )}

      {!lockedProjectSlug && (
        <Link
          href={`/cost/${project.slug}`}
          className="inline-block text-sm font-semibold text-brand-accent underline underline-offset-4"
        >
          See the full {project.name.toLowerCase()} cost guide →
        </Link>
      )}
    </section>
  );
}
