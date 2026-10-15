import dotenv from 'dotenv';
import { ContentGenerationRequest, ContentGenerationResponse } from '../types';

export interface GemmaConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  enableMockFallback: boolean;
}

export const getGemmaConfig = (): GemmaConfig => {
  return {
    apiKey: process.env.GEMMA_API_KEY?.trim(),
    baseUrl: (process.env.GEMMA_API_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
    model: process.env.GEMMA_MODEL?.trim() || 'google/gemma-3-12b-it',
    timeoutMs: parseInt(process.env.GEMMA_TIMEOUT_MS || '15000', 10),
    maxTokens: parseInt(process.env.GEMMA_MAX_TOKENS || '800', 10),
    enableMockFallback: process.env.ENABLE_MOCK_FALLBACK === 'true',
  };
};

export const isGemmaConfigured = (): boolean => {
  const config = getGemmaConfig();
  return Boolean(config.apiKey && config.apiKey.length > 0);
};

export const isMockFallbackEnabled = (): boolean => {
  return getGemmaConfig().enableMockFallback;
};

const buildSystemPrompt = (): string => {
  return `You are HustleKit AI, an expert e-commerce copywriter for solo entrepreneurs and online sellers.
Your task is to write high-converting, professional, tailored copy for a product.
Always respond strictly with a valid JSON object matching this structure:
{
  "title": "A short, punchy, compelling headline or SEO title",
  "content": "The full body copy with clear spacing, formatting, and persuasive phrasing",
  "suggestedTags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"],
  "suggestedChannels": ["Platform 1", "Platform 2", "Platform 3"]
}
Do not include any commentary or preamble outside the JSON object.`;
};

const buildUserPrompt = (req: ContentGenerationRequest): string => {
  const {
    productTitle,
    category,
    price,
    keyFeatures,
    tone = 'persuasive',
    contentType,
    targetAudience,
    customerQuery,
  } = req;

  const featuresText = keyFeatures && keyFeatures.length > 0
    ? keyFeatures.map((f) => `- ${f}`).join('\n')
    : 'High quality build, fast delivery';

  return `Product Information:
- Product Title: ${productTitle}
- Category: ${category || 'General E-commerce'}
- Price: ${price ? `$${price}` : 'Unspecified'}
- Target Audience: ${targetAudience || 'Modern shoppers and discerning customers'}
- Key Features:\n${featuresText}

Requested Task:
- Content Format: ${contentType.replace('_', ' ')}
- Tone of Voice: ${tone}
${contentType === 'customer_reply' && customerQuery ? `- Customer Question to Answer: "${customerQuery}"` : ''}

Generate the JSON response containing "title", "content", "suggestedTags" (4-5 relevant hashtags), and "suggestedChannels" (2-4 best marketing channels).`;
};

interface ParsedGemmaOutput {
  title: string;
  content: string;
  suggestedTags: string[];
  suggestedChannels: string[];
}

const parseModelOutput = (rawOutput: string, defaultTitle: string): ParsedGemmaOutput => {
  const clean = rawOutput.trim();

  // Try extracting from ```json ... ``` code fence if present
  let jsonString = clean;
  const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim();
  } else {
    // If opening brace exists, extract up to the last closing brace
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = clean.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      const title = String(parsed.title || defaultTitle).trim();
      const content = String(parsed.content || clean).trim();
      const suggestedTags = Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags.map((t: any) => String(t).trim()).filter(Boolean)
        : ['#ShopSmall', '#NewArrival', '#MustHave'];
      const suggestedChannels = Array.isArray(parsed.suggestedChannels)
        ? parsed.suggestedChannels.map((c: any) => String(c).trim()).filter(Boolean)
        : ['Shopify Storefront', 'Instagram', 'Email'];

      return { title, content, suggestedTags, suggestedChannels };
    }
  } catch {
    // If strict JSON parsing fails, use the raw text output as content
  }

  return {
    title: defaultTitle,
    content: clean,
    suggestedTags: ['#Ecommerce', '#NewArrival', '#ShopOnline'],
    suggestedChannels: ['Online Store', 'Social Media'],
  };
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callModelChatCompletion = async (
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
  customFetch?: typeof fetch
): Promise<{ content: string; model: string }> => {
  const config = getGemmaConfig();

  if (!config.apiKey) {
    throw new Error('Gemma API key is not configured. Please set GEMMA_API_KEY in backend/.env.');
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  const fetchFn = customFetch || fetch;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'User-Agent': 'HustleKit-AI/1.0',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? config.maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = '';
      try {
        const json = await response.json();
        errorBody = json?.error?.message || json?.message || JSON.stringify(json);
      } catch {
        errorBody = await response.text().catch(() => '');
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Gemma provider authentication failed. Please verify that your GEMMA_API_KEY is valid.'
        );
      }

      if (response.status === 429) {
        throw new Error(
          'Gemma provider rate limit exceeded. Please wait a few moments before trying again.'
        );
      }

      if (response.status >= 500) {
        throw new Error(
          `Gemma provider service temporarily unavailable (status ${response.status}). Please try again later.`
        );
      }

      throw new Error(`Gemma provider error (${response.status}): ${errorBody || 'Request failed'}`);
    }

    const data: any = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      throw new Error('Gemma provider returned an empty or invalid completion response.');
    }

    return {
      content: rawContent,
      model: config.model,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error(
        `Gemma request timed out after ${config.timeoutMs / 1000}s. Upstream provider did not respond in time.`
      );
    }
    throw err;
  }
};

export const generateWithGemma = async (
  req: ContentGenerationRequest,
  customFetch?: typeof fetch
): Promise<ContentGenerationResponse> => {
  const config = getGemmaConfig();

  if (!req.productTitle || !req.productTitle.trim()) {
    throw new Error('Product title is required for content generation.');
  }

  const { content: rawContent, model } = await callModelChatCompletion(
    [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(req) },
    ],
    { temperature: 0.7, maxTokens: config.maxTokens },
    customFetch
  );

  const defaultTitle = `${req.productTitle} — ${req.contentType.replace('_', ' ')}`;
  const parsed = parseModelOutput(rawContent, defaultTitle);

  const words = parsed.content.trim().split(/\s+/).filter(Boolean).length;
  const chars = parsed.content.length;

  let providerHost = 'OpenAI-compatible endpoint';
  try {
    providerHost = new URL(config.baseUrl).hostname;
  } catch {
    // ignore
  }

  return {
    id: `gen_gemma_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentType: req.contentType,
    title: parsed.title,
    content: parsed.content,
    wordCount: words,
    characterCount: chars,
    suggestedTags: parsed.suggestedTags,
    suggestedChannels: parsed.suggestedChannels,
    tone: req.tone || 'persuasive',
    timestamp: new Date().toISOString(),
    isDemo: false,
    modelNotice: `Generated with real Gemma model (${model}) via ${providerHost}.`,
    modelUsed: model,
  };
};
