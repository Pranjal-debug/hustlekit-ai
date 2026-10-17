import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Bell,
  Search,
  Activity,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  Package,
  X,
} from 'lucide-react';
import type { NavPage, HealthResponse, ProductItem } from '../types';

interface TopBarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  onOpenMobile: () => void;
  onQuickGenerate: () => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  sellerName?: string;
  products?: ProductItem[];
  onSelectProduct?: (product: ProductItem) => void;
  isDemoData?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNavigate,
  onOpenMobile,
  onQuickGenerate,
  health,
  healthLoading,
  onRefreshHealth,
  sellerName = 'Solo Founder',
  products = [],
  onSelectProduct,
  isDemoData = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === 'Escape') {
        setSearchFocused(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isOnline = health?.status === 'ok';

  // Compute initials from sellerName
  const initials = sellerName
    ? sellerName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'HK';

  // Real searchable items (Products + Navigation shortcuts)
  const query = searchQuery.trim().toLowerCase();
  const matchedProducts = query
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const navShortcuts: { label: string; page: NavPage; desc: string }[] = [
    { label: 'Dashboard', page: 'dashboard', desc: 'Overview telemetry and KPI cards' },
    { label: 'Product Studio', page: 'studio', desc: 'AI marketing copy & SEO tags' },
    { label: 'Sales Insights', page: 'insights', desc: 'CSV sales telemetry & breakdown' },
    { label: 'Growth Advisor', page: 'advisor', desc: 'Mastra orchestrated growth plan' },
    { label: 'Settings', page: 'settings', desc: 'Store profile & AI configurations' },
  ];

  const matchedNav = query
    ? navShortcuts.filter((n) => n.label.toLowerCase().includes(query))
    : [];

  // Generate real telemetry notifications from genuine app state
  const realNotifications: { id: string; title: string; desc: string; type: 'success' | 'warning' | 'info' }[] = [];

  if (health?.database?.status === 'connected') {
    realNotifications.push({
      id: 'db_connected',
      title: 'MongoDB Atlas Connected',
      desc: `Persistent cluster connected (${health.database.dbName || 'hustlekit_ai'}).`,
      type: 'success',
    });
  } else if (health?.database?.status === 'in_memory_fallback') {
    realNotifications.push({
      id: 'db_fallback',
      title: 'In-Memory Store Active',
      desc: 'MongoDB URI not set or offline; using transient memory store.',
      type: 'warning',
    });
  }

  if (health?.aiEngineStatus === 'live_provider') {
    realNotifications.push({
      id: 'ai_live',
      title: 'Gemma 3 12B Connected',
      desc: 'Live OpenRouter inference active.',
      type: 'success',
    });
  } else {
    realNotifications.push({
      id: 'ai_demo',
      title: 'Template Engine Mode',
      desc: 'AI provider key unconfigured; using built-in solo entrepreneur heuristics.',
      type: 'info',
    });
  }

  if (isDemoData) {
    realNotifications.push({
      id: 'demo_data',
      title: 'Simulation Dataset Active',
      desc: 'Showing demo solo seller metrics. Import a CSV in Sales Insights to see real sales.',
      type: 'info',
    });
  } else {
    realNotifications.push({
      id: 'real_data',
      title: 'Imported Sales Active',
      desc: 'Dashboard metrics are calculated from your real persisted transaction records.',
      type: 'success',
    });
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#061A2B]/85 backdrop-blur-md border-b border-[#12364B] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Mobile Hamburger Toggle & Real Interactive Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md relative" ref={searchContainerRef}>
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Interactive Search Input */}
        <div className="relative w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6F8BA3]">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search products or tools..."
            className="w-full bg-[#03111F]/80 border border-[#12364B] rounded-xl pl-9 pr-14 py-1.5 text-xs text-[#F1F7FC] placeholder-[#6F8BA3] focus:outline-none focus:border-[#00E0B0]/60 focus:ring-1 focus:ring-[#00E0B0]/30 transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchFocused(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6F8BA3] hover:text-[#F1F7FC]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="text-[10px] text-[#6F8BA3] font-mono px-1.5 py-0.5 rounded bg-[#061A2B] border border-[#12364B]">
                ⌘ K
              </kbd>
            </div>
          )}

          {/* Real Search Results Dropdown */}
          {searchFocused && query.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#061A2B] border border-[#12364B] shadow-2xl p-2 z-50 text-xs animate-in fade-in max-h-80 overflow-y-auto">
              {matchedProducts.length === 0 && matchedNav.length === 0 ? (
                <div className="p-3 text-center text-[#6F8BA3]">
                  No matching items found for "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-2">
                  {matchedProducts.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#6F8BA3]">
                        Store Products ({matchedProducts.length})
                      </div>
                      {matchedProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectProduct?.(p);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-[#092137] flex items-center justify-between cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-[#00E0B0]" />
                            <div>
                              <div className="font-semibold text-[#F1F7FC] group-hover:text-[#00E0B0] transition-colors">
                                {p.title}
                              </div>
                              <div className="text-[10px] text-[#6F8BA3]">{p.category}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#00E0B0] font-semibold flex items-center gap-1">
                            <span>Open in Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedNav.length > 0 && (
                    <div className="pt-1 border-t border-[#12364B]/60">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#6F8BA3]">
                        Navigation Shortcuts
                      </div>
                      {matchedNav.map((n) => (
                        <div
                          key={n.page}
                          onClick={() => {
                            onNavigate(n.page);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-[#092137] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-[#F1F7FC]">{n.label}</div>
                            <div className="text-[10px] text-[#6F8BA3]">{n.desc}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#6F8BA3]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Real Status, Real Notifications, User Profile & CTA */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Real Backend Status Badge */}
        <button
          onClick={onRefreshHealth}
          title="Click to re-ping backend /health endpoint"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[#12364B] bg-[#03111F]/60 hover:bg-[#092137] transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-[#00E0B0]' : 'bg-[#EF4444]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-[#00E0B0]' : 'bg-[#EF4444]'
              }`}
            />
          </span>
          <span className={`font-semibold ${isOnline ? 'text-[#00E0B0]' : 'text-rose-400'}`}>
            {healthLoading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
          </span>
          <Activity className="w-3 h-3 text-[#6F8BA3]" />
        </button>

        {/* Real Telemetry Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137] transition-colors"
            aria-label="View system notifications"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            {isDemoData && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#061A2B]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#061A2B] border border-[#12364B] shadow-2xl p-4 text-xs z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#12364B]">
                <span className="font-semibold text-[#F1F7FC]">System Status &amp; Alerts</span>
                <span className="text-[10px] text-[#00E0B0] font-medium">Real-time Telemetry</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {realNotifications.map((notif) => (
                  <div key={notif.id} className="p-2 rounded-xl bg-[#03111F]/60 border border-[#12364B]/60 flex items-start gap-2.5">
                    {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#00E0B0] shrink-0 mt-0.5" />}
                    {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    {notif.type === 'info' && <Database className="w-4 h-4 text-[#00C9F2] shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-semibold text-[#F1F7FC] leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-[#9BB4C9] mt-0.5 leading-relaxed">{notif.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge (reads saved sellerName) */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#12364B] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#092137] border border-[#12364B] group-hover:border-[#00E0B0]/40 flex items-center justify-center text-xs font-bold text-[#F1F7FC] shadow-sm transition-colors">
              {initials}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[#F1F7FC] group-hover:text-[#00E0B0] transition-colors">
              <span className="text-xs font-semibold">{sellerName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F8BA3]" />
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#061A2B] border border-[#12364B] shadow-2xl p-2 text-xs z-50 animate-in fade-in">
              <div className="p-2 border-b border-[#12364B]/60">
                <p className="font-semibold text-[#F1F7FC]">{sellerName}</p>
                <p className="text-[10px] text-[#6F8BA3]">Solo Founder / Operator</p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137] transition-colors"
                >
                  Configure Store Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generate Copy Quick Action Button */}
        <button
          onClick={onQuickGenerate}
          className="btn-shimmer hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E0B0] to-[#00C9F2] hover:opacity-95 text-[#03111F] text-xs font-bold shadow-md shadow-[#00E0B0]/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#03111F]" />
          <span>Generate Copy</span>
        </button>
      </div>
    </header>
  );
};
