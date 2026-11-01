import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Zap, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Copy, 
  Bell, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Share2, 
  Lock,
  Compass,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Heart,
  ShoppingCart,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, ViewState } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';

interface FamousProductsProps {
  products?: Product[];
  wishlist?: string[];
  onProductClick?: (p: Product) => void;
  onAddToCart?: (p: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist?: (p: Product) => void;
  limitedOfferEnd?: number | null;
  onToggleCompare?: (product: Product) => void;
  comparisonList?: Product[];
  loading?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onNavigate?: (view: ViewState) => void;
}

interface FlashSaleEvent {
  id: string;
  title: string;
  category: string;
  tagline: string;
  status: 'LIVE' | 'CLOSING_SOON' | 'UPCOMING' | 'SCHEDULED' | string;
  discountLabel: string;
  code: string;
  claimedPercent: number;
  remainingSlots: number;
  perks: string[];
  timeRemaining?: string;
  startsAt?: string;
  description: string;
  targetCategory?: string;
}

type TabType = 'ALL_EVENTS' | 'LIVE_NOW' | 'UPCOMING' | 'SALE_ITEMS' | 'CALENDAR';

const FamousProducts: React.FC<FamousProductsProps> = ({ 
  products = [],
  wishlist = [],
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  limitedOfferEnd,
  loading = false,
  onNavigate,
  onSelectCategory
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL_EVENTS');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [vipPhone, setVipPhone] = useState('');
  const [vipSubscribed, setVipSubscribed] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Real-time flash sale countdown clock
  const [timeState, setTimeState] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '02',
    minutes: '48',
    seconds: '36'
  });

