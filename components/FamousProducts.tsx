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
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, ViewState } from '../types';

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
  status: 'LIVE' | 'CLOSING_SOON' | 'UPCOMING' | 'SCHEDULED';
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

const FamousProducts: React.FC<FamousProductsProps> = ({ 
  limitedOfferEnd,
  onNavigate,
  onSelectCategory
}) => {
  const [activeTab, setActiveTab] = useState<'ALL_EVENTS' | 'LIVE_NOW' | 'UPCOMING' | 'CALENDAR'>('ALL_EVENTS');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [vipPhone, setVipPhone] = useState('');
  const [vipSubscribed, setVipSubscribed] = useState(false);

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

  // Flash Sale Events Definition (Curated for High Fashion and Style)
  const flashEvents: FlashSaleEvent[] = [
    {
      id: 'event-haute',
      title: 'Haute Tailoring & Silk Event',
      category: 'Tailoring & Formalwear',
      tagline: 'Precision Italian cuts, structured blazers & evening silk silhouettes',
      status: 'LIVE',
      discountLabel: '45% OFF',
      code: 'HAUTE45',
      claimedPercent: 84,
      remainingSlots: 16,
      perks: ['Complimentary Silk Dust Bag', 'Express Courier Across Ghana', 'Hand-Tailored Alteration Guide'],
      timeRemaining: 'Closing at Wave Conclusion',
      description: 'A strictly limited flash privilege applied to Italian double-breasted wool blazers, silk charmeuse pieces, and structured formalwear.',
      targetCategory: 'Tailoring'
    },
    {
      id: 'event-leather',
      title: 'Archival Footwear & Leather Blitz',
      category: 'Footwear & Fine Leather',
      tagline: 'Handcrafted calfskin Chelsea boots, Belgian loafers & luxury leather totes',
      status: 'CLOSING_SOON',
      discountLabel: '35% OFF',
      code: 'LEATHER35',
      claimedPercent: 92,
      remainingSlots: 8,
      perks: ['12-Point RFID Authentication', 'Natural Cedar Shoe Trees Included', 'Waterproof Leather Conditioning'],
      timeRemaining: 'Final 8 Allocations',
      description: 'Artisanal footwear and full-grain leather bags crafted by legacy European tanneries. Zero restocks once current reserve is claimed.',
      targetCategory: 'Footwear'
    },
    {
      id: 'event-midnight',
      title: 'Midnight Architectural Silhouettes',
      category: 'Contemporary High Fashion',
      tagline: 'Monochromatic draped overcoats, fluid trousers & structured modern lines',
      status: 'UPCOMING',
      discountLabel: 'GH₵100 VOUCHER',
      code: 'MIDNIGHT100',
      claimedPercent: 45,
      remainingSlots: 35,
      perks: ['Priority Dispatch Queue', 'VIP Style Concierge Consultation', 'Archival Lookbook Print'],
      startsAt: 'Tonight at 20:00 GMT',
      description: 'An exclusive 120-minute nighttime surge featuring cutting-edge architectural outerwear and fluid monochromatic staples.',
      targetCategory: 'Outerwear'
    },
    {
      id: 'event-cashmere',
      title: 'Weekend Cashmere & Fine Knitwear Surge',
      category: 'Knitwear & Luxury Fibers',
      tagline: 'Pure Grade-A Mongolian cashmere sweaters, merino turtlenecks & textured knits',
      status: 'SCHEDULED',
      discountLabel: 'BOGO 50% OFF',
      code: 'CASHMERE50',
      claimedPercent: 20,
      remainingSlots: 50,
      perks: ['Cashmere Care Comb Included', 'Breathable Moth-Proof Storage Pouch', 'Complimentary Fiber Refresh Guide'],
      startsAt: 'This Saturday at 18:00 GMT',
      description: 'The pinnacle of tactile luxury. Acquire synchronized fine knitwear with a 50% second-item flash courtesy privilege.',
      targetCategory: 'Knitwear'
    }
  ];

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

  const filteredEvents = flashEvents.filter(ev => {
    if (activeTab === 'LIVE_NOW') return ev.status === 'LIVE' || ev.status === 'CLOSING_SOON';
    if (activeTab === 'UPCOMING') return ev.status === 'UPCOMING' || ev.status === 'SCHEDULED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050811] text-white">
      {/* FLASH SALE HERO & COUNTDOWN BANNER */}
      <header className="relative border-b border-white/5 overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#070C1A] to-[#050811] pt-12 pb-14 px-4 sm:px-8 md:px-16">
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[#0F52BA]/15 blur-[140px] pointer-events-none -z-0"></div>
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-[#C5A880]/10 blur-[120px] pointer-events-none -z-0"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-8">
          {/* Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F52BA]/20 border border-[#0F52BA]/40 text-[#C5A880] text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(15,82,186,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE FLASH SALE WINDOW ACTIVE
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Flame size={14} className="text-amber-500 fill-amber-500" />
                4 Active Flash Events
              </span>
              <span className="hidden sm:inline text-zinc-700">|</span>
              <span className="hidden sm:inline text-[#C5A880] font-bold">
                Up to 45% Privilege Markdown
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
                  Active Flash Window Closes In:
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
                Live Now (2)
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
                Upcoming Waves (2)
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
        {/* CALENDAR VIEW */}
        {activeTab === 'CALENDAR' ? (
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
        ) : (
          /* FLASH SALE EVENTS CARDS (NOT PRODUCT GRIDS!) */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif italic text-white">Active & Upcoming Flash Drops</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Each event offers exclusive tier discounts, private voucher codes, and verified authenticity perks.
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
                TOTAL {filteredEvents.length} SALE WAVES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id}
                  className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B132B]/70 to-[#070C1A]/90 p-6 sm:p-7 space-y-6 hover:border-[#0F52BA]/60 transition-all duration-300 shadow-xl overflow-hidden"
                >
                  {/* Status & Category Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {event.status === 'LIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          LIVE SALE
                        </span>
                      ) : event.status === 'CLOSING_SOON' ? (
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
                        {event.status === 'UPCOMING' || event.status === 'SCHEDULED' ? 'VIP Advance Registrations' : 'Flash Allocation Claimed'}
                      </span>
                      <span className="text-[#C5A880] font-black">{event.claimedPercent}% ({event.remainingSlots} Remaining)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          event.status === 'CLOSING_SOON' ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0F52BA] to-[#C5A880]'
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
                      {event.perks.map((perk, idx) => (
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

                    {event.status === 'UPCOMING' || event.status === 'SCHEDULED' ? (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { code: 'HAUTE45', discount: '45% OFF', label: 'Tailoring & Silhouettes', min: 'No Minimum' },
              { code: 'LEATHER35', discount: '35% OFF', label: 'Calfskin & Footwear', min: 'GH₵200 Min' },
              { code: 'MIDNIGHT100', discount: 'GH₵100 OFF', label: 'Monochrome Drops', min: 'GH₵350 Min' },
              { code: 'CASHMERE50', discount: 'BOGO 50%', label: 'Fine Knitwear Tiers', min: '2+ Knits' }
            ].map((v, i) => (
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
