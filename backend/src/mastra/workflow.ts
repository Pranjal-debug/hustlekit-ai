import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getSalesRecords } from '../db/mongo';
import { calculateRealInsights } from '../services/sales.service';
import {
  callModelChatCompletion,
  isGemmaConfigured,
  getGemmaConfig,
} from '../services/gemma.service';
import {
  AdvisorReport,
  AdvisorRecommendation,
  AdvisorMetricsSnapshot,
  AdvisorAnalysisPeriod,
  AdvisorCategory,
  AdvisorPriority,
} from '../types';

// ==========================================
// ZOD SCHEMAS FOR MASTRA STEPS
// ==========================================

export const AdvisorRecommendationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  category: z.enum(['marketing', 'pricing', 'inventory', 'product', 'operations']),
  priority: z.enum(['high', 'medium', 'low']),
  evidence: z.string().min(3),
  reasoning: z.string().min(5),
  actionSteps: z.array(z.string().min(3)).min(1),
  limitations: z.string().min(3),
});

export const AdvisorModelOutputSchema = z.object({
  recommendations: z.array(AdvisorRecommendationSchema).min(1).max(5),
  missingDataNotes: z.array(z.string()).optional(),
});

export const ProductEvidenceSchema = z.object({
  productName: z.string(),
  revenue: z.number(),
  unitsSold: z.number(),
  averageUnitPrice: z.number(),
  shareOfTotalRevenue: z.number(),
});

export const TrendEvidenceSchema = z.object({
  description: z.string(),
  metric: z.string(),
  confidence: z.enum(['high', 'moderate', 'low']),
});

export const StepAOutputSchema = z.object({
  workspaceId: z.string(),
  hasRealData: z.boolean(),
  rawRecordCount: z.number(),
  summary: z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    unitsSold: z.number(),
    averageOrderValue: z.number(),
  }),
  products: z.array(
    z.object({
      productName: z.string(),
      unitsSold: z.number(),
      revenue: z.number(),
      averageUnitPrice: z.number(),
      ordersCount: z.number(),
    })
  ),
  dailyObservations: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      orders: z.number(),
    })
  ),
  channels: z.array(
    z.object({
      channel: z.string(),
      revenue: z.number(),
      sharePercentage: z.number(),
    })
  ),
});

export const StepBOutputSchema = z.object({
  workspaceId: z.string(),
  hasRealData: z.boolean(),
  hasSufficientData: z.boolean(),
  observationPeriod: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    totalDaysObserved: z.number(),
  }),
  metricsSnapshot: z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    unitsSold: z.number(),
    averageOrderValue: z.number(),
    productCount: z.number(),
  }),
  strongProducts: z.array(ProductEvidenceSchema),
  weakProducts: z.array(ProductEvidenceSchema),
  identifiedTrends: z.array(TrendEvidenceSchema),
  channelSummary: z.array(
    z.object({
      channel: z.string(),
      revenue: z.number(),
      sharePercentage: z.number(),
    })
  ),
  missingDataNotes: z.array(z.string()),
});

export const StepCOutputSchema = z.object({
  workspaceId: z.string(),
  hasRealData: z.boolean(),
  hasSufficientData: z.boolean(),
  observationPeriod: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    totalDaysObserved: z.number(),
  }),
  metricsSnapshot: z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    unitsSold: z.number(),
    averageOrderValue: z.number(),
    productCount: z.number(),
  }),
  missingDataNotes: z.array(z.string()),
  rawModelOutput: z.string(),
  modelUsed: z.string(),
});

export const AdvisorReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdAt: z.string(),
  dataSource: z.enum(['imported_sales', 'empty_state']),
  hasSufficientData: z.boolean(),
  analysisPeriod: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    totalDaysObserved: z.number(),
  }),
  metricsSnapshot: z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    unitsSold: z.number(),
    averageOrderValue: z.number(),
    productCount: z.number(),
  }),
  recommendations: z.array(AdvisorRecommendationSchema),
  missingDataNotes: z.array(z.string()),
  modelUsed: z.string(),
  workflowRunId: z.string().optional(),
  workflowExecutionPath: z.array(z.string()).optional(),
});

// ==========================================
// WORKFLOW STEPS FACTORY
// ==========================================

export interface WorkflowOptions {
  customFetch?: typeof fetch;
}

