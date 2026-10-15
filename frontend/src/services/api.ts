import type {
  HealthResponse,
  ProductItem,
  SalesInsightsData,
  ContentGenerationRequest,
  ContentGenerationResponse,
  StoreSettings,
  SalesImportSummary,
  SalesRecord,
  AdvisorReport,
} from '../types';

const resolveApiBaseUrl = (): string => {
  const customUrl = import.meta.env.VITE_API_URL?.trim();
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  // In production builds (single-service or same-domain proxy), default to relative /api
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In local development, connect to local backend port 5000
  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export interface CsvValidationResponse {
  validRows: any[];
  errors: { row: number; error: string }[];
  totalRows: number;
  previewSummary: {
    estimatedTotalRevenue: number;
    estimatedOrders: number;
    dateRange: { start?: string; end?: string };
    productsCount: number;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMsg = `Server responded with status ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.error) errorMsg = errorJson.error;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err) {
      console.warn(`[API] Error contacting ${url}:`, err);
      throw err;
    }
  }

  public async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public async getProducts(): Promise<{ data: ProductItem[]; total: number; isDemo: boolean }> {
    return this.request<{ data: ProductItem[]; total: number; isDemo: boolean }>('/products');
  }

  public async createProduct(product: {
    title: string;
    category: string;
    price: number;
    inventory: number;
  }): Promise<{ data: ProductItem }> {
    return this.request<{ data: ProductItem }>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  public async getInsights(): Promise<SalesInsightsData> {
    return this.request<SalesInsightsData>('/insights');
  }

  public async validateSalesCsv(csvContent: string): Promise<CsvValidationResponse> {
    return this.request<CsvValidationResponse>('/sales/validate-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  }

  public async importSalesCsv(
    csvContent: string,
    workspaceId: string = 'default'
  ): Promise<{ message: string; summary: SalesImportSummary }> {
    return this.request<{ message: string; summary: SalesImportSummary }>('/sales/import', {
      method: 'POST',
      body: JSON.stringify({ csvContent, workspaceId }),
    });
  }

  public async getSampleCsv(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/sales/sample-csv`);
    if (!res.ok) throw new Error('Failed to download sample CSV');
    return res.text();
  }

  public async getSalesRecords(): Promise<{ data: SalesRecord[]; count: number }> {
    return this.request<{ data: SalesRecord[]; count: number }>('/sales/records');
  }

  public async clearSalesRecords(): Promise<{ message: string; deletedCount: number }> {
    return this.request<{ message: string; deletedCount: number }>('/sales/records', {
      method: 'DELETE',
    });
  }

  public async generateContent(payload: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    return this.request<ContentGenerationResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getContentHistory(): Promise<{ data: ContentGenerationResponse[]; count: number }> {
    return this.request<{ data: ContentGenerationResponse[]; count: number }>('/content/history');
  }

  public async getSettings(): Promise<StoreSettings> {
    return this.request<StoreSettings>('/settings');
  }

  public async updateSettings(settings: Partial<StoreSettings>): Promise<{ message: string; data: StoreSettings }> {
    return this.request<{ message: string; data: StoreSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  public async generateGrowthPlan(workspaceId: string = 'default'): Promise<AdvisorReport> {
    return this.request<AdvisorReport>('/advisor/generate', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    });
  }

  public async getAdvisorHistory(workspaceId: string = 'default'): Promise<{ data: AdvisorReport[]; count: number }> {
    return this.request<{ data: AdvisorReport[]; count: number }>(`/advisor/history?workspaceId=${encodeURIComponent(workspaceId)}`);
  }

  public async getLatestAdvisorReport(workspaceId: string = 'default'): Promise<AdvisorReport | null> {
    try {
      return await this.request<AdvisorReport>(`/advisor/latest?workspaceId=${encodeURIComponent(workspaceId)}`);
    } catch {
      return null;
    }
  }
}

export const api = new ApiService();
