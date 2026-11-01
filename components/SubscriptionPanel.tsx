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
        className={`fixed inset-0 bg-black/40 z-[400] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-lg bg-white z-[410] shadow-2xl transition-transform duration-500 ease-out border-l border-zinc-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <header className="p-6 sm:p-10 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-serif italic text-zinc-950 tracking-tighter">Alerts & Following</h2>
              <div className="text-[7px] sm:text-[8px] font-black text-[#0F52BA] uppercase tracking-[0.5em]">Notification Settings</div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-all shadow-xs"
            >
              <span className="text-lg sm:text-xl">✕</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 sm:p-10 space-y-10 sm:space-y-16">
            
            {/* Brand Subscriptions */}
            <section className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-serif italic text-zinc-950">Follow Brands</h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  Receive priority notifications when new items arrive from these brands.
                </p>
              </div>

              <form onSubmit={handleAddCustomBrand} className="relative">
                <input 
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder="Enter Brand Name..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl py-4 sm:py-5 px-5 sm:px-6 text-[10px] sm:text-xs font-bold text-zinc-950 focus:border-[#0F52BA] transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-[#0F52BA] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm"
                >
                  Follow
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
                        ? 'bg-[#0F52BA] border-[#0F52BA] text-white shadow-sm' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-[#0F52BA]/40 hover:text-zinc-950'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {(stats.brandSubscriptions || []).filter(b => !AVAILABLE_BRANDS.includes(b)).length > 0 && (
                <div className="space-y-3 sm:space-y-4 pt-4">
                  <div className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-widest">Custom Brands</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(stats.brandSubscriptions || []).filter(b => !AVAILABLE_BRANDS.includes(b)).map(brand => (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border bg-blue-50 border-blue-200 text-[#0F52BA] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
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
                <h3 className="text-lg sm:text-xl font-serif italic text-zinc-950">Style Tag Alerts</h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  Monitor the store for specific style tags. You will be alerted when matching items arrive.
                </p>
              </div>

              <form onSubmit={handleAddCustomTag} className="relative">
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter Style Tag..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl py-4 sm:py-5 px-5 sm:px-6 text-[10px] sm:text-xs font-bold text-zinc-950 focus:border-[#0F52BA] transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-[#0F52BA] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm"
                >
                  Follow
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
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-[#0F52BA]/40 hover:text-zinc-950'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              {(stats.tagSubscriptions || []).filter(t => !AVAILABLE_TAGS.includes(t)).length > 0 && (
                <div className="space-y-3 sm:space-y-4 pt-4">
                  <div className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-widest">Custom Tags</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(stats.tagSubscriptions || []).filter(t => !AVAILABLE_TAGS.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                      >
                        #{tag} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>

          <footer className="p-6 sm:p-10 bg-zinc-50 border-t border-zinc-200">
            <div className="p-4 sm:p-6 bg-white border border-zinc-200 rounded-xl sm:rounded-2xl space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] sm:text-[9px] font-black text-zinc-900 uppercase tracking-widest">Alerts Active</span>
              </div>
              <p className="text-[7px] sm:text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                Subscribed items are monitored 24/7. Notifications will appear upon arrival.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPanel;
