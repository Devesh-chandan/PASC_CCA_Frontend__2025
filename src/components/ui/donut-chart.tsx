"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
// Shared SVG donut chart used on both Admin and Student dashboards.
// Uses CSS variable tokens (--color-text-primary / --color-text-muted) for
// consistent theming across light and dark modes.

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 180,
}: DonutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<DonutSegment | null>(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 75;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full -rotate-90 drop-shadow-sm transition-all duration-300"
      >
        {/* Track ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-surface-hover)"
          strokeWidth={strokeWidth}
          className="opacity-40"
        />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((seg, i) => {
              const pct = seg.value / total;
              const dashLength = pct * circumference;
              const dashGap = circumference - dashLength;
              const offset = cumulativeOffset;
              cumulativeOffset += dashLength;
              return (
                <circle
                  key={i}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${dashGap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer drop-shadow-md"
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 pointer-events-none">
        {hoveredSegment ? (
          <>
            <span
              className="text-2xl font-extrabold tracking-tight drop-shadow-sm transition-colors"
              style={{ color: hoveredSegment.color }}
            >
              {hoveredSegment.value}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 transition-colors"
              style={{ color: hoveredSegment.color }}
            >
              {hoveredSegment.label}
            </span>
          </>
        ) : (
          <>
            {centerValue && (
              <span className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight drop-shadow-sm">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">
                {centerLabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
