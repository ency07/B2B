"use client";

import * as React from "react";

/**
 * Sello monocromo simple (círculo + check) — reemplaza texto plano de
 * certificaciones ("AMCA · ISO 1940") por un ícono reconocible como badge.
 */
export function CertBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 opacity-80"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5 5.5-5.5" />
      </svg>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{label}</span>
    </span>
  );
}

export function CertBadgeRow({ labels }: { labels: string[] }) {
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, idx) => (
        <React.Fragment key={label}>
          {idx > 0 && <span className="opacity-30 font-mono text-[10px]">·</span>}
          <CertBadge label={label} />
        </React.Fragment>
      ))}
    </div>
  );
}
