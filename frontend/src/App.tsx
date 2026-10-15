import { useState, useEffect, useCallback } from 'react';
import type { NavPage, HealthResponse, ProductItem, SalesInsightsData } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ProductStudioPage } from './pages/ProductStudioPage';
import { SalesInsightsPage } from './pages/SalesInsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // App domain state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [insights, setInsights] = useState<SalesInsightsData | null>(null);
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

  // Load products & insights from backend
  const loadAppData = useCallback(async () => {
    try {
      setLoadingInitial(true);
      const [healthData, productsRes, insightsData] = await Promise.allSettled([
        api.checkHealth(),
        api.getProducts(),
        api.getInsights(),
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar
          activePage={activePage}
          onOpenMobile={() => setMobileOpen(true)}
          onQuickGenerate={() => setActivePage('studio')}
          health={health}
          healthLoading={healthLoading}
          onRefreshHealth={checkHealth}
        />

        {/* Page Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              insights={insights}
              products={products}
              loading={loadingInitial}
              onNavigate={(page) => setActivePage(page)}
              onSelectProductForStudio={handleSelectProductForStudio}
              onAddProduct={handleAddProduct}
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

          {activePage === 'settings' && (
            <SettingsPage
              health={health}
              onRefreshHealth={checkHealth}
              onShowToast={showToast}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
