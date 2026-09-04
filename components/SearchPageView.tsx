import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';
import { 
  Search, 
  Camera, 
  Trash2, 
  Clock, 
  Loader2, 
  Upload, 
  Video, 
  Sparkles, 
  X, 
  Heart, 
  Grid, 
  List, 
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Check
} from 'lucide-react';
import { setCookie, getCookie } from '../lib/cookieUtils';
import { toast } from 'sonner';

interface SearchPageViewProps {
  products: Product[];
  wishlist: string[];
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (p: Product) => void;
  limitedOfferEnd?: number | null;
  onToggleCompare?: (product: Product) => void;
  comparisonList?: Product[];
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onQuickBuy?: (product: Product) => void;
}

const SearchPageView: React.FC<SearchPageViewProps> = ({
  products,
  wishlist,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  limitedOfferEnd,
  onToggleCompare,
  comparisonList = [],
  initialQuery,
  onClearInitialQuery,
  onQuickBuy
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(3000);
  const [filterOnlyInStock, setFilterOnlyInStock] = useState<boolean>(false);
  const [filterSortBy, setFilterSortBy] = useState<string>('RELEVANCE');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Sync initialQuery prop to local state
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery, onClearInitialQuery]);

  // Camera search state variables
  const [showCameraMode, setShowCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [uploadedImageB64, setUploadedImageB64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingPhase, setAnalyzingPhase] = useState('');
  const [detectedAttributes, setDetectedAttributes] = useState('');
  const [visualMatches, setVisualMatches] = useState<any[]>([]);

  // Sizes / colors selection states for adding to cart
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedColorVariants, setSelectedColorVariants] = useState<Record<string, { main: string; secondary: string }>>({});
  const [showSelectionModal, setShowSelectionModal] = useState<string | null>(null);
  const [clickedProductIds, setClickedProductIds] = useState<Record<string, boolean>>({});
  const [quickBuyingId, setQuickBuyingId] = useState<string | null>(null);

  const handleQuickBuySearch = (product: Product) => {
    if (quickBuyingId || !onQuickBuy) return;
    setQuickBuyingId(product.id);
    
    setTimeout(() => {
      onQuickBuy(product);
    }, 600);

    setTimeout(() => {
      setQuickBuyingId(null);
    }, 1500);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard backend product query logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Backend search
        const backendResults = await databaseService.searchProducts(searchQuery);
        
        // Local filtering
        const clientSideResults = products.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // Merge results
        const combinedResults = Array.from(new Map([...backendResults, ...clientSideResults].map(p => [p.id, p])).values());
        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  // Load search history cookie on mount
  useEffect(() => {
    const saved = getCookie('searchHistory');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing search history', e);
      }
    }
  }, []);

  // Initialize size defaults
  useEffect(() => {
    const defaults: Record<string, string> = {};
    products.forEach(p => {
      if (p.sizes && p.sizes.length > 0 && !selectedSizes[p.id]) {
        defaults[p.id] = p.sizes[0];
      }
    });
    if (Object.keys(defaults).length > 0) {
      setSelectedSizes(prev => ({ ...prev, ...defaults }));
    }
  }, [products]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, [cameraStream]);

  const clearHistory = () => {
    setRecentSearches([]);
    setCookie('searchHistory', '', 0);
  };

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const consent = getCookie('cookieConsent');
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 8);
    setRecentSearches(updated);
    if (consent === 'true') {
      setCookie('searchHistory', JSON.stringify(updated), 60); // 60 days
    }
  };

  const recommendedSearches = useMemo(() => {
    if (products.length === 0) return ['Fashion', 'Jacket', 'Drapes', 'Hoodie'];
    const uniqueCats = Array.from(new Set(products.map(p => p.category))).slice(0, 3);
    const randomProductNames = products
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(p => p.name);
    return [...uniqueCats, ...randomProductNames];
  }, [products]);

  // Camera streaming controls
  const startLiveCamera = async () => {
    try {
      stopLiveCamera(); // clear previous
      setUploadedImageB64(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success("Live camera alignment initiated.");
    } catch (err) {
      console.error("Camera access failed:", err);
      toast.error("Unable to activate live stream. Please capture or upload a file directly instead.");
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopLiveCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setUploadedImageB64(b64);
        startVisualSearch(b64); // trigger search instantly
      };
      reader.readAsDataURL(file);
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL('image/jpeg');
        setUploadedImageB64(b64);
        stopLiveCamera();
        startVisualSearch(b64); // trigger search instantly
      }
    }
  };

  const startVisualSearch = async (b64Data: string) => {
    setIsAnalyzing(true);
    setVisualMatches([]);
    setDetectedAttributes('');

    const phases = [
      'Isolating garment contour lines...',
      'Analyzing fabric shades & color palette...',
      'Deconstructing texture silhouette weight...',
      'Cross-referencing high-fashion look catalogues...'
    ];
    let phaseIdx = 0;
    setAnalyzingPhase(phases[0]);

    const interval = setInterval(() => {
      phaseIdx++;
      if (phaseIdx < phases.length) {
        setAnalyzingPhase(phases[phaseIdx]);
      }
    }, 1200);

    try {
      const res = await databaseService.visualSearchByImage(b64Data);
      clearInterval(interval);
      setAnalyzingPhase('Aligning visual blueprints...');

      if (res.success) {
        setVisualMatches(res.matches || []);
        setDetectedAttributes(res.detectedAttrs || '');
        if (!res.matches || res.matches.length === 0) {
          toast.error("No stylistically similar matches discovered.");
        } else {
          toast.success(`Search integrated. Discovered ${res.matches.length} matches.`);
        }
      } else {
        toast.error("Neural analysis failed to process.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      toast.error(err.message || "Deep neural match failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToCartClick = (product: Product) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colorVariants && product.colorVariants.length > 0;

    if (hasSizes || hasColors) {
      if (hasSizes && !selectedSizes[product.id]) {
        setSelectedSizes(prev => ({ ...prev, [product.id]: product.sizes![0] }));
      }
      if (hasColors && !selectedColorVariants[product.id]) {
        setSelectedColorVariants(prev => ({ ...prev, [product.id]: product.colorVariants![0] }));
      }
      setShowSelectionModal(product.id);
    } else {
      setClickedProductIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setClickedProductIds(prev => ({ ...prev, [product.id]: false }));
      }, 1200);
      onAddToCart(product);
    }
  };

  const confirmAddToCart = (product: Product) => {
    setClickedProductIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setClickedProductIds(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
    onAddToCart(product, selectedSizes[product.id], selectedColorVariants[product.id]);
    setShowSelectionModal(null);
  };

  // Dynamically calculate highest price of products in the database to scale slider
  const highestPriceLimit = useMemo(() => {
    if (products.length === 0) return 3000;
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  // Set default max price on load if it has not been modified
  useEffect(() => {
    setFilterMaxPrice(highestPriceLimit);
  }, [highestPriceLimit]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const matchesFilter = (p: Product) => {
    // Category filter
    if (filterCategory !== 'ALL' && p.category !== filterCategory) {
      return false;
    }
    // Price filter
    if (p.price > filterMaxPrice) {
      return false;
    }
    // Stock filter
    if (filterOnlyInStock && !p.inStock) {
      return false;
    }
    // Gender filter
    if (filterGender !== 'ALL') {
      const g = p.gender ? p.gender.toUpperCase() : '';
      const filterG = filterGender.toUpperCase();
      if (filterG === 'MALE' || filterG === 'MEN') {
        if (g !== 'MALE' && g !== 'MEN' && g !== 'UNISEX') return false;
      } else if (filterG === 'FEMALE' || filterG === 'WOMEN') {
        if (g !== 'FEMALE' && g !== 'WOMEN' && g !== 'UNISEX') return false;
      } else if (filterG === 'UNISEX') {
        if (g !== 'UNISEX') return false;
      }
    }
    // Color filter
    if (filterColor !== 'ALL') {
      let pColors: string[] = [];
      try {
        if (p.colors) {
          pColors = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors;
        }
      } catch (e) {
        pColors = [];
      }
      const hasColorMatch = Array.isArray(pColors) && pColors.some(c => c.toLowerCase().includes(filterColor.toLowerCase()));
      if (!hasColorMatch) {
        return false;
      }
    }
    return true;
  };

  const sortProducts = (a: Product, b: Product) => {
    if (filterSortBy === 'PRICE_ASC') {
      return a.price - b.price;
    }
    if (filterSortBy === 'PRICE_DESC') {
      return b.price - a.price;
    }
    if (filterSortBy === 'POPULARITY') {
      return (b.viewers || 0) - (a.viewers || 0);
    }
    if (filterSortBy === 'NEWEST') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  };

  const filteredSearchResults = useMemo(() => {
    return searchResults.filter(matchesFilter).sort(sortProducts);
  }, [searchResults, filterCategory, filterMaxPrice, filterOnlyInStock, filterSortBy, filterGender, filterColor, highestPriceLimit]);

  const filteredVisualMatches = useMemo(() => {
    return visualMatches
      .filter(match => match.product && matchesFilter(match.product))
      .sort((a, b) => {
        const prodA = a.product;
        const prodB = b.product;
        if (filterSortBy !== 'RELEVANCE') {
          return sortProducts(prodA, prodB);
        }
        return b.confidence - a.confidence;
      });
  }, [visualMatches, filterCategory, filterMaxPrice, filterOnlyInStock, filterSortBy, filterGender, filterColor, highestPriceLimit]);

  const activeResults = useMemo(() => {
    return filteredSearchResults;
  }, [filteredSearchResults]);

  const activeVisualMatches = useMemo(() => {
    return filteredVisualMatches;
  }, [filteredVisualMatches]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 animate-in fade-in duration-700">
      
      {/* Quick Add To Bag Modal Overlay */}
      {showSelectionModal && (
        <div 
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in duration-300"
          onClick={() => setShowSelectionModal(null)}
        >
          <div 
            className="w-full max-w-sm glass-card p-8 rounded-[2rem] flex flex-col gap-8 border border-[#00D1FF]/30"
            onClick={(e) => e.stopPropagation()}
          >
            {products.find(p => p.id === showSelectionModal) && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif italic text-white line-clamp-1">{products.find(p => p.id === showSelectionModal)?.name}</h3>
                  <button onClick={() => setShowSelectionModal(null)} className="text-white hover:text-[#00D1FF]">✕</button>
                </div>

                {/* Color Selection */}
                {products.find(p => p.id === showSelectionModal)?.colorVariants && products.find(p => p.id === showSelectionModal)!.colorVariants!.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Variant</div>
                    <div className="flex flex-wrap gap-4">
                      {products.find(p => p.id === showSelectionModal)!.colorVariants!.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorVariants(prev => ({ ...prev, [showSelectionModal]: variant }))}
                          className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                            selectedColorVariants[showSelectionModal]?.main === variant.main 
                              ? 'border-[#00D1FF] scale-110 shadow-[0_0_15px_rgba(0,209,255,0.3)]' 
                              : 'border-white/10 opacity-50 hover:opacity-100'
                          }`}
                          style={{ 
                            background: `linear-gradient(135deg, ${variant.main} 50%, ${variant.secondary} 50%)` 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {products.find(p => p.id === showSelectionModal)?.sizes && products.find(p => p.id === showSelectionModal)!.sizes.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Size</div>
                    <div className="grid grid-cols-3 gap-3">
                      {products.find(p => p.id === showSelectionModal)?.sizes?.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes(prev => ({ ...prev, [showSelectionModal]: size }))}
                          className={`py-3 text-[10px] font-black rounded-xl border transition-all ${
                            selectedSizes[showSelectionModal] === size 
                              ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-[0_0_15px_rgba(0,209,255,0.3)]' 
                              : 'border-white/10 text-white hover:border-white/30'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => confirmAddToCart(products.find(p => p.id === showSelectionModal)!)}
                  className={`w-full py-5 text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all ${
                    showSelectionModal && clickedProductIds[showSelectionModal]
                      ? 'bg-[#00D1FF] text-black shadow-[0_0_30px_rgba(0,209,255,0.4)]'
                      : 'bg-white text-black hover:bg-[#00D1FF] transition-colors'
                  }`}
                >
                  Acquire Silhouette
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Styled Laser-Sweep scanning animation */}
      <style>{`
        @keyframes scanlaser {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }
        .scan-line {
          animation: scanlaser 2s ease-in-out infinite;
        }
      `}</style>

      {/* Simplified Header spacing */}
      <div className="pt-8"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-20 mt-12 space-y-8">
        
        {/* Simplified Unified Search Controls */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input and Toggles */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-[#00D1FF]/60 focus-within:bg-white/10 transition-all">
                <Search className="w-5 h-5 text-zinc-400 ml-3" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { saveSearch(searchQuery); } }}
                  placeholder="Enter keywords, tags or silhouettes..."
                  className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-zinc-500 pl-3 py-2 pr-4 font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-zinc-500 hover:text-white mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Filters Toggle & Camera/Scanner Toggle */}
              <div className="flex gap-2 shrink-0">
                {/* Filters Toggle Button */}
                <button
                  onClick={() => {
                    setShowFilters(!showFilters);
                  }}
                  className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                    showFilters 
                      ? 'bg-[#00D1FF] border-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  <span className="ml-1 text-[10px] opacity-75">
                    {showFilters ? '▲' : '▼'}
                  </span>
                </button>

                {/* Camera/Visual Scanner Toggle Button */}
                <button
                  onClick={() => {
                    if (showCameraMode) {
                      stopLiveCamera();
                      setShowCameraMode(false);
                    } else {
                      setShowCameraMode(true);
                      startLiveCamera();
                    }
                  }}
                  className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                    showCameraMode 
                      ? 'bg-gradient-to-r from-[#00D1FF] to-[#EC4899] border-transparent text-white shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Visual Scan</span>
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden sm:inline">Listing mode</span>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('GRID')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Filters Dropdown Panel */}
          {showFilters && (
            <div className="glass-card border border-[#00D1FF]/20 p-6 rounded-3xl space-y-6 mt-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Advanced Filter Console</span>
                </div>
                {(filterCategory !== 'ALL' || filterMaxPrice !== highestPriceLimit || filterOnlyInStock || filterGender !== 'ALL' || filterSortBy !== 'RELEVANCE') && (
                  <button 
                    onClick={() => {
                      setFilterCategory('ALL');
                      setFilterMaxPrice(highestPriceLimit);
                      setFilterOnlyInStock(false);
                      setFilterGender('ALL');
                      setFilterSortBy('RELEVANCE');
                      toast.success("Filters reset successfully");
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#00D1FF] transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sort Order Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Sort Directives</label>
                  <select
                    value={filterSortBy}
                    onChange={(e) => setFilterSortBy(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#00D1FF]/60 transition-all font-medium appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="RELEVANCE" className="bg-[#050505] text-white">Relevance Match</option>
                    <option value="PRICE_ASC" className="bg-[#050505] text-white">Price: Low to High</option>
                    <option value="PRICE_DESC" className="bg-[#050505] text-white">Price: High to Low</option>
                    <option value="POPULARITY" className="bg-[#050505] text-white">Popularity (Viewers)</option>
                    <option value="NEWEST" className="bg-[#050505] text-white">Newest Silhouettes</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Gender Archetype</label>
                  <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    {['ALL', 'MALE', 'FEMALE', 'UNISEX'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFilterGender(g)}
                        className={`py-2 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all ${
                          filterGender === g 
                            ? 'bg-[#00D1FF] text-black shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {g === 'ALL' ? 'All' : g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-zinc-500">Max Budget</span>
                    <span className="text-[#00D1FF] font-mono">GH₵{filterMaxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={highestPriceLimit}
                    step="10"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#00D1FF] bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                    <span>GH₵0</span>
                    <span>GH₵{highestPriceLimit}</span>
                  </div>
                </div>

                {/* Availability Stock Toggle */}
                <div className="flex items-center justify-center">
                  <label className="flex items-center justify-between cursor-pointer group py-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">In-Stock Only</span>
                      <p className="text-[8px] text-zinc-500 font-mono">Exclude unavailable silhouettes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={filterOnlyInStock}
                      onChange={(e) => setFilterOnlyInStock(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D1FF] peer-checked:after:bg-black peer-checked:after:border-black"></div>
                  </label>
                </div>
              </div>

              {/* Category Filter - Expanded row */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Categories</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                      filterCategory === 'ALL'
                        ? 'bg-[#00D1FF] border-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    All Categories
                  </button>
                  {uniqueCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                        filterCategory === cat
                          ? 'bg-[#00D1FF] border-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Filter By Color</label>
                  {filterColor !== 'ALL' && (
                    <button 
                      onClick={() => setFilterColor('ALL')}
                      className="text-[8px] font-black uppercase text-[#00D1FF] tracking-wider hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar p-2 bg-[#020202]/40 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setFilterColor('ALL')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${
                      filterColor === 'ALL'
                        ? 'bg-[#00D1FF] border-[#00D1FF] text-black shadow-md'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    All Colors
                  </button>
                  {[
                    { name: 'Black', hex: '#000000' },
                    { name: 'White', hex: '#FFFFFF' },
                    { name: 'Grey', hex: '#808080' },
                    { name: 'Red', hex: '#D32F2F' },
                    { name: 'Blue', hex: '#1F51FF' },
                    { name: 'Green', hex: '#87A96B' },
                    { name: 'Yellow', hex: '#CCFF00' },
                    { name: 'Orange', hex: '#FF9900' },
                    { name: 'Purple', hex: '#9966CC' },
                    { name: 'Pink', hex: '#FFC0CB' },
                    { name: 'Beige', hex: '#F5F5DC' },
                    { name: 'Gold', hex: '#FFD700' },
                    { name: 'Silver', hex: '#C0C0C0' }
                  ].map(c => (
                    <button
                      key={c.name}
                      onClick={() => setFilterColor(c.name)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${
                        filterColor === c.name
                          ? 'bg-[#00D1FF] border-[#00D1FF] text-black shadow-md'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Camera / Neural Scanner Panel */}
          {showCameraMode && (
            <div className="glass-card border border-pink-500/20 p-6 rounded-3xl space-y-6 relative overflow-hidden animate-in slide-in-from-top-4 duration-300 max-w-xl mx-auto">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#00D1FF]/5 blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00D1FF] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Silhouette Scanner</span>
                </div>
                <button 
                  onClick={() => { stopLiveCamera(); setShowCameraMode(false); }}
                  className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
                >
                  Close Scanner
                </button>
              </div>

              {/* Visual Capture / Preview Display */}
              <div className="relative aspect-video max-h-[300px] rounded-2xl border border-white/5 bg-zinc-950/60 overflow-hidden flex flex-col items-center justify-center">
                
                {isAnalyzing && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-black/90">
                    <div className="relative w-40 h-40 rounded-xl border border-[#00D1FF]/30 overflow-hidden bg-zinc-950 flex items-center justify-center">
                      {uploadedImageB64 && (
                        <img src={uploadedImageB64} className="w-full h-full object-cover opacity-50" alt="Scanned pattern" />
                      )}
                      <div className="absolute left-0 right-0 h-1 bg-[#00D1FF] shadow-[0_0_15px_#00D1FF] scan-line" />
                    </div>
                    <div className="mt-4 text-center space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#00D1FF] mx-auto" />
                      <p className="text-[10px] text-white uppercase font-black tracking-widest">{analyzingPhase}</p>
                      <p className="text-[8px] text-zinc-500 font-mono">Multimodal Gemini Node</p>
                    </div>
                  </div>
                )}

                {cameraStream ? (
                  <div className="w-full h-full relative z-10">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      <button 
                        onClick={captureFrame}
                        className="bg-[#00D1FF] text-black font-black uppercase text-[9px] tracking-widest px-4 py-2.5 rounded-xl hover:bg-white transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,209,255,0.3)]"
                      >
                        <Camera className="w-3.5 h-3.5" /> SNAP BLUEPRINT
                      </button>
                    </div>
                  </div>
                ) : uploadedImageB64 ? (
                  <div className="w-full h-full relative z-10">
                    <img src={uploadedImageB64} className="w-full h-full object-cover" alt="Uploaded snap" />
                    <button 
                      onClick={() => {
                        setUploadedImageB64(null);
                        setVisualMatches([]);
                        setDetectedAttributes('');
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-red-500 rounded-full text-white transition-colors border border-white/10"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#00D1FF] mx-auto">
                      <Camera className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-300">Align silhouette pattern</p>
                      <p className="text-[10px] text-zinc-500 max-w-[280px] leading-relaxed mx-auto">Snap a picture or upload an external look design to fetch matching items instantly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Controls */}
              {!cameraStream && !isAnalyzing && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 text-zinc-300"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00D1FF]" /> UPLOAD FILE
                  </button>
                  <button 
                    onClick={() => { startLiveCamera(); }}
                    className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 text-zinc-300"
                  >
                    <Video className="w-3.5 h-3.5 text-[#00D1FF]" /> LIVE CAMERA
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              )}

              {/* Analysis details */}
              {detectedAttributes && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[8px] font-black tracking-widest uppercase text-[#00D1FF]">Isolated Look Attributes</span>
                  <p className="text-[10px] font-medium text-zinc-300 italic">"{detectedAttributes}"</p>
                </div>
              )}
            </div>
          )}

          {/* Recent & Recommended searches row */}
          {(recentSearches.length > 0 || recommendedSearches.length > 0) && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
              {/* Recent Search Intel */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent Intel</span>
                    <button onClick={clearHistory} className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 flex items-center gap-1.5 transition-colors">
                      <Trash2 className="w-3 h-3" /> Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <button 
                        key={`${term}-${idx}`}
                        onClick={() => setSearchQuery(term)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-zinc-300 hover:bg-[#00D1FF]/10 hover:text-[#00D1FF] hover:border-[#00D1FF]/30 transition-all flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended searches */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 block">Trending Directives</span>
                <div className="flex flex-wrap gap-2">
                  {recommendedSearches.map((name, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSearchQuery(name)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Matched Items Section */}
        <div className="w-full space-y-6">
          
          {/* Header row with stats */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-serif italic text-lg sm:text-2xl text-white">Found Blueprints</span>
              <span className="px-2.5 py-1 bg-white/5 text-[9px] font-mono text-zinc-400 rounded-lg">
                {showCameraMode ? activeVisualMatches.length : activeResults.length} Results
              </span>
            </div>
            
            {showCameraMode && activeVisualMatches.length > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00D1FF] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Neural Confidence Alignment Active
              </span>
            )}
          </div>

          {/* Visual matches from Camera or standard matches from text search */}
          {showCameraMode ? (
            /* Visual Search Matches List */
            activeVisualMatches.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {activeVisualMatches.map((match: any, idx: number) => {
                  const product: Product = match.product;
                  if (!product) return null;
                  const inWish = wishlist.includes(product.id);
                  return (
                    <motion.div 
                      variants={itemVariants}
                      key={product.id || idx}
                      className="group bg-white/5 border border-white/10 hover:border-[#00D1FF]/40 rounded-[1.5rem] overflow-hidden transition-all flex flex-col cursor-pointer"
                      onClick={() => onProductClick(product)}
                    >
                      <div className="aspect-[3/4] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                        <img 
                          src={getImageUrl(product.image)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                          alt={product.name}
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-md">
                          <span className="text-[8px] font-mono text-[#00D1FF] font-bold">
                            {Math.round(match.confidence * 100)}% Match
                          </span>
                        </div>
                        <motion.button 
                          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                          whileTap={{ scale: 0.8 }}
                          animate={{ scale: inWish ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            inWish ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-lg shadow-[#00D1FF]/20' : 'border-white/10 bg-black/60 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <motion.div
                            key={inWish ? 'search-grid-wish-yes' : 'search-grid-wish-no'}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Heart className="w-3.5 h-3.5" fill={inWish ? "currentColor" : "none"} />
                          </motion.div>
                        </motion.button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-[8px] font-black uppercase tracking-widest text-[#00D1FF]">{product.category}</div>
                          <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-[#00D1FF] transition-colors">{product.name}</h4>
                          <p className="text-[9px] text-zinc-400 line-clamp-2 italic font-medium">"{match.reasoning}"</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                          <span className="text-xs font-mono font-bold text-white">GH₵{product.price}</span>
                          <div className="flex gap-1.5">
                            {onQuickBuy && (!product.sizes || product.sizes.length <= 1) && (!product.colorVariants || product.colorVariants.length <= 1) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onQuickBuy(product); }}
                                className="px-2.5 py-1.5 bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/30 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#00D1FF] hover:text-black hover:border-transparent transition-colors flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                Quick Buy
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAddToCartClick(product); }}
                              className="px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#00D1FF] hover:text-white transition-colors"
                            >
                              Acquire
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : !isAnalyzing && uploadedImageB64 ? (
              <div className="text-center py-24 text-zinc-500 text-xs font-mono">
                Searching aligned look pattern directives...
              </div>
            ) : (
              <div className="text-center py-24 text-zinc-500 space-y-4">
                <Camera className="w-8 h-8 mx-auto text-zinc-700 animate-bounce" />
                <p className="text-xs font-mono max-w-sm mx-auto leading-relaxed">Align or snap a garment using the visual camera scanner to list identical matching silhouettes.</p>
              </div>
            )
          ) : (
            /* Standard database query results */
            searchQuery ? (
              activeResults.length > 0 ? (
                viewMode === 'GRID' ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {activeResults.map((product) => {
                      const inWish = wishlist.includes(product.id);
                      return (
                        <motion.div 
                          variants={itemVariants}
                          key={product.id}
                          className="group bg-white/5 border border-white/10 hover:border-[#00D1FF]/40 rounded-[1.5rem] overflow-hidden transition-all flex flex-col cursor-pointer"
                          onClick={() => onProductClick(product)}
                        >
                          <div className="aspect-[3/4] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                            <img 
                              src={getImageUrl(product.image)} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                              alt={product.name}
                            />
                            <motion.button 
                              onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                              whileTap={{ scale: 0.8 }}
                              animate={{ scale: inWish ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className={`absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                inWish ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-lg shadow-[#00D1FF]/20' : 'border-white/10 bg-black/60 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <motion.div
                                key={inWish ? 'search-rec-wish-yes' : 'search-rec-wish-no'}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              >
                                <Heart className="w-3.5 h-3.5" fill={inWish ? "currentColor" : "none"} />
                              </motion.div>
                            </motion.button>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-[8px] font-black uppercase tracking-widest text-[#00D1FF]">{product.category}</div>
                              <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-[#00D1FF] transition-colors">{product.name}</h4>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                              <span className="text-xs font-mono font-bold text-white">GH₵{product.price}</span>
                              <div className="flex gap-1.5">
                                {onQuickBuy && (!product.sizes || product.sizes.length <= 1) && (!product.colorVariants || product.colorVariants.length <= 1) && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleQuickBuySearch(product); }}
                                    disabled={quickBuyingId === product.id}
                                    className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 ${
                                      quickBuyingId === product.id
                                        ? 'bg-[#00D1FF] text-black border-[#00D1FF] animate-pulse'
                                        : 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/30 hover:bg-[#00D1FF] hover:text-black hover:border-transparent'
                                    }`}
                                  >
                                    {quickBuyingId === product.id ? (
                                      <>
                                        <Check className="w-3 h-3 stroke-[3px]" />
                                        <span>Initiated</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3" />
                                        <span>Quick Buy</span>
                                      </>
                                    )}
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAddToCartClick(product); }}
                                  className="px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#00D1FF] hover:text-white transition-colors"
                                >
                                  Acquire
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-white/5"
                  >
                    {activeResults.map((product) => {
                      const inWish = wishlist.includes(product.id);
                      return (
                        <motion.div 
                          variants={itemVariants}
                          key={product.id}
                          className="py-6 flex gap-6 items-center group transition-all"
                        >
                          <div 
                            className="w-24 h-32 overflow-hidden bg-zinc-900 relative rounded-xl border border-white/5 cursor-pointer shrink-0"
                            onClick={() => onProductClick(product)}
                          >
                            <img 
                              src={getImageUrl(product.image)} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                              alt={product.name}
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#00D1FF]">{product.category}</div>
                            <h3 
                              className="text-base font-serif italic text-white group-hover:text-[#00D1FF] transition-colors cursor-pointer"
                              onClick={() => onProductClick(product)}
                            >
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-md">{product.description}</p>
                            <div className="text-sm font-mono font-bold text-white pt-1">GH₵{product.price}</div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                             {onQuickBuy && (!product.sizes || product.sizes.length <= 1) && (!product.colorVariants || product.colorVariants.length <= 1) && (
                               <button 
                                 onClick={() => handleQuickBuySearch(product)}
                                 disabled={quickBuyingId === product.id}
                                 className={`px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 active:scale-95 font-sans ${
                                   quickBuyingId === product.id
                                     ? 'bg-[#00D1FF] text-black border-[#00D1FF] animate-pulse'
                                     : 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/30 hover:bg-[#00D1FF] hover:text-black hover:border-transparent'
                                 }`}
                               >
                                 {quickBuyingId === product.id ? (
                                   <>
                                     <Check className="w-3 h-3 stroke-[3px]" />
                                     <span>Initiated</span>
                                   </>
                                 ) : (
                                   <>
                                     <Sparkles className="w-3 h-3" />
                                     <span>Quick Buy</span>
                                   </>
                                 )}
                               </button>
                             )}
                            <button 
                              onClick={() => handleAddToCartClick(product)}
                              className="px-6 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#00D1FF] hover:text-white transition-all active:scale-95"
                            >
                              Acquire
                            </button>
                            <motion.button 
                              onClick={() => onToggleWishlist(product)}
                              whileTap={{ scale: 0.8 }}
                              animate={{ scale: inWish ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className={`w-9 h-9 border rounded-lg transition-all flex items-center justify-center ${
                                inWish ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-lg shadow-[#00D1FF]/20' : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                              }`}
                            >
                              <motion.div
                                key={inWish ? 'search-list-wish-yes' : 'search-list-wish-no'}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              >
                                <Heart className="w-3.5 h-3.5" fill={inWish ? "currentColor" : "none"} />
                              </motion.div>
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )
              ) : (
                <div className="text-center py-24 text-zinc-500 space-y-4">
                  <span className="text-3xl">📭</span>
                  <p className="text-xs font-mono max-w-sm mx-auto leading-relaxed">No matching look profiles found for query "{searchQuery}". Try refining your inputs or scanning a layout.</p>
                </div>
              )
            ) : (
              <div className="text-center py-24 text-zinc-500 space-y-4">
                <Search className="w-8 h-8 mx-auto text-zinc-700 animate-pulse" />
                <p className="text-xs font-mono max-w-sm mx-auto leading-relaxed">Specify keywords above or select trending keywords to query the global collection indexes.</p>
              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
};

export default SearchPageView;
