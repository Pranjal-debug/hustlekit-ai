import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  TrendingUp,
  CheckSquare,
  Square,
  AlertTriangle,
  Zap,
  Info,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import type { AdvisorReport, AdvisorRecommendation, NavPage, ProductItem } from '../types';
import { api } from '../services/api';

interface MastraGrowthAdvisorProps {
  workspaceId?: string;
  isRealData: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectProductForStudio: (product: Partial<ProductItem>) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const MastraGrowthAdvisor: React.FC<MastraGrowthAdvisorProps> = ({
  workspaceId = 'default',
  isRealData,
  onNavigate,
  onSelectProductForStudio,
  onShowToast,
}) => {
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AdvisorReport[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Load the latest report on mount
  useEffect(() => {
    let isMounted = true;

    const loadLatestAndHistory = async () => {
      try {
        const latest = await api.getLatestAdvisorReport(workspaceId);
        if (isMounted && latest) {
          setReport(latest);
        }
        const hist = await api.getAdvisorHistory(workspaceId);
        if (isMounted && hist?.data) {
          setHistory(hist.data);
        }
      } catch (err) {
        // Silently tolerate if no report exists yet
      }
    };

    loadLatestAndHistory();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep('Initializing Mastra Sales Growth Advisor workflow...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Step A & B: Querying MongoDB Atlas and building evidence...');
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Step C: Mastra orchestrating Gemma 3 12B reasoning...');
    }, 3200);

    const stepTimer3 = setTimeout(() => {
      setLoadingStep('Step D: Validating structured outputs against Zod schema...');
    }, 8000);

    try {
      const newReport = await api.generateGrowthPlan(workspaceId);
      setReport(newReport);
      onShowToast('Mastra generated fresh growth recommendations', 'success');

      // Refresh history list
      api.getAdvisorHistory(workspaceId).then((res) => {
        if (res?.data) setHistory(res.data);
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate growth recommendations.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
      setLoadingStep('');
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectHistoricalReport = (selected: AdvisorReport) => {
    setReport(selected);
    setShowHistoryDropdown(false);
    onShowToast(`Loaded advisor report from ${new Date(selected.createdAt).toLocaleDateString()}`, 'info');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'marketing':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'pricing':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'inventory':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'product':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'operations':
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Medium Priority
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-slate-800 text-slate-300 border border-slate-700">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-800 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Mastra Sales Growth Advisor
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
                  Mastra Workflow
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-step deterministic evidence gathering, AI reasoning (Gemma 3 12B), and schema validation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Data Source Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Data Source Badge */}
          {report ? (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                report.dataSource === 'imported_sales'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
              title={
                report.dataSource === 'imported_sales'
                  ? 'Grounding model recommendations in verified transaction records from MongoDB Atlas'
                  : 'Workspace has no sales imported yet. Showing baseline operational guidance.'
              }
            >
              {report.dataSource === 'imported_sales' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real Sales Data ({report.metricsSnapshot.totalOrders} Orders)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Empty Store Data — Import CSV for Tailored Plan</span>
                </>
              )}
            </div>
          ) : (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                isRealData
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {isRealData ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Sales Ready</span>
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Baseline</span>
                </>
              )}
            </div>
          )}

          {/* History selector */}
          {history.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Review previous reports"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({history.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 divide-y divide-slate-800">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Past Mastra Reports
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => handleSelectHistoricalReport(h)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          report?.id === h.id ? 'bg-purple-900/30 text-purple-200' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold truncate">{new Date(h.createdAt).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {h.dataSource === 'imported_sales' ? `$${h.metricsSnapshot.totalRevenue.toFixed(2)} sales` : 'Empty state'}
                          </div>
                        </div>
                        {report?.id === h.id && <span className="text-[10px] text-purple-400 font-bold">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                <span>Orchestrating Workflow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{report ? 'Re-run Growth Advisor' : 'Generate Growth Plan'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="py-10 text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 animate-pulse">
            <Bot className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Mastra Sales Growth Advisor Running</h3>
            <p className="text-xs text-purple-300 font-medium font-mono">{loadingStep}</p>
          </div>
          <div className="max-w-md mx-auto w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error Alert State */}
      {!loading && error && (
        <div className="my-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-rose-300">Workflow Execution Stopped</h4>
            <p className="text-xs text-rose-200/90 leading-relaxed">{error}</p>
            <div className="pt-2">
              <button
                onClick={handleGeneratePlan}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
              >
                Retry Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State / Initial Prompt */}
      {!loading && !error && !report && (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Growth Plan Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Run the Mastra Sales Growth Advisor to analyze your current revenue metrics, identify product velocity bottlenecks, and get concrete action steps.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate First Growth Plan</span>
          </button>
        </div>
      )}

      {/* Active Advisor Report Display */}
      {!loading && !error && report && (
        <div className="mt-5 space-y-6">
          {/* Metadata & Scope Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Generated: {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              {report.analysisPeriod.startDate && (
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="text-slate-400">Period:</span>{' '}
                  <span className="font-semibold text-slate-200">
                    {report.analysisPeriod.startDate} to {report.analysisPeriod.endDate} ({report.analysisPeriod.totalDaysObserved} days)
                  </span>
                </span>
              )}
              <span className="text-slate-400">
                Model: <span className="font-mono text-purple-300">{report.modelUsed}</span>
              </span>
            </div>

            {report.workflowRunId && (
              <span className="text-[11px] font-mono text-slate-400">
                Run ID: <span className="text-slate-300">{report.workflowRunId.slice(0, 8)}</span>
              </span>
            )}
          </div>

          {/* Missing Data Caveats Banner if applicable */}
          {report.missingDataNotes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Data Boundary &amp; Observation Disclosures</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] pl-1">
                {report.missingDataNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.recommendations.map((rec, index) => (
              <div
                key={rec.id || index}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category and Priority Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border tracking-wider ${getCategoryColor(
                        rec.category
                      )}`}
                    >
                      {rec.category}
                    </span>
                    {getPriorityBadge(rec.priority)}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors font-['Plus_Jakarta_Sans',sans-serif]">
                    {rec.title}
                  </h3>

                  {/* Verified Supporting Evidence Box */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Evidence Metric</span>
                    </div>
                    <p className="text-slate-200 font-medium text-[11px] leading-relaxed">{rec.evidence}</p>
                  </div>

                  {/* Business Reasoning */}
                  <div className="text-xs text-slate-300 leading-relaxed">{rec.reasoning}</div>

                  {/* Action Steps Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">
                      Action Checklist
                    </div>
                    <div className="space-y-1.5">
                      {rec.actionSteps.map((step, sIdx) => {
                        const stepId = `${rec.id}_step_${sIdx}`;
                        const isDone = completedTaskIds.includes(stepId);

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => toggleTaskCompletion(stepId)}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2.5 transition-all ${
                              isDone
                                ? 'bg-emerald-950/20 text-slate-400 line-through border border-emerald-900/30'
                                : 'bg-slate-800/40 hover:bg-slate-800/70 text-slate-200 border border-slate-800/60'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug text-[11px]">{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Limitations footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-start gap-1.5 text-[10px] text-slate-400">
                  <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="text-slate-300">Uncertainty &amp; Boundary:</strong> {rec.limitations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
