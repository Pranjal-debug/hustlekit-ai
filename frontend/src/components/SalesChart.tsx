import React, { useState } from 'react';
import type { SalesChartDataPoint } from '../types';

interface SalesChartProps {
  data: SalesChartDataPoint[];
  showProjection?: boolean;
  height?: number;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  showProjection = false,
  height = 240,
}) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No sales data available.
      </div>
    );
  }

  const values = data.map((d) => (activeMetric === 'revenue' ? d.revenue : d.orders));
  const projectionValues = data.map((d) =>
    activeMetric === 'revenue' ? d.projectedRevenue || d.revenue : d.orders
  );

  const maxValue = Math.max(...values, ...(showProjection ? projectionValues : [])) * 1.15;
  const minValue = 0;

  const width = 800;
  const svgHeight = height;
  const paddingX = 45;
  const paddingY = 30;

  const getX = (index: number) =>
    paddingX + (index / (data.length - 1)) * (width - paddingX * 2);

  const getY = (val: number) =>
    svgHeight - paddingY - ((val - minValue) / (maxValue - minValue || 1)) * (svgHeight - paddingY * 2);

  // Build SVG path
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(activeMetric === 'revenue' ? d.revenue : d.orders),
    ...d,
  }));

  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  // Projection path
  const projectionPoints = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.projectedRevenue || d.revenue),
  }));

  const projectionPathD = projectionPoints.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMetric('revenue')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'revenue'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            Revenue ($)
          </button>
          <button
            onClick={() => setActiveMetric('orders')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'orders'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            Order Volume
          </button>
        </div>

        {showProjection && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-b-2 border-dashed border-sky-400" />
              AI Projection
            </span>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden w-full">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            const val = Math.round(maxValue - pct * maxValue);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity="0.3"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                >
                  {activeMetric === 'revenue' ? `$${val.toLocaleString()}` : val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#purpleGrad)" />

          {/* Optional projection line */}
          {showProjection && (
            <path
              d={projectionPathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.7"
            />
          )}

          {/* Main revenue / orders curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive points */}
          {points.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="#0f172a"
                stroke="#c084fc"
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="transition-all duration-150"
              />
              {/* X Axis Labels */}
              <text
                x={p.x}
                y={svgHeight - 8}
                textAnchor="middle"
                fill={hoveredIndex === i ? '#f8fafc' : '#64748b'}
                fontSize="11"
                fontWeight={hoveredIndex === i ? '600' : '400'}
                fontFamily="Inter, sans-serif"
              >
                {p.day}
              </text>
            </g>
          ))}
        </svg>

        {/* Hovered point tooltip overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 bg-slate-900 border border-purple-500/30 text-white rounded-lg px-3 py-1.5 shadow-xl text-xs z-20 backdrop-blur-md"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredIndex].y / svgHeight) * 100 - 35)}%`,
            }}
          >
            <div className="font-semibold text-purple-300">
              {points[hoveredIndex].date} ({points[hoveredIndex].day})
            </div>
            <div className="mt-0.5 text-slate-200">
              {activeMetric === 'revenue'
                ? `Revenue: $${points[hoveredIndex].revenue.toLocaleString()}`
                : `Orders: ${points[hoveredIndex].orders}`}
            </div>
            {showProjection && points[hoveredIndex].projectedRevenue && (
              <div className="text-[10px] text-sky-400">
                Proj: ${points[hoveredIndex].projectedRevenue?.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
