import React, { useState } from 'react';
import type { SalesChartDataPoint } from '../types';

interface SalesChartProps {
  data: SalesChartDataPoint[];
  showProjection?: boolean;
  height?: number;
  currencySymbol?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data = [],
  showProjection = true,
  height = 240,
  currencySymbol = '₹',
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // If no data exists, display an honest, styled empty state within the chart frame
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#12364B] rounded-xl bg-[#03111F]/50">
        <div className="w-10 h-10 rounded-full bg-[#12364B]/60 flex items-center justify-center text-[#6F8BA3] mb-2.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-[#F1F7FC]">No sales velocity data recorded</p>
        <p className="text-[11px] text-[#6F8BA3] mt-1 max-w-sm">
          Import your store transactions CSV in Sales Insights or reload demo inventory to view real velocity curves.
        </p>
      </div>
    );
  }

  // Filter real data based on the selected time range
  const filteredData = timeRange === '7D'
    ? data.slice(-7)
    : timeRange === '30D'
    ? data.slice(-30)
    : timeRange === '90D'
    ? data.slice(-90)
    : data;

  const values = filteredData.map((d) => d.revenue);

  // Only consider projected revenue if actual projection data is supplied by the backend
  const hasRealProjection = showProjection && filteredData.some((d) => typeof d.projectedRevenue === 'number');
  const projectionValues = hasRealProjection
    ? filteredData.map((d) => d.projectedRevenue || d.revenue)
    : [];

  const maxValue = Math.max(...values, ...(hasRealProjection ? projectionValues : [])) * 1.15 || 100;
  const minValue = 0;

  const width = 800;
  const svgHeight = height;
  const paddingX = 45;
  const paddingY = 25;

  const getX = (index: number) =>
    paddingX + (index / (filteredData.length - 1 || 1)) * (width - paddingX * 2);

  const getY = (val: number) =>
    svgHeight - paddingY - ((val - minValue) / (maxValue - minValue || 1)) * (svgHeight - paddingY * 2);

  // Main revenue path points
  const points = filteredData.map((d, i) => ({
    x: getX(i),
    y: getY(d.revenue),
    ...d,
  }));

  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Projection path points (only calculated when genuine projections exist)
  const projectionPoints = hasRealProjection
    ? filteredData.map((d, i) => ({
        x: getX(i),
        y: getY(d.projectedRevenue || d.revenue),
      }))
    : [];

  const projectionPathD = projectionPoints.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const formatYValue = (val: number) => {
    if (val >= 1000) return `${currencySymbol} ${(val / 1000).toFixed(0)}K`;
    return `${currencySymbol} ${val}`;
  };

  return (
    <div className="w-full select-none">
      {/* Chart Header Controls: Real Filtering Time Range Pills */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-[#6F8BA3]">
          Showing {filteredData.length} active data points
        </div>
        <div className="flex items-center gap-1 bg-[#03111F] p-1 rounded-xl border border-[#12364B]">
          {(['7D', '30D', '90D', '1Y'] as const).map((range) => {
            const isAvailable = range === '7D'
              ? data.length >= 1
              : range === '30D'
              ? data.length >= 7
              : range === '90D'
              ? data.length >= 30
              : data.length >= 60;

            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                disabled={!isAvailable && range !== '7D'}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-[#00E0B0] text-[#03111F] shadow-sm shadow-[#00E0B0]/30'
                    : isAvailable
                    ? 'text-[#6F8BA3] hover:text-[#F1F7FC] hover:bg-[#061A2B]'
                    : 'text-[#6F8BA3]/40 cursor-not-allowed'
                }`}
                title={!isAvailable ? `Requires more historical days` : undefined}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-visible w-full">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <filter id="neonEmeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E0B0" floodOpacity="0.75" />
              <feDropShadow dx="0" dy="2" stdDeviation="10" floodColor="#00C9F2" floodOpacity="0.3" />
            </filter>

            <linearGradient id="chartAreaGradCinema" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E0B0" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#00C9F2" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#03111F" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="chartLineGradCinema" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00C9F2" />
              <stop offset="50%" stopColor="#00E0B0" />
              <stop offset="100%" stopColor="#00E0B0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            const val = Math.round(maxValue - pct * maxValue);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#12364B"
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#6F8BA3"
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                >
                  {formatYValue(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartAreaGradCinema)" />}

          {/* AI Projection line — strictly rendered if real forecast data exists */}
          {hasRealProjection && projectionPathD && (
            <path
              d={projectionPathD}
              fill="none"
              stroke="#00C9F2"
              strokeWidth="2"
              strokeDasharray="5 4"
              opacity="0.6"
            />
          )}

          {/* Main revenue curve with neon glow */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#chartLineGradCinema)"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#neonEmeraldGlow)"
            />
          )}

          {/* Interactive points */}
          {points.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Pulsing halo ring on latest active data point */}
              {i === points.length - 1 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill="none"
                  stroke="#00E0B0"
                  strokeOpacity="0.5"
                  className="animate-ping"
                  style={{ transformOrigin: `${p.x}px ${p.y}px`, animationDuration: '3s' }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : i === points.length - 1 ? 5 : 3.5}
                fill="#03111F"
                stroke={hoveredIndex === i ? '#FFFFFF' : '#00E0B0'}
                strokeWidth={hoveredIndex === i ? 2.5 : 2}
                className="transition-all duration-150"
              />

              {/* X Axis Date Labels */}
              <text
                x={p.x}
                y={svgHeight - 6}
                textAnchor="middle"
                fill={hoveredIndex === i ? '#F1F7FC' : '#6F8BA3'}
                fontSize="10"
                fontWeight={hoveredIndex === i ? '600' : '400'}
                fontFamily="Inter, sans-serif"
              >
                {p.day || (p.date.length >= 10 ? p.date.substring(5) : p.date)}
              </text>
            </g>
          ))}
        </svg>

        {/* Hovered point tooltip overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 bg-[#061A2B]/95 border border-[#00E0B0]/60 text-[#F1F7FC] rounded-xl px-3 py-1.5 shadow-2xl text-xs z-30 backdrop-blur-md"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredIndex].y / svgHeight) * 100 - 35)}%`,
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-[#00E0B0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E0B0]" />
              <span>{points[hoveredIndex].date} ({points[hoveredIndex].day})</span>
            </div>
            <div className="font-bold text-sm text-[#F1F7FC] mt-0.5">
              {currencySymbol} {points[hoveredIndex].revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {points[hoveredIndex].orders != null && (
              <div className="text-[10px] text-[#9BB4C9]">
                {points[hoveredIndex].orders} transactions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Chart Legend */}
      <div className="mt-3 flex items-center gap-5 text-xs text-[#6F8BA3]">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#00E0B0] rounded-full" />
          <span className="text-[#9BB4C9] font-medium">Actual Revenue</span>
        </div>
        {hasRealProjection && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-b border-dashed border-[#00C9F2]" />
            <span className="text-[#6F8BA3]">Forecast Trajectory</span>
          </div>
        )}
      </div>
    </div>
  );
};
