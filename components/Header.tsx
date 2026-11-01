
import React from 'react';
import { ViewState, UserStats, Page } from '../types';
import { ShoppingCart, Search, Bell, Heart } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  stats: UserStats;
  onCartOpen: () => void;
  onOpenSearch: () => void;
  onNavigatePage: (page: Page) => void;
  onNavigateView: (view: ViewState) => void;
  onNotificationOpen: () => void;
  currentPage: Page;
  currentView: ViewState;
  dropTime: number;
  onOpenCategories?: () => void;
  theme?: 'dark' | 'light';
  rep: number;
  handle: string;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  wishlistCount = 0,
  onCartOpen,
  onOpenSearch,
  onNavigateView, 
  onNotificationOpen, 
  currentView,
  handle,
}) => {
  return (
    <nav className="fixed top-[6px] left-[6px] right-[6px] z-50 glass-header-bar rounded-[2rem] p-3 space-y-2.5 max-w-7xl mx-auto">
      {/* Top Row: Brand & Profile Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="flex flex-col cursor-pointer select-none" 
            onClick={() => onNavigateView(ViewState.LOBBY)}
          >
            <h1 className="text-lg md:text-xl font-serif italic tracking-tighter uppercase leading-none text-zinc-950 flex items-center">
              CLOSET<span className="text-[#0F52BA] font-sans font-black not-italic ml-1">KRAZE</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A880] ml-1 shadow-[0_0_6px_#C5A880]"></span>
            </h1>
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.35em] text-[#C5A880] font-sans mt-0.5">
              Fashion & Style
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => onNavigateView(ViewState.PROFILE)}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-[#C5A880]/50 bg-gradient-to-br from-[#0B132B] to-[#0F52BA] shadow-[0_2px_10px_rgba(15,82,186,0.25)] hover:border-[#C5A880] hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
          title="Profile"
        >
          <span className="text-xs font-black uppercase text-[#E8D3B0]">
            {handle.trim().charAt(0) || 'G'}
          </span>
        </button>
      </div>

      {/* Bottom Row: Search & Utility Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onNotificationOpen}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 bg-white text-zinc-700 hover:border-[#0F52BA]/40 hover:text-[#0F52BA] transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>

        <div 
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between bg-white border border-zinc-200 rounded-full px-4 py-1.5 cursor-pointer hover:border-[#0F52BA]/40 hover:shadow-sm transition-all duration-300 group shadow-xs"
        >
          <span className="text-[10px] text-zinc-600 font-semibold">Search clothes, shoes, bags...</span>
          <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#0F52BA] transition-colors" />
        </div>

        <button 
          onClick={() => onNavigateView(ViewState.WISHLIST)}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-sm cursor-pointer relative ${
            currentView === ViewState.WISHLIST
              ? 'bg-[#0F52BA] border-[#0F52BA] text-white shadow-[0_0_12px_rgba(15,82,186,0.3)]'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#0F52BA]/40 hover:text-[#0F52BA]'
          }`}
          title="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${currentView === ViewState.WISHLIST ? 'fill-white text-white' : wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white shadow-md animate-pulse">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </button>

        <button 
          onClick={onCartOpen}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 bg-white hover:border-[#0F52BA]/40 transition-all active:scale-95 relative shadow-sm cursor-pointer"
          title="Cart"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-zinc-800" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5A880] text-zinc-950 rounded-full text-[8px] font-black flex items-center justify-center border border-white shadow-md animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Header;
