import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRight,
  Plus,
  Box,
  Info,
  CheckCircle,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { SalesChart } from '../components/SalesChart';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import type { ProductItem, SalesInsightsData, NavPage } from '../types';

interface DashboardPageProps {
  insights: SalesInsightsData | null;
  products: ProductItem[];
  loading: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectProductForStudio: (product: ProductItem) => void;
  onAddProduct: (product: { title: string; category: string; price: number; inventory: number }) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  insights,
  products,
  loading,
  onNavigate,
  onSelectProductForStudio,
  onAddProduct,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('29.00');
  const [newInventory, setNewInventory] = useState('25');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredProducts = filterCategory === 'all'
    ? products
    : products.filter(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()));

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

  const isRealData = insights?.dataSource === 'imported_sales';

  return (
    <div className="space-y-6 pb-12">
      {/* Demo vs Real Notice Banner */}
      <div
        className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isRealData
            ? 'bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-indigo-500/10 border-emerald-500/30'
            : 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isRealData ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {isRealData
                  ? `Real Imported Store Sales Active (${insights?.importedRecordsCount} transactions)`
                  : 'Realistic Demo Dataset Active'}
              </span>
              <Badge variant={isRealData ? 'success' : 'demo'}>
                {isRealData ? 'Imported Data' : 'Demo Data'}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isRealData
                ? 'Store metrics, order counts, and charts are generated from actual imported sales.'
                : 'Metrics and products shown below represent a simulated solo business. Import your sales CSV in Sales Insights.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('insights')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all shrink-0"
        >
          {isRealData ? 'Manage Sales Data' : 'Upload Sales CSV'}
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
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
          title="Avg. Order Value"
          value={`$${summary.averageOrderValue.toFixed(2)}`}
          change={isRealData ? undefined : summary.aovChangePercentage}
          icon={TrendingUp}
          subtext={isRealData ? 'Computed per transaction' : undefined}
          isDemo={!isRealData}
        />
        <StatCard
          title="Store Conversion"
          value={`${summary.conversionRate}%`}
          change={isRealData ? undefined : summary.conversionChangePercentage}
          icon={Percent}
          isDemo={!isRealData}
        />
      </div>

      {/* Sales Chart & Clear CTA Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Area */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800/80 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800/60 gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Sales &amp; Revenue Velocity
                </h2>
                <Badge variant="purple">Live Trajectory</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past 14 days dynamic order pacing with AI projection curve
              </p>
            </div>

            <button
              onClick={() => onNavigate('insights')}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Detailed Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <SalesChart
            data={insights?.chartData || []}
            showProjection={true}
            height={260}
          />
        </div>

        {/* Clear 'Generate Content' Call to Action Card */}
        <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
                AI Copywriter Studio
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                Instant
              </span>
            </div>

            <h3 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Turn Product Ideas Into High-Converting Sales Copy
            </h3>

            <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
              Don't let blank page syndrome stall your store launch. Generate persuasive product descriptions, SEO tags, promo emails, or support replies in 2 seconds.
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Optimized for Etsy, Shopify &amp; Social Feeds</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>5 Persuasive Tones &amp; SEO Meta Keywords</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-purple-500/20 flex flex-col gap-2">
            <button
              onClick={() => onNavigate('studio')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Content Now</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              No prompt engineering required
            </p>
          </div>
        </div>
      </div>

      {/* Recent Products Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800/60 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Recent Store Inventory
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {products.length} Products
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage inventory status or directly generate marketing copy with 1 click
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="Workspace">Workspace</option>
              <option value="Home">Home &amp; Office</option>
              <option value="Accessories">Accessories</option>
              <option value="Stationery">Stationery</option>
              <option value="Kitchen">Kitchen</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Product Table or Empty State */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Box}
            title="No products found"
            description="No items match your category filter or inventory is empty. Create a product to start generating copy."
            actionLabel="Add New Product"
            onAction={() => setShowAddModal(true)}
            className="my-4"
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800/80">
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Units Sold</th>
                  <th className="pb-3 font-semibold text-right">Quick AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/40 transition-all">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{p.title}</div>
                        {p.isDemo ? (
                          <span className="text-[10px] text-amber-400/80 font-medium">Demo SKU</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium">Custom Product</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-200 font-semibold font-mono">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="py-3.5">
                      {p.status === 'active' && (
                        <Badge variant="success">{p.inventory} in stock</Badge>
                      )}
                      {p.status === 'low_stock' && (
                        <Badge variant="warning">Only {p.inventory} left</Badge>
                      )}
                      {p.status === 'draft' && (
                        <Badge variant="neutral">Draft (0 stock)</Badge>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-300 font-medium font-mono">
                      {p.salesCount} units
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onSelectProductForStudio(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all group-hover:border-purple-400"
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
        )}
      </div>

      {/* Modal for adding custom product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Add New Product
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add a new item to test the inventory engine and AI content creation.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Ergonomic Vertical Mouse"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workspace & Ergonomics"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newInventory}
                    onChange={(e) => setNewInventory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
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
