import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, UserStats, ViewState, UserPreferences, CategoryInfo } from '../types';
import { CATEGORY_GROUPS } from '../constants';
import { databaseService } from '../services/databaseService';
import { Search, Zap, Camera, Clock, Star, TrendingUp, ShieldCheck, Truck, Lock, Flame, Download, Sparkles, SlidersHorizontal, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User, ShoppingCart, Tag, LayoutGrid, Check, Gift, Copy, Award, AlertCircle, RefreshCw, Shuffle, ArrowRight, Dices } from 'lucide-react';
import { Skeleton, ProductGridSkeleton } from './Skeleton';
import ProductCard from './ProductCard';
import SectionErrorBoundary from './SectionErrorBoundary';
import { matchesCategory } from '../lib/categoryUtils';
import { HeroQuoteSlide, getRandomSessionHeroSlides } from '../data/heroQuotes';
import { toast } from 'sonner';

interface HomeLobbyProps {
  userId: string;
  products: Product[];
  categories: CategoryInfo[];
  userHandle: string;
  socialPosts: any[];
  wishlist: string[];
  onNavigate: (view: ViewState) => void;
  onAddToCart: (product: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onCompleteQuest: (questId: string) => void;
  onGainRep: (amount: number) => void;
  limitedOfferEnd?: number | null;
  onResetLimitedOffer?: () => void;
  onToggleCompare?: (product: Product) => void;
  comparisonList?: Product[];
  isInitializing?: boolean;
  isAuthenticated?: boolean;
  tutorialFinished?: boolean;
  userPrefs?: UserPreferences;
  onQuickBuy?: (product: Product) => void;
  productError?: string | null;
  onRetryProducts?: () => void;
}

const HomeLobby: React.FC<HomeLobbyProps> = ({ 
  userId,
  products = [], 
  categories = [],
  onNavigate, 
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist = [],
  onToggleCompare,
  comparisonList = [],
  userPrefs,
  onQuickBuy,
  userHandle,
  limitedOfferEnd,
  isInitializing = false,
  productError = null,
  onRetryProducts
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState<'random' | 'recommended' | 'time' | 'price_asc' | 'price_desc'>('random');
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));

  // Automatically randomize product mix on every home page load
  useEffect(() => {
    setShuffleSeed(Date.now() + Math.floor(Math.random() * 1000000));
  }, []);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState<boolean>(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  
  // Price Filter states
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [activePricePreset, setActivePricePreset] = useState<string>('all');
  const [showPriceInputs, setShowPriceInputs] = useState<boolean>(false);
  const productsSectionRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);

  // Referral Modal States
  const [showReferModal, setShowReferModal] = useState<boolean>(false);
  const [referralCopied, setReferralCopied] = useState<boolean>(false);
  