/**
 * Step A: Load business data from MongoDB repositories
 * Enforces workspace isolation and avoids using demo simulations as real data.
 */
export const createLoadBusinessDataStep = () =>
  createStep({
    id: 'load-business-data',
    inputSchema: z.object({
      workspaceId: z.string(),
    }),
    outputSchema: StepAOutputSchema,
    execute: async ({ inputData }) => {
      const workspaceId = inputData.workspaceId || 'default';
      const records = await getSalesRecords(workspaceId);

      if (!records || records.length === 0) {
        return {
          workspaceId,
          hasRealData: false,
          rawRecordCount: 0,
          summary: {
            totalRevenue: 0,
            totalOrders: 0,
            unitsSold: 0,
            averageOrderValue: 0,
          },
          products: [],
          dailyObservations: [],
          channels: [],
        };
      }

      const calculated = calculateRealInsights(records);
      const uniqueDates = Array.from(new Set(records.map((r) => r.date))).sort();
      const dailyObservations = calculated.chartData.map((cd) => ({
        date: cd.date,
        revenue: cd.revenue,
        orders: cd.orders,
      }));

      return {
        workspaceId,
        hasRealData: true,
        rawRecordCount: records.length,
        summary: {
          totalRevenue: calculated.summary.totalRevenue,
          totalOrders: calculated.summary.totalOrders,
          unitsSold: calculated.summary.unitsSold || 0,
          averageOrderValue: calculated.summary.averageOrderValue,
        },
        products: (calculated.topProducts || []).map((p) => ({
          productName: p.productName,
          unitsSold: p.unitsSold,
          revenue: p.revenue,
          averageUnitPrice: p.averageUnitPrice,
          ordersCount: p.ordersCount,
        })),
        dailyObservations,
        channels: calculated.channels.map((c) => ({
          channel: c.channel,
          revenue: c.revenue,
          sharePercentage: c.sharePercentage,
        })),
      };
    },
  });

/**
 * Step B: Build evidence from deterministic calculations
 * Strictly avoids inventing trends when dataset is sparse or empty.
 */
