import { Router, Request, Response } from 'express';
import { ContentGenerationRequest, ContentGenerationResponse } from '../types';
import {
  generateWithGemma,
  isGemmaConfigured,
  isMockFallbackEnabled,
  getGemmaConfig,
} from '../services/gemma.service';
import { saveGeneratedContent, getGeneratedContentHistory } from '../db/mongo';
import { aiRateLimiter } from '../middleware/rateLimiter';

export const contentRouter = Router();

// Fallback in-memory template generator (used strictly when ENABLE_MOCK_FALLBACK=true)
export const generateDemoTemplateCopy = (
  req: ContentGenerationRequest
): { title: string; content: string; tags: string[]; channels: string[] } => {
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

  const featuresList =
    keyFeatures && keyFeatures.length > 0
      ? keyFeatures
      : ['Handcrafted premium build', 'Durable materials', 'Fast shipping'];
  const audience = targetAudience || 'discerning customers and modern shoppers';
  const priceDisplay = price ? `$${price}` : 'value-driven pricing';

  switch (contentType) {
    case 'product_description': {
      if (tone === 'luxurious') {
        return {
          title: `Exclusive Edition: ${productTitle}`,
          content: `Indulge in meticulous craftsmanship with the ${productTitle}. Designed exclusively for ${audience}, this signature piece in our ${category} collection combines timeless aesthetic elegance with superior utility.\n\n✨ Why you will love it:\n${featuresList.map((f) => `• ${f} - engineered to perfection`).join('\n')}\n\nElevate your everyday standard with unmatched distinction at ${priceDisplay}.`,
          tags: ['#LuxuryLiving', `#${category.replace(/\s+/g, '')}`, '#ArtisanCrafted', '#PremiumDesign'],
          channels: ['Online Storefront', 'Etsy / Shopify', 'Instagram Showcase'],
        };
      }
      return {
        title: `The All-New ${productTitle} — Made For Everyday Excellence`,
        content: `Looking for the ultimate upgrade in ${category}? The ${productTitle} is designed specifically for ${audience} who demand performance, style, and reliability.\n\nKey Highlights:\n${featuresList.map((f) => `• ${f}`).join('\n')}\n\nAvailable now for only ${priceDisplay}. Order today and discover why creators and customers trust our curated essentials.`,
        tags: ['#Ecommerce', `#${category.replace(/\s+/g, '')}`, '#MustHave', '#ShopSmall', '#BestSeller'],
        channels: ['Shopify', 'Amazon', 'Product Landing Page'],
      };
    }

    case 'seo_title': {
      return {
        title: `SEO Optimized Meta Title & Slug for ${productTitle}`,
        content: `Title Tag (58 chars):\nBest ${productTitle} for ${audience} | High Quality ${category}\n\nMeta Description (154 chars):\nDiscover the top-rated ${productTitle}. Featuring ${featuresList.slice(0, 2).join(' & ')} at only ${priceDisplay}. Fast shipping, guaranteed satisfaction. Shop now!\n\nTarget Keywords:\n${productTitle.toLowerCase()}, buy ${productTitle.toLowerCase()}, ${category.toLowerCase()} reviews, best ${category.toLowerCase()}`,
        tags: ['#SEO', '#GoogleRanking', '#OrganicTraffic', '#MetaDescription'],
        channels: ['Google Search', 'Bing', 'Social Sharing Previews'],
      };
    }

    case 'promotional_message': {
      return {
        title: `Flash Campaign Copy: ${productTitle}`,
        content: `🚀 Weekend Spotlight: Unlock 15% OFF ${productTitle}!\n\nHey everyone! For the next 48 hours only, grab our best-selling ${productTitle} (${category}) at an exclusive creator perk: just ${priceDisplay}.\n\n🔥 Here is why everyone loves it:\n${featuresList.map((f) => `✔️ ${f}`).join('\n')}\n\n👉 Tap the link in bio to secure yours before stock sells out! Use code: HUSTLE15 at checkout.`,
        tags: ['#PromoDeal', '#LimitedTime', '#ShopNow', '#FlashSale', '#DiscountCode'],
        channels: ['Instagram Caption', 'TikTok Bio Link', 'Email Newsletter', 'Twitter/X Post'],
      };
    }

    case 'customer_reply': {
      const queryContext = customerQuery || 'inquiring about shipping timeframe, quality guarantee, and specs';
      return {
        title: `Polished Support Response for ${productTitle}`,
        content: `Hi there! 👋\n\nThank you so much for reaching out to us about the ${productTitle}! We're thrilled you're interested.\n\nRegarding your question about ${queryContext}: We stand 100% behind our ${category} line. Each order features ${featuresList[0] || 'our premium quality warranty'} and typically ships within 24–48 hours directly to your doorstep with real-time tracking.\n\nIf you have any further questions or need help picking the perfect option at ${priceDisplay}, I'm right here to help.\n\nWarm regards,\nThe HustleKit Support Team`,
        tags: ['#CustomerSuccess', '#FastReply', '#StoreTrust', '#CustomerService'],
        channels: ['Email Support', 'Instagram Direct Message', 'Etsy Conversation', 'Live Chat'],
      };
    }

    default:
      return {
        title: `${productTitle} Copy`,
        content: `Discover the ${productTitle} in our ${category} lineup. Features include ${featuresList.join(', ')}.`,
        tags: ['#Product'],
        channels: ['General Store'],
      };
  }
};

