import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Product, ViewState } from '../types';
import { X } from 'lucide-react';
import { trackPlausibleEvent } from '../lib/analytics';

interface WhatsAppFloatingButtonProps {
  currentView?: ViewState;
  selectedProduct?: Product | null;
}

const WHATSAPP_PHONE = '233553877937';

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  currentView = ViewState.LOBBY,
  selectedProduct = null,
}) => {
  // Check if already dismissed in the browser session/local storage
  const isDismissed = typeof window !== 'undefined' && localStorage.getItem('wa-dismissed') === 'true';

  if (isDismissed) {
    return null;
  }

  // Compute the appropriate message based on current context
  const getWhatsAppMessage = (): string => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://closetkraze.top';

    if (selectedProduct) {
      return `Hey ClosetKraze, interested in "${selectedProduct.name}" — ${currentUrl}`;
    }

    if (currentView && currentView !== ViewState.LOBBY) {
      const viewNames: Record<string, string> = {
        [ViewState.FAMOUS]: 'Famous Drops',
        [ViewState.BUNDLES]: 'Synergy Bundles',
        [ViewState.CATEGORIES]: 'Categories Collection',
        [ViewState.WISHLIST]: 'My Wishlist',
        [ViewState.SEARCH]: 'Search Catalog',
        [ViewState.PROFILE]: 'User Profile',
        [ViewState.CHECKOUT]: 'Checkout',
        [ViewState.PAY_FOR_ME]: 'Pay For Me',
        [ViewState.STYLIST]: 'AI Stylist Studio',
        [ViewState.SOCIAL]: 'Community Syndicate',
      };
      const pageTitle = viewNames[currentView] || currentView;
      return `Hey ClosetKraze, I saw your drops on closetkraze.top — viewing ${pageTitle}.`;
    }

    return 'Hey ClosetKraze, I saw your drops on closetkraze.top — interested in browsing.';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackPlausibleEvent('whatsapp_click', {
      location: currentView || 'lobby',
      product_id: selectedProduct?.id,
      product_name: selectedProduct?.name
    });
    const message = getWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      localStorage.setItem('wa-dismissed', 'true');
      const btn = document.getElementById('whatsapp-floating-container');
      if (btn) {
        btn.style.display = 'none';
      }
    }
  };

  return (
    <div 
      id="whatsapp-floating-container"
      className="fixed right-4 sm:right-6 bottom-20 sm:bottom-8 z-[9999] flex flex-col items-end gap-2 pointer-events-auto transition-all duration-300 group/btn"
    >
      {/* Desktop / Tablet Hover Tooltip (Uses pure CSS group-hover for bulletproof state management) */}
      <div 
        className="hidden sm:flex items-center gap-2 bg-zinc-950/95 text-white px-3.5 py-1.5 rounded-full text-[11px] font-mono font-medium shadow-xl border border-white/10 opacity-0 translate-y-2 scale-95 group-hover/btn:opacity-100 group-hover/btn:translate-y-0 group-hover/btn:scale-100 pointer-events-none transition-all duration-300"
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat with Closet Kraze</span>
      </div>

      <div className="relative">
        {/* Cancel / Dismiss 'X' Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close WhatsApp chat button"
          title="Dismiss"
          className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-900/90 hover:bg-red-600 text-zinc-300 hover:text-white border border-white/20 flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Main WhatsApp Button */}
        <a
          href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(getWhatsAppMessage())}`}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Closet Kraze on WhatsApp"
          tabIndex={0}
          className="relative flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#25D366] text-white shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_30px_rgba(37,211,102,0.6)] hover:bg-[#20ba5a] active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 select-none"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />
          
          {/* WhatsApp Icon */}
          <div className="relative z-10 w-8 h-8 flex items-center justify-center transform group-hover/btn:scale-110 transition-transform duration-300">
            <WhatsAppIcon size={32} title="Chat on WhatsApp" />
          </div>
        </a>
      </div>
    </div>
  );
};

export default WhatsAppFloatingButton;
