import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  DollarSign,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Lightbulb,
  CheckCircle2,
  Share2,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Check,
  RefreshCw,
  Trash2,
  Box,
  PackageCheck,
} from 'lucide-react';
import type { SalesInsightsData, NavPage, ProductItem } from '../types';
import { StatCard } from '../components/StatCard';
import { SalesChart } from '../components/SalesChart';
import { Badge } from '../components/Badge';
import { MastraGrowthAdvisor } from '../components/MastraGrowthAdvisor';
import { api, CsvValidationResponse } from '../services/api';

interface SalesInsightsPageProps {
  insights: SalesInsightsData | null;
  loading: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectProductForStudio: (product: Partial<ProductItem>) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshInsights: () => void;
}

export const SalesInsightsPage: React.FC<SalesInsightsPageProps> = ({
  insights,
  loading: _loading,
  onNavigate,
  onSelectProductForStudio,
  onShowToast,
  onRefreshInsights,
}) => {
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);

  // CSV Import State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<CsvValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleActionClick = (action: { id: string; category: string; title: string; suggestedActionLabel: string }) => {
    if (action.suggestedActionLabel.includes('Studio')) {
      if (action.title.includes('AuraFocus')) {
        onSelectProductForStudio({
          id: 'prod_2',
          title: 'AuraFocus Ambient Desk Lamp',
          category: 'Home & Office',
          price: 69.99,
        });
      } else if (action.title.includes('Desk Mat')) {
        onSelectProductForStudio({
          id: 'prod_1',
          title: 'Minimalist Desk Mat Pro (Leatherette)',
          category: 'Workspace & Ergonomics',
          price: 38.00,
        });
      } else {
        // Use title extract if available
        const match = action.title.match(/"([^"]+)"/);
        onSelectProductForStudio({
          title: match ? match[1] : action.title,
          category: 'General E-commerce',
          price: 29.99,
        });
      }
      onNavigate('studio');
      onShowToast(`Transferred context to Product Studio for ${action.title}`, 'info');
    } else {
      setCompletedActionIds((prev) =>
        prev.includes(action.id) ? prev.filter((i) => i !== action.id) : [...prev, action.id]
      );
      onShowToast(`Updated status for: ${action.title}`, 'success');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const csv = await api.getSampleCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hustlekit_sales_sample.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Downloaded hustlekit_sales_sample.csv', 'success');
    } catch (err: any) {
      onShowToast('Failed to download sample CSV', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      onShowToast('Please select a valid .csv file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size exceeds the 5MB limit', 'error');
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = String(evt.target?.result || '');
      setCsvRawText(text);
      await triggerValidation(text);
    };
    reader.readAsText(file);
  };

  const triggerValidation = async (text: string) => {
    if (!text.trim()) return;
    setValidating(true);
    try {
      const res = await api.validateSalesCsv(text);
      setValidationResult(res);
      onShowToast(`Validated ${res.validRows.length} rows (${res.errors.length} issues)`, 'info');
    } catch (err: any) {
      setValidationResult(null);
      onShowToast(err.message || 'Validation failed', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!csvRawText.trim() || !validationResult || validationResult.validRows.length === 0) {
      onShowToast('No valid rows available to import', 'error');
      return;
    }

    setImporting(true);
    try {
      const res = await api.importSalesCsv(csvRawText);
      onShowToast(res.message, 'success');
      setShowUploadModal(false);
      setCsvRawText('');
      setSelectedFileName(null);
      setValidationResult(null);
      onRefreshInsights();
    } catch (err: any) {
      onShowToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleClearRecords = async () => {
    if (!window.confirm('Reset all imported sales records back to demo simulation mode?')) return;
    setClearing(true);
    try {
      const res = await api.clearSalesRecords();
      onShowToast(res.message, 'success');
      onRefreshInsights();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to clear records', 'error');
    } finally {
      setClearing(false);
    }
  };

  const isRealData = insights?.dataSource === 'imported_sales';

  const summary = insights?.summary || {
    totalRevenue: 19668.14,
    revenueChangePercentage: 23.4,
    totalOrders: 508,
    ordersChangePercentage: 14.8,
    averageOrderValue: 38.71,
    aovChangePercentage: 7.5,
    conversionRate: 3.42,
    conversionChangePercentage: -0.6,
  };

  const forecast = insights?.forecast || {
    nextMonthEstimatedRevenue: 26400,
    estimatedGrowthRate: 28.5,
    confidenceScore: 87,
    insightsSummary:
      'Based on seasonal pickup and conversion momentum, monthly revenue is trending towards $26.4k.',
    hasEnoughData: true,
  };

  const channels = insights?.channels || [];
  const recommendedActions = insights?.recommendedActions || [];
  const topProducts = insights?.topProducts || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Notice & Actions Bar */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-900 border border-indigo-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">Sales Telemetry &amp; Analytics</span>
              {isRealData ? (
                <Badge variant="success">
                  Real Imported Sales ({insights?.importedRecordsCount} transactions)
                </Badge>
              ) : (
                <Badge variant="demo">Demo Simulation Dataset</Badge>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isRealData
                ? 'Metrics, channels, and product rankings are calculated from actual imported order records.'
                : 'Showing simulated store sales. Upload a CSV of your actual sales to analyze real telemetry.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Download formatted sample CSV template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-shimmer px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E0B0] to-[#00C9F2] hover:opacity-95 text-[#03111F] text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00E0B0]/20 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Sales CSV</span>
          </button>

          {isRealData && (
            <button
              onClick={handleClearRecords}
              disabled={clearing}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-all"
              title="Reset data back to demo simulation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset to Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={`$${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={isRealData ? undefined : summary.revenueChangePercentage}
          icon={DollarSign}
          subtext={isRealData ? 'Actual imported gross' : undefined}
          isDemo={!isRealData}
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders}
          change={isRealData ? undefined : summary.ordersChangePercentage}
          icon={ShoppingBag}
          subtext={summary.unitsSold ? `${summary.unitsSold} units sold` : undefined}
          isDemo={!isRealData}
        />
        <StatCard
          title="Average Order Value"
          value={`$${summary.averageOrderValue.toFixed(2)}`}
          change={isRealData ? undefined : summary.aovChangePercentage}
          icon={TrendingUp}
          subtext={isRealData ? 'Computed per transaction' : undefined}
          isDemo={!isRealData}
        />
        {isRealData ? (
          <StatCard
            title="Units Sold"
            value={summary.unitsSold || 0}
            change={undefined}
            icon={PackageCheck}
            subtext="Total items fulfilled across orders"
            isDemo={false}
          />
        ) : (
          <StatCard
            title="Store Conversion Rate"
            value={`${summary.conversionRate}%`}
            change={summary.conversionChangePercentage}
            icon={Percent}
            isDemo={true}
          />
        )}
      </div>

      {/* Chart Area & Sales Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Sales &amp; Revenue Trajectory
                </h2>
                <Badge variant={isRealData ? 'success' : 'purple'}>
                  {isRealData ? 'Imported Trend' : '14-Day View'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRealData
                  ? 'Daily aggregated totals from imported transaction records'
                  : 'Solid line represents confirmed sales; dashed sky line indicates forecast trajectory'}
              </p>
            </div>
          </div>

          <SalesChart
            data={insights?.chartData || []}
            showProjection={true}
            height={280}
          />
        </div>

        {/* AI Forecast Card */}
        <div className="glass-card rounded-2xl p-6 border border-sky-500/30 bg-gradient-to-br from-slate-900 via-sky-950/20 to-purple-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-400">
                Predictive Forecast
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Confidence: {forecast.confidenceScore}%
              </span>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-400">Next Month Est. Revenue</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                ${forecast.nextMonthEstimatedRevenue.toLocaleString()}
              </div>
              {forecast.estimatedGrowthRate > 0 && (
                <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{forecast.estimatedGrowthRate}% vs current run rate</span>
                </div>
              )}
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Pacing Rationale</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {forecast.insightsSummary}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Forecast Model:</span>
            <span className="text-slate-300 font-mono">
              {isRealData ? 'Rolling Linear Baseline' : 'HustleKit Linear-EWMA v1'}
            </span>
          </div>
        </div>
      </div>

      {/* Mastra Sales Growth Advisor */}
      <MastraGrowthAdvisor
        workspaceId="default"
        isRealData={isRealData}
        onNavigate={onNavigate}
        onSelectProductForStudio={onSelectProductForStudio}
        onShowToast={onShowToast}
      />

      {/* Top Products Performance Table (When Real Data is Available) */}
      {topProducts.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Imported Product Performance
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated rankings from actual customer orders
              </p>
            </div>
            <Badge variant="success">{topProducts.length} Products Tracked</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800/80">
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Units Sold</th>
                  <th className="pb-3 font-semibold">Gross Revenue</th>
                  <th className="pb-3 font-semibold">Avg. Unit Price</th>
                  <th className="pb-3 font-semibold text-right">Quick AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">{p.productName}</td>
                    <td className="py-3 text-slate-300 font-mono">{p.unitsSold} units</td>
                    <td className="py-3 text-emerald-400 font-semibold font-mono">
                      ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-slate-300 font-mono">${p.averageUnitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          onSelectProductForStudio({
                            title: p.productName,
                            price: p.averageUnitPrice,
                          });
                          onNavigate('studio');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Create Copy</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommended Actions Area & Channels Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Actions (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  AI-Recommended Actions
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks prioritized by projected revenue recovery and conversion lift
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {completedActionIds.length}/{recommendedActions.length} completed
            </span>
          </div>

          <div className="space-y-3">
            {recommendedActions.map((action) => {
              const isCompleted = completedActionIds.includes(action.id);
              const priorityVariant =
                action.priority === 'high' ? 'danger' : action.priority === 'medium' ? 'warning' : 'neutral';

              return (
                <div
                  key={action.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityVariant}>
                          {action.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <span className="text-[11px] font-medium uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                          {action.category}
                        </span>
                        <span className="text-xs font-bold text-slate-100">
                          {action.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {action.description}
                      </p>
                      <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 pt-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Impact: {action.expectedImpact}</span>
                      </div>
                    </div>

                    <div className="sm:self-center shrink-0">
                      <button
                        onClick={() => handleActionClick(action)}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/30 active:scale-95'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Incomplete</span>
                          </>
                        ) : (
                          <>
                            <span>{action.suggestedActionLabel}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Breakdown (1 col) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Sales Channels
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Distribution
              </span>
            </div>

            <div className="space-y-4">
              {channels.map((ch, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{ch.channel}</span>
                    <span className="font-semibold text-slate-100 font-mono">
                      ${ch.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-purple-500'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${ch.sharePercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{ch.sharePercentage}% total sales</span>
                    {ch.growth !== undefined && (
                      <span
                        className={`font-medium ${
                          ch.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {ch.growth >= 0 ? `+${ch.growth}%` : `${ch.growth}%`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('studio')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Optimize Channel Marketing Copy</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Upload & Validation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Import Real Sales CSV
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Schema description card */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <span className="font-bold text-purple-300">Supported CSV Schema:</span>
                <p className="leading-relaxed">
                  Your CSV must include: <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">product_name</code>, <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">date</code> (YYYY-MM-DD), <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">quantity</code>, and <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">unit_price</code>. Optional: <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">order_id</code>, <code className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded font-mono">channel</code>.
                </p>
              </div>

              {/* Upload picker */}
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-colors">
                <input
                  type="file"
                  id="csvFileInput"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csvFileInput"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-purple-400" />
                  <span className="text-sm font-semibold text-slate-200">
                    {selectedFileName ? selectedFileName : 'Choose a CSV file or drag and drop'}
                  </span>
                  <span className="text-xs text-slate-400">Max size 5MB</span>
                </label>
              </div>

              {/* Validation Status Preview */}
              {validating ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Validating CSV structure and row data...</span>
                </div>
              ) : validationResult ? (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Valid Orders</div>
                      <div className="text-base font-bold text-emerald-400">
                        {validationResult.validRows.length} / {validationResult.totalRows}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Estimated Revenue</div>
                      <div className="text-base font-bold text-white font-mono">
                        ${validationResult.previewSummary.estimatedTotalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Unique SKUs</div>
                      <div className="text-base font-bold text-purple-300">
                        {validationResult.previewSummary.productsCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Date Span</div>
                      <div className="text-[11px] font-semibold text-slate-200 truncate mt-1">
                        {validationResult.previewSummary.dateRange.start || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Errors preview if any */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1 max-h-32 overflow-y-auto">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{validationResult.errors.length} rows contain validation errors (will be skipped):</span>
                      </div>
                      {validationResult.errors.slice(0, 5).map((e, idx) => (
                        <div key={idx} className="text-[11px]">
                          • Row {e.row}: {e.error}
                        </div>
                      ))}
                      {validationResult.errors.length > 5 && (
                        <div className="text-[10px] text-rose-400">
                          ...and {validationResult.errors.length - 5} more issues.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Format</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !validationResult || validationResult.validRows.length === 0}
                  onClick={handleConfirmImport}
                  className="btn-shimmer px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E0B0] to-[#00C9F2] hover:opacity-95 disabled:opacity-50 text-[#03111F] text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00E0B0]/20 transition-all"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Import {validationResult ? `${validationResult.validRows.length} Orders` : 'CSV'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
