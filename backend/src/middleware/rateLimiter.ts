import rateLimit, { MemoryStore } from 'express-rate-limit';

export const aiRateLimiterStore = new MemoryStore();

/**
 * AI Endpoint Rate Limiter (Fix F-03)
 * Protects expensive inference endpoints from abuse and DoS.
 * - Window: 5 minutes (300,000 ms)
 * - Limit: 20 requests per IP per window
 * - Response: HTTP 429 Too Many Requests
 * - Standard headers: Draft-6 RateLimit-* headers enabled (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
 * - Safe proxy IP evaluation via Express 'trust proxy: 1'
 *
 * Deployment limitation:
 * Uses standard in-memory store suitable for single-instance deployments
 * (e.g., Render Web Service). Multi-instance or horizontally scaled
 * clusters require an external distributed store like Redis (rate-limit-redis).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  statusCode: 429,
  store: aiRateLimiterStore,
  message: {
    error: 'Too many AI generation requests from this IP. Please try again after 5 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

/**
 * Resets the in-memory rate limiter store (used in test teardown).
 */
export const resetAiRateLimiter = async (): Promise<void> => {
  await aiRateLimiterStore.resetAll();
};