export const createBuildEvidenceStep = () =>
  createStep({
    id: 'build-evidence',
    inputSchema: StepAOutputSchema,
    outputSchema: StepBOutputSchema,
    execute: async ({ inputData }: { inputData: z.infer<typeof StepAOutputSchema> }) => {
      const {
        workspaceId,
        hasRealData,
        rawRecordCount,
        summary,
        products,
        dailyObservations,
        channels,
      } = inputData;

      const missingDataNotes: string[] = [];

      // Case 1: Empty workspace
      if (!hasRealData || rawRecordCount === 0) {
        missingDataNotes.push(
          `No imported sales records found for workspace '${workspaceId}'.`
        );
        missingDataNotes.push(
          'A transaction CSV with date, product_name, quantity, and unit_price is required for historical performance diagnostics.'
        );

        return {
          workspaceId,
          hasRealData: false,
          hasSufficientData: false,
          observationPeriod: {
            totalDaysObserved: 0,
          },
          metricsSnapshot: {
            totalRevenue: 0,
            totalOrders: 0,
            unitsSold: 0,
            averageOrderValue: 0,
            productCount: 0,
          },
          strongProducts: [],
          weakProducts: [],
          identifiedTrends: [],
          channelSummary: [],
          missingDataNotes,
        };
      }

      // Case 2: Real sales data exists
      const totalRev = summary.totalRevenue;
      const sortedDates = dailyObservations.map((d: { date: string }) => d.date).sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      const daysCount = dailyObservations.length;

      // Evaluate data sufficiency
      if (daysCount < 3) {
        missingDataNotes.push(
          `Only ${daysCount} distinct transaction date(s) recorded (${startDate || 'N/A'} to ${endDate || 'N/A'}). Daily velocity trends are preliminary.`
        );
      }

      if (products.length < 2) {
        missingDataNotes.push(
          `Only ${products.length} distinct product recorded in transaction history. Catalog portfolio comparison is limited.`
        );
      }

      const hasSufficientData = daysCount >= 2 && products.length >= 2;

      // Strongest & Weakest Products (Only calculated if multiple products exist)
      let strongProducts: z.infer<typeof ProductEvidenceSchema>[] = [];
      let weakProducts: z.infer<typeof ProductEvidenceSchema>[] = [];

      if (products.length >= 2) {
        const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
        // Top 1-2
        strongProducts = sortedByRevenue.slice(0, Math.min(2, sortedByRevenue.length)).map((p: any) => ({
          productName: p.productName,
          revenue: p.revenue,
          unitsSold: p.unitsSold,
          averageUnitPrice: p.averageUnitPrice,
          shareOfTotalRevenue: totalRev > 0 ? Math.round((p.revenue / totalRev) * 1000) / 10 : 0,
        }));

        // Bottom 1-2 (excluding items in top)
        const remaining = sortedByRevenue.slice(Math.min(2, sortedByRevenue.length));
        if (remaining.length > 0) {
          weakProducts = remaining.slice(-2).map((p: any) => ({
            productName: p.productName,
            revenue: p.revenue,
            unitsSold: p.unitsSold,
            averageUnitPrice: p.averageUnitPrice,
            shareOfTotalRevenue: totalRev > 0 ? Math.round((p.revenue / totalRev) * 1000) / 10 : 0,
          }));
        }
      }

      // Identify genuine factual trends
      const identifiedTrends: z.infer<typeof TrendEvidenceSchema>[] = [];
      if (daysCount >= 3) {
        // Average daily velocity
        const avgDailyRev = totalRev / daysCount;
        identifiedTrends.push({
          description: `Average daily revenue over ${daysCount} active days is $${avgDailyRev.toFixed(2)}.`,
          metric: `$${avgDailyRev.toFixed(2)}/day`,
          confidence: 'high',
        });

        // Top channel concentration
        if (channels.length > 0) {
          const topChannel = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
          identifiedTrends.push({
            description: `Channel '${topChannel.channel}' leads with $${topChannel.revenue.toFixed(2)} (${topChannel.sharePercentage}% share).`,
            metric: `${topChannel.sharePercentage}% share`,
            confidence: 'high',
          });
        }
      }

      return {
        workspaceId,
        hasRealData: true,
        hasSufficientData,
        observationPeriod: {
          startDate,
          endDate,
          totalDaysObserved: daysCount,
        },
        metricsSnapshot: {
          totalRevenue: summary.totalRevenue,
          totalOrders: summary.totalOrders,
          unitsSold: summary.unitsSold,
          averageOrderValue: summary.averageOrderValue,
          productCount: products.length,
        },
        strongProducts,
        weakProducts,
        identifiedTrends,
        channelSummary: channels,
        missingDataNotes,
      };
    },
  });

/**
 * Step C: Generate model-backed recommendations using Mastra
 * Uses Gemma 3 12B with strict grounding in the supplied evidence.
 */