  // Hero Carousel with 4 Random Quotes for this user section
  const [heroSlides, setHeroSlides] = useState<HeroQuoteSlide[]>(() => getRandomSessionHeroSlides(4));
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Slideshow Auto-play Timer (5 seconds)
  useEffect(() => {
    if (isPaused || !heroSlides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length, isPaused]);

  const handleShuffleHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sessionStorage.removeItem('cc_session_hero_slides_v2');
      sessionStorage.removeItem('cc_session_hero_slides');
    } catch (err) {}
    const newSlides = getRandomSessionHeroSlides(4);
    setHeroSlides(newSlides);
    setCurrentSlide(0);
  };

  const handleReshuffleProducts = useCallback(() => {
    setActiveSort('random');
    setShuffleSeed(Date.now() + Math.floor(Math.random() * 10000));
    toast.success('Catalog feed shuffled at random!');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setShowPriceInputs(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    if (showPriceInputs || showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriceInputs, showSortDropdown]);

  const getSortLabel = (sortMode: 'random' | 'recommended' | 'time' | 'price_asc' | 'price_desc') => {
    switch (sortMode) {
      case 'random': return 'Random Mix 🎲';
      case 'recommended': return 'Recommended ⭐';
      case 'time': return 'Newest Drops 🕒';
      case 'price_asc': return 'Price: Low 💲';
      case 'price_desc': return 'Price: High 💎';
      default: return 'Random Mix 🎲';
    }
  };

  const getPriceFilterLabel = () => {
    if (activePricePreset === 'under150') return 'Under $150';
    if (activePricePreset === '150-400') return '$150 - $400';
    if (activePricePreset === 'over400') return 'Over $400';
    if (activePricePreset === 'custom') {
      if (minPrice && maxPrice) return `$${minPrice} - $${maxPrice}`;
      if (minPrice) return `≥ $${minPrice}`;
      if (maxPrice) return `≤ $${maxPrice}`;
      return 'Custom Price';
    }
    return 'Price';
  };

  // Filter products based on selected parameters
  const filteredProducts = React.useMemo(() => {
    let filtered = activeCategory === 'All' 
      ? [...products] 
      : products.filter(p => matchesCategory(p, activeCategory, categories));

    // Apply active filters (Deals, Low Stock, etc.)
    if (activeFilter === 'Deals') {
      filtered = filtered.filter(p => p.price < (p.originalPrice || p.price));
    } else if (activeFilter === 'Low Stock') {
      filtered = filtered.filter(p => p.stockCount > 0 && p.stockCount < 5);
    } else if (activeFilter === 'Trending') {
      filtered = [...filtered].sort((a, b) => ((b.likes || 0) + (b.isHallOfFame ? 50 : 0) + (b.viewers || 0)) - ((a.likes || 0) + (a.isHallOfFame ? 50 : 0) + (a.viewers || 0)));
    }

    // Apply Price Filter
    if (activePricePreset === 'under150') {
      filtered = filtered.filter(p => p.price < 150);
    } else if (activePricePreset === '150-400') {
      filtered = filtered.filter(p => p.price >= 150 && p.price <= 400);
    } else if (activePricePreset === 'over400') {
      filtered = filtered.filter(p => p.price > 400);
    } else if (activePricePreset === 'custom') {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => p.price >= min);
      }
      if (!isNaN(max)) {
        filtered = filtered.filter(p => p.price <= max);
      }
    }

    // Apply Sorting logic
    if (activeSort === 'random') {
      const arr = [...filtered];
      // Deterministic Fisher-Yates pseudo-random permutation based on shuffleSeed
      for (let i = arr.length - 1; i > 0; i--) {
        const pseudoVal = Math.abs(Math.sin(shuffleSeed + i * 997 + (arr[i]?.name?.length || i)));
        const j = Math.floor(pseudoVal * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    } else if (activeSort === 'time') {
      return [...filtered].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (activeSort === 'price_asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else {
      // Recommended logic
      if (userPrefs && userPrefs.preferredCategories && userPrefs.preferredCategories.length > 0) {
        filtered = filtered.filter(p => userPrefs.preferredCategories.some(cat => CATEGORY_GROUPS[cat]?.includes(p.category)));
      }
      return [...filtered].sort((a, b) => {
        const scoreA = (a.isHallOfFame ? 100 : 0) + (a.likes || 0) * 2 + (a.isNew ? 20 : 0);
        const scoreB = (b.isHallOfFame ? 100 : 0) + (b.likes || 0) * 2 + (b.isNew ? 20 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }
  }, [products, activeCategory, categories, activeFilter, userPrefs, activeSort, minPrice, maxPrice, activePricePreset, shuffleSeed]);

  // Reset pagination when category, search, or filters change
  useEffect(() => {
    setVisibleCount(8);
    setInfiniteScrollEnabled(false);
  }, [activeCategory, activeFilter, activeSort, activePricePreset, minPrice, maxPrice]);

  // Infinite Scroll Trigger when user scrolls down
  useEffect(() => {
    if (!infiniteScrollEnabled) return;
    if (visibleCount >= filteredProducts.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 8, filteredProducts.length));
      }
    }, { threshold: 0.1, rootMargin: '200px' });

    const currentSentinel = loadMoreSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [infiniteScrollEnabled, visibleCount, filteredProducts.length]);

  // Cyber Blueprint Vector Silhouettes mapping
  const renderCyberBlueprint = (category: string) => {
    const normalized = category.toLowerCase();
    
    if (normalized.includes('shoe') || normalized.includes('footwear') || normalized.includes('boot')) {
      return (
        <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18h12a2 2 0 0 0 2-2V8l-3-3H9L4 9v9z" className="opacity-40" />
          <path d="M4 14h14" />
          <path d="M12 5v13" />
          <path d="M8 9h8" />
          <path d="M18 16c1.1 0 2-.9 2-2V8" />
          <circle cx="12" cy="11" r="1.5" className="fill-blue-600 animate-pulse" />
        </svg>
      );
    } else if (normalized.includes('bag') || normalized.includes('luggage') || normalized.includes('purse') || normalized.includes('jewelry') || normalized.includes('accessories')) {
      return (
        <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="10" width="18" height="11" rx="2" />
          <path d="M9 10V6a3 3 0 0 1 6 0v4" />
          <path d="M3 14h18" className="opacity-60" />
          <path d="M12 10v11" className="opacity-40" />
          <rect x="11" y="13" width="2" height="3" rx="0.5" className="fill-blue-600" />
        </svg>
      );
    } else {
      return (
        <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 5.5l-3-1.5L12 6.5 6.5 4l-3 1.5L2 10h4v10h12V10h4l-1.5-4.5z" />
          <path d="M12 6.5V20" strokeDasharray="2 2" />
          <path d="M6 10h12" className="opacity-50" />
          <path d="M8.5 4.5L12 8l3.5-3.5" />
        </svg>
      );
    }
  };

  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent('open-search'));
  };

  const triggerCart = () => {
    window.dispatchEvent(new CustomEvent('open-cart'));
  };

  return (
    <div className="bg-zinc-50 min-h-screen pb-28 text-zinc-900 font-sans mt-0 overflow-x-hidden relative">
      {/* Background Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[600px] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06)_0%,transparent_75%)] pointer-events-none z-0"></div>
      <div className="absolute top-44 left-[-10%] w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none rounded-full z-0"></div>
      <div className="absolute top-[600px] right-[-10%] w-96 h-96 bg-blue-700/5 blur-[120px] pointer-events-none rounded-full z-0"></div>

      {/* 2. Hero Card (Editorial Quote Carousel - 4 Random Selected Per Session) */}
      <SectionErrorBoundary sectionName="Featured Banner" compact>
        {heroSlides.length > 0 && (() => {
          const activeSlide = heroSlides[currentSlide] || heroSlides[0];
          return (
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="mx-4 mt-2 sm:mt-3 relative rounded-[2.5rem] overflow-hidden bg-[#0B132B] border border-[#1E293B] p-2 sm:p-4 aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] md:h-[480px] w-[calc(100%-2rem)] max-w-7xl mx-auto flex items-center justify-center shadow-2xl group z-10 select-none"
            >
              {/* Soft liquid layout waves and colors */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0F52BA]/20 to-[#4169E1]/10 z-0"></div>
              <div className="absolute top-[10%] left-[5%] right-[5%] bottom-[10%] bg-[#0F52BA]/10 rounded-[3rem] blur-[80px] z-0"></div>
              
              {/* Curved organic mask shape */}
              <div className="absolute inset-x-0 bottom-0 top-[25%] z-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full text-[#1E50FF]/20 fill-current" viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path d="M0,64L48,80C96,96,192,128,288,149.3C384,171,480,181,576,165.3C672,149,768,107,864,96C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
              </div>

              {/* Top Controls: 4 Slide Progress Indicators & Session Shuffle */}
              <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between gap-3 z-30">
                <div className="flex-1 flex gap-2">
                  {heroSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlide(idx)}
                      className="flex-1 h-1.5 bg-white/25 hover:bg-white/40 rounded-full overflow-hidden transition-all relative"
                      title={`Go to quote ${idx + 1}`}
                    >
                      {currentSlide === idx ? (
                        <div className={`h-full bg-white rounded-full animate-slide-progress ${isPaused ? 'animation-pause' : ''}`} />
                      ) : currentSlide > idx ? (
                        <div className="h-full bg-white/90 rounded-full w-full" />
                      ) : (
                        <div className="h-full bg-white/10 rounded-full w-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Shuffle 4 Button */}
                <button
                  onClick={handleShuffleHero}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/90 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  title="Pick 4 new random quotes"
                >
                  <Shuffle className="w-3 h-3 text-[#C5A880]" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
              </div>

              {/* Model Image Layout */}
              <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden rounded-[2rem]">
                <img 
                  key={activeSlide.id}
                  src={activeSlide.image} 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = activeSlide.fallbackImage;
                  }}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-[2000ms] ease-out select-none pointer-events-none animate-in fade-in zoom-in-95 duration-700" 
                  alt={activeSlide.quote} 
                  referrerPolicy="no-referrer"
                />

                {/* Multi-layered cinematic gradient protection */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block"></div>

                {/* Quote Written Down The Image (Editorial Layout) */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-12 flex flex-col justify-end z-20">
                  <div className="max-w-4xl space-y-3 sm:space-y-4">
                    {/* Prominent Fashion Quote Written Down The Image */}
                    <h2 className="text-2xl sm:text-4xl md:text-6xl font-serif italic font-bold text-white leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                      "{activeSlide.quote}"
                    </h2>

                    {/* Editorial Actions */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full bg-gradient-to-r from-white via-slate-50 to-[#E8D3B0] text-zinc-950 border border-[#C5A880]/60 text-[10px] sm:text-xs font-black uppercase tracking-widest inline-flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all"
                      >
                        <span>Shop Now</span>
                        <ArrowRight className="w-4 h-4 text-[#0F52BA]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Arrow */}
              <button 
                onClick={() => setCurrentSlide(prev => prev === 0 ? heroSlides.length - 1 : prev - 1)}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all duration-300 z-30 opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 shadow-lg"
                title="Previous Quote"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow */}
              <button 
                onClick={() => setCurrentSlide(prev => (prev + 1) % heroSlides.length)}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all duration-300 z-30 opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 shadow-lg"
                title="Next Quote"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          );
        })()}
      </SectionErrorBoundary>

      {/* Filter Panel */}
      <div className="px-4 mt-8 flex justify-end z-10 relative">
        <div className="flex items-center gap-2.5">
          {/* Filter Toggle Button */}
          <button
            onClick={() => {
              setShowPriceInputs(!showPriceInputs);
              setShowSortDropdown(false);
            }}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-xs cursor-pointer ${
              showPriceInputs || activePricePreset !== 'all'
                ? 'bg-[#0F52BA] text-white border-[#0F52BA] shadow-sm'
                : 'bg-white text-[#0F52BA] border-zinc-200 hover:border-[#0F52BA]/40'
            }`}
          >
            Filter
          </button>
        </div>
      </div>
      
      {/* Absolute Dropdown Price Filter */}
      {showPriceInputs && (
        <div 
          ref={priceDropdownRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 left-4 md:left-auto md:right-4 top-[560px] z-[100] bg-white border border-zinc-200 rounded-2xl p-4 shadow-xl min-w-[280px] sm:min-w-[320px] animate-in fade-in slide-in-from-top-2 duration-200 text-zinc-800"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filter By Price</span>
            {activePricePreset !== 'all' && (
              <button 
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setActivePricePreset('all');
                }}
                className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="mb-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Quick Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under150', label: 'Under $150' },
                { id: '150-400', label: '$150 - $400' },
                { id: 'over400', label: 'Over $400' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setActivePricePreset(preset.id);
                    if (preset.id === 'all') {
                      setMinPrice('');
                      setMaxPrice('');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    activePricePreset === preset.id 
                      ? 'bg-blue-600/10 text-blue-600 border-blue-600/30' 
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Custom Range ($)</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-zinc-50 px-2.5 py-2 rounded-xl border border-zinc-200 focus-within:border-blue-600/50 transition-colors">
                <span className="text-[9px] text-zinc-400 uppercase font-black">Min</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setActivePricePreset('custom');
                  }}
                  className="w-full bg-transparent border-none text-[12px] text-zinc-800 focus:outline-none placeholder-zinc-300 font-bold"
                />
              </div>
              <span className="text-zinc-400 text-xs font-bold">—</span>
              <div className="flex-1 flex items-center gap-1.5 bg-zinc-50 px-2.5 py-2 rounded-xl border border-zinc-200 focus-within:border-blue-600/50 transition-colors">
                <span className="text-[9px] text-zinc-400 uppercase font-black">Max</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setActivePricePreset('custom');
                  }}
                  className="w-full bg-transparent border-none text-[12px] text-zinc-800 focus:outline-none placeholder-zinc-300 font-bold"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPriceInputs(false)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* 4. Product Showcase */}
      <SectionErrorBoundary 
        sectionName="Featured Products" 
        onReset={onRetryProducts}
      >
        <div 
          ref={productsSectionRef} 
          className="mx-4 mt-8 z-10 relative"
        >
          <div className="flex justify-between items-center px-2 pb-2 border-b border-[#0F52BA]/15">
            <span className="text-[10px] font-mono tracking-widest text-[#0F52BA] uppercase flex items-center gap-2 font-bold">
              <span className="w-2 h-2 bg-[#C5A880] rounded-full animate-ping shadow-[0_0_8px_#C5A880]"></span>
              FEATURED PRODUCTS
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReshuffleProducts}
                className="text-[9px] font-mono text-blue-600 hover:text-blue-700 tracking-wider font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 active:scale-95 transition-all cursor-pointer"
                title="Shuffle products at random"
              >
                <Shuffle className="w-2.5 h-2.5" />
                <span>Shuffle Feed</span>
              </button>
              <span className="text-[9px] font-mono text-[#C5A880] tracking-wider font-semibold">
                {isInitializing ? 'LOADING PRODUCTS...' : `${filteredProducts.length} ITEMS AVAILABLE`}
              </span>
            </div>
          </div>

          {isInitializing ? (
            <div className="pt-3">
              <ProductGridSkeleton count={8} />
            </div>
          ) : productError ? (
            <div className="my-6 p-8 rounded-3xl bg-zinc-50 border border-zinc-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-800">Couldn't load products</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {productError || 'The catalog request took too long or encountered a connection issue.'}
                </p>
              </div>
              {onRetryProducts && (
                <button
                  onClick={onRetryProducts}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto mb-3 animate-pulse" />
              <p className="text-xs font-medium text-zinc-400">No drops matching your current filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                {filteredProducts.slice(0, visibleCount).map((p) => (
                  <ProductCard 
                    key={p.id}
                    product={p}
                    onClick={onProductClick}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlist.includes(p.id)}
                    saleTimerEnd={p.price < p.originalPrice ? limitedOfferEnd : null}
                    onQuickBuy={onQuickBuy}
                    onToggleCompare={onToggleCompare}
                    isComparing={comparisonList.some(item => item.id === p.id)}
                  />
                ))}
              </div>

              {/* Infinite Scroll and Pagination Control */}
              {filteredProducts.length > 8 && (
                <div className="mt-8 flex flex-col items-center justify-center gap-3">
                  {!infiniteScrollEnabled && visibleCount < filteredProducts.length ? (
                    <button
                      id="show-more-products-btn"
                      onClick={() => {
                        setInfiniteScrollEnabled(true);
                        setVisibleCount((prev) => Math.min(prev + 8, filteredProducts.length));
                      }}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#0F52BA] to-[#0B132B] hover:from-blue-600 hover:to-[#0F52BA] text-white rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_4px_16px_rgba(15,82,186,0.3)] flex items-center gap-2 cursor-pointer border border-[#C5A880]/30 group"
                    >
                      <span>Show More Products</span>
                      <ChevronDown className="w-4 h-4 text-[#E8D3B0] group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  ) : null}

                  {/* Infinite scroll load sentinel */}
                  {infiniteScrollEnabled && visibleCount < filteredProducts.length && (
                    <div ref={loadMoreSentinelRef} className="py-6 flex items-center justify-center gap-2 text-zinc-400">
                      <div className="w-4 h-4 border-2 border-[#0F52BA] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] font-mono tracking-wider">Loading more pieces...</span>
                    </div>
                  )}

                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                    Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} items
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </SectionErrorBoundary>

      {/* Trust Badges & Referral Program overlay */}
      <div className="px-4 mt-8 grid grid-cols-2 gap-3 z-10 relative">
        <div className="p-4 rounded-[1.75rem] bg-white border border-zinc-200 hover:border-[#0F52BA]/40 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Truck className="w-4 h-4 text-[#0F52BA]" />
          </div>
          <h4 className="font-bold text-xs text-zinc-900 tracking-tight">Fast Delivery</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed">Quick and safe delivery with package tracking included.</p>
        </div>
        <div className="p-4 rounded-[1.75rem] bg-white border border-zinc-200 hover:border-[#0F52BA]/40 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-[#FFFDF9] flex items-center justify-center border border-[#E8D3B0]">
            <ShieldCheck className="w-4 h-4 text-[#8D6638]" />
          </div>
          <h4 className="font-bold text-xs text-zinc-900 tracking-tight">100% Authentic</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed">Genuine clothes and accessories with guaranteed quality.</p>
        </div>
      </div>

            {/* Refer & Earn Modal */}
      {showReferModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
            
            {/* Modal header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#967447]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#967447] font-mono">REFER & EARN</span>
              </div>
              <button 
                onClick={() => setShowReferModal(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Illustration/Description */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#0F52BA]/10 border border-[#0F52BA]/20 flex items-center justify-center mx-auto shadow-[0_4px_16px_rgba(15,82,186,0.1)]">
                <Award className="w-8 h-8 text-[#0F52BA]" />
              </div>
              <h3 className="text-lg font-serif italic text-zinc-950 font-bold">Expand the Syndicate</h3>
              <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                Invite fellow fashion archivers. They receive <strong className="text-zinc-950">10% off</strong> their first synergy checkout, and you earn <strong className="text-[#0F52BA] font-black">$15 store credit</strong>.
              </p>
            </div>

            {/* Referral Link Copy Section */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 font-mono">Your Direct Link</span>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-2.5">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://closetkraze.com/join?ref=${userHandle || 'Archiver'}`} 
                  className="flex-1 bg-transparent border-none text-xs text-zinc-800 font-mono focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://closetkraze.com/join?ref=${userHandle || 'Archiver'}`);
                    setReferralCopied(true);
                    setTimeout(() => setReferralCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    referralCopied 
                      ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-zinc-950 text-white hover:bg-[#0F52BA] shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  {referralCopied ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Referral Stats Grid */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
              <div className="text-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Invited Archivers</span>
                <span className="text-xl font-mono font-black text-zinc-950 block mt-1">3</span>
              </div>
              <div className="text-center border-l border-zinc-200">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Store Credit Earned</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">$45.00</span>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Floating styles & animations */}
      <style>{`
        /* Glowing grids background details */
        .bg-grid-lines {
          background-image: 
            linear-gradient(to right, rgba(37, 99, 235, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.1) 1px, transparent 1px);
          background-size: 8px 8px;
        }

        /* Scanner laser animation */
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }

        .group:hover .group-hover\\:animate-scanner {
          animation: scan 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default HomeLobby;
