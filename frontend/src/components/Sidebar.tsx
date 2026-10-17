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

  const overallColor = !health
    ? 'text-rose-400 bg-rose-400'
    : isDegraded
    ? 'text-amber-400 bg-amber-400'
    : 'text-[#00E0B0] bg-[#00E0B0]';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#03111F]/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#061A2B]/95 lg:bg-[#061A2B]/90 backdrop-blur-xl border-r border-[#12364B] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#12364B]">
            <div className="flex items-center gap-3">
              {/* Stylized 'H' ribbon logo matching reference */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00C9F2] to-[#00E0B0] flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(0,224,176,0.35)]">
                <div className="w-full h-full bg-[#061A2B] rounded-[6px] flex items-center justify-center">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-[#00C9F2] to-[#00E0B0] text-lg font-sans">
                    H
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#F1F7FC] tracking-tight text-base font-sans">
                    HustleKit
                  </span>
                  <span className="font-bold text-[#00E0B0] text-base">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-[#6F8BA3] font-medium leading-tight">
                  Smarter Insights. Bigger Growth.
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137]"
              aria-label="Close menu"
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#0A2E3D]/90 text-[#F1F7FC] border border-[#00E0B0]/40 shadow-[0_0_12px_rgba(0,224,176,0.15)] font-semibold'
                      : 'text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#00E0B0]' : 'text-[#6F8BA3] group-hover:text-[#00E0B0]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E0B0] shadow-[0_0_8px_#00E0B0]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Section: System Status & Brand Message */}
        <div className="px-4 pb-6 space-y-5">
          {/* System Status Panel matching reference */}
          <div className="rounded-xl p-3.5 bg-[#03111F]/60 border border-[#12364B]/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6F8BA3] uppercase tracking-wider">
                System Status
              </span>
              <span className={`flex items-center gap-1.5 text-[10px] font-medium ${overallColor.split(' ')[0]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overallColor.split(' ')[1]} ${isHealthy ? 'animate-pulse' : ''}`} />
                {overallSystemLabel}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* MongoDB Atlas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9BB4C9]">
                  <Database className="w-3.5 h-3.5 text-[#00E0B0]" />
                  <span>MongoDB Atlas</span>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    mongoStatus === 'Connected'
                      ? 'text-[#00E0B0]'
                      : mongoStatus === 'In-Memory'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {mongoStatus}
                </span>
              </div>

              {/* Gemma 3 12B */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9BB4C9]">
                  <Cpu className="w-3.5 h-3.5 text-[#00C9F2]" />
                  <span>Gemma 3 12B</span>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    gemmaStatus === 'Live'
                      ? 'text-[#00C9F2]'
                      : gemmaStatus === 'Template Mode'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {gemmaStatus}
                </span>
              </div>

              {/* Mastra Workflow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9BB4C9]">
                  <GitBranch className="w-3.5 h-3.5 text-[#00E0B0]" />
                  <span>Mastra Workflow</span>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    mastraStatus === 'Ready'
                      ? 'text-[#00E0B0]'
                      : 'text-rose-400'
                  }`}
                >
                  {mastraStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Brand Wave Banner matching reference */}
          <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-t from-[#061A2B] to-[#092137] border border-[#12364B]/60">
            {/* Subtle mini wave lines in background */}
            <svg
              className="absolute -bottom-2 -left-4 w-48 h-16 opacity-30 pointer-events-none"
              viewBox="0 0 200 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M -10 60 C 40 20, 100 70, 160 30 C 190 10, 210 50, 230 40"
                stroke="#00C9F2"
                strokeWidth="1.2"
              />
              <path
                d="M -10 70 C 50 30, 110 80, 170 40 C 200 20, 220 60, 240 50"
                stroke="#00E0B0"
                strokeWidth="0.8"
              />
            </svg>
            <p className="relative z-10 text-[11px] text-[#6F8BA3] leading-relaxed">
              Turn your ideas into <span className="text-[#F1F7FC] font-medium">real business growth</span>.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
