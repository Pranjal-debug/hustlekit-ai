import React, { useState, useEffect, useRef } from 'react';
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
  onNavigate: _onNavigate,
  onSelectProductForStudio: _onSelectProductForStudio,
  onShowToast,
}) => {
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AdvisorReport[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // Close history dropdown on outside click or Escape key
  useEffect(() => {
    if (!showHistoryDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHistoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHistoryDropdown]);

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
      clearAllTimers();
    };
  }, [workspaceId]);

  const handleGeneratePlan = async () => {
    clearAllTimers();
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

    timersRef.current = [stepTimer1, stepTimer2, stepTimer3];

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
      clearAllTimers();
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
        return 'bg-[#F5F1EA] text-[#0A0A0A] border-[#E5E0D8]';
      case 'pricing':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'inventory':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'product':
        return 'bg-[#F5F1EA] text-[#171717] border-[#E5E0D8]';
      case 'operations':
      default:
        return 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8]';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase bg-rose-50 text-rose-900 border border-rose-300 font-sans">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-50 text-amber-900 border border-amber-300 font-sans">
            Medium Priority
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase bg-[#F5F1EA] text-[#57534E] border border-[#E5E0D8] font-sans">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm relative">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-[#E5E0D8] gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#0A0A0A] font-sans">
                  Mastra Sales Growth Advisor
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#F5F1EA] text-[#0A0A0A] border border-[#E5E0D8] flex items-center gap-1 font-sans">
                  <Zap className="w-3 h-3 text-[#0A0A0A] fill-[#0A0A0A]" />
                  Mastra Workflow
                </span>
              </div>
              <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
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
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
              title={
                report.dataSource === 'imported_sales'
                  ? 'Grounding model recommendations in verified transaction records from MongoDB Atlas'
                  : 'Workspace has no sales imported yet. Showing baseline operational guidance.'
              }
            >
              {report.dataSource === 'imported_sales' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Real Sales Data ({report.metricsSnapshot.totalOrders} Orders)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Empty Store Data — Import CSV for Tailored Plan</span>
                </>
              )}
            </div>
          ) : (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                isRealData
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {isRealData ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified Sales Ready</span>
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>Demo Baseline</span>
                </>
              )}
            </div>
          )}

          {/* History selector */}
          {history.length > 1 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] text-xs font-semibold border border-[#E5E0D8] flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
                title="Review previous reports"
                aria-expanded={showHistoryDropdown}
              >
                <History className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>History ({history.length})</span>
                <ChevronDown className="w-3 h-3 text-[#57534E]" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#FFFFFF] border border-[#E5E0D8] shadow-xl p-2 z-50 divide-y divide-[#E5E0D8]">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
                    Past Mastra Reports
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleSelectHistoricalReport(h)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] ${
                          report?.id === h.id ? 'bg-[#F5F1EA] text-[#0A0A0A] font-bold' : 'hover:bg-[#FBF9F5] text-[#57534E]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#0A0A0A] truncate">{new Date(h.createdAt).toLocaleString()}</div>
                          <div className="text-[10px] text-[#78716C]">
                            {h.dataSource === 'imported_sales' ? `$${h.metricsSnapshot.totalRevenue.toFixed(2)} sales` : 'Empty state'}
                          </div>
                        </div>
                        {report?.id === h.id && <span className="text-[10px] text-[#0A0A0A] font-bold bg-[#E5E0D8] px-1.5 py-0.5 rounded">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold flex items-center gap-2 border border-[#171717] shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>Orchestrating Workflow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>{report ? 'Re-run Growth Advisor' : 'Generate Growth Plan'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="my-6 p-8 text-center rounded-2xl border border-dashed border-[#E5E0D8] bg-[#FBF9F5] space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="w-12 h-12 rounded-full border-2 border-[#E5E0D8] border-t-[#0A0A0A] animate-spin" />
            <Bot className="w-5 h-5 text-[#0A0A0A] absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">Mastra Sales Growth Advisor Running</h3>
            <p className="text-xs text-[#57534E] font-medium font-mono">{loadingStep}</p>
          </div>
          <div className="max-w-md mx-auto w-full bg-[#E5E0D8] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#0A0A0A] h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error Alert State */}
      {!loading && error && (
        <div className="my-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-rose-950 font-sans">Workflow Execution Stopped</h4>
            <p className="text-xs text-rose-900 leading-relaxed">{error}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGeneratePlan}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-bold rounded-lg border border-rose-300 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-800"
              >
                Retry Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State / Initial Prompt */}
      {!loading && !error && !report && (
        <div className="my-6 p-8 text-center rounded-2xl border border-dashed border-[#E5E0D8] bg-[#FBF9F5] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A]">
            <TrendingUp className="w-6 h-6 text-[#0A0A0A]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">No Growth Plan Generated Yet</h3>
            <p className="text-xs text-[#57534E] max-w-lg mx-auto leading-relaxed">
              Run the Mastra Sales Growth Advisor to analyze your current revenue metrics, identify product velocity bottlenecks, and get concrete action steps.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGeneratePlan}
            className="px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold inline-flex items-center gap-1.5 transition-all border border-[#171717] shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>Generate First Growth Plan</span>
          </button>
        </div>
      )}

      {/* Active Advisor Report Display */}
      {!loading && !error && report && (
        <div className="mt-5 space-y-6">
          {/* Metadata & Scope Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] text-xs text-[#57534E] gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Generated: <strong className="text-[#0A0A0A] font-medium">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
              </span>
              {report.analysisPeriod.startDate && (
                <span className="flex items-center gap-1 text-[#57534E]">
                  <span className="text-[#78716C]">Period:</span>{' '}
                  <span className="font-semibold text-[#0A0A0A]">
                    {report.analysisPeriod.startDate} to {report.analysisPeriod.endDate} ({report.analysisPeriod.totalDaysObserved} days)
                  </span>
                </span>
              )}
              <span className="text-[#78716C]">
                Model: <span className="font-mono text-[#0A0A0A] font-semibold bg-[#F5F1EA] px-1.5 py-0.5 rounded border border-[#E5E0D8]">{report.modelUsed}</span>
              </span>
            </div>

            {report.workflowRunId && (
              <span className="text-[11px] font-mono text-[#78716C]">
                Run ID: <span className="text-[#0A0A0A] font-medium">{report.workflowRunId.slice(0, 8)}</span>
              </span>
            )}
          </div>

          {/* Missing Data Caveats Banner if applicable */}
          {report.missingDataNotes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 font-sans">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Data Boundary &amp; Observation Disclosures</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900 text-[11px] pl-1 leading-relaxed">
                {report.missingDataNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-page-enter">
            {report.recommendations.map((rec, index) => (
              <div
                key={rec.id || index}
                className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D8] hover:border-[#171717] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category and Priority Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border tracking-wider font-sans ${getCategoryColor(
                        rec.category
                      )}`}
                    >
                      {rec.category}
                    </span>
                    {getPriorityBadge(rec.priority)}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">
                    {rec.title}
                  </h3>

                  {/* Verified Supporting Evidence Box */}
                  <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider flex items-center gap-1 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verified Evidence Metric</span>
                    </div>
                    <p className="text-[#0A0A0A] font-semibold text-[11px] leading-relaxed">{rec.evidence}</p>
                  </div>

                  {/* Business Reasoning */}
                  <div className="text-xs text-[#57534E] leading-relaxed">{rec.reasoning}</div>

                  {/* Action Steps Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider font-sans">
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
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 ${
                              isDone
                                ? 'bg-[#FBF9F5] text-[#78716C] line-through border border-[#E5E0D8]'
                                : 'bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] border border-[#E5E0D8] font-medium'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-[#78716C] shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug text-[11px]">{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Limitations footer */}
                <div className="pt-2 border-t border-[#E5E0D8] flex items-start gap-1.5 text-[10px] text-[#78716C]">
                  <Info className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="text-[#57534E]">Uncertainty &amp; Boundary:</strong> {rec.limitations}
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
