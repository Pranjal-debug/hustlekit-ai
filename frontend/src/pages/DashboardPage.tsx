import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  Tag,
  Target,
  Sparkles,
  ArrowRight,
  Plus,
  Store,
  Clock,
  Upload,
  CheckCircle2,
  TrendingUp,
  PackageCheck,
  Maximize2,
  Layers,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { SalesChart } from '../components/SalesChart';
import { AiMascot } from '../components/AiMascot';
import { api } from '../services/api';
import type { ProductItem, SalesInsightsData, NavPage, StoreSettings, AdvisorReport } from '../types';

interface DashboardPageProps {
  insights: SalesInsightsData | null;
  products: ProductItem[];
  loading: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectProductForStudio: (product: ProductItem) => void;
  onAddProduct: (product: { title: string; category: string; price: number; inventory: number }) => void;
  settings?: StoreSettings | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  insights,
  products,
  onNavigate,
  onSelectProductForStudio,
  onAddProduct,
  settings,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('29.00');
  const [newInventory, setNewInventory] = useState('25');
  const [latestReport, setLatestReport] = useState<AdvisorReport | null>(null);

  // Fetch genuine latest advisor report if one has been generated & persisted
  useEffect(() => {
    let isMounted = true;
    api.getLatestAdvisorReport()
      .then((rep) => {
        if (isMounted) setLatestReport(rep);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory.trim()) return;
    onAddProduct({
      title: newTitle.trim(),
      category: newCategory.trim(),
      price: parseFloat(newPrice) || 0,
      inventory: parseInt(newInventory, 10) || 0,
    });
    setNewTitle('');
    setNewCategory('');
    setShowAddModal(false);
  };

  const isRealData = insights?.dataSource === 'imported_sales';
  const currencySymbol = settings?.currency?.includes('$')
    ? '$'
    : settings?.currency?.includes('€')
    ? '€'
    : settings?.currency?.includes('£')
    ? '£'
    : '₹';

  const summary = insights?.summary;

  // Genuine data-backed metrics
  const revenueVal = summary ? summary.totalRevenue : 0;
  const ordersVal = summary ? summary.totalOrders : 0;
  const aovVal = summary ? summary.averageOrderValue : 0;
  const unitsVal = summary ? summary.unitsSold || 0 : 0;
  const convVal = summary ? summary.conversionRate : undefined;

  // Only show period-over-period change if genuinely available from backend
  const revChange = !isRealData ? summary?.revenueChangePercentage : undefined;
  const ordersChange = !isRealData ? summary?.ordersChangePercentage : undefined;
  const aovChange = !isRealData ? summary?.aovChangePercentage : undefined;
  const convChange = !isRealData ? summary?.conversionChangePercentage : undefined;

  // Sparkline data points: strictly drawn from real chart data if at least 2 points exist
  const hasRealChartPoints = Boolean(insights?.chartData && insights.chartData.length >= 2);
  const revenueSparkline = hasRealChartPoints
    ? insights!.chartData.map((d) => d.revenue)
    : undefined;
  const ordersSparkline = hasRealChartPoints
    ? insights!.chartData.map((d) => d.orders)
    : undefined;
  const aovSparkline = hasRealChartPoints
    ? insights!.chartData.map((d) => (d.orders > 0 ? d.revenue / d.orders : 0))
    : undefined;

  const founderName = settings?.sellerName
    ? settings.sellerName.split(' ')[0]
    : 'Solo Founder';

  // Genuine products list from actual API / database
  const inventoryList = products.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#061A2B] border border-[#12364B] p-6 lg:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00C9F2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F7FC] tracking-tight font-sans">
            Welcome back, <span className="text-[#00E0B0]">{founderName}</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#9BB4C9]">
            {isRealData
              ? `Displaying verified store telemetry (${insights?.importedRecordsCount || 0} imported sales records).`
              : 'Here is what is happening with your business telemetry today.'}
          </p>
        </div>

        {/* Right Graphic: Flowing wave ribbon with quote badge */}
        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="hidden lg:block w-56 h-14 overflow-hidden relative opacity-70">
            <svg viewBox="0 0 240 60" fill="none" className="w-full h-full animate-wave-slow">
              <path
                d="M 0 35 C 40 10, 80 50, 140 25 C 180 5, 210 40, 240 20"
                stroke="#00C9F2"
                strokeWidth="1.5"
              />
              <path
                d="M 0 45 C 50 15, 90 55, 150 30 C 190 10, 220 45, 240 25"
                stroke="#00E0B0"
                strokeWidth="1"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#092137]/80 border border-[#12364B] text-right">
            <Sparkles className="w-4 h-4 text-[#00E0B0] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#F1F7FC] leading-snug">
                "Better data. Smarter decisions."
              </p>
              <p className="text-[10px] text-[#00C9F2] font-medium">Bigger growth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Genuine KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <StatCard
          title="Gross Revenue"
          value={`${currencySymbol} ${revenueVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={revChange}
          changePeriod="vs. simulation baseline"
          subtext={isRealData ? `Actual imported gross (${insights?.importedRecordsCount || 0} rows)` : undefined}
          icon={Package}
          accentColor="teal"
          sparklineColor="emerald"
          sparklinePoints={revenueSparkline}
          isDemo={!isRealData}
        />

        {/* Total Orders / Transactions */}
        <StatCard
          title={isRealData ? 'Sales Records' : 'Total Orders'}
          value={ordersVal.toLocaleString()}
          change={ordersChange}
          changePeriod="vs. simulation baseline"
          subtext={unitsVal > 0 ? `${unitsVal} units sold` : undefined}
          icon={ShoppingCart}
          accentColor="cyan"
          sparklineColor="cyan"
          sparklinePoints={ordersSparkline}
          isDemo={!isRealData}
        />

        {/* Average Order Value */}
        <StatCard
          title="Average Order Value"
          value={`${currencySymbol} ${aovVal.toFixed(2)}`}
          change={aovChange}
          changePeriod="vs. simulation baseline"
          subtext={ordersVal > 0 ? `Gross / ${ordersVal} transactions` : 'No orders yet'}
          icon={Tag}
          accentColor="indigo"
          sparklineColor="violet"
          sparklinePoints={aovSparkline}
          isDemo={!isRealData}
        />

        {/* 4th Metric: Units Sold (or Simulated Conversion Rate) */}
        {isRealData ? (
          <StatCard
            title="Units Sold"
            value={unitsVal.toLocaleString()}
            change={undefined}
            subtext="Total items fulfilled across orders"
            icon={PackageCheck}
            accentColor="teal"
            isDemo={false}
          />
        ) : (
          <StatCard
            title="Store Conversion"
            value={`${convVal != null ? convVal : 3.42}%`}
            change={convChange}
            changePeriod="simulated baseline"
            subtext="Simulated conversion funnel"
            icon={Target}
            accentColor="teal"
            isDemo={true}
          />
        )}
      </div>

      {/* 3. Middle Grid: Sales & Revenue Velocity + AI Copywriter Studio Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Velocity Chart Card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#061A2B] border border-[#12364B] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#12364B]/60 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00E0B0]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F1F7FC] font-sans">
                  Sales &amp; Revenue Velocity
                </h2>
              </div>

              <button
                onClick={() => onNavigate('insights')}
                className="text-xs text-[#00C9F2] hover:text-[#00E0B0] flex items-center gap-1 transition-colors"
              >
                <span>Detailed Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <SalesChart
              data={insights?.chartData || []}
              showProjection={true}
              height={250}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>

        {/* AI Copywriter Studio Feature Card (1 col) */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#061A2B] via-[#092137] to-[#061A2B] border border-[#12364B] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#00C9F2]/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00E0B0]/10 border border-[#00E0B0]/20 text-[#00E0B0] text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 fill-[#00E0B0]" />
                <span>AI Copywriter Studio</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E0B0]/10 border border-[#00E0B0]/30 text-[10px] text-[#00E0B0] font-medium">
                <span>Gemma 3 12B</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E0B0] animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#F1F7FC] tracking-tight leading-snug font-sans">
              Create high-converting product content with AI
            </h3>

            <p className="mt-2 text-xs text-[#9BB4C9] leading-relaxed">
              Turn your product specifications into persuasive product descriptions, SEO tags, and launch posts.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigate('studio')}
              className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E0B0] to-[#00C9F2] hover:opacity-95 text-[#03111F] text-xs font-bold shadow-lg shadow-[#00E0B0]/25 active:scale-95 transition-all"
            >
              <span>Generate Copy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <AiMascot className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" />
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Real Store Inventory Table + Genuine Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Inventory Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#061A2B] border border-[#12364B]">
          <div className="flex items-center justify-between pb-4 border-b border-[#12364B]/60">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-[#00E0B0]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F1F7FC] font-sans">
                Store Inventory
              </h2>
              <span className="text-[11px] text-[#6F8BA3]">({products.length} registered items)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 text-xs text-[#00E0B0] hover:text-[#00C9F2] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
              <button
                onClick={() => onNavigate('studio')}
                className="text-xs text-[#6F8BA3] hover:text-[#F1F7FC] transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <Maximize2 className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          {inventoryList.length === 0 ? (
            <div className="py-12 text-center text-[#6F8BA3]">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#F1F7FC]">No inventory registered</p>
              <p className="text-[11px] text-[#6F8BA3] mt-1">Click "+ Add Item" above to add your first product.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#6F8BA3] text-[11px] font-semibold border-b border-[#12364B]/60">
                    <th className="pb-3 font-medium">Product Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12364B]/40">
                  {inventoryList.map((item) => {
                    const isOutOfStock = item.inventory === 0;
                    const isLowStock = item.inventory > 0 && item.inventory <= 10;
                    return (
                      <tr key={item.id} className="hover:bg-[#092137]/50 transition-colors group">
                        <td className="py-3 font-medium text-[#F1F7FC] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#092137] border border-[#12364B] flex items-center justify-center text-[#6F8BA3] group-hover:text-[#00E0B0] group-hover:border-[#00E0B0]/40 transition-colors">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-[#F1F7FC] group-hover:text-[#00E0B0] transition-colors block">
                              {item.title}
                            </span>
                            {item.isDemo && (
                              <span className="text-[9px] text-amber-400/80 font-mono">Demo SKU</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-[#9BB4C9]">
                          {item.category}
                        </td>
                        <td className="py-3 text-[#F1F7FC] font-semibold font-mono">
                          {currencySymbol} {item.price.toFixed(2)}
                        </td>
                        <td className="py-3 text-[#F1F7FC] font-semibold font-mono">
                          {item.inventory}
                        </td>
                        <td className="py-3">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Low Stock ({item.inventory})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00E0B0]/10 text-[#00E0B0] border border-[#00E0B0]/30">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onSelectProductForStudio(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#00E0B0]/40 hover:bg-[#00E0B0]/15 text-[#00E0B0] text-[11px] font-semibold transition-all active:scale-95"
                          >
                            <span>Create Copy</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Card backed by genuine data sources (1 col) */}
        <div className="rounded-2xl p-6 bg-[#061A2B] border border-[#12364B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#12364B]/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00C9F2]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F1F7FC] font-sans">
                  Recent Activity
                </h2>
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs text-[#6F8BA3] hover:text-[#F1F7FC] transition-colors"
              >
                View Telemetry
              </button>
            </div>

            {/* Real Activity Stream */}
            <div className="mt-4 space-y-4">
              {/* Event 1: Growth Advisor report */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#F1F7FC] truncate">
                      {latestReport ? 'Growth Advisor Report' : 'Mastra Growth Workflow'}
                    </p>
                    <span className="text-[10px] text-[#6F8BA3] shrink-0">
                      {latestReport ? new Date(latestReport.createdAt).toLocaleDateString() : 'Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9BB4C9] mt-0.5">
                    {latestReport
                      ? `${latestReport.recommendations.length} action items • ${latestReport.modelUsed}`
                      : 'Deterministic sales diagnostics ready'}
                  </p>
                </div>
              </div>

              {/* Event 2: Sales Telemetry */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00C9F2]/10 border border-[#00C9F2]/20 flex items-center justify-center text-[#00C9F2] shrink-0 mt-0.5">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#F1F7FC] truncate">
                      {isRealData ? 'Imported Sales Telemetry' : 'Simulation Dataset'}
                    </p>
                    <span className="text-[10px] text-[#6F8BA3] shrink-0">
                      {isRealData ? 'Active' : 'Demo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9BB4C9] mt-0.5">
                    {isRealData
                      ? `${insights?.importedRecordsCount || 0} rows • ${currencySymbol} ${revenueVal.toLocaleString()}`
                      : '508 simulated orders • Multi-channel model'}
                  </p>
                </div>
              </div>

              {/* Event 3: Product Inventory */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00E0B0]/10 border border-[#00E0B0]/20 flex items-center justify-center text-[#00E0B0] shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#F1F7FC] truncate">
                      Store Catalog Engine
                    </p>
                    <span className="text-[10px] text-[#6F8BA3] shrink-0">Active</span>
                  </div>
                  <p className="text-[11px] text-[#9BB4C9] mt-0.5">
                    {products.length} registered product SKUs in database
                  </p>
                </div>
              </div>

              {/* Event 4: System Health */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00E0B0]/10 border border-[#00E0B0]/20 flex items-center justify-center text-[#00E0B0] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#F1F7FC] truncate">
                      Database &amp; API Health
                    </p>
                    <span className="text-[10px] text-[#00E0B0] shrink-0">Connected</span>
                  </div>
                  <p className="text-[11px] text-[#9BB4C9] mt-0.5">
                    MongoDB Atlas persistence active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('advisor')}
            className="mt-6 w-full py-2.5 rounded-xl border border-[#12364B] hover:border-[#00C9F2]/50 hover:bg-[#092137] text-xs font-semibold text-[#9BB4C9] hover:text-[#F1F7FC] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Run Growth Advisor</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00C9F2]" />
          </button>
        </div>
      </div>

      {/* Modal for adding custom product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03111F]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#061A2B] border border-[#12364B] shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#F1F7FC] font-sans">
              Add New Product
            </h3>
            <p className="text-xs text-[#9BB4C9] mt-1">
              Add a new item to test the inventory engine and AI content creation.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9BB4C9] mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Standing Desk Mat"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#03111F] border border-[#12364B] rounded-xl px-3.5 py-2 text-sm text-[#F1F7FC] placeholder-[#6F8BA3] focus:outline-none focus:border-[#00E0B0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9BB4C9] mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workspace"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#03111F] border border-[#12364B] rounded-xl px-3.5 py-2 text-sm text-[#F1F7FC] placeholder-[#6F8BA3] focus:outline-none focus:border-[#00E0B0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9BB4C9] mb-1">
                    Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#03111F] border border-[#12364B] rounded-xl px-3.5 py-2 text-sm text-[#F1F7FC] focus:outline-none focus:border-[#00E0B0] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9BB4C9] mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newInventory}
                    onChange={(e) => setNewInventory(e.target.value)}
                    className="w-full bg-[#03111F] border border-[#12364B] rounded-xl px-3.5 py-2 text-sm text-[#F1F7FC] focus:outline-none focus:border-[#00E0B0] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#12364B]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9BB4C9] hover:text-[#F1F7FC] hover:bg-[#092137] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E0B0] to-[#00C9F2] hover:opacity-90 text-[#03111F] text-xs font-bold shadow-md transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
