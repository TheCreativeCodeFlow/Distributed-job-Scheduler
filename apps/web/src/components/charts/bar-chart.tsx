'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface BarDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 240, className }: BarChartProps) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const width = 600;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const barWidth = (graphWidth / data.length) * 0.65;
  const barGap = (graphWidth / data.length) * 0.35;

  return (
    <div
      className={cn(
        'w-full border border-border rounded-xl bg-card p-6 shadow-sm',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = paddingTop + (idx / 3) * graphHeight;
          const val = max - (idx / 3) * max;
          return (
            <g key={idx} className="opacity-45">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted-foreground/30"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground font-semibold"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Draw Bars */}
        {data.map((d, idx) => {
          const barHeight = (d.value / max) * graphHeight;
          const x = paddingLeft + idx * (barWidth + barGap) + barGap / 2;
          const y = paddingTop + graphHeight - barHeight;

          return (
            <g key={idx} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                className="fill-primary/85 hover:fill-primary transition-colors cursor-pointer"
              />
              {/* Tooltip on hover */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[10px] font-bold fill-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                {d.value}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          if (data.length > 10 && idx % 2 !== 0) return null;
          const x =
            paddingLeft + idx * (barWidth + barGap) + barGap / 2 + barWidth / 2;
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground font-semibold uppercase tracking-wider"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