export const createGenerateRecommendationsStep = (options?: WorkflowOptions) =>
  createStep({
    id: 'generate-recommendations',
    inputSchema: StepBOutputSchema,
    outputSchema: StepCOutputSchema,
    execute: async ({ inputData }: { inputData: z.infer<typeof StepBOutputSchema> }) => {
      const {
        workspaceId,
        hasRealData,
        hasSufficientData,
        observationPeriod,
        metricsSnapshot,
        strongProducts,
        weakProducts,
        identifiedTrends,
        channelSummary,
        missingDataNotes,
      } = inputData;

      const gemmaConfig = getGemmaConfig();
      const modelName = gemmaConfig.model;

      // Construct grounded prompt
      const systemPrompt = `You are HustleKit AI's Sales Growth Advisor, powered by Mastra.
Your job is to provide realistic, disciplined, high-impact growth recommendations for a solo entrepreneur or small online seller.

STRICT ADVISORY RULES:
1. Ground every recommendation strictly in the verified metrics provided.
2. NEVER invent sales figures, customer counts, or trends that are not in the evidence.
3. NEVER assume profit margins or profit numbers because product cost data is not supplied. Speak in terms of revenue, order volume, and unit sales.
4. NEVER promise guaranteed revenue gains (e.g. do not say "This will guarantee $5,000").
5. Distinguish correlation from causation.
6. Provide between 3 and 5 actionable recommendations.
7. Categories must be one of: 'marketing', 'pricing', 'inventory', 'product', 'operations'.
8. Priorities must be one of: 'high', 'medium', 'low'.
9. Each recommendation MUST include specific, practical action steps tailored for a solo operator with limited time.
10. Return ONLY a valid JSON object matching this exact structure:
{
  "recommendations": [
    {
      "title": "Concise imperative action title",
      "category": "marketing",
      "priority": "high",
      "evidence": "Exact metric citation (e.g. Desk Mat generated $500 across 10 orders representing 42% of revenue)",
      "reasoning": "Clear business rationale explaining why this matters for a solo seller",
      "actionSteps": [
        "Step 1: Specific action",
        "Step 2: Specific action"
      ],
      "limitations": "Specific data gap or uncertainty (e.g. Observation window is 15 days; seasonal elasticity unknown)"
    }
  ],
  "missingDataNotes": ["Any observed data gap or caveat"]
}`;

      let userPrompt = '';
      if (!hasRealData) {
        userPrompt = `Workspace ID: ${workspaceId}
CURRENT DATA STATE: EMPTY (No sales records imported yet).
Snapshot: Total Revenue $0, Orders 0, Units 0.

Because no transaction history has been imported yet, provide 3 to 4 foundational setup recommendations for a new solo seller:
- Category 1: operations (setting up CSV / transaction tracking and SKU standardization)
- Category 2: marketing (defining initial launch channels and audience tracking)
- Category 3: inventory (establishing reorder point alerts and safety stock levels)
- Category 4: pricing (benchmarking competitor pricing without margin assumptions)
Remember to note in 'evidence' that zero transactions are recorded, and in 'limitations' that recommendations are baseline best practices until sales CSV is uploaded.`;
      } else {
        userPrompt = `Workspace ID: ${workspaceId}
OBSERVATION PERIOD: ${observationPeriod.startDate || 'N/A'} to ${observationPeriod.endDate || 'N/A'} (${observationPeriod.totalDaysObserved} active days)
METRICS SNAPSHOT:
- Total Revenue: $${metricsSnapshot.totalRevenue.toFixed(2)}
- Total Orders: ${metricsSnapshot.totalOrders}
- Total Units Sold: ${metricsSnapshot.unitsSold}
- Average Order Value (AOV): $${metricsSnapshot.averageOrderValue.toFixed(2)}
- Distinct Products Sold: ${metricsSnapshot.productCount}

STRONG PRODUCTS (Top Performers):
${
  strongProducts.length > 0
    ? strongProducts
        .map(
          (p: any) =>
            `- ${p.productName}: $${p.revenue.toFixed(2)} revenue (${p.shareOfTotalRevenue}% of total), ${p.unitsSold} units, avg price $${p.averageUnitPrice.toFixed(2)}`
        )
        .join('\n')
    : 'None identified (insufficient catalog diversity)'
}

WEAK PRODUCTS (Lower Performers):
${
  weakProducts.length > 0
    ? weakProducts
        .map(
          (p: any) =>
            `- ${p.productName}: $${p.revenue.toFixed(2)} revenue (${p.shareOfTotalRevenue}% of total), ${p.unitsSold} units, avg price $${p.averageUnitPrice.toFixed(2)}`
        )
        .join('\n')
    : 'None identified (catalog size too small for meaningful comparison)'
}

CHANNELS BREAKDOWN:
${
  channelSummary.length > 0
    ? channelSummary
        .map((c: any) => `- ${c.channel}: $${c.revenue.toFixed(2)} (${c.sharePercentage}%)`)
        .join('\n')
    : 'Direct / unspecified'
}

IDENTIFIED TRENDS:
${
  identifiedTrends.length > 0
    ? identifiedTrends.map((t: any) => `- ${t.description} [${t.confidence} confidence]`).join('\n')
    : 'Insufficient sequential days for definitive trend identification'
}

DATA GAPS & CAVEATS:
${missingDataNotes.length > 0 ? missingDataNotes.map((n: any) => `- ${n}`).join('\n') : 'Dataset meets minimum criteria'}

Generate 3 to 5 tailored growth recommendations matching the strict JSON format.`;
      }

      // Check if Gemma is configured
      if (!isGemmaConfigured() && !options?.customFetch) {
        throw new Error(
          'Gemma AI provider is not configured. Please set GEMMA_API_KEY in backend/.env to execute the Mastra Sales Growth Advisor.'
        );
      }

      const { content: rawModelOutput, model } = await callModelChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.2, maxTokens: 1400 },
        options?.customFetch
      );

      return {
        workspaceId,
        hasRealData,
        hasSufficientData,
        observationPeriod,
        metricsSnapshot,
        missingDataNotes,
        rawModelOutput,
        modelUsed: model,
      };
    },
  });

