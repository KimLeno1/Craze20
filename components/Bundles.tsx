import React, { useState } from 'react';
import { Bundle } from '../types';
import { Skeleton } from './Skeleton';
import { MessageSquare, Sparkles } from 'lucide-react';

interface BundlesProps {
  bundles: Bundle[];
  onAddBundle: (bundle: Bundle) => void;
  loading?: boolean;
}

const Bundles: React.FC<BundlesProps> = ({ bundles, onAddBundle, loading = false }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleWhatsAppShare = (bundle: Bundle, originalTotal: number) => {
    const savings = originalTotal - bundle.bundlePrice;
    const text = `🔥 *CLOSET KRAZE VAULT DROP: ${bundle.name}* 🔥\n\n${bundle.description}\n\n🏷️ *Bundle Price:* GH₵${bundle.bundlePrice} *(Save GH₵${savings})*\n📦 Curated Fashion & Style Kit.\n\n⚡ Claim yours instantly: https://closetkraze.top/kits`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setCopiedId(bundle.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (loading || bundles.length === 0) {
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
    <div className="p-6 md:p-12 space-y-12 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#0F52BA] animate-pulse"></div>
             <span className="text-[10px] font-black text-[#C5A880] uppercase tracking-[0.5em]">Curated Ensembles & Kits</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-serif italic text-white tracking-tighter leading-none">Kits & Bundles</h1>
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] max-w-lg leading-relaxed">
            Curated archives of synchronized silhouettes and complementary styling. Order 3+ bundles for automatic 10% Friend Group discount.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[1em]">EXCLUSIVE_COLLECTION</span>
        </div>
      </header>

      {/* Friend Group Pricing Notice Banner */}
      <div className="p-6 glass-sapphire-22-5 border border-[#0F52BA]/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Friend Group Pricing Active</h3>
            <p className="text-zinc-400 text-[11px] mt-0.5">Pool orders with your inner circle. Enjoy an automatic 10% discount when acquiring 3 or more bundles together.</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-[#C5A880] uppercase tracking-[0.3em] bg-black/40 px-4 py-2 rounded-lg border border-[#C5A880]/30">
          -10% Bulk Privilege
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {bundles.map((bundle, idx) => {
          const originalTotal = bundle.products && bundle.products.length > 0 
            ? bundle.products.reduce((acc: number, p: any) => acc + (p.originalPrice || p.price || 100), 0)
            : bundle.originalPrice || bundle.bundlePrice * 1.2;
          const savings = originalTotal - bundle.bundlePrice;
          const discountPercent = Math.round((savings / originalTotal) * 100);

          return (
            <div key={bundle.id} className="group py-24 space-y-12 hover:bg-white/[0.01] transition-all duration-500 px-4">
              <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl md:text-7xl font-serif italic text-white/20 group-hover:text-white/40 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-serif italic text-white group-hover:text-[#C5A880] transition-colors">{bundle.name}</h2>
                  </div>
                  <p className="text-zinc-400 text-xs uppercase tracking-[0.2em] max-w-xl leading-relaxed">
                    {bundle.description}
                  </p>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-zinc-600 line-through font-mono text-xl">GH₵{originalTotal}</span>
                    <span className="text-4xl font-mono text-white">GH₵{bundle.bundlePrice}</span>
                  </div>
                  <div className="text-[10px] font-black text-[#C5A880] uppercase tracking-[0.4em]">
                    Save GH₵{savings} (-{discountPercent}%)
                  </div>
                </div>
              </div>

              {bundle.products && bundle.products.length > 0 && (
                <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x">
                  {bundle.products.map((p: any) => (
                    <div key={p.id} className="min-w-[220px] sm:min-w-[280px] md:min-w-[320px] aspect-[3/4] overflow-hidden glass-sapphire-22-5 border border-[#0F52BA]/40 snap-center group/card relative rounded-xl">
                      <img src={p.image || (p.images && p.images[0])} className="w-full h-full object-cover group-hover/card:scale-105 transition-all duration-1000" alt={p.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                        <div className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{p.name}</div>
                        <div className="text-[8px] text-[#C5A880] uppercase tracking-widest mt-1 font-mono">GH₵{p.price} • {p.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
                <button
                  onClick={() => handleWhatsAppShare(bundle, originalTotal)}
                  className="h-14 px-8 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 rounded-xl"
                >
                  <MessageSquare className="w-4 h-4" />
                  {copiedId === bundle.id ? 'Broadcast Link Copied!' : 'Share Bundle on WhatsApp'}
                </button>

                <button 
                  onClick={() => onAddBundle(bundle)}
                  className="h-16 px-16 bg-[#0F52BA] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all shadow-[0_0_40px_rgba(15,82,186,0.3)] active:scale-95 rounded-xl"
                >
                  Add Synergy Kit (GH₵{bundle.bundlePrice})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Bundles;
