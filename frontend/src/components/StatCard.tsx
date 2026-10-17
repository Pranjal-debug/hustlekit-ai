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

  // Accent container styling
  const accentStyles = {
    teal: 'bg-[#00E0B0]/10 border-[#00E0B0]/20 text-[#00E0B0]',
    cyan: 'bg-[#00C9F2]/10 border-[#00C9F2]/20 text-[#00C9F2]',
    indigo: 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#818CF8]',
    violet: 'bg-[#A855F7]/10 border-[#A855F7]/20 text-[#C084FC]',
    emerald: 'bg-[#00E0B0]/10 border-[#00E0B0]/20 text-[#00E0B0]',
  };

  const sparklineStroke = {
    emerald: '#00E0B0',
    cyan: '#00C9F2',
    violet: '#A855F7',
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
    <div className="glass-card glass-card-hover group rounded-2xl p-5 border border-[#12364B] bg-[#061A2B] relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
      {/* Top row: Icon container + Metric title + Demo badge */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${accentStyles[accentColor]}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#6F8BA3]">
                  {title}
                </span>
                {isDemo && (
                  <span className="text-[9px] uppercase font-bold px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Demo
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-[#F1F7FC] font-sans">
                {value}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Real Trend percentage & Real Sparkline (rendered only when data-backed) */}
      <div className="mt-4 pt-2 border-t border-[#12364B]/40 flex items-center justify-between">
        <div>
          {change !== undefined ? (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  isPositive ? 'text-[#00E0B0]' : 'text-rose-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {isPositive ? `+${change}%` : `${change}%`}
              </span>
              <span className="text-[#6F8BA3] text-[11px] ml-1">{changePeriod}</span>
            </div>
          ) : subtext ? (
            <span className="text-[11px] text-[#6F8BA3] truncate max-w-[140px] block" title={subtext}>
              {subtext}
            </span>
          ) : (
            <span className="text-[11px] text-[#00E0B0]">Live telemetry</span>
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
                strokeWidth="1.8"
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
