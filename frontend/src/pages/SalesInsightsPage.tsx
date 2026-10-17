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
      <div className="rounded-2xl p-5 bg-[#FBF9F5] border border-[#E5E0D8] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#0A0A0A] font-sans">Sales Telemetry &amp; Analytics</span>
              {isRealData ? (
                <Badge variant="success">
                  Real Imported Sales ({insights?.importedRecordsCount} transactions)
                </Badge>
              ) : (
                <Badge variant="demo">Demo Simulation Dataset</Badge>
              )}
            </div>
            <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
              {isRealData
                ? 'Metrics, channels, and product rankings are calculated from actual imported order records.'
                : 'Showing simulated store sales. Upload a CSV of your actual sales to analyze real telemetry.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="px-3.5 py-1.5 rounded-xl bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] text-xs font-semibold flex items-center gap-1.5 border border-[#E5E0D8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
            title="Download formatted sample CSV template"
          >
            <Download className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>Sample CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-1.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold flex items-center gap-1.5 border border-[#171717] shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
          >
            <Upload className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>Import Sales CSV</span>
          </button>

          {isRealData && (
            <button
              type="button"
              onClick={handleClearRecords}
              disabled={clearing}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-1"
              title="Reset data back to demo simulation"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-700" />
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
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E5E0D8] gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                  Sales &amp; Revenue Trajectory
                </h2>
                <Badge variant={isRealData ? 'success' : 'neutral'}>
                  {isRealData ? 'Imported Trend' : '14-Day View'}
                </Badge>
              </div>
              <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
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
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-[#57534E] font-sans">
                Predictive Forecast
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F1EA] text-[#0A0A0A] border border-[#E5E0D8]">
                Confidence: {forecast.confidenceScore}%
              </span>
            </div>

            <div className="mt-4">
              <div className="text-xs text-[#57534E]">Next Month Est. Revenue</div>
              <div className="text-3xl font-extrabold text-[#0A0A0A] mt-1 font-sans">
                ${forecast.nextMonthEstimatedRevenue.toLocaleString()}
              </div>
              {forecast.estimatedGrowthRate > 0 && (
                <div className="inline-flex items-center gap-1 text-xs text-emerald-800 font-semibold mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+{forecast.estimatedGrowthRate}% vs current run rate</span>
                </div>
              )}
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Pacing Rationale</span>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                {forecast.insightsSummary}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E0D8] text-[11px] text-[#78716C] flex items-center justify-between">
            <span>Forecast Model:</span>
            <span className="text-[#0A0A0A] font-mono font-medium">
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
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#0A0A0A]" />
                <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">
                  Imported Product Performance
                </h3>
              </div>
              <p className="text-xs text-[#57534E] mt-0.5">
                Calculated rankings from actual customer orders
              </p>
            </div>
            <Badge variant="success">{topProducts.length} Products Tracked</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#78716C] uppercase tracking-wider text-[11px] border-b border-[#E5E0D8]">
                  <th className="pb-3 font-bold">Product Name</th>
                  <th className="pb-3 font-bold">Units Sold</th>
                  <th className="pb-3 font-bold">Gross Revenue</th>
                  <th className="pb-3 font-bold">Avg. Unit Price</th>
                  <th className="pb-3 font-bold text-right">Quick AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]/70">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="py-3 font-bold text-[#0A0A0A]">{p.productName}</td>
                    <td className="py-3 text-[#57534E] font-mono">{p.unitsSold} units</td>
                    <td className="py-3 text-[#0A0A0A] font-bold font-mono">
                      ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-[#57534E] font-mono">${p.averageUnitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProductForStudio({
                            title: p.productName,
                            price: p.averageUnitPrice,
                          });
                          onNavigate('studio');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] border border-[#E5E0D8] text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
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
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
                <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                  AI-Recommended Actions
                </h2>
              </div>
              <p className="text-xs text-[#57534E] mt-0.5">
                Tasks prioritized by projected revenue recovery and conversion lift
              </p>
            </div>
            <span className="text-xs text-[#78716C] font-mono">
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
                      ? 'bg-[#FBF9F5] border-[#E5E0D8] opacity-60'
                      : 'bg-[#FFFFFF] border-[#E5E0D8] hover:border-[#171717]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityVariant}>
                          {action.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <span className="text-[11px] font-bold uppercase text-[#57534E] px-2 py-0.5 rounded bg-[#F5F1EA] border border-[#E5E0D8]">
                          {action.category}
                        </span>
                        <span className="text-xs font-bold text-[#0A0A0A]">
                          {action.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] leading-relaxed pt-1">
                        {action.description}
                      </p>
                      <div className="text-[11px] font-semibold text-[#0A0A0A] flex items-center gap-1.5 pt-0.5">
                        <Sparkles className="w-3 h-3 text-[#0A0A0A]" />
                        <span>Impact: {action.expectedImpact}</span>
                      </div>
                    </div>

                    <div className="sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleActionClick(action)}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 ${
                          isCompleted
                            ? 'bg-[#F5F1EA] text-[#57534E] hover:bg-[#EAE4D9] border-[#E5E0D8]'
                            : 'bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] border-[#171717] shadow-sm active:scale-95'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Mark Incomplete</span>
                          </>
                        ) : (
                          <>
                            <span>{action.suggestedActionLabel}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#0A0A0A]" />
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
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#0A0A0A]" />
                <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">
                  Sales Channels
                </h3>
              </div>
              <span className="text-[10px] text-[#78716C] uppercase tracking-wider font-bold">
                Distribution
              </span>
            </div>

            <div className="space-y-4">
              {channels.map((ch, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0A0A0A]">{ch.channel}</span>
                    <span className="font-bold text-[#0A0A0A] font-mono">
                      ${ch.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-[#0A0A0A]'
                          : idx === 1
                          ? 'bg-[#57534E]'
                          : idx === 2
                          ? 'bg-[#78716C]'
                          : 'bg-[#A8A29E]'
                      }`}
                      style={{ width: `${ch.sharePercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#57534E]">
                    <span>{ch.sharePercentage}% total sales</span>
                    {ch.growth !== undefined && (
                      <span
                        className={`font-semibold ${
                          ch.growth >= 0 ? 'text-emerald-800' : 'text-rose-800'
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

          <div className="mt-6 pt-4 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] text-xs font-bold border border-[#E5E0D8] flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
              <span>Optimize Channel Marketing Copy</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Upload & Validation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#0A0A0A]" />
                <h3 className="text-base font-bold text-[#0A0A0A] font-sans">
                  Import Real Sales CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[#78716C] hover:text-[#0A0A0A] text-lg font-bold p-1 rounded-lg hover:bg-[#F5F1EA] transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Schema description card */}
              <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-1.5 text-xs text-[#57534E]">
                <span className="font-bold text-[#0A0A0A]">Supported CSV Schema:</span>
                <p className="leading-relaxed">
                  Your CSV must include: <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">product_name</code>, <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">date</code> (YYYY-MM-DD), <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">quantity</code>, and <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">unit_price</code>. Optional: <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">order_id</code>, <code className="text-[#0A0A0A] bg-[#F5F1EA] px-1 py-0.5 rounded border border-[#E5E0D8] font-mono">channel</code>.
                </p>
              </div>

              {/* Upload picker */}
              <div className="border-2 border-dashed border-[#E5E0D8] bg-[#FBF9F5] rounded-2xl p-6 text-center hover:border-[#0A0A0A] transition-colors">
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
                  <Upload className="w-8 h-8 text-[#0A0A0A]" />
                  <span className="text-sm font-bold text-[#0A0A0A]">
                    {selectedFileName ? selectedFileName : 'Choose a CSV file or drag and drop'}
                  </span>
                  <span className="text-xs text-[#78716C]">Max size 5MB</span>
                </label>
              </div>

              {/* Validation Status Preview */}
              {validating ? (
                <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] flex items-center justify-center gap-2 text-xs text-[#57534E]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                  <span>Validating CSV structure and row data...</span>
                </div>
              ) : validationResult ? (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                      <div className="text-[#78716C] text-[10px] font-bold uppercase">Valid Orders</div>
                      <div className="text-base font-bold text-emerald-800">
                        {validationResult.validRows.length} / {validationResult.totalRows}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                      <div className="text-[#78716C] text-[10px] font-bold uppercase">Estimated Revenue</div>
                      <div className="text-base font-bold text-[#0A0A0A] font-mono">
                        ${validationResult.previewSummary.estimatedTotalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                      <div className="text-[#78716C] text-[10px] font-bold uppercase">Unique SKUs</div>
                      <div className="text-base font-bold text-[#0A0A0A]">
                        {validationResult.previewSummary.productsCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                      <div className="text-[#78716C] text-[10px] font-bold uppercase">Date Span</div>
                      <div className="text-[11px] font-bold text-[#0A0A0A] truncate mt-1">
                        {validationResult.previewSummary.dateRange.start || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Errors preview if any */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1 max-h-32 overflow-y-auto">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                        <span>{validationResult.errors.length} rows contain validation errors (will be skipped):</span>
                      </div>
                      {validationResult.errors.slice(0, 5).map((e, idx) => (
                        <div key={idx} className="text-[11px]">
                          • Row {e.row}: {e.error}
                        </div>
                      ))}
                      {validationResult.errors.length > 5 && (
                        <div className="text-[10px] text-rose-800">
                          ...and {validationResult.errors.length - 5} more issues.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-xs text-[#0A0A0A] hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Format</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !validationResult || validationResult.validRows.length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] disabled:opacity-40 text-[#0A0A0A] border border-[#171717] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A0A0A]" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0A0A0A]" />
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
