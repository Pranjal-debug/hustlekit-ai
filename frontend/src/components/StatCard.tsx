import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  subtext?: string;
  isDemo?: boolean;
  accentColor?: 'teal' | 'cyan' | 'indigo' | 'violet' | 'emerald';
  sparklineColor?: 'emerald' | 'cyan' | 'violet';
  sparklinePoints?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePeriod = 'vs. last 7 days',
  icon: Icon,
  subtext,
  isDemo,
  accentColor = 'teal',
  sparklineColor = 'emerald',
  sparklinePoints,
}) => {
  const isPositive = change !== undefined ? change >= 0 : true;

  // Refined editorial icon container styling
  const accentStyles = {
    teal: 'bg-[#F5F1EA] border-[#E5E0D8] text-[#0A0A0A]',
    cyan: 'bg-[#F5F1EA] border-[#E5E0D8] text-[#0A0A0A]',
    indigo: 'bg-[#F5F1EA] border-[#E5E0D8] text-[#0A0A0A]',
    violet: 'bg-[#F5F1EA] border-[#E5E0D8] text-[#0A0A0A]',
    emerald: 'bg-[#F5F1EA] border-[#E5E0D8] text-[#0A0A0A]',
  };

  const sparklineStroke = {
    emerald: '#0A0A0A',
    cyan: '#0A0A0A',
    violet: '#57534E',
  }[sparklineColor];

  // Only render sparkline if genuine data points are provided (no fake decorative curve)
  const hasValidSparkline = Boolean(sparklinePoints && sparklinePoints.length >= 2);
  const points = sparklinePoints || [];
  const minVal = hasValidSparkline ? Math.min(...points) : 0;
  const maxVal = hasValidSparkline ? Math.max(...points) || 1 : 1;
  const sparkWidth = 72;
  const sparkHeight = 28;

  const sparklineD = hasValidSparkline
    ? points.reduce((acc, curr, i, arr) => {
        const x = (i / (arr.length - 1)) * sparkWidth;
        const y = sparkHeight - ((curr - minVal) / (maxVal - minVal || 1)) * (sparkHeight - 8) - 4;
        if (i === 0) return `M ${x} ${y}`;
        const prevX = ((i - 1) / (arr.length - 1)) * sparkWidth;
        const prevY = sparkHeight - ((arr[i - 1] - minVal) / (maxVal - minVal || 1)) * (sparkHeight - 8) - 4;
        const cpX = (prevX + x) / 2;
        return `${acc} C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
      }, '')
    : '';

  return (
    <div className="rounded-2xl p-5 border border-[#E5E0D8] bg-[#FFFFFF] shadow-sm relative overflow-hidden transition-all duration-200 hover:border-[#171717] hover:shadow-md flex flex-col justify-between group">
      {/* Top row: Icon container + Metric title + Demo badge */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors group-hover:bg-[#EBE5DB] ${accentStyles[accentColor]}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  {title}
                </span>
                {isDemo && (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Demo
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-sans">
                {value}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Real Trend percentage & Real Sparkline (rendered only when data-backed) */}
      <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
        <div>
          {change !== undefined ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[11px] border ${
                  isPositive
                    ? 'bg-[#D4FF00] text-[#0A0A0A] border-[#C5EE00]'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-[#0A0A0A]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-900" />
                )}
                {isPositive ? `+${change}%` : `${change}%`}
              </span>
              <span className="text-[#57534E] text-[11px]">{changePeriod}</span>
            </div>
          ) : subtext ? (
            <span className="text-[11px] text-[#57534E] font-medium truncate max-w-[140px] block" title={subtext}>
              {subtext}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#0A0A0A] bg-[#F5F1EA] px-2 py-0.5 rounded border border-[#E5E0D8]">
              Live Telemetry
            </span>
          )}
        </div>

        {/* Real Sparkline rendered strictly if actual series exists */}
        {hasValidSparkline && (
          <div className="shrink-0 pl-2">
            <svg
              width={sparkWidth}
              height={sparkHeight}
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              fill="none"
              className="overflow-visible"
            >
              <path
                d={sparklineD}
                stroke={sparklineStroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
