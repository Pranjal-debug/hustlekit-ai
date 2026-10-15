import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateWithGemma, getGemmaConfig } from '../gemma.service';
import { ContentGenerationRequest } from '../../types';

describe('Gemma Service Unit Tests', () => {
  const sampleRequest: ContentGenerationRequest = {
    productTitle: 'AeroGrip Ergonomic Mouse Pad',
    category: 'Workspace Accessories',
    price: 34.99,
    keyFeatures: ['Memory foam wrist rest', 'Micro-textured tracking cloth', 'Non-skid base'],
    tone: 'persuasive',
    contentType: 'product_description',
    targetAudience: 'Programmers and digital designers',
  };

  beforeEach(() => {
    process.env.GEMMA_API_KEY = 'test_key_mock_123';
    process.env.GEMMA_API_BASE_URL = 'https://mock.api.endpoint/v1';
    process.env.GEMMA_MODEL = 'google/gemma-2-9b-it';
    process.env.GEMMA_TIMEOUT_MS = '2000';
    process.env.ENABLE_MOCK_FALLBACK = 'false';
  });

  it('successfully parses valid JSON response from Gemma provider', async () => {
    const mockProviderResponse = {
      id: 'chatcmpl-test-001',
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'AeroGrip: The Ergonomic Upgrade Your Wrists Deserve',
              content: 'Say goodbye to wrist fatigue with the AeroGrip Ergonomic Mouse Pad. Engineered for programmers who demand precision.',
              suggestedTags: ['#Ergonomics', '#Workspace', '#DeskSetup', '#TechEssentials'],
              suggestedChannels: ['Shopify Store', 'Reddit r/battlestations', 'Instagram'],
            }),
          },
        },
      ],
    };

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify(mockProviderResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await generateWithGemma(sampleRequest, mockFetch);

    assert.equal(result.isDemo, false, 'Live generation must have isDemo: false');
    assert.equal(result.title, 'AeroGrip: The Ergonomic Upgrade Your Wrists Deserve');
    assert.ok(result.content.includes('wrist fatigue'));
    assert.equal(result.suggestedTags.length, 4);
    assert.equal(result.modelUsed, 'google/gemma-2-9b-it');
    assert.ok(result.modelNotice.includes('google/gemma-2-9b-it'));
    assert.ok(result.wordCount > 10);
  });

  it('handles markdown fenced JSON response from Gemma', async () => {
    const mockFencedResponse = {
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify({
              title: 'SEO Title: Best Ergonomic Mouse Pad 2026',
              content: 'High-performance memory foam mouse pad engineered for zero fatigue.',
              suggestedTags: ['#SEO', '#Ergonomics'],
              suggestedChannels: ['Google Search'],
            }) + "\n```",
          },
        },
      ],
    };

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify(mockFencedResponse), { status: 200 });
    };

    const result = await generateWithGemma(sampleRequest, mockFetch);
    assert.equal(result.isDemo, false);
    assert.equal(result.title, 'SEO Title: Best Ergonomic Mouse Pad 2026');
  });

  it('gracefully handles unstructured non-JSON output without crashing', async () => {
    const mockRawTextResponse = {
      choices: [
        {
          message: {
            content: 'Introducing the AeroGrip Mouse Pad! Features memory foam, ultra-smooth cloth, and non-slip rubber.',
          },
        },
      ],
    };

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify(mockRawTextResponse), { status: 200 });
    };

    const result = await generateWithGemma(sampleRequest, mockFetch);
    assert.equal(result.isDemo, false);
    assert.ok(result.content.includes('Introducing the AeroGrip'));
    assert.ok(result.suggestedTags.length > 0);
  });

  it('handles 401 authentication error without leaking API key', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: { message: 'Invalid API key provided' } }), {
        status: 401,
      });
    };

    await assert.rejects(
      async () => {
        await generateWithGemma(sampleRequest, mockFetch);
      },
      (err: Error) => {
        assert.ok(err.message.includes('authentication failed'));
        // Verify key is not leaked in message
        assert.ok(!err.message.includes('test_key_mock_123'));
        return true;
      }
    );
  });

  it('handles 429 rate limit error', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: { message: 'Rate limit reached' } }), {
        status: 429,
      });
    };

    await assert.rejects(
      async () => {
        await generateWithGemma(sampleRequest, mockFetch);
      },
      (err: Error) => {
        assert.ok(err.message.includes('rate limit exceeded'));
        return true;
      }
    );
  });

  it('handles provider 500 server error', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response('Internal Server Error', { status: 500 });
    };

    await assert.rejects(
      async () => {
        await generateWithGemma(sampleRequest, mockFetch);
      },
      (err: Error) => {
        assert.ok(err.message.includes('service temporarily unavailable'));
        return true;
      }
    );
  });

  it('throws error when GEMMA_API_KEY is missing', async () => {
    delete process.env.GEMMA_API_KEY;

    await assert.rejects(
      async () => {
        await generateWithGemma(sampleRequest);
      },
      (err: Error) => {
        assert.ok(err.message.includes('Gemma API key is not configured'));
        return true;
      }
    );
  });

  it('throws error when productTitle is blank', async () => {
    await assert.rejects(
      async () => {
        await generateWithGemma({
          ...sampleRequest,
          productTitle: '   ',
        });
      },
      (err: Error) => {
        assert.ok(err.message.includes('Product title is required'));
        return true;
      }
    );
  });
});
