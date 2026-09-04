import React, { useState } from 'react';
import { UserStats } from '../types';

interface SubscriptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onUpdateSubscriptions: (brands: string[], tags: string[]) => void;
}

const AVAILABLE_BRANDS = ["NEO-TECH", "GLITCH", "VOID-ARCHITECT", "CHROME-LUXE", "TITAN-IND", "VOID-ESSENCE"];
const AVAILABLE_TAGS = ["CYBER", "TECHWEAR", "POWER", "STREETWEAR", "UTILITY", "CLASSIC", "LUXE", "VOID", "INDUSTRIAL", "OLD MONEY"];

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({ 
  isOpen, 
  onClose, 
  stats, 
  onUpdateSubscriptions 
}) => {
  const [brandInput, setBrandInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const toggleBrand = (brand: string) => {
    const current = stats.brandSubscriptions || [];
    const updated = current.includes(brand) 
      ? current.filter(b => b !== brand) 
      : [...current, brand];
    onUpdateSubscriptions(updated, stats.tagSubscriptions || []);
  };

  const toggleTag = (tag: string) => {
    const current = stats.tagSubscriptions || [];
    const updated = current.includes(tag) 
      ? current.filter(t => t !== tag) 
      : [...current, tag];
    onUpdateSubscriptions(stats.brandSubscriptions || [], updated);
  };

  const handleAddCustomBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (brandInput.trim()) {
      const brand = brandInput.trim().toUpperCase();
      if (!(stats.brandSubscriptions || []).includes(brand)) {
        toggleBrand(brand);
      }
      setBrandInput('');
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      const tag = tagInput.trim().toUpperCase();
      if (!(stats.tagSubscriptions || []).includes(tag)) {
        toggleTag(tag);
      }
      setTagInput('');
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[400] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-lg glass-grey z-[410] shadow-2xl transition-transform duration-500 ease-out border-l border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <header className="p-6 sm:p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white tracking-tighter">Neural Subscriptions</h2>
              <div className="text-[7px] sm:text-[8px] font-black text-[#00D1FF] uppercase tracking-[0.5em]">Signal_Monitoring_Protocol</div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <span className="text-lg sm:text-xl">✕</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 sm:p-10 space-y-10 sm:space-y-16">
            
            {/* Brand Subscriptions */}
            <section className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Brand Uplinks</h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  Receive priority notifications when new silhouettes materialize from these creators.
                </p>
              </div>

              <form onSubmit={handleAddCustomBrand} className="relative">
                <input 
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder="Enter Brand Identity..."
                  className="w-full glass-light border border-white/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 px-5 sm:px-6 text-[10px] sm:text-xs font-black text-white focus:border-[#00D1FF] transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest hover:bg-[#00D1FF] hover:text-white transition-all"
                >
                  Link
                </button>
              </form>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {AVAILABLE_BRANDS.map(brand => {
                  const isActive = (stats.brandSubscriptions || []).includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isActive 
                        ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-[0_0_15px_rgba(0,209,255,0.3)]' 
                        : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {(stats.brandSubscriptions || []).filter(b => !AVAILABLE_BRANDS.includes(b)).length > 0 && (
                <div className="space-y-3 sm:space-y-4 pt-4">
                  <div className="text-[7px] sm:text-[8px] font-black text-zinc-700 uppercase tracking-widest">Custom Uplinks</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(stats.brandSubscriptions || []).filter(b => !AVAILABLE_BRANDS.includes(b)).map(brand => (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border bg-[#00D1FF]/20 border-[#00D1FF]/40 text-[#00D1FF] hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-500 transition-all"
                      >
                        {brand} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Tag Subscriptions */}
            <section className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Archetype Triggers</h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  Monitor the archive for specific style tags. System will alert on new matches.
                </p>
              </div>

              <form onSubmit={handleAddCustomTag} className="relative">
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter Style Tag..."
                  className="w-full glass-light border border-white/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 px-5 sm:px-6 text-[10px] sm:text-xs font-black text-white focus:border-emerald-500 transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                >
                  Trigger
                </button>
              </form>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {AVAILABLE_TAGS.map(tag => {
                  const isActive = (stats.tagSubscriptions || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isActive 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              {(stats.tagSubscriptions || []).filter(t => !AVAILABLE_TAGS.includes(t)).length > 0 && (
                <div className="space-y-3 sm:space-y-4 pt-4">
                  <div className="text-[7px] sm:text-[8px] font-black text-zinc-700 uppercase tracking-widest">Custom Triggers</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(stats.tagSubscriptions || []).filter(t => !AVAILABLE_TAGS.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border bg-emerald-500/20 border-emerald-500/40 text-emerald-500 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-500 transition-all"
                      >
                        #{tag} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>

          <footer className="p-6 sm:p-10 bg-white/5 border-t border-white/5">
            <div className="p-4 sm:p-6 glass-light border border-white/5 rounded-xl sm:rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest">Neural Watch Active</span>
              </div>
              <p className="text-[7px] sm:text-[8px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                Subscribed signals are monitored 24/7. Notifications will appear in your neural center upon detection.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPanel;
