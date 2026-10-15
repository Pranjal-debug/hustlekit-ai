import React from 'react';
import { Menu, Sparkles, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import type { NavPage, HealthResponse } from '../types';

interface TopBarProps {
  activePage: NavPage;
  onOpenMobile: () => void;
  onQuickGenerate: () => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activePage,
  onOpenMobile,
  onQuickGenerate,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Store Overview',
      subtitle: 'Real-time sales telemetry & automated growth tools',
    },
    studio: {
      title: 'AI Product Studio',
      subtitle: 'Generate high-converting descriptions, SEO copy, and support messages',
    },
    insights: {
      title: 'Sales & Revenue Insights',
      subtitle: 'Analyze conversion trends, sales channels, and AI-recommended actions',
    },
    settings: {
      title: 'Store Settings',
      subtitle: 'Configure store identity, default copywriting tone, and API environments',
    },
  };

  const current = pageTitles[activePage];

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
            {current.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 truncate max-w-md">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Backend health status badge */}
        <button
          onClick={onRefreshHealth}
          title="Click to check backend health status"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/60 transition-all hover:bg-slate-800/80"
        >
          {healthLoading ? (
            <>
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              <span className="hidden md:inline text-slate-400">Pinging API...</span>
            </>
          ) : health && health.status === 'ok' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline text-slate-300">Backend:</span>
              <span className="text-emerald-400 font-semibold">Online</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-slate-300">Backend:</span>
              <span className="text-amber-400 font-semibold">Offline</span>
            </>
          )}
        </button>

        {/* Demo indicator tag */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Demo Data Mode</span>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onQuickGenerate}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Copy</span>
        </button>

        {/* Profile Avatar / Store Initials */}
        <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200 shadow-sm">
          HK
        </div>
      </div>
    </header>
  );
};