contentRouter.post('/generate', aiRateLimiter, async (req: Request, res: Response) => {
  const body = req.body as ContentGenerationRequest;

  if (!body || !body.productTitle || !body.productTitle.trim()) {
    res.status(400).json({
      error: 'Product title is required to generate marketing copy.',
    });
    return;
  }

  // Branch 1: Real Gemma model inference
  if (isGemmaConfigured()) {
    try {
      const result = await generateWithGemma(body);
      // Persist generated copy to MongoDB Atlas / memory
      await saveGeneratedContent('default', result).catch((e) =>
        console.warn('[DB] Failed to persist generated copy:', e.message)
      );
      res.status(200).json(result);
      return;
    } catch (err: any) {
      console.error('[Gemma Inference Error]:', err.message);

      // Map error types to HTTP status codes
      let statusCode = 502;
      if (err.message?.includes('authentication failed')) statusCode = 401;
      else if (err.message?.includes('rate limit')) statusCode = 429;
      else if (err.message?.includes('timed out')) statusCode = 504;

      res.status(statusCode).json({
        error: err.message || 'An error occurred during Gemma inference.',
        model: getGemmaConfig().model,
      });
      return;
    }
  }

  // Branch 2: Explicitly enabled mock/demo fallback
  if (isMockFallbackEnabled()) {
    const generated = generateDemoTemplateCopy(body);
    const words = generated.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = generated.content.length;

    const response: ContentGenerationResponse = {
      id: `gen_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contentType: body.contentType || 'product_description',
      title: generated.title,
      content: generated.content,
      wordCount: words,
      characterCount: chars,
      suggestedTags: generated.tags,
      suggestedChannels: generated.channels,
      tone: body.tone || 'persuasive',
      timestamp: new Date().toISOString(),
      isDemo: true,
      modelNotice:
        'Generated via HustleKit Demo Template Engine (mock mode explicitly enabled). Real Gemma inference is inactive.',
      modelUsed: 'template_engine',
    };

    setTimeout(() => {
      res.status(200).json(response);
    }, 350);
    return;
  }

  // Branch 3: Gemma not configured and mock mode not enabled (Default safe behavior)
  res.status(503).json({
    error:
      'Gemma AI inference is not configured. Please add GEMMA_API_KEY to backend/.env to generate live copy, or set ENABLE_MOCK_FALLBACK=true to use demo templates.',
    code: 'GEMMA_NOT_CONFIGURED',
  });
});

// GET /api/content/history
contentRouter.get('/content/history', async (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'default';
  try {
    const history = await getGeneratedContentHistory(workspaceId);
    res.status(200).json({ data: history, count: history.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve content history' });
  }
});

