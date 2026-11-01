import React, { useState } from 'react';
import { Bundle, Product, ViewState } from '../types';
import { Skeleton } from './Skeleton';
import { MessageSquare, Sparkles, Eye, Layers, ArrowUpRight, CheckCircle2, ShieldCheck, Compass, Loader2 } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';

interface BundlesProps {
  bundles: Bundle[];
  onAddBundle: (bundle: Bundle) => void;
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  onNavigate?: (view: ViewState) => void;
}

export const Bundles: React.FC<BundlesProps> = ({ 
  bundles, 
  onAddBundle, 
  loading = false,
  onProductClick,
  onNavigate
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addingBundleId, setAddingBundleId] = useState<string | null>(null);

  const handleWhatsAppShare = (bundle: Bundle, originalTotal: number) => {
    const savings = originalTotal - bundle.bundlePrice;
    const text = `🔥 *CLOSET KRAZE VAULT DROP: ${bundle.name}* 🔥\n\n${bundle.description}\n\n🏷️ *Bundle Price:* GH₵${bundle.bundlePrice} *(Save GH₵${savings})*\n📦 Curated Fashion & Style Kit.\n\n⚡ Claim yours instantly: https://closetkraze.top/kits`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setCopiedId(bundle.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleProductCardClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (!onProductClick) return;

    // Normalize product object to ensure all required fields for ProductDetail
    const normalizedProduct: Product = {
      id: product.id || `prod_${Date.now()}`,
      name: product.name || 'Vault Curated Piece',
      price: product.price || 150,
      originalPrice: product.originalPrice || product.price || 180,
      image: product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
      images: product.images && product.images.length > 0 
        ? product.images 
        : [product.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'],
      category: product.category || 'Vault Piece',
      description: product.description || 'Archival curated piece verified for the Closet Kraze vault in Kumasi, Ghana.',
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['M', 'L', 'XL'],
      inStock: product.inStock !== false,
      stock: product.stock ?? 10,
      isGrail: Boolean(product.isGrail),
      isFamous: Boolean(product.isFamous),
      isNewDrop: Boolean(product.isNewDrop),
      tags: product.tags || ['Curated', 'Archival'],
      views: product.views || 0,
      purchases: product.purchases || 0,
      rating: product.rating || 4.9,
      reviewCount: product.reviewCount || 12,
      supplierId: product.supplierId || 'vault_internal',
      weightGsm: product.weightGsm || 280,
      zipperType: product.zipperType || 'YKK Metal',
      fabricComposition: product.fabricComposition || '100% Premium Heavyweight Cotton',
      ...product
    };

    onProductClick(normalizedProduct);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 space-y-12 pb-32 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-20">
          <div className="space-y-4 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 md:h-32 w-64" />
            <Skeleton className="h-10 w-full max-w-sm" />
          </div>
          <Skeleton className="h-4 w-48 hidden md:block" />
        </header>

        <div className="space-y-24">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="py-24 space-y-12">
              <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16" />
                    <Skeleton className="h-12 w-64" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-lg" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-8 w-48 ml-auto" />
                  <Skeleton className="h-4 w-32 ml-auto" />
                </div>
              </div>
              <div className="flex gap-8 overflow-hidden">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="min-w-[280px] md:min-w-[320px] aspect-[3/4]" />
                ))}
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-16 w-64" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-6 space-y-8 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8 sm:pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#0F52BA] animate-pulse"></div>
             <span className="text-[10px] font-black text-[#C5A880] uppercase tracking-[0.5em]">Curated Ensembles & Kits</span>
          </div>
          <h1 className="text-6xl sm:text-7xl md:text-9xl font-serif italic text-white tracking-tighter leading-none">Kits & Bundles</h1>
          <p className="text-zinc-400 text-[11px] sm:text-xs font-mono uppercase tracking-[0.3em] max-w-xl leading-relaxed">
            Curated outfit bundles and complementary pieces. Click any individual item inside a kit to inspect full specifications, fabrics, and sizes.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[1em]">EXCLUSIVE_COLLECTION</span>
        </div>
      </header>

      {/* Friend Group Pricing Notice Banner */}
      <div className="p-6 glass-sapphire-22-5 border border-[#0F52BA]/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Friend Group Pricing Active</h3>
            <p className="text-zinc-400 text-[11px] mt-0.5">Pool orders with your inner circle. Enjoy an automatic 10% discount when acquiring 3 or more bundles together.</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-[#C5A880] uppercase tracking-[0.3em] bg-black/40 px-4 py-2 rounded-lg border border-[#C5A880]/30 whitespace-nowrap">
          -10% Bulk Privilege
        </div>
      </div>


      {bundles.length === 0 ? (
        <div className="py-20 px-6 rounded-3xl border border-white/10 bg-[#0B132B]/40 text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0F52BA]/20 border border-[#0F52BA]/40 text-[#C5A880] mx-auto flex items-center justify-center shadow-lg shadow-[#0F52BA]/10">
            <Layers className="w-8 h-8 text-[#C5A880]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">No Kits & Bundles Currently Active</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
              Our stylists and curators are assembling the next wave of coordinated lookbooks and multi-piece style kits. All individual pieces remain available in our catalog.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(ViewState.CATEGORIES)}
                className="px-6 py-3 rounded-xl bg-[#0F52BA] hover:bg-[#0F52BA]/80 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#0F52BA]/30 cursor-pointer flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Catalog Collections</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const text = encodeURIComponent("Hello Closet Kraze, I would like to inquire about curated outfit kits and style bundles!");
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Request Custom Style Kit</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {bundles.map((bundle, idx) => {
          const originalTotal = bundle.products && bundle.products.length > 0 
            ? bundle.products.reduce((acc: number, p: any) => acc + (p.originalPrice || p.price || 100), 0)
            : bundle.originalPrice || bundle.bundlePrice * 1.2;
          const savings = originalTotal - bundle.bundlePrice;
          const discountPercent = Math.round((savings / originalTotal) * 100);
          const hasProducts = bundle.products && bundle.products.length > 0;

          return (
            <div key={bundle.id} className="group py-16 md:py-24 space-y-10 hover:bg-white/[0.01] transition-all duration-500 px-2 sm:px-4 rounded-3xl">
              {/* Bundle Header & Pricing */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl sm:text-5xl md:text-7xl font-serif italic text-white/20 group-hover:text-white/40 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif italic text-white group-hover:text-[#C5A880] transition-colors">{bundle.name}</h2>
                  </div>
                  <p className="text-zinc-400 text-xs uppercase tracking-[0.2em] max-w-xl leading-relaxed">
                    {bundle.description}
                  </p>
                </div>
                
                <div className="text-left md:text-right space-y-2 shrink-0 bg-zinc-900/40 md:bg-transparent p-4 md:p-0 rounded-2xl border border-zinc-800 md:border-0 w-full md:w-auto">
                  <div className="flex items-center md:justify-end gap-4">
                    <span className="text-zinc-500 line-through font-mono text-lg md:text-xl">GH₵{originalTotal}</span>
                    <span className="text-3xl md:text-4xl font-mono font-black text-white">GH₵{bundle.bundlePrice}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#C5A880] uppercase tracking-[0.3em] bg-[#C5A880]/10 px-3 py-1 rounded-full border border-[#C5A880]/20">
                    <Sparkles size={11} />
                    Save GH₵{savings} (-{discountPercent}%)
                  </div>
                </div>
              </div>

              {/* INDIVIDUAL PRODUCTS BREAKDOWN IN BUNDLE */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Layers className="text-[#00D1FF]" size={16} />
                    <h3 className="text-xs sm:text-sm font-mono font-black text-white uppercase tracking-[0.2em]">
                      Included Pieces ({bundle.products?.length || 0} items)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <Eye size={13} className="text-[#00D1FF]" />
                    <span>Click any item to inspect details & sizing</span>
                  </span>
                </div>

                {hasProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-2">
                    {bundle.products.map((product: any, pIdx: number) => {
                      const itemImg = getImageUrl(product.image || (product.images && product.images[0]));
                      return (
                        <div
                          key={product.id || pIdx}
                          onClick={(e) => handleProductCardClick(e, product)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleProductCardClick(e as any, product);
                            }
                          }}
                          className="group/card relative bg-zinc-950/80 border border-zinc-800/90 hover:border-[#00D1FF]/60 hover:shadow-[0_0_25px_rgba(0,209,255,0.15)] rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                        >
                          {/* Image Container */}
                          <div className="aspect-[3/4] w-full bg-zinc-900 rounded-xl overflow-hidden relative border border-white/5 mb-3">
                            <img 
                              src={itemImg} 
                              alt={product.name || 'Bundle item'}
                              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" 
                              loading="lazy"
                            />

                            {/* Floating Top Badge */}
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-zinc-300">
                              <span className="text-[#00D1FF]">Item {String(pIdx + 1).padStart(2, '0')}</span>
                            </div>

                            {/* Inspect Overlay Trigger */}
                            <div className="absolute top-2 right-2 bg-[#00D1FF]/90 text-zinc-950 px-2 py-1 rounded-md text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity shadow-lg">
                              <Eye size={11} />
                              <span>Inspect</span>
                            </div>

                            {/* Hover Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end p-3">
                              <div className="text-[10px] font-mono text-[#00D1FF] flex items-center gap-1">
                                <span>Tap to view full grail details</span>
                                <ArrowUpRight size={12} />
                              </div>
                            </div>
                          </div>

                          {/* Product Details Content */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-mono font-bold text-[#00D1FF] uppercase tracking-widest truncate">
                                {product.category || 'Vault Piece'}
                              </span>
                              {product.sizes && product.sizes.length > 0 && (
                                <span className="text-[8px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                  {product.sizes.slice(0, 3).join('/')}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white group-hover/card:text-[#00D1FF] transition-colors line-clamp-1">
                              {product.name || 'Vault Curated Silhouette'}
                            </h4>

                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Individual Value</span>
                                <span className="text-xs font-mono font-bold text-zinc-200">
                                  GH₵{product.price || 150}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleProductCardClick(e, product)}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-[#00D1FF] hover:text-zinc-950 text-[#00D1FF] text-[9px] font-mono font-bold uppercase rounded-lg border border-[#00D1FF]/30 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Eye size={10} />
                                <span>Specs</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
                    <p className="text-xs font-mono text-zinc-400">Curated pieces are synchronized into this bundle.</p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(bundle, originalTotal)}
                  className="h-14 px-6 sm:px-8 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-black uppercase tracking-[0.25em] hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3 rounded-2xl shadow-lg active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  {copiedId === bundle.id ? 'Broadcast Link Copied!' : 'Share Bundle on WhatsApp'}
                </button>

                <button 
                  type="button"
                  disabled={addingBundleId === bundle.id}
                  onClick={() => {
                    if (addingBundleId) return;
                    setAddingBundleId(bundle.id);
                    setTimeout(() => {
                      onAddBundle(bundle);
                      setAddingBundleId(null);
                    }, 400);
                  }}
                  className={`h-14 sm:h-16 px-8 sm:px-14 text-white text-[11px] font-mono font-black uppercase tracking-[0.3em] transition-all active:scale-95 rounded-2xl flex items-center justify-center gap-3 cursor-pointer ${
                    addingBundleId === bundle.id
                      ? 'bg-[#09285E] text-amber-300 border border-[#C5A880] shadow-xl'
                      : 'bg-[#0F52BA] hover:bg-white hover:text-black shadow-[0_0_40px_rgba(15,82,186,0.3)]'
                  }`}
                >
                  {addingBundleId === bundle.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Adding Kit Pieces...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add Synergy Kit (GH₵{bundle.bundlePrice})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Bundles;
