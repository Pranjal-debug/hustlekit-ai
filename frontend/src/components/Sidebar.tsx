import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  Database,
  Cpu,
  GitBranch,
  PenTool,
  X,
} from 'lucide-react';
import type { NavPage, HealthResponse } from '../types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  health?: HealthResponse | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  health,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'studio',
      label: 'Product Studio',
      icon: PenTool,
    },
    {
      id: 'insights',
      label: 'Sales Insights',
      icon: BarChart3,
    },
    {
      id: 'advisor',
      label: 'Growth Advisor',
      icon: Sparkles,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleSelect = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  // Derive genuine system statuses from backend health
  const mongoStatus = !health
    ? 'Offline'
    : health.database?.status === 'connected'
    ? 'Connected'
    : health.database?.status === 'in_memory_fallback'
    ? 'In-Memory'
    : 'Disconnected';

  const gemmaStatus = !health
    ? 'Offline'
    : health.aiEngineStatus === 'live_provider'
    ? 'Live'
    : 'Template Mode';

  const mastraStatus = !health
    ? 'Offline'
    : health.mastra?.ready
    ? 'Ready'
    : 'Degraded';

  const isDegraded = Boolean(health && health.status === 'degraded');
  const isHealthy = Boolean(health && health.status === 'ok');
  const overallSystemLabel = !health
    ? 'Backend Offline'
    : isDegraded
    ? 'Service Degraded'
    : 'All Systems Operational';

  const overallBadgeStyle = !health
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : isDegraded
    ? 'text-amber-800 bg-amber-50 border-amber-200'
    : 'text-[#0A0A0A] bg-[#D4FF00] border-[#C5EE00]';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#0A0A0A]/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FBF9F5] border-r border-[#E5E0D8] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-3">
              {/* Refined editorial brand emblem */}
              <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-[#171717] flex items-center justify-center p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#0A0A0A] rounded-[5px] flex items-center justify-center">
                  <span className="font-extrabold text-[#D4FF00] text-base font-display">
                    H
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#0A0A0A] tracking-tight text-base font-sans">
                    HustleKit
                  </span>
                  <span className="text-xs font-extrabold px-1.5 py-0.2 rounded bg-[#D4FF00] text-[#0A0A0A] border border-[#171717]">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-[#57534E] font-medium leading-tight">
                  Editorial Commerce Intelligence
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation list */}
          <nav className="px-3 py-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#F5F1EA] text-[#0A0A0A] border border-[#171717] font-bold shadow-sm'
                      : 'text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA]/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#0A0A0A]' : 'text-[#78716C] group-hover:text-[#0A0A0A]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00] border border-[#171717]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Section: System Status & Brand Message */}
        <div className="px-4 pb-6 space-y-4">
          {/* System Status Panel */}
          <div className="rounded-xl p-3.5 bg-[#F5F1EA] border border-[#E5E0D8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider">
                System Status
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${overallBadgeStyle}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${!health ? 'bg-rose-500' : isDegraded ? 'bg-amber-500' : 'bg-[#0A0A0A]'}`} />
                {overallSystemLabel}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* MongoDB Atlas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#57534E]">
                  <Database className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span className="font-medium">MongoDB Atlas</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    mongoStatus === 'Connected'
                      ? 'text-[#0A0A0A]'
                      : mongoStatus === 'In-Memory'
                      ? 'text-amber-700'
                      : 'text-rose-600'
                  }`}
                >
                  {mongoStatus}
                </span>
              </div>

              {/* Gemma 3 12B */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#57534E]">
                  <Cpu className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span className="font-medium">Gemma 3 12B</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    gemmaStatus === 'Live'
                      ? 'text-[#0A0A0A]'
                      : gemmaStatus === 'Template Mode'
                      ? 'text-amber-700'
                      : 'text-rose-600'
                  }`}
                >
                  {gemmaStatus}
                </span>
              </div>

              {/* Mastra Workflow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#57534E]">
                  <GitBranch className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span className="font-medium">Mastra Workflow</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    mastraStatus === 'Ready'
                      ? 'text-[#0A0A0A]'
                      : 'text-rose-600'
                  }`}
                >
                  {mastraStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Brand Editorial Note */}
          <div className="rounded-xl p-3 bg-[#FBF9F5] border border-[#E5E0D8]">
            <p className="text-[11px] text-[#57534E] leading-relaxed">
              Designed for solo operators. <span className="text-[#0A0A0A] font-semibold">Real growth &amp; sales velocity</span>.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
