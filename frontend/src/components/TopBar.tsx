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
    <header className="sticky top-0 z-30 h-16 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E5E0D8] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Mobile Hamburger Toggle & Real Interactive Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md relative" ref={searchContainerRef}>
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] transition-colors lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Interactive Search Input */}
        <div className="relative w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
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
            className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl pl-9 pr-14 py-1.5 text-xs text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchFocused(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#78716C] hover:text-[#0A0A0A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="text-[10px] text-[#57534E] font-mono px-1.5 py-0.5 rounded bg-[#F5F1EA] border border-[#E5E0D8]">
                ⌘ K
              </kbd>
            </div>
          )}

          {/* Real Search Results Dropdown */}
          {searchFocused && query.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D8] shadow-xl p-2 z-50 text-xs animate-in fade-in max-h-80 overflow-y-auto">
              {matchedProducts.length === 0 && matchedNav.length === 0 ? (
                <div className="p-3 text-center text-[#78716C]">
                  No matching items found for "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-2">
                  {matchedProducts.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#57534E]">
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
                          className="p-2 rounded-xl hover:bg-[#F5F1EA] flex items-center justify-between cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-[#0A0A0A]" />
                            <div>
                              <div className="font-semibold text-[#0A0A0A] group-hover:underline">
                                {p.title}
                              </div>
                              <div className="text-[10px] text-[#78716C]">{p.category}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#0A0A0A] font-bold flex items-center gap-1 bg-[#D4FF00] px-2 py-0.5 rounded border border-[#171717]">
                            <span>Open in Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedNav.length > 0 && (
                    <div className="pt-1 border-t border-[#E5E0D8]">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#57534E]">
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
                          className="p-2 rounded-xl hover:bg-[#F5F1EA] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-[#0A0A0A]">{n.label}</div>
                            <div className="text-[10px] text-[#78716C]">{n.desc}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#78716C]" />
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#E5E0D8] bg-[#F5F1EA] hover:bg-[#EBE5DB] transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-[#0A0A0A]' : 'bg-[#EF4444]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-[#D4FF00] border border-[#0A0A0A]' : 'bg-[#EF4444]'
              }`}
            />
          </span>
          <span className={`font-semibold ${isOnline ? 'text-[#0A0A0A]' : 'text-rose-700'}`}>
            {healthLoading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
          </span>
          <Activity className="w-3 h-3 text-[#78716C]" />
        </button>

        {/* Real Telemetry Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] transition-colors"
            aria-label="View system notifications"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            {isDemoData && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#FBF9F5]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D8] shadow-2xl p-4 text-xs z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E0D8]">
                <span className="font-bold text-[#0A0A0A]">System Status &amp; Alerts</span>
                <span className="text-[10px] text-[#0A0A0A] font-bold px-1.5 py-0.5 rounded bg-[#D4FF00] border border-[#171717]">Live Telemetry</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {realNotifications.map((notif) => (
                  <div key={notif.id} className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] flex items-start gap-2.5">
                    {notif.type === 'success' && (
                      <span className="w-5 h-5 rounded-full bg-[#D4FF00] border border-[#171717] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-[#0A0A0A]" />
                      </span>
                    )}
                    {notif.type === 'warning' && (
                      <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-amber-800" />
                      </span>
                    )}
                    {notif.type === 'info' && (
                      <span className="w-5 h-5 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Database className="w-3 h-3 text-[#0A0A0A]" />
                      </span>
                    )}
                    <div>
                      <p className="font-bold text-[#0A0A0A] leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">{notif.desc}</p>
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
            className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#E5E0D8] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#F5F1EA] border border-[#171717] group-hover:bg-[#EBE5DB] flex items-center justify-center text-xs font-bold text-[#0A0A0A] shadow-sm transition-colors">
              {initials}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[#0A0A0A] transition-colors">
              <span className="text-xs font-bold">{sellerName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D8] shadow-xl p-2 text-xs z-50 animate-in fade-in">
              <div className="p-2 border-b border-[#E5E0D8]">
                <p className="font-bold text-[#0A0A0A]">{sellerName}</p>
                <p className="text-[10px] text-[#57534E]">Solo Founder / Operator</p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] font-medium transition-colors"
                >
                  Configure Store Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generate Copy Quick Action Button (Prominent Acid-Lime CTA with ink text) */}
        <button
          onClick={onQuickGenerate}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold border border-[#171717] shadow-sm active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A] fill-[#0A0A0A]" />
          <span>+ New Copy</span>
        </button>
      </div>
    </header>
  );
};