  // Countdown timer logic
  useEffect(() => {
    let targetEnd = limitedOfferEnd && !isNaN(limitedOfferEnd) && limitedOfferEnd > Date.now()
      ? limitedOfferEnd
      : null;

    if (!targetEnd) {
      const saved = localStorage.getItem('cc-flash-sale-end');
      const parsed = saved ? parseInt(saved, 10) : 0;
      if (parsed > Date.now()) {
        targetEnd = parsed;
      } else {
        targetEnd = Date.now() + (2 * 3600 * 1000) + (48 * 60 * 1000) + 36000;
        localStorage.setItem('cc-flash-sale-end', targetEnd.toString());
      }
    }

    const updateTimer = () => {
      const diff = Math.max(0, targetEnd - Date.now());
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setTimeState({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [limitedOfferEnd]);

  const [flashEvents, setFlashEvents] = useState<FlashSaleEvent[]>([]);
  const [dbVouchers, setDbVouchers] = useState<{ code: string; discount: string; label: string; min: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingEvents(true);
      try {
        // Load Flash Sale Events from Admin settings - NO auto-injecting dummy data!
        const eventsData = await databaseService.getSetting<FlashSaleEvent[]>('flash_sale_events');
        if (eventsData && Array.isArray(eventsData)) {
          setFlashEvents(eventsData);
        } else {
          setFlashEvents([]);
        }

        // Load Promo Code Vouchers
        const promos = await databaseService.getPromoCodes();
        if (promos && promos.length > 0) {
          const mapped = promos.map(p => ({
            code: p.code,
            discount: p.type === 'PERCENT' ? `${p.discount}% OFF` : `GH₵${p.discount} OFF`,
            label: p.description || 'Active Promo Code',
            min: p.usageLimit ? `Limit: ${p.usedCount || 0}/${p.usageLimit} claims` : 'No Minimum'
          }));
          setDbVouchers(mapped);
        } else {
          setDbVouchers([]);
        }
      } catch (err) {
        console.error('Error loading dynamic flash sale data:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Flash Sale Code "${code}" copied to clipboard! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleVipSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipPhone.trim()) {
      toast.error('Please enter a valid phone or WhatsApp number');
      return;
    }
    setVipSubscribed(true);
    toast.success('VIP Flash Sale alert registered! You will receive drop alerts 15 minutes before public opening.');
  };

  // Status helpers to ensure robust filtering across admin inputs
  const getNormalizedStatus = (status?: string) => (status || '').toUpperCase().trim();
  const isLive = (status?: string) => {
    const s = getNormalizedStatus(status);
    return s === 'LIVE' || s === 'CLOSING_SOON' || s === 'CLOSING SOON';
  };
  const isUpcoming = (status?: string) => {
    const s = getNormalizedStatus(status);
    return s === 'UPCOMING' || s === 'SCHEDULED';
  };

  const liveEvents = flashEvents.filter(ev => isLive(ev.status));
  const upcomingEvents = flashEvents.filter(ev => isUpcoming(ev.status));

  // Catalog products that have an active discount
  const discountedProducts = (products || []).filter(p => 
    (p.offeredDiscount && p.offeredDiscount > 0) || 
    (p.originalPrice && p.originalPrice > p.price)
  );

  const filteredEvents = flashEvents.filter(ev => {
    if (activeTab === 'LIVE_NOW') return isLive(ev.status);
    if (activeTab === 'UPCOMING') return isUpcoming(ev.status);
    return true;
  });

  const hasLiveSales = liveEvents.length > 0;

  return (
    <div className="min-h-screen bg-[#050811] text-white">
      {/* FLASH SALE HERO & COUNTDOWN BANNER */}
      <header className="relative border-b border-white/5 overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#070C1A] to-[#050811] pt-5 sm:pt-6 pb-8 px-4 sm:px-8 md:px-16">
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[#0F52BA]/15 blur-[140px] pointer-events-none -z-0"></div>
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-[#C5A880]/10 blur-[120px] pointer-events-none -z-0"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-8">
          {/* Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] shadow-lg transition-all ${
              hasLiveSales 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10' 
                : 'bg-[#0F52BA]/20 border-[#0F52BA]/40 text-[#C5A880] shadow-[#0F52BA]/20'
            }`}>
              {hasLiveSales ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
              )}
              {hasLiveSales ? 'LIVE FLASH SALE WINDOW ACTIVE' : 'FLASH SALE WINDOW // STANDBY'}
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Flame size={14} className={hasLiveSales ? "text-amber-500 fill-amber-500" : "text-zinc-500"} />
                {flashEvents.length} Active Flash Event{flashEvents.length === 1 ? '' : 's'}
              </span>
              <span className="hidden sm:inline text-zinc-700">|</span>
              <span className="hidden sm:inline text-[#C5A880] font-bold">
                {discountedProducts.length} Discounted Catalog Pieces
              </span>
            </div>
          </div>

          {/* Main Title & Countdown Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif italic text-white tracking-tight leading-none">
                Flash <span className="text-[#C5A880] not-italic font-sans font-black">Sales</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed font-sans">
                Time-limited privilege windows on authenticated luxury silhouettes, bespoke tailoring, and seasonal high-fashion archives. Allocations expire strictly upon timer conclusion.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent('Hello Closet Kraze, I would like to join the Flash Sale VIP drops notification list!');
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <Bell size={13} />
                  Join VIP Flash Alert on WhatsApp
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewState.CATEGORIES)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Compass size={13} />
                    Explore Collections
                  </button>
                )}
              </div>
            </div>

            {/* Glowing Flash Countdown Timer Box */}
            <div className="lg:col-span-5 bg-[#0B132B]/80 border border-[#0F52BA]/40 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_rgba(15,82,186,0.2)] backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-1.5 text-[#C5A880]">
                  <Clock size={13} className="animate-pulse text-[#C5A880]" />
                  {hasLiveSales ? 'Active Flash Window Closes In:' : 'Next Wave Scheduled In:'}
                </span>
                <span className="text-emerald-400 font-bold">AUTHENTICATED</span>
              </div>

              {/* Digital Clock Digits */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="bg-[#050811] border border-white/10 rounded-2xl py-3 px-2">
                  <span className="text-2xl sm:text-4xl font-mono font-black text-white tracking-wider">
                    {timeState.hours}
                  </span>
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Hours</span>
                </div>
                <div className="bg-[#050811] border border-white/10 rounded-2xl py-3 px-2">
                  <span className="text-2xl sm:text-4xl font-mono font-black text-[#C5A880] tracking-wider">
                    {timeState.minutes}
                  </span>
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Mins</span>
                </div>
                <div className="bg-[#050811] border border-white/10 rounded-2xl py-3 px-2">
                  <span className="text-2xl sm:text-4xl font-mono font-black text-white tracking-wider">
                    {timeState.seconds}
                  </span>
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Secs</span>
                </div>
              </div>

              {/* Trust & Guarantee Ticker under clock */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span className="text-[#C5A880] font-medium">⚡ Strict 3-Hour Allocation</span>
                <span className="text-zinc-500">Nationwide Insured Delivery</span>
              </div>
            </div>
          </div>

          {/* Flash Sale Event Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('ALL_EVENTS')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'ALL_EVENTS'
                    ? 'bg-[#0F52BA] text-white shadow-[0_0_15px_rgba(15,82,186,0.4)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                All Flash Sales ({flashEvents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('LIVE_NOW')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'LIVE_NOW'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Now ({liveEvents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UPCOMING')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'UPCOMING'
                    ? 'bg-[#C5A880] text-[#0B132B] font-black shadow-[0_0_15px_rgba(197,168,128,0.4)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <Clock size={12} />
                Upcoming Waves ({upcomingEvents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SALE_ITEMS')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SALE_ITEMS'
                    ? 'bg-amber-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <Tag size={12} />
                Discounted Pieces ({discountedProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CALENDAR')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'CALENDAR'
                    ? 'bg-white text-black font-black'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <Calendar size={12} />
                Weekly Drop Calendar
              </button>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">
              VAULT AUTHENTICATION PROTOCOL // GHANA
            </div>
          </div>
        </div>
      </header>

      {/* MAIN FLASH SALES CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 py-10 space-y-12">
        {loading || loadingEvents ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-white/5 rounded-lg animate-pulse hidden sm:block" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 rounded-3xl bg-white/[0.02] border border-white/5 p-6 animate-pulse space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-24 bg-white/10 rounded-full" />
                    <div className="h-6 w-20 bg-white/10 rounded-xl" />
                  </div>
                  <div className="h-8 w-3/4 bg-white/10 rounded-xl" />
                  <div className="h-16 w-full bg-white/5 rounded-xl" />
                  <div className="h-10 w-full bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'CALENDAR' ? (
          <div className="space-y-6">
            <div className="border border-white/10 bg-[#0B132B]/50 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#C5A880]" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif italic text-white">Weekly Flash Drop Schedule</h2>
                  <p className="text-xs text-zinc-400">Regular release schedule for synchronized seasonal high-fashion drops.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-[#0F52BA]">Mondays • 18:00 GMT</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">WEEKLY WAVE</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Silk Blouses & Structured Tailoring</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Hand-finished Italian double-breasted jackets, fluid crepe trousers, and archival silk evening blouses.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-[#C5A880]">Wednesdays • 19:00 GMT</span>
                    <span className="px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] text-[9px] font-mono font-bold">FOOTWEAR & LEATHER</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Artisanal Footwear & Handcrafted Leather</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    European calfskin footwear, Goodyear-welted dress boots, Belgian loafers, and full-grain travel bags.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">Fridays • 17:00 GMT</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-mono font-bold">RUNWAY & SAMPLES</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Editorial Cuts & Runway Sample Archives</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ultra-rare designer samples, runway show pieces, and experimental tailoring silhouettes.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">Sundays • 20:00 GMT</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold">FINAL SURGE</span>
                  </div>
                  <h3 className="text-base font-bold text-white">The Collector's Vault Clearance Cut</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Last-call allocations on single-size rarities and discontinued seasonal lines before vault closure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'SALE_ITEMS' ? (
          /* DISCOUNTED CATALOG PIECES TAB */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif italic text-white">Discounted Catalog Pieces</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Curated silhouettes currently featuring active markdown privileges.
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                TOTAL {discountedProducts.length} DISCOUNTED PIECES
              </span>
            </div>

            {discountedProducts.length === 0 ? (
              <div className="py-20 px-6 rounded-3xl border border-white/10 bg-[#0B132B]/40 text-center space-y-6 max-w-xl mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-[#0F52BA]/20 border border-[#0F52BA]/30 text-[#C5A880] mx-auto flex items-center justify-center">
                  <Tag className="w-7 h-7 text-[#C5A880]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-white">No Discounted Pieces Currently in Catalog</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                    All catalog products are currently at regular valuation. Check our flash sale events or return during synchronized drop hours.
                  </p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewState.CATEGORIES)}
                    className="px-6 py-3 rounded-xl bg-[#0F52BA] hover:bg-[#0F52BA]/80 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#0F52BA]/30 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Full Catalog</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {discountedProducts.map((p) => {
                  const discountPercent = p.offeredDiscount || (p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
                  const isWishlisted = wishlist.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => onProductClick && onProductClick(p)}
                      className="group relative bg-[#070C1A] border border-white/10 hover:border-[#0F52BA]/60 rounded-2xl p-3 sm:p-4 space-y-3 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden relative bg-zinc-900">
                        <img 
                          src={getImageUrl(p.image || (p.images && p.images[0]))} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {discountPercent > 0 && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-mono font-black uppercase">
                            -{discountPercent}% OFF
                          </div>
                        )}
                        {onToggleWishlist && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(p);
                            }}
                            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-red-400 transition-colors"
                          >
                            <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C5A880] transition-colors truncate">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono truncate">
                          {p.category}
                        </p>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-sm sm:text-base font-mono font-black text-white">GH₵{p.price}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-xs font-mono text-zinc-500 line-through">GH₵{p.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(p);
                          }}
                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#0F52BA] text-zinc-300 hover:text-white border border-white/10 text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ShoppingCart size={12} />
                          <span>Acquire Piece</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* FLASH SALE EVENTS CARDS OR EMPTY STATE */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif italic text-white">
                  {activeTab === 'LIVE_NOW' 
                    ? 'Live Flash Sales' 
                    : activeTab === 'UPCOMING'
                    ? 'Upcoming Flash Waves'
                    : 'Active & Upcoming Flash Drops'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Each event offers exclusive tier discounts, private voucher codes, and verified authenticity perks.
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
                TOTAL {filteredEvents.length} SALE WAVES
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-20 px-6 rounded-3xl border border-white/10 bg-[#0B132B]/40 text-center space-y-6 max-w-xl mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-[#0F52BA]/20 border border-[#0F52BA]/30 text-[#C5A880] mx-auto flex items-center justify-center">
                  {activeTab === 'LIVE_NOW' ? (
                    <Flame className="w-7 h-7 text-amber-500" />
                  ) : activeTab === 'UPCOMING' ? (
                    <Clock className="w-7 h-7 text-[#0F52BA]" />
                  ) : (
                    <Inbox className="w-7 h-7 text-[#C5A880]" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-white">
                    {activeTab === 'LIVE_NOW' 
                      ? 'No Live Flash Sales Right Now' 
                      : activeTab === 'UPCOMING'
                      ? 'No Upcoming Flash Waves Scheduled'
                      : 'No Flash Sales Currently Active'}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
                    {activeTab === 'LIVE_NOW'
                      ? 'There are currently no flash sales running in the live window. Check our upcoming waves, browse discounted pieces, or view the weekly drop calendar.'
                      : activeTab === 'UPCOMING'
                      ? 'There are currently no future flash sales on the calendar. Switch to "Live Now" or check our weekly drop schedule.'
                      : 'There are currently no active or scheduled flash sales in the vault. Check back soon for exclusive limited-time drops and private vault privileges.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {activeTab === 'LIVE_NOW' && upcomingEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('UPCOMING')}
                      className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#C5A880]/80 text-[#0B132B] text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock size={12} />
                      <span>View Upcoming Waves ({upcomingEvents.length})</span>
                    </button>
                  )}
                  {activeTab === 'UPCOMING' && liveEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('LIVE_NOW')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Flame size={12} />
                      <span>View Live Drops ({liveEvents.length})</span>
                    </button>
                  )}
                  {discountedProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('SALE_ITEMS')}
                      className="px-5 py-2.5 rounded-xl bg-[#0F52BA] hover:bg-[#0F52BA]/80 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Tag size={12} />
                      <span>Browse Sale Items ({discountedProducts.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('CALENDAR')}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar size={12} />
                    <span>Weekly Schedule</span>
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate(ViewState.CATEGORIES)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Compass size={12} />
                      <span>Explore Catalog</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B132B]/70 to-[#070C1A]/90 p-6 sm:p-7 space-y-6 hover:border-[#0F52BA]/60 transition-all duration-300 shadow-xl overflow-hidden"
                  >
                    {/* Status & Category Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isLive(event.status) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            LIVE SALE
                          </span>
                        ) : getNormalizedStatus(event.status) === 'CLOSING_SOON' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[9px] font-mono font-black uppercase tracking-wider">
                            <Flame size={10} className="text-amber-400 fill-amber-400" />
                            CLOSING SOON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-400 text-[9px] font-mono font-black uppercase tracking-wider">
                            <Clock size={10} />
                            UPCOMING WAVE
                          </span>
                        )}

                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A880] font-mono">
                          {event.category}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-lg sm:text-xl font-mono font-black text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                          {event.discountLabel}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-serif italic text-white group-hover:text-[#C5A880] transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        {event.description}
                      </p>
                    </div>

                    {/* Quota Progress Bar */}
                    <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400 uppercase tracking-wider">
                          {isUpcoming(event.status) ? 'VIP Advance Registrations' : 'Flash Allocation Claimed'}
                        </span>
                        <span className="text-[#C5A880] font-black">{event.claimedPercent}% ({event.remainingSlots} Remaining)</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            getNormalizedStatus(event.status) === 'CLOSING_SOON' ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0F52BA] to-[#C5A880]'
                          }`}
                          style={{ width: `${event.claimedPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Flash Perks List */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                        Event Privileges & Guarantee:
                      </span>
                      <div className="space-y-1">
                        {(event.perks || []).map((perk, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-300">
                            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Flash Code Voucher & Action Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/5">
                      <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2 flex-1 justify-between">
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-[#C5A880]" />
                          <span className="text-xs font-mono font-black text-white tracking-widest">{event.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(event.code)}
                          className="text-[9px] font-mono font-black uppercase tracking-wider text-[#C5A880] hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode === event.code ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          <span>{copiedCode === event.code ? 'COPIED' : 'COPY CODE'}</span>
                        </button>
                      </div>

                      {isUpcoming(event.status) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const text = encodeURIComponent(`Hi Closet Kraze, please alert me when the "${event.title}" flash sale drops! Code: ${event.code}`);
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Bell size={12} />
                          Set WhatsApp RSVP
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyCode(event.code);
                            if (onNavigate) {
                              if (onSelectCategory && event.targetCategory) {
                                onSelectCategory(event.targetCategory);
                              }
                              onNavigate(ViewState.CATEGORIES);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#0F52BA] hover:bg-[#0B132B] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F52BA]/30 whitespace-nowrap"
                        >
                          <span>Activate & Shop</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FLASH PRIVILEGE VOUCHERS QUICK VAULT */}
        <section className="rounded-3xl border border-white/10 bg-[#0B132B]/40 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C5A880]" />
                <h3 className="text-xl sm:text-2xl font-serif italic text-white">Active Flash Voucher Codes</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Copy any verified flash sale code directly and apply at checkout for instant markdown deduction.
              </p>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              INSTANT CHECKOUT APPLICABLE
            </span>
          </div>

          {dbVouchers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/40 border border-white/5 text-center space-y-2">
              <p className="text-xs text-zinc-400">No promo voucher codes currently active. Vouchers are released during synchronized drop events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dbVouchers.map((v, i) => (
                <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-mono font-black text-white">{v.discount}</span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">VERIFIED</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-300 mt-1">{v.label}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{v.min}</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleCopyCode(v.code)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-[#0F52BA]/20 text-[#C5A880] hover:text-white border border-white/10 text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCode === v.code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode === v.code ? 'COPIED' : v.code}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4 PILLARS OF FLASH SALE AUTHENTICITY & TRUST */}
        <section className="border-t border-white/5 pt-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">The Flash Sale Trust Protocol</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Unlike generic discount sites, Closet Kraze Flash Sales maintain the exact same white-glove authenticity standards as our flagship collections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880] mb-3">
                <ShieldCheck size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">12-Point Authentication</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Every flash sale item undergoes physical inspection for stitch density, hardware stamping, and archival provenance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880] mb-3">
                <Clock size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Strict 3-Hour Windows</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Flash sale prices terminate automatically at window completion. This ensures authentic scarcity and avoids dilution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880] mb-3">
                <Award size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Insured Courier Dispatch</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Nationwide express delivery across Ghana with tamper-evident security seals and live tracking updates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#0F52BA]/20 flex items-center justify-center text-[#C5A880] mb-3">
                <Lock size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Zero Second Restocks</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Once a flash sale quota is depleted, the item returns to standard catalog pricing without backorders.
              </p>
            </div>
          </div>
        </section>

        {/* VIP FLASH DROP SUBSCRIPTION PANEL */}
        <section className="rounded-3xl border border-[#0F52BA]/30 bg-gradient-to-r from-[#0B132B] to-[#070C1A] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F52BA]/20 border border-[#0F52BA]/30 text-[#C5A880] text-[10px] font-black uppercase tracking-widest">
              <Bell size={12} />
              VIP Priority Notification
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">Never Miss A Flash Sale Drop</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Receive a private WhatsApp notification 15 minutes before upcoming flash sale waves unlock to the public.
            </p>
          </div>

          <form onSubmit={handleVipSubscribe} className="w-full md:w-auto flex-1 max-w-md space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={vipPhone}
                onChange={(e) => setVipPhone(e.target.value)}
                placeholder="WhatsApp number (e.g. 0541234567)"
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#0F52BA] transition-all font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#0F52BA] hover:bg-[#0B132B] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-[#0F52BA]/20"
              >
                {vipSubscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono">
              Strictly confidential. No spam, only flash drop announcements.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default FamousProducts;
