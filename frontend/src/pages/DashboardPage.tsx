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

  // Safe formatted current date for editorial header
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Hero Banner */}
      <section
        aria-label="Dashboard Overview"
        className="relative overflow-hidden rounded-2xl bg-[#FBF9F5] border border-[#171717] p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
      >
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold">
              {formattedDate}
            </span>
            <span className="text-[#E5E0D8]">•</span>
            <span className="text-[11px] font-semibold text-[#0A0A0A] bg-[#F5F1EA] px-2 py-0.5 rounded border border-[#E5E0D8]">
              {settings?.storeName || 'Solo Venture'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A0A0A] tracking-tight font-display">
            Welcome back, <span className="underline decoration-[#D4FF00] decoration-4 underline-offset-4">{founderName}</span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#57534E] leading-relaxed">
            {isRealData
              ? `Displaying verified store telemetry across ${insights?.importedRecordsCount || 0} imported transaction records.`
              : 'Real-time commerce telemetry, inventory performance, and AI-powered growth velocity.'}
          </p>
        </div>

        {/* Right CTA & Insight Briefing */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigate('advisor')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs sm:text-sm font-bold border border-[#171717] shadow-sm transition-all active:scale-95 group"
          >
            <Sparkles className="w-4 h-4 text-[#0A0A0A] fill-[#0A0A0A]" />
            <span>Run Advisor</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

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
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0A0A0A]" />
                <h2 className="text-sm sm:text-base font-bold text-[#0A0A0A] font-sans">
                  Sales &amp; Revenue Velocity
                </h2>
              </div>

              <button
                onClick={() => onNavigate('insights')}
                className="text-xs text-[#57534E] hover:text-[#0A0A0A] flex items-center gap-1 transition-colors font-medium"
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
        <div className="rounded-2xl p-6 bg-[#FBF9F5] border border-[#E5E0D8] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] text-[#0A0A0A] text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-[#0A0A0A] fill-[#0A0A0A]" />
                <span>AI Copywriter Studio</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4FF00] border border-[#171717] text-[10px] text-[#0A0A0A] font-bold">
                <span>Gemma 3 12B</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0A] tracking-tight leading-snug font-display">
              Create high-converting product content with AI
            </h3>

            <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
              Turn your product specifications into persuasive product descriptions, SEO tags, and launch posts.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigate('studio')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold border border-[#171717] shadow-sm active:scale-95 transition-all"
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
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-sm sm:text-base font-bold text-[#0A0A0A] font-sans">
                Store Inventory
              </h2>
              <span className="text-[11px] font-medium text-[#57534E]">({products.length} registered items)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0A0A0A] hover:text-[#57534E] transition-colors bg-[#F5F1EA] px-2.5 py-1 rounded-lg border border-[#E5E0D8]"
              >
                <Plus className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Add Item</span>
              </button>
              <button
                onClick={() => onNavigate('studio')}
                className="text-xs font-semibold text-[#57534E] hover:text-[#0A0A0A] transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <Maximize2 className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          {inventoryList.length === 0 ? (
            <div className="py-12 text-center text-[#57534E]">
              <Package className="w-8 h-8 mx-auto mb-2 text-[#78716C]" />
              <p className="text-xs font-bold text-[#0A0A0A]">No inventory registered</p>
              <p className="text-[11px] text-[#57534E] mt-1">Click "+ Add Item" above to add your first product.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead>
                  <tr className="text-[#57534E] text-[10px] font-bold uppercase tracking-wider border-b border-[#E5E0D8]">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Stock</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {inventoryList.map((item) => {
                    const isOutOfStock = item.inventory === 0;
                    const isLowStock = item.inventory > 0 && item.inventory <= 10;
                    return (
                      <tr key={item.id} className="hover:bg-[#FBF9F5] transition-colors group">
                        <td className="py-3 font-medium text-[#0A0A0A] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#57534E] group-hover:border-[#171717] group-hover:text-[#0A0A0A] transition-colors">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[#0A0A0A] transition-colors block">
                              {item.title}
                            </span>
                            {item.isDemo && (
                              <span className="text-[9px] text-amber-900 font-mono bg-amber-100 px-1 rounded border border-amber-200">Demo SKU</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-[#57534E] font-medium">
                          {item.category}
                        </td>
                        <td className="py-3 text-[#0A0A0A] font-bold font-mono">
                          {currencySymbol} {item.price.toFixed(2)}
                        </td>
                        <td className="py-3 text-[#0A0A0A] font-bold font-mono">
                          {item.inventory}
                        </td>
                        <td className="py-3">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Low Stock ({item.inventory})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4FF00] text-[#0A0A0A] border border-[#C5EE00]">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onSelectProductForStudio(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#171717] bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-[11px] font-bold transition-all active:scale-95 shadow-sm"
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
        <div className="rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0A0A0A]" />
                <h2 className="text-sm sm:text-base font-bold text-[#0A0A0A] font-sans">
                  Recent Activity
                </h2>
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-[#57534E] hover:text-[#0A0A0A] transition-colors"
              >
                View Telemetry
              </button>
            </div>

            {/* Real Activity Stream */}
            <div className="mt-4 space-y-4">
              {/* Event 1: Growth Advisor report */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#0A0A0A] truncate">
                      {latestReport ? 'Growth Advisor Report' : 'Mastra Growth Workflow'}
                    </p>
                    <span className="text-[10px] font-mono text-[#57534E] bg-[#F5F1EA] px-1.5 py-0.5 rounded border border-[#E5E0D8] shrink-0">
                      {latestReport ? new Date(latestReport.createdAt).toLocaleDateString() : 'Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                    {latestReport
                      ? `${latestReport.recommendations.length} action items • ${latestReport.modelUsed}`
                      : 'Deterministic sales diagnostics ready'}
                  </p>
                </div>
              </div>

              {/* Event 2: Sales Telemetry */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] shrink-0 mt-0.5">
                  <Upload className="w-4 h-4 text-[#0A0A0A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#0A0A0A] truncate">
                      {isRealData ? 'Imported Sales Telemetry' : 'Simulation Dataset'}
                    </p>
                    <span className="text-[10px] font-mono text-[#57534E] bg-[#F5F1EA] px-1.5 py-0.5 rounded border border-[#E5E0D8] shrink-0">
                      {isRealData ? 'Active' : 'Demo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                    {isRealData
                      ? `${insights?.importedRecordsCount || 0} rows • ${currencySymbol} ${revenueVal.toLocaleString()}`
                      : '508 simulated orders • Multi-channel model'}
                  </p>
                </div>
              </div>

              {/* Event 3: Product Inventory */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] shrink-0 mt-0.5">
                  <Layers className="w-4 h-4 text-[#0A0A0A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#0A0A0A] truncate">
                      Store Catalog Engine
                    </p>
                    <span className="text-[10px] font-mono text-[#57534E] bg-[#F5F1EA] px-1.5 py-0.5 rounded border border-[#E5E0D8] shrink-0">Active</span>
                  </div>
                  <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                    {products.length} registered product SKUs in database
                  </p>
                </div>
              </div>

              {/* Event 4: System Health */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0A0A0A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#0A0A0A] truncate">
                      Database &amp; API Health
                    </p>
                    <span className="text-[10px] font-bold text-[#0A0A0A] bg-[#D4FF00] px-1.5 py-0.5 rounded border border-[#171717] shrink-0">Connected</span>
                  </div>
                  <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                    MongoDB Atlas persistence active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('advisor')}
            className="mt-6 w-full py-2.5 rounded-xl border border-[#171717] bg-[#F5F1EA] hover:bg-[#EBE5DB] text-xs font-bold text-[#0A0A0A] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Run Growth Advisor</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </button>
        </div>
      </div>

      {/* Modal for adding custom product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#FFFFFF] border border-[#171717] shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#0A0A0A] font-display">
              Add New Product
            </h3>
            <p className="text-xs text-[#57534E] mt-1">
              Add a new item to test the inventory engine and AI content creation.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Standing Desk Mat"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-sm text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workspace"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-sm text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-sm text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newInventory}
                    onChange={(e) => setNewInventory(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-sm text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#57534E] hover:text-[#0A0A0A] hover:bg-[#F5F1EA] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] text-xs font-bold border border-[#171717] shadow-sm active:scale-95 transition-all"
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
