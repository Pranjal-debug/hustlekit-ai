import React, { useState, useEffect } from 'react';
import {
  Save,
  Server,
  Database,
  Store,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { StoreSettings, ToneType, HealthResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

interface SettingsPageProps {
  health: HealthResponse | null;
  onRefreshHealth: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onResetDemoData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  health,
  onRefreshHealth,
  onShowToast,
  onResetDemoData,
}) => {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'AeroCraft Solo Commerce',
    sellerName: 'Pranjal Gupta',
    currency: 'USD ($)',
    defaultTone: 'persuasive',
    targetMarket: 'Remote professionals, designers, and EDC enthusiasts',
    aiProviderConfigured: false,
    demoModeActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.warn('Could not load settings from server, using local defaults', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      onShowToast('Settings saved successfully!', 'success');
    } catch (err: any) {
      onShowToast(err?.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestHealth = async () => {
    setTestResult(null);
    try {
      const res = await api.checkHealth();
      onRefreshHealth();
      setTestResult(
        `Backend Online (${res.service}). Uptime: ${res.uptime}s. Engine: ${res.aiEngineStatus}`
      );
      onShowToast('Backend connection confirmed healthy!', 'success');
    } catch (err: any) {
      setTestResult(`Connection Failed: ${err.message}`);
      onShowToast('Backend health check failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#E5E0D8]">
            <div className="w-9 h-9 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                Store Identity &amp; Profile
              </h2>
              <p className="text-xs text-[#57534E]">Brand identity, founder profile, and default ecommerce parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 font-sans">
                Store / Brand Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-medium placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 font-sans">
                Solo Founder / Operator Name
              </label>
              <input
                type="text"
                value={settings.sellerName}
                onChange={(e) => setSettings({ ...settings, sellerName: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-medium placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 font-sans">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-medium focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="CAD ($)">CAD ($)</option>
                <option value="AUD ($)">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 font-sans">
                Default Copywriting Tone
              </label>
              <select
                value={settings.defaultTone}
                onChange={(e) => setSettings({ ...settings, defaultTone: e.target.value as ToneType })}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-medium focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
              >
                <option value="persuasive">Persuasive (High Conversion)</option>
                <option value="luxurious">Luxurious (Premium Brands)</option>
                <option value="friendly">Friendly (Approachable)</option>
                <option value="concise">Concise (Direct &amp; Fast)</option>
                <option value="witty">Witty (Engaging &amp; Modern)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 font-sans">
              Primary Target Market Description
            </label>
            <input
              type="text"
              value={settings.targetMarket}
              onChange={(e) => setSettings({ ...settings, targetMarket: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-medium placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
            />
          </div>
        </div>

        {/* AI & Backend Integration Card */}
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] flex items-center justify-center shrink-0">
                <Server className="w-5 h-5 text-[#0A0A0A]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                  AI Provider &amp; API Connectivity
                </h2>
                <p className="text-xs text-[#57534E]">Real-time telemetry, model configuration, and connectivity diagnostics</p>
              </div>
            </div>
            <Badge variant="purple">Architecture</Badge>
          </div>

          <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#0A0A0A] font-sans">Current AI Engine Mode:</span>
                <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
                  {settings.aiProviderConfigured
                    ? 'Configured with live OpenAI / Gemini keys in environment'
                    : 'Built-in HustleKit Heuristics & Copywriting Engine (Demo Mode)'}
                </p>
              </div>
              <Badge variant={settings.aiProviderConfigured ? 'success' : 'demo'}>
                {settings.aiProviderConfigured ? 'Live AI Provider' : 'Demo Template Mode'}
              </Badge>
            </div>

            <div className="text-[11px] text-[#57534E] bg-[#F5F1EA] p-3 rounded-xl border border-[#E5E0D8] font-mono break-all space-y-1">
              <div><strong className="text-[#0A0A0A]">API_BASE_URL:</strong> {api.getBaseUrl()}</div>
              <div><strong className="text-[#0A0A0A]">ENVIRONMENT:</strong> {health?.environment || 'development'}</div>
              <div><strong className="text-[#0A0A0A]">ENGINE_STATUS:</strong> {health?.aiEngineStatus || 'demo_template_engine'}</div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestHealth}
                className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F1EA] text-[#0A0A0A] border border-[#E5E0D8] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Test API Health Endpoint</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium leading-relaxed ${
                  testResult.toLowerCase().includes('failed')
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Demo Data Management Card */}
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#E5E0D8]">
            <div className="w-9 h-9 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                Demo Data &amp; Sandbox Controls
              </h2>
              <p className="text-xs text-[#57534E]">Sandbox inventory, simulation records, and sample telemetry</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-sans">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Realistic Demo Mode Active
              </span>
              <p className="text-xs text-amber-900 leading-relaxed">
                To evaluate the app without live storefront credentials, preloaded demo inventory and sales history are active.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetDemoData}
              className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F1EA] text-[#0A0A0A] text-xs font-bold border border-[#E5E0D8] shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
            >
              Reload Demo Inventory
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] border border-[#171717] font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#0A0A0A]" />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
