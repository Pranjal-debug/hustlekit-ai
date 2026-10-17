import { useState, useEffect, useCallback } from 'react';
import type { NavPage, HealthResponse, ProductItem, SalesInsightsData, StoreSettings } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ProductStudioPage } from './pages/ProductStudioPage';
import { SalesInsightsPage } from './pages/SalesInsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MastraGrowthAdvisor } from './components/MastraGrowthAdvisor';
import { AmbientBackground } from './components/AmbientBackground';

export function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // App domain state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [insights, setInsights] = useState<SalesInsightsData | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Cross-page navigation state
  const [prefilledProduct, setPrefilledProduct] = useState<ProductItem | null>(null);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch backend health status
  const checkHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const res = await api.checkHealth();
      setHealth(res);
    } catch {
      setHealth({
        status: 'error',
        service: 'HustleKit AI Backend',
        uptime: 0,
        timestamp: new Date().toISOString(),
        version: '1.0.0-hackathon',
        environment: 'offline',
        aiEngineStatus: 'demo_template_engine',
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Load products, insights, settings & health from backend
  const loadAppData = useCallback(async () => {
    try {
      setLoadingInitial(true);
      const [healthData, productsRes, insightsData, settingsData] = await Promise.allSettled([
        api.checkHealth(),
        api.getProducts(),
        api.getInsights(),
        api.getSettings(),
      ]);

      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value.data);
      }
      if (insightsData.status === 'fulfilled') {
        setInsights(insightsData.value);
      }
      if (settingsData.status === 'fulfilled') {
        setSettings(settingsData.value);
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Handlers for cross-page navigation & actions
  const handleSelectProductForStudio = (product: Partial<ProductItem>) => {
    setPrefilledProduct(product as ProductItem);
    setActivePage('studio');
    showToast(`Loaded ${product.title} into AI Product Studio`, 'info');
  };

  const handleAddProduct = async (productData: {
    title: string;
    category: string;
    price: number;
    inventory: number;
  }) => {
    try {
      const res = await api.createProduct(productData);
      setProducts((prev) => [res.data, ...prev]);
      showToast(`Product "${productData.title}" created!`, 'success');
    } catch (err: any) {
      // Local fallback in case backend is offline
      const fallbackItem: ProductItem = {
        id: `prod_local_${Date.now()}`,
        title: productData.title,
        category: productData.category,
        price: productData.price,
        inventory: productData.inventory,
        status: productData.inventory > 0 ? 'active' : 'draft',
        salesCount: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
        isDemo: false,
      };
      setProducts((prev) => [fallbackItem, ...prev]);
      showToast(`Product "${productData.title}" added to local inventory`, 'success');
    }
  };

  const handleResetDemoData = async () => {
    await loadAppData();
    showToast('Reset to default demo inventory and metrics.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#03111F] text-[#F1F7FC] flex flex-col font-sans selection:bg-[#00E0B0]/30 selection:text-[#00E0B0] relative">
      {/* Ambient living background with flowing cyan/emerald waves */}
      <AmbientBackground />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        health={health}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Bar */}
        <TopBar
          activePage={activePage}
          onNavigate={(page) => setActivePage(page)}
          onOpenMobile={() => setMobileOpen(true)}
          onQuickGenerate={() => setActivePage('studio')}
          health={health}
          healthLoading={healthLoading}
          onRefreshHealth={checkHealth}
          sellerName={settings?.sellerName || 'Pranjal Gupta'}
          products={products}
          onSelectProduct={(prod) => handleSelectProductForStudio(prod)}
          isDemoData={insights?.dataSource !== 'imported_sales'}
        />

        {/* Page Routing with smooth page-enter motion */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div key={activePage} className="animate-page-enter">
            {activePage === 'dashboard' && (
              <DashboardPage
                insights={insights}
                products={products}
                loading={loadingInitial}
                onNavigate={(page) => setActivePage(page)}
                onSelectProductForStudio={handleSelectProductForStudio}
                onAddProduct={handleAddProduct}
                settings={settings}
              />
            )}

            {activePage === 'studio' && (
              <ProductStudioPage
                products={products}
                prefilledProduct={prefilledProduct}
                onClearPrefill={() => setPrefilledProduct(null)}
                onShowToast={showToast}
              />
            )}

            {activePage === 'insights' && (
              <SalesInsightsPage
                insights={insights}
                loading={loadingInitial}
                onNavigate={(page) => setActivePage(page)}
                onSelectProductForStudio={handleSelectProductForStudio}
                onShowToast={showToast}
                onRefreshInsights={loadAppData}
              />
            )}

            {activePage === 'advisor' && (
              <div className="space-y-6 pb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#12364B] gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#F1F7FC] tracking-tight font-sans">
                      Mastra Sales Growth Advisor
                    </h1>
                    <p className="text-xs text-[#9BB4C9] mt-0.5">
                      Multi-step AI workflow orchestrating telemetry diagnostics, schema validation, and growth actions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#00E0B0]/10 border border-[#00E0B0]/30 text-[#00E0B0] font-semibold">
                      Mastra Workflow Orchestration
                    </span>
                  </div>
                </div>

                <MastraGrowthAdvisor
                  isRealData={insights?.dataSource === 'imported_sales'}
                  onNavigate={(page) => setActivePage(page)}
                  onSelectProductForStudio={handleSelectProductForStudio}
                  onShowToast={showToast}
                />
              </div>
            )}

            {activePage === 'settings' && (
              <SettingsPage
                health={health}
                onRefreshHealth={checkHealth}
                onShowToast={showToast}
                onResetDemoData={handleResetDemoData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
