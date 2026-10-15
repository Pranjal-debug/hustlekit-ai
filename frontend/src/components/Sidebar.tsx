import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Settings,
  Zap,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { NavPage } from '../types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'studio' as NavPage,
      label: 'Product Studio',
      icon: Sparkles,
      badge: 'AI Copy',
    },
    {
      id: 'insights' as NavPage,
      label: 'Sales Insights',
      icon: TrendingUp,
      badge: undefined,
    },
    {
      id: 'settings' as NavPage,
      label: 'Settings',
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleSelect = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/95 lg:bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                HustleKit
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Solo Entrepreneur Toolkit</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Main Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-purple-800/60 text-purple-200 border border-purple-400/30'
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Quick Actions
          </div>

          <button
            onClick={() => handleSelect('studio')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 border border-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Draft New Copy</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleSelect('insights')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 border border-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Review Sales Velocity</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Solo Plan Card */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">Hackathon Edition</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Active
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            AI Marketing &amp; Commerce Engine ready for solo sellers.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
            <span>Template Engine Mode</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </aside>
    </>
  );
};
