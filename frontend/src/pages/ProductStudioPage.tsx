import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Search,
  Megaphone,
  MessageSquare,
  AlertCircle,
  Tag,
  Share2,
  Sliders,
  Zap,
} from 'lucide-react';
import type {
  ContentType,
  ToneType,
  ProductItem,
  ContentGenerationResponse,
} from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface ProductStudioPageProps {
  products: ProductItem[];
  prefilledProduct?: ProductItem | null;
  onClearPrefill?: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductStudioPage: React.FC<ProductStudioPageProps> = ({
  products,
  prefilledProduct,
  onClearPrefill,
  onShowToast,
}) => {
  // Form State
  const [productTitle, setProductTitle] = useState('');
  const [category, setCategory] = useState('Workspace & Ergonomics');
  const [price, setPrice] = useState('38.00');
  const [features, setFeatures] = useState<string[]>([
    'Vegan leather water-resistant surface',
    'Non-slip natural rubber backing',
    'Laser-stitched edge durability',
  ]);
  const [featureInput, setFeatureInput] = useState('');
  const [targetAudience, setTargetAudience] = useState('Remote professionals, digital nomads, and desk setup minimalists');
  const [tone, setTone] = useState<ToneType>('persuasive');
  const [contentType, setContentType] = useState<ContentType>('product_description');
  const [customerQuery, setCustomerQuery] = useState(
    'Does this desk mat lay completely flat out of the box and is it easy to wipe clean after coffee spills?'
  );

  // Generation & Output State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentGenerationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Apply prefill if redirected from Dashboard or Insights
  useEffect(() => {
    if (prefilledProduct) {
      setProductTitle(prefilledProduct.title);
      setCategory(prefilledProduct.category);
      setPrice(String(prefilledProduct.price));
      if (prefilledProduct.title.includes('Lamp')) {
        setFeatures(['Custom dimming levels', 'USB-C fast charging base', 'Zero flicker eye-care LED']);
        setContentType('promotional_message');
      } else if (prefilledProduct.title.includes('Carabiner')) {
        setFeatures(['Grade 5 Aerospace Titanium', 'Ultra lightweight 18g', 'Bottle opener notch']);
        setContentType('seo_title');
      }
      onClearPrefill?.();
    }
  }, [prefilledProduct, onClearPrefill]);

  const contentTypes: { id: ContentType; label: string; icon: any; desc: string }[] = [
    {
      id: 'product_description',
      label: 'Product Description',
      icon: FileText,
      desc: 'High-converting listing copy for Shopify, Etsy, or WooCommerce',
    },
    {
      id: 'seo_title',
      label: 'SEO Title & Meta',
      icon: Search,
      desc: 'Keyword-optimized titles and search snippet meta descriptions',
    },
    {
      id: 'promotional_message',
      label: 'Promotional / Social',
      icon: Megaphone,
      desc: 'Flash sale announcement, Instagram caption, or launch post',
    },
    {
      id: 'customer_reply',
      label: 'Customer Reply',
      icon: MessageSquare,
      desc: 'Warm, reassuring response to common buyer product queries',
    },
  ];

  const tones: { id: ToneType; label: string; emoji: string }[] = [
    { id: 'persuasive', label: 'Persuasive', emoji: '🎯' },
    { id: 'luxurious', label: 'Luxurious', emoji: '💎' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'concise', label: 'Concise', emoji: '⚡' },
    { id: 'witty', label: 'Witty', emoji: '💡' },
  ];

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    if (!features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleQuickFeatureAdd = (feature: string) => {
    if (!features.includes(feature)) {
      setFeatures([...features, feature]);
    }
  };

  const handlePrefillSelect = (product: ProductItem) => {
    setProductTitle(product.title);
    setCategory(product.category);
    setPrice(String(product.price));
    onShowToast(`Loaded ${product.title}`, 'info');
  };

  const handleGenerate = async () => {
    if (!productTitle.trim()) {
      setError('Please enter a product title to generate content.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await api.generateContent({
        productTitle: productTitle.trim(),
        category,
        price: parseFloat(price) || undefined,
        keyFeatures: features,
        tone,
        contentType,
        targetAudience: targetAudience.trim(),
        customerQuery: contentType === 'customer_reply' ? customerQuery.trim() : undefined,
      });

      setResult(response);
      setEditedContent(response.content);
      setIsEditingContent(false);
      onShowToast('Marketing copy generated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to connect to HustleKit AI backend service.');
      onShowToast('Generation failed: Backend service error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditingContent ? editedContent : (result?.content || '');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onShowToast('Copied copy to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Helper Banner */}
      <div className="rounded-2xl p-5 bg-[#FBF9F5] border border-[#E5E0D8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] shrink-0">
            <Zap className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#0A0A0A] font-sans">
              Solo Seller AI Content Studio
            </h1>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Select or type your product specs on the left. HustleKit AI constructs high-converting copy on the right.
            </p>
          </div>
        </div>

        {/* Quick Product Prefill Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <span className="text-xs font-semibold text-[#57534E] whitespace-nowrap">Load SKU:</span>
          <select
            onChange={(e) => {
              const found = products.find((p) => p.id === e.target.value);
              if (found) handlePrefillSelect(found);
            }}
            defaultValue=""
            className="text-xs bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] w-full sm:w-auto font-medium"
          >
            <option value="" disabled>Choose existing product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (${p.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-6 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] font-sans">
                1. Product Specs &amp; Tone
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#78716C]">* Required</span>
          </div>

          {/* Product Title */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1">
              Product Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Minimalist Leather Desk Mat Pro"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="Workspace & Ergonomics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">
                Retail Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="38.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] font-mono"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1">
              Target Customer Segment
            </label>
            <input
              type="text"
              placeholder="e.g. Remote workers, gamers, digital artists"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
            />
          </div>

          {/* Key Features Chips */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1">
              Key Value Props &amp; Features ({features.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Type a feature and press Add..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-xs text-[#0A0A0A] placeholder-[#78716C] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3.5 py-1.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1C1917] text-[#FBF9F5] text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                Add
              </button>
            </div>

            {/* Feature tags list */}
            <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
              {features.length === 0 ? (
                <span className="text-[11px] text-[#78716C]">No features added yet.</span>
              ) : (
                features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FFFFFF] border border-[#E5E0D8] text-[#0A0A0A] text-xs font-medium shadow-xs"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-[#78716C] hover:text-[#0A0A0A] font-bold p-0.5"
                      aria-label={`Remove ${feat}`}
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick feature suggestions */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-[#78716C]">Quick suggestions:</span>
              {['100% Vegan Leather', 'Fast 24h Shipping', 'Durable Edge Stitching', 'Money-Back Guarantee'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleQuickFeatureAdd(sug)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F5F1EA] hover:bg-[#EBE5DB] text-[#57534E] hover:text-[#0A0A0A] border border-[#E5E0D8] transition-all font-medium"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
              Copywriting Tone of Voice
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                    tone === t.id
                      ? 'bg-[#D4FF00] border-[#171717] text-[#0A0A0A] shadow-sm font-bold'
                      : 'bg-[#FBF9F5] border-[#E5E0D8] text-[#57534E] hover:bg-[#F5F1EA] hover:text-[#0A0A0A]'
                  }`}
                >
                  <span className="text-sm">{t.emoji}</span>
                  <span className="mt-0.5 text-[11px]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Selector */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E0D8]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] font-sans">
                2. Select Content Format
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contentTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = contentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContentType(item.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#F5F1EA] border-[#171717] shadow-sm'
                        : 'bg-[#FFFFFF] border-[#E5E0D8] hover:border-[#171717]/40 hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-[#0A0A0A] text-[#FBF9F5]'
                          : 'bg-[#F5F1EA] text-[#57534E]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#57534E] mt-0.5 leading-snug">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer query context if customer reply selected */}
          {contentType === 'customer_reply' && (
            <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-[#0A0A0A]">
                Customer Message or Question:
              </label>
              <textarea
                rows={2}
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-lg p-2 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]"
                placeholder="Paste the buyer query here..."
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{error}</span>
            </div>
          )}

          {/* Generation Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all border ${
              loading
                ? 'bg-[#F5F1EA] text-[#78716C] border-[#E5E0D8] cursor-not-allowed'
                : 'bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] border-[#171717] active:scale-98'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>Crafting AI Copy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-[#0A0A0A] text-[#0A0A0A]" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Preview Area (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl p-6 bg-[#FFFFFF] border border-[#E5E0D8] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] font-sans">
                2. Generated Output Preview
              </h2>
            </div>

            {result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingContent(!isEditingContent)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F1EA] hover:bg-[#EAE4D9] text-[#0A0A0A] border border-[#E5E0D8] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
                >
                  {isEditingContent ? 'Preview Formatted' : 'Edit Copy'}
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] border border-[#171717] text-xs font-bold shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Dynamic state rendering */}
          {loading ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5E0D8] bg-[#FBF9F5] space-y-4">
              <div className="relative mx-auto w-12 h-12">
                <div className="w-12 h-12 rounded-full border-2 border-[#E5E0D8] border-t-[#0A0A0A] animate-spin" />
                <Sparkles className="w-5 h-5 text-[#0A0A0A] absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">
                HustleKit Engine Synthesizing Content...
              </h3>
              <p className="text-xs text-[#57534E] max-w-sm mx-auto leading-relaxed">
                Analyzing product specs, aligning with <span className="font-semibold text-[#0A0A0A]">{tone}</span> tone parameters, and formatting for optimal conversion.
              </p>
            </div>
          ) : !result ? (
            <EmptyState
              icon={Sparkles}
              title="Ready to Generate"
              description="Fill out the product specs on the left and click 'Generate Content' to see persuasive copy, SEO tags, and multi-channel marketing material."
              actionLabel="Fill Sample & Generate"
              onAction={() => {
                setProductTitle('Minimalist Leather Desk Mat Pro');
                handleGenerate();
              }}
              className="py-16"
            />
          ) : (
            <div className="space-y-4 animate-page-enter">
              {/* Output Header Details */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                <div>
                  <h3 className="text-sm font-bold text-[#0A0A0A] font-sans">{result.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#57534E]">
                    <span>Format: <strong className="text-[#0A0A0A] capitalize font-medium">{result.contentType.replace('_', ' ')}</strong></span>
                    <span>•</span>
                    <span>Tone: <strong className="text-[#0A0A0A] capitalize font-medium">{result.tone}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[#0A0A0A] font-medium bg-[#F5F1EA] px-1.5 py-0.5 rounded border border-[#E5E0D8]">
                      {result.wordCount} words / {result.characterCount} chars
                    </span>
                  </div>
                </div>

                {result.isDemo ? (
                  <Badge variant="demo">Demo Template</Badge>
                ) : (
                  <Badge variant="success">Gemma 2 Live AI</Badge>
                )}
              </div>

              {/* Copy Body Canvas */}
              <div className="rounded-xl border border-[#E5E0D8] bg-[#FBF9F5] p-4">
                {isEditingContent ? (
                  <textarea
                    rows={10}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E0D8] rounded-xl p-3 text-sm text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] font-sans leading-relaxed resize-y break-words"
                  />
                ) : (
                  <div className="text-sm text-[#0A0A0A] whitespace-pre-wrap leading-relaxed select-text font-sans break-words">
                    {result.content}
                  </div>
                )}
              </div>

              {/* Suggested Tags & Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] mb-2 font-sans">
                    <Tag className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>Suggested Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#0A0A0A] border border-[#E5E0D8] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E5E0D8]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] mb-2 font-sans">
                    <Share2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>Recommended Channels</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedChannels.map((ch, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#0A0A0A] border border-[#E5E0D8] font-medium"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer / Model notice */}
              <div
                className={`p-3.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                  result.isDemo
                    ? 'bg-[#FBF9F5] border-amber-300 text-amber-900'
                    : 'bg-[#FBF9F5] border-emerald-300 text-emerald-900'
                }`}
              >
                {result.isDemo ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{result.modelNotice}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
