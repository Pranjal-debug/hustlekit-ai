export type ContentType = 
  | 'product_description'
  | 'seo_title'
  | 'promotional_message'
  | 'customer_reply';

export type ToneType = 
  | 'persuasive' 
  | 'luxurious' 
  | 'friendly' 
  | 'concise' 
  | 'witty';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  aiEngineStatus: 'demo_template_engine' | 'live_provider';
  gemma?: {
    configured: boolean;
    model: string;
    endpoint: string;
    mockFallbackEnabled: boolean;
  };
  database?: {
    type: 'mongodb' | 'memory';
    status: 'connected' | 'disconnected' | 'in_memory_fallback';
    dbName?: string;
  };
}

export interface ContentGenerationRequest {
  productTitle: string;
  category: string;
  price?: string | number;
  keyFeatures: string[];
  tone?: ToneType;
  contentType: ContentType;
  targetAudience?: string;
  customerQuery?: string;
}

export interface ContentGenerationResponse {
  id: string;
  contentType: ContentType;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  suggestedTags: string[];
  suggestedChannels: string[];
  tone: ToneType;
  timestamp: string;
  isDemo: boolean;
  modelNotice: string;
  modelUsed?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  inventory: number;
  status: 'active' | 'draft' | 'low_stock';
  salesCount: number;
  revenue: number;
  createdAt: string;
  isDemo: boolean;
}

export interface SalesChartDataPoint {
  date: string;
  day: string;
  revenue: number;
  orders: number;
  projectedRevenue?: number;
}

export interface SalesChannelMetric {
  channel: string;
  sharePercentage: number;
  revenue: number;
  growth: number;
}

export interface RecommendedAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'inventory' | 'marketing' | 'pricing' | 'seo';
  title: string;
  description: string;
  expectedImpact: string;
  suggestedActionLabel: string;
}

export interface ProductPerformance {
  productName: string;
  unitsSold: number;
  revenue: number;
  averageUnitPrice: number;
  ordersCount: number;
}

export interface SalesInsightsData {
  summary: {
    totalRevenue: number;
    revenueChangePercentage: number;
    totalOrders: number;
    ordersChangePercentage: number;
    averageOrderValue: number;
    aovChangePercentage: number;
    conversionRate: number;
    conversionChangePercentage: number;
    unitsSold?: number;
  };
  chartData: SalesChartDataPoint[];
  forecast: {
    nextMonthEstimatedRevenue: number;
    estimatedGrowthRate: number;
    confidenceScore: number;
    insightsSummary: string;
    hasEnoughData?: boolean;
  };
  channels: SalesChannelMetric[];
  recommendedActions: RecommendedAction[];
  topProducts?: ProductPerformance[];
  isDemo: boolean;
  dataSource: 'demo_simulation' | 'imported_sales';
  importedRecordsCount?: number;
}

export interface SalesRecord {
  id: string;
  workspaceId: string;
  orderId?: string;
  productName: string;
  productId?: string;
  date: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  channel?: string;
  recordHash: string;
  createdAt: string;
}

export interface SalesHashInput {
  orderId?: string;
  productName: string;
  date: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesRecordInput {
  orderId?: string;
  productName: string;
  productId?: string;
  date: string;
  quantity: number;
  unitPrice: number;
  revenue?: number;
  channel?: string;
}

export interface SalesImportRowValidation {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  parsedRecord?: Partial<SalesRecord>;
}

export interface SalesImportSummary {
  totalRowsProcessed: number;
  insertedCount: number;
  skippedDuplicatesCount: number;
  invalidRowsCount: number;
  totalImportedRevenue: number;
  sampleErrors?: { row: number; error: string }[];
  persistedTo: 'mongodb' | 'memory';
}

export interface StoreSettings {
  storeName: string;
  sellerName: string;
  currency: string;
  defaultTone: ToneType;
  targetMarket: string;
  aiProviderConfigured: boolean;
  demoModeActive: boolean;
}

export type AdvisorCategory = 'marketing' | 'pricing' | 'inventory' | 'product' | 'operations';
export type AdvisorPriority = 'high' | 'medium' | 'low';

export interface AdvisorRecommendation {
  id: string;
  title: string;
  category: AdvisorCategory;
  priority: AdvisorPriority;
  evidence: string;
  reasoning: string;
  actionSteps: string[];
  limitations: string;
}

export interface AdvisorMetricsSnapshot {
  totalRevenue: number;
  totalOrders: number;
  unitsSold: number;
  averageOrderValue: number;
  productCount: number;
}

export interface AdvisorAnalysisPeriod {
  startDate?: string;
  endDate?: string;
  totalDaysObserved: number;
}

export interface AdvisorReport {
  id: string;
  workspaceId: string;
  createdAt: string;
  dataSource: 'imported_sales' | 'empty_state';
  hasSufficientData: boolean;
  analysisPeriod: AdvisorAnalysisPeriod;
  metricsSnapshot: AdvisorMetricsSnapshot;
  recommendations: AdvisorRecommendation[];
  missingDataNotes: string[];
  modelUsed: string;
  workflowRunId?: string;
  workflowExecutionPath?: string[];
}

