import React from 'react';
import { UserStats, ViewState } from '../types';

interface NavbarProps {
  stats: UserStats;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  logoUrl: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, logoUrl }) => {
  const navItems = [
    { label: 'Flash Sale', view: ViewState.FAMOUS, icon: '⚡' },
    { label: 'Kits & Bundles', view: ViewState.BUNDLES, icon: '🎁' },
    { label: 'Fitting & AI Stylist', view: ViewState.TRY_ON, icon: '✨' },
  ];

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="sticky top-0 z-50 glass-nav-dock border-b border-[#0F52BA]/30 px-6 md:px-10 py-4 flex items-center justify-between shadow-[0_8px_32px_rgba(6,11,24,0.4)]">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => onNavigate(ViewState.LOBBY)}
        >
          <div className="relative">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-12 h-12 rounded-2xl border border-[#C5A880]/30 shadow-[0_0_16px_rgba(197,168,128,0.2)] group-hover:scale-105 group-hover:border-[#C5A880]/60 transition-all duration-500 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md animate-pulse border border-white/10" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-serif italic tracking-tighter leading-none text-white">
              CLOSET<span className="text-[#C5A880] font-sans font-black not-italic ml-1 drop-shadow-[0_0_10px_rgba(197,168,128,0.4)]">KRAZE</span>
            </div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#C5A880]/70 mt-1">Fashion & Style</div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button 
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${
                  isActive 
                    ? 'bg-[#0F52BA]/25 text-[#C5A880] border border-[#C5A880]/40 shadow-[0_0_16px_rgba(197,168,128,0.15)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#C5A880] rounded-full shadow-[0_0_8px_#C5A880]"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;