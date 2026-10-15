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
    sellerName: 'Alex Rivera',
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
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Store Identity &amp; Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store / Brand Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Solo Founder / Operator Name
              </label>
              <input
                type="text"
                value={settings.sellerName}
                onChange={(e) => setSettings({ ...settings, sellerName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="CAD ($)">CAD ($)</option>
                <option value="AUD ($)">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Copywriting Tone
              </label>
              <select
                value={settings.defaultTone}
                onChange={(e) => setSettings({ ...settings, defaultTone: e.target.value as ToneType })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Primary Target Market Description
            </label>
            <input
              type="text"
              value={settings.targetMarket}
              onChange={(e) => setSettings({ ...settings, targetMarket: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* AI & Backend Integration Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                AI Provider &amp; API Connectivity
              </h2>
            </div>
            <Badge variant="purple">Architecture</Badge>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200">Current AI Engine Mode:</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.aiProviderConfigured
                    ? 'Configured with live OpenAI / Gemini keys in environment'
                    : 'Built-in HustleKit Heuristics & Copywriting Engine (Demo Mode)'}
                </p>
              </div>
              <Badge variant={settings.aiProviderConfigured ? 'success' : 'demo'}>
                {settings.aiProviderConfigured ? 'Live AI Provider' : 'Demo Template Mode'}
              </Badge>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono">
              <div>API_BASE_URL: {api.getBaseUrl()}</div>
              <div>ENVIRONMENT: {health?.environment || 'development'}</div>
              <div>ENGINE_STATUS: {health?.aiEngineStatus || 'demo_template_engine'}</div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestHealth}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test API Health Endpoint</span>
              </button>
            </div>

            {testResult && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30 text-xs text-indigo-200">
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Demo Data Management Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Demo Data &amp; Sandbox Controls
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Realistic Demo Mode Active
              </span>
              <p className="text-xs text-slate-300">
                To evaluate the app without live storefront credentials, preloaded demo inventory and sales history are active.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetDemoData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shrink-0"
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
