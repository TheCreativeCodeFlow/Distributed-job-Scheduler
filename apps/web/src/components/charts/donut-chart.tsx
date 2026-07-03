'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface DonutPoint {
  label: string;
  value: number;
  color?: string; // Tailwind color class or hex code
}

interface DonutChartProps {
  data: DonutPoint[];
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export function DonutChart({
  data,
  innerRadius = 55,
  outerRadius = 80,
  className,
}: DonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Fallback colors
  const defaultColors = [
    'fill-primary',
    'fill-violet-400',
    'fill-emerald-400',
    'fill-amber-400',
    'fill-rose-400',
    'fill-blue-400',
  ];

  let accumulatedAngle = 0;

  const width = 240;
  const height = 240;
  const center = 120;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-6 border border-border rounded-xl bg-card p-6 shadow-sm',
        className,
      )}
    >
      <div className="relative h-60 w-60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          {total === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              className="fill-muted/20"
            />
          ) : (
            data.map((d, idx) => {
              const percentage = d.value / total;
              const angle = percentage * 360;

              // Arc math coordinates
              const rad1 = ((accumulatedAngle - 90) * Math.PI) / 180;
              const rad2 = ((accumulatedAngle + angle - 90) * Math.PI) / 180;

              accumulatedAngle += angle;

              // Inner path coordinates
              const x1_inner = center + innerRadius * Math.cos(rad1);
              const y1_inner = center + innerRadius * Math.sin(rad1);
              const x2_inner = center + innerRadius * Math.cos(rad2);
              const y2_inner = center + innerRadius * Math.sin(rad2);

              // Outer path coordinates
              const x1_outer = center + outerRadius * Math.cos(rad1);
              const y1_outer = center + outerRadius * Math.sin(rad1);
              const x2_outer = center + outerRadius * Math.cos(rad2);
              const y2_outer = center + outerRadius * Math.sin(rad2);

              const largeArcFlag = angle > 180 ? 1 : 0;

              // Construct path: Move to outer 1, Arc to outer 2, Line to inner 2, Arc back to inner 1, Close path
              const dPath = [
                `M ${x1_outer} ${y1_outer}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2_outer} ${y2_outer}`,
                `L ${x2_inner} ${y2_inner}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1_inner} ${y1_inner}`,
                'Z',
              ].join(' ');

              const colorClass =
                d.color || defaultColors[idx % defaultColors.length];

              return (
                <path
                  key={idx}
                  d={dPath}
                  className={cn(
                    colorClass,
                    'hover:opacity-90 transition-opacity duration-150 cursor-pointer origin-center hover:scale-[1.03] transform',
                  )}
                  role="img"
                  aria-label={`${d.label}: ${d.value}`}
                />
              );
            })
          )}
          {/* Central label mapping */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 4}
            className="fill-card"
          />
          <text
            x={center}
            y={center - 4}
            textAnchor="middle"
            className="text-xs font-bold fill-muted-foreground uppercase tracking-wide"
          >
            Total
          </text>
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            className="text-xl font-extrabold fill-foreground tracking-tight"
          >
            {total}
          </text>
        </svg>
      </div>

      {/* Legends lists */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs">
        {data.map((d, idx) => {
          const colorClass =
            d.color || defaultColors[idx % defaultColors.length];
          return (
            <div key={idx} className="flex items-center gap-2 font-semibold">
              <span
                className={cn(
                  'h-3.5 w-3.5 rounded-full inline-block',
                  colorClass,
                )}
              />
              <span className="truncate text-muted-foreground">{d.label}</span>
              <span className="ml-auto text-foreground">{d.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export { DonutChart as PieChart };
