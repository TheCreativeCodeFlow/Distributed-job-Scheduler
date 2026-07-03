'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface ChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  className?: string;
}

export function LineChart({ data, height = 240, className }: LineChartProps) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;

  // Render variables
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const width = 600;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const points = data
    .map((d, idx) => {
      const x = paddingLeft + (idx / (data.length - 1)) * graphWidth;
      const y =
        paddingTop + graphHeight - ((d.value - min) / range) * graphHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Create SVG path for area fill
  const firstPoint = `${paddingLeft},${paddingTop + graphHeight}`;
  const lastPoint = `${paddingLeft + graphWidth},${paddingTop + graphHeight}`;
  const areaPoints = `${firstPoint} ${points} ${lastPoint}`;

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
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = paddingTop + (idx / 3) * graphHeight;
          const val = max - (idx / 3) * range;
          return (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-muted-foreground/35"
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

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#chartGradient)" />

        {/* Trend line */}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((d, idx) => {
          const x = paddingLeft + (idx / (data.length - 1)) * graphWidth;
          const y =
            paddingTop + graphHeight - ((d.value - min) / range) * graphHeight;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              className="fill-card stroke-primary stroke-[2.5] hover:r-6 cursor-pointer transition-all duration-150"
            />
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          if (data.length > 8 && idx % Math.ceil(data.length / 6) !== 0)
            return null;
          const x = paddingLeft + (idx / (data.length - 1)) * graphWidth;
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
export { LineChart as AreaChart };