/**
 * Step D: Validate output against strict Zod schema
 * Parses JSON safely and rejects hallucinations or malformed formats.
 */
export const createValidateOutputStep = () =>
  createStep({
    id: 'validate-output',
    inputSchema: StepCOutputSchema,
    outputSchema: AdvisorReportSchema,
    execute: async ({ inputData }: { inputData: z.infer<typeof StepCOutputSchema> }) => {
      const {
        workspaceId,
        hasRealData,
        hasSufficientData,
        observationPeriod,
        metricsSnapshot,
        missingDataNotes: initialNotes,
        rawModelOutput,
        modelUsed,
      } = inputData;

      // Extract JSON from potential code fences or raw string
      let jsonString = rawModelOutput.trim();
      const codeFenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeFenceMatch && codeFenceMatch[1]) {
        jsonString = codeFenceMatch[1].trim();
      } else {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.slice(firstBrace, lastBrace + 1);
        }
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonString);
      } catch (err: any) {
        throw new Error(
          `Sales Growth Advisor output validation failed: Model did not return valid JSON. Error: ${err.message}`
        );
      }

      // Validate against strict Zod schema
      const parseResult = AdvisorModelOutputSchema.safeParse(parsedJson);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Sales Growth Advisor schema validation rejected output: ${errors}`);
      }

      const validatedOutput = parseResult.data;
      const combinedNotes = Array.from(
        new Set([...initialNotes, ...(validatedOutput.missingDataNotes || [])])
      );

      // Attach unique identifiers and normalize recommendations
      const recommendations: AdvisorRecommendation[] = validatedOutput.recommendations.map(
        (rec, index) => ({
          id: `rec_${Date.now()}_${index + 1}`,
          title: rec.title.trim(),
          category: rec.category,
          priority: rec.priority,
          evidence: rec.evidence.trim(),
          reasoning: rec.reasoning.trim(),
          actionSteps: rec.actionSteps.map((s) => s.trim()),
          limitations: rec.limitations.trim(),
        })
      );

      const report: AdvisorReport = {
        id: `adv_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspaceId,
        createdAt: new Date().toISOString(),
        dataSource: hasRealData ? 'imported_sales' : 'empty_state',
        hasSufficientData,
        analysisPeriod: observationPeriod,
        metricsSnapshot,
        recommendations,
        missingDataNotes: combinedNotes,
        modelUsed,
        workflowExecutionPath: [
          'load-business-data',
          'build-evidence',
          'generate-recommendations',
          'validate-output',
        ],
      };

      return report;
    },
  });

// ==========================================
// WORKFLOW COMPOSER
// ==========================================

export const createSalesGrowthAdvisorWorkflow = (options?: WorkflowOptions) => {
  const stepA = createLoadBusinessDataStep();
  const stepB = createBuildEvidenceStep();
  const stepC = createGenerateRecommendationsStep(options);
  const stepD = createValidateOutputStep();

  return createWorkflow({
    id: 'sales-growth-advisor',
    inputSchema: z.object({
      workspaceId: z.string(),
    }),
    outputSchema: AdvisorReportSchema,
  })
    .then(stepA)
    .then(stepB)
    .then(stepC)
    .then(stepD)
    .commit();
};

/**
 * Default singleton instance of the Mastra Sales Growth Advisor workflow
 */
export const salesGrowthAdvisorWorkflow = createSalesGrowthAdvisorWorkflow();

/**
 * Execute the Mastra Sales Growth Advisor workflow
 */
export const runSalesGrowthAdvisor = async (
  workspaceId: string = 'default',
  options?: WorkflowOptions
): Promise<AdvisorReport> => {
  const workflow = options ? createSalesGrowthAdvisorWorkflow(options) : salesGrowthAdvisorWorkflow;
  const run = await workflow.createRun();

  const runResult = await run.start({
    inputData: {
      workspaceId,
    },
  });

  if (runResult.status !== 'success') {
    const errorMsg = (runResult as any).error?.message || 'Mastra workflow execution failed';
    throw new Error(errorMsg);
  }

  const report = (runResult as any).result as AdvisorReport;
  if (report) {
    report.workflowRunId = (runResult as any).runId || (run as any).runId;
    report.workflowExecutionPath = (runResult as any).stepExecutionPath || [
      'load-business-data',
      'build-evidence',
      'generate-recommendations',
      'validate-output',
    ];
  }

  return report;
};
