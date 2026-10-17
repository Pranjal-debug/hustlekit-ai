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
      <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E5E0D8] rounded-xl bg-[#FBF9F5]">
        <div className="w-10 h-10 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#57534E] mb-2.5">
          <svg className="w-5 h-5 text-[#0A0A0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-[#0A0A0A]">No sales velocity data recorded</p>
        <p className="text-[11px] text-[#57534E] mt-1 max-w-sm">
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
        <div className="text-[11px] font-medium text-[#57534E]">
          Showing {filteredData.length} active data points
        </div>
        <div className="flex items-center gap-1 bg-[#F5F1EA] p-1 rounded-xl border border-[#E5E0D8]">
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
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-[#0A0A0A] text-[#FBF9F5] shadow-sm'
                    : isAvailable
                    ? 'text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#EBE5DB]'
                    : 'text-[#A8A29E] cursor-not-allowed'
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
            <linearGradient id="chartAreaGradEditorial" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4FF00" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#F5F1EA" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FBF9F5" stopOpacity="0.0" />
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
                  stroke="#E5E0D8"
                  strokeOpacity="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#57534E"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                >
                  {formatYValue(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartAreaGradEditorial)" />}

          {/* AI Projection line — strictly rendered if real forecast data exists */}
          {hasRealProjection && projectionPathD && (
            <path
              d={projectionPathD}
              fill="none"
              stroke="#57534E"
              strokeWidth="2"
              strokeDasharray="5 4"
              opacity="0.8"
            />
          )}

          {/* Main revenue curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#0A0A0A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              {/* Highlight halo on latest active data point */}
              {i === points.length - 1 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  fill="none"
                  stroke="#D4FF00"
                  strokeWidth="2"
                  className="animate-ping"
                  style={{ transformOrigin: `${p.x}px ${p.y}px`, animationDuration: '3s' }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : i === points.length - 1 ? 5 : 3.5}
                fill={hoveredIndex === i ? '#D4FF00' : '#0A0A0A'}
                stroke={hoveredIndex === i ? '#0A0A0A' : '#FFFFFF'}
                strokeWidth={hoveredIndex === i ? 2 : 1.5}
                className="transition-all duration-150"
              />

              {/* X Axis Date Labels */}
              <text
                x={p.x}
                y={svgHeight - 6}
                textAnchor="middle"
                fill={hoveredIndex === i ? '#0A0A0A' : '#57534E'}
                fontSize="10"
                fontWeight={hoveredIndex === i ? '700' : '500'}
                fontFamily="JetBrains Mono, monospace"
              >
                {p.day || (p.date.length >= 10 ? p.date.substring(5) : p.date)}
              </text>
            </g>
          ))}
        </svg>

        {/* Hovered point tooltip overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 bg-[#FFFFFF] border border-[#171717] text-[#0A0A0A] rounded-xl px-3.5 py-2 shadow-xl text-xs z-30"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${Math.max(8, (points[hoveredIndex].y / svgHeight) * 100 - 38)}%`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-[10px] text-[#57534E] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#D4FF00] border border-[#171717]" />
              <span>{points[hoveredIndex].date} ({points[hoveredIndex].day})</span>
            </div>
            <div className="font-extrabold text-sm text-[#0A0A0A] mt-0.5 font-mono">
              {currencySymbol} {points[hoveredIndex].revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {points[hoveredIndex].orders != null && (
              <div className="text-[10px] text-[#57534E] font-medium mt-0.5">
                {points[hoveredIndex].orders} transactions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Chart Legend */}
      <div className="mt-3 flex items-center gap-5 text-xs text-[#57534E]">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-[#0A0A0A] rounded-full" />
          <span className="text-[#0A0A0A] font-semibold">Actual Revenue</span>
        </div>
        {hasRealProjection && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 border-b-2 border-dashed border-[#57534E]" />
            <span className="text-[#57534E] font-medium">Forecast Trajectory</span>
          </div>
        )}
      </div>
    </div>
  );
};
