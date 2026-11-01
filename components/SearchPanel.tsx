import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';
import { 
  Search, 
  ChevronLeft, 
  Trash2, 
  Clock, 
  Loader2, 
  Sparkles, 
  X, 
  SlidersHorizontal, 
  Tag, 
  Folder, 
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  CornerDownLeft
} from 'lucide-react';
import { setCookie, getCookie } from '../lib/cookieUtils';
import { toast } from 'sonner';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductSelect: (p: Product) => void;
  onNavigateToFullSearch?: (query: string) => void;
}

// Utility to highlight matching query text in suggestions
const highlightMatch = (text: string, query: string) => {
  if (!query || !text) return text;
  const q = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);
  return (
    <>
      {before}
      <span className="text-[#00D1FF] font-black underline decoration-[#00D1FF]/40">{match}</span>
      {after}
    </>
  );
};

const SearchPanel: React.FC<SearchPanelProps> = ({ 
  isOpen, 
  onClose, 
  products, 
  onProductSelect,
  onNavigateToFullSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(3000);
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Instant real-time suggestions computed synchronously on keystrokes
  const realTimeSuggestions = useMemo(() => {
    const rawQuery = searchQuery.trim();
    const query = rawQuery.toLowerCase();
    if (!query) {
      return { categories: [], products: [], tags: [] };
    }

    const queryWords = query.split(/\s+/).filter(Boolean);

    // 1. Compute Category Matches with item counts
    const categoryMap = new Map<string, number>();
    products.forEach(p => {
      if (p.category) {
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      }
    });

    const matchingCategories: Array<{ name: string; count: number; score: number }> = [];
    categoryMap.forEach((count, cat) => {
      const catLower = cat.toLowerCase();
      let score = 0;
      if (catLower === query) score += 100;
      else if (catLower.startsWith(query)) score += 60;
      else if (catLower.includes(query)) score += 30;

      if (score > 0) {
        matchingCategories.push({ name: cat, count, score });
      }
    });
    matchingCategories.sort((a, b) => b.score - a.score || b.count - a.count);

    // 2. Compute Product Suggestions (top 5 highly relevant items)
    const scoredProducts = products.map(p => {
      const nameLower = (p.name || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();
      const brandLower = (p.brand || '').toLowerCase();
      const pTags = Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()) : [];

      let score = 0;
      if (nameLower === query) score += 120;
      else if (nameLower.startsWith(query)) score += 80;
      else if (nameLower.includes(query)) score += 40;

      queryWords.forEach(word => {
        if (nameLower.includes(word)) score += 20;
        if (brandLower.includes(word)) score += 15;
        if (catLower.includes(word)) score += 10;
        if (pTags.some(t => t.includes(word))) score += 8;
      });

      return { product: p, score };
    });

    const topProductSuggestions = scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.product);

    // 3. Compute Keyword / Tag / Brand Suggestions
    const tagSet = new Set<string>();
    products.forEach(p => {
      if (p.brand && p.brand.toLowerCase().includes(query)) {
        tagSet.add(p.brand);
      }
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          if (t.toLowerCase().includes(query)) {
            tagSet.add(t);
          }
        });
      }
    });

    return {
      categories: matchingCategories.slice(0, 4),
      products: topProductSuggestions,
      tags: Array.from(tagSet).slice(0, 4)
    };
  }, [searchQuery, products]);

  // Standard backend product query logic (debounced)
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
        
        // Local filtering with split-word scoring
        const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        
        const scoredClientProducts = products.map(p => {
          const name = (p.name || '').toLowerCase();
          const category = (p.category || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          const gender = (p.gender || '').toLowerCase();
          const pTags = Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()) : [];
          
          let score = 0;
          let matchedAll = true;

          for (const word of queryWords) {
            let wordMatch = false;
            if (name.includes(word)) {
              score += 10;
              wordMatch = true;
            }
            if (brand.includes(word)) {
              score += 8;
              wordMatch = true;
            }
            if (category.includes(word)) {
              score += 5;
              wordMatch = true;
            }
            if (pTags.some(t => t.includes(word))) {
              score += 4;
              wordMatch = true;
            }
            if (gender.includes(word)) {
              score += 3;
              wordMatch = true;
            }
            if (description.includes(word)) {
              score += 1;
              wordMatch = true;
            }
            if (!wordMatch) {
              matchedAll = false;
            }
          }

          if (matchedAll) score += 50;
          return { product: p, score };
        });

        const clientSideResults = scoredClientProducts
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.product);
        
        // Merge results
        const combinedResults = Array.from(new Map([...backendResults, ...clientSideResults].map(p => [p.id, p])).values());
        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  // Load search history cookie on mount
  useEffect(() => {
    const saved = getCookie('searchHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing search history', e);
        setRecentSearches([]);
      }
    }
  }, []);

  // Wipe the search overlay state when closed/navigated
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowFilters(false);
      setFilterCategory('ALL');
      setFilterGender('ALL');
    }
  }, [isOpen]);

  const clearHistory = () => {
    setRecentSearches([]);
    setCookie('searchHistory', '', 0);
  };

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const consent = getCookie('cookieConsent');
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    if (consent === 'true') {
      setCookie('searchHistory', JSON.stringify(updated), 60); // 60 days
    }
  };

  const recommendedSearches = useMemo(() => {
    if (products.length === 0) return ['Fashion', 'Apparel', 'Shoes', 'Bags'];
    return Array.from(new Set(products.map(p => p.category))).slice(0, 4);
  }, [products]);

  // Dynamically calculate highest price of products in the database to scale slider
  const highestPriceLimit = useMemo(() => {
    if (products.length === 0) return 3000;
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  // Set default max price on load or change
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
    // Gender filter
    if (filterGender !== 'ALL') {
      const g = p.gender ? p.gender.toUpperCase() : '';
      const filterG = filterGender.toUpperCase();
      if (filterG === 'MEN' || filterG === 'MALE') {
        if (g !== 'MALE' && g !== 'MEN' && g !== 'UNISEX') return false;
      } else if (filterG === 'WOMEN' || filterG === 'FEMALE') {
        if (g !== 'FEMALE' && g !== 'WOMEN' && g !== 'UNISEX') return false;
      } else if (filterG === 'UNISEX') {
        if (g !== 'UNISEX') return false;
      }
    }
    return true;
  };

  const filteredResults = useMemo(() => {
    return searchResults.filter(matchesFilter);
  }, [searchResults, filterCategory, filterMaxPrice, filterGender]);

  const handleSelectProduct = (product: Product) => {
    saveSearch(product.name);
    onProductSelect(product);
    onClose();
  };

  const handleSelectCategorySuggestion = (catName: string) => {
    setFilterCategory(catName);
    saveSearch(catName);
    toast.success(`Filtered by ${catName}`);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 left-0 w-full h-full sm:max-w-md bg-white text-black z-[310] shadow-2xl transition-transform duration-300 ease-out border-r border-black/5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          
          {/* Top Search Header */}
          <header className="p-3 border-b border-zinc-100 bg-white flex items-center gap-2.5">
            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-950 transition-all rounded-full hover:bg-zinc-50 cursor-pointer active:scale-95"
              aria-label="Close search"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-1 focus-within:border-[#00D1FF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00D1FF]/10 transition-all h-10">
              <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-1.5" />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    saveSearch(searchQuery); 
                    if (onNavigateToFullSearch) {
                      onNavigateToFullSearch(searchQuery);
                    }
                  } 
                }}
                placeholder="Search products, categories..." 
                className="bg-transparent border-none outline-none w-full text-sm text-zinc-950 placeholder-zinc-400" 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors mr-1 cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-1 pr-0.5 shrink-0">
                <button 
                  className="bg-zinc-950 text-white font-black uppercase text-[10px] rounded-full px-3 py-1.5 hover:bg-[#00D1FF] transition-colors flex items-center gap-1.5 min-w-[65px] justify-center cursor-pointer shadow-sm" 
                  onClick={() => {
                    saveSearch(searchQuery);
                    if (onNavigateToFullSearch) {
                      onNavigateToFullSearch(searchQuery);
                    }
                  }}
                  disabled={isSearching}
                >
                   {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>
          </header>

          {/* Filter Toggle Bar */}
          <div className="p-2.5 border-b border-zinc-100 bg-white flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 py-1.5 px-3 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                showFilters 
                  ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              <span className="text-[8px]">{showFilters ? '▲' : '▼'}</span>
            </button>
            {(filterCategory !== 'ALL' || filterMaxPrice !== highestPriceLimit || filterGender !== 'ALL') && (
              <button
                onClick={() => {
                  setFilterCategory('ALL');
                  setFilterMaxPrice(highestPriceLimit);
                  setFilterGender('ALL');
                  toast.success("Filters reset");
                }}
                className="px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Collapsible Filter Dropdown */}
          {showFilters && (
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Gender Filter */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Gender Archetype</label>
                <div className="grid grid-cols-4 gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  {['ALL', 'MEN', 'WOMEN', 'UNISEX'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFilterGender(g)}
                      className={`py-1.5 text-[8px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                        filterGender === g 
                          ? 'bg-[#00D1FF] text-white shadow-md' 
                          : 'text-zinc-500 hover:text-zinc-950'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] uppercase font-black tracking-widest">
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
                  className="w-full accent-[#00D1FF] bg-zinc-200 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  <button
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-2 py-1 text-[8px] font-bold rounded-lg border transition-all cursor-pointer ${
                      filterCategory === 'ALL'
                        ? 'bg-[#00D1FF] border-[#00D1FF] text-white'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    All
                  </button>
                  {uniqueCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2 py-1 text-[8px] font-bold rounded-lg border transition-all cursor-pointer ${
                        filterCategory === cat
                          ? 'bg-[#00D1FF] border-[#00D1FF] text-white'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {searchQuery.trim() ? (
              <div className="p-3.5 space-y-4">
                
                {/* ------------------------------------------------------------- */}
                {/* REAL-TIME SUGGESTIONS SECTION (UPDATES ON EVERY KEYSTROKE)   */}
                {/* ------------------------------------------------------------- */}
                {(realTimeSuggestions.categories.length > 0 || realTimeSuggestions.products.length > 0 || realTimeSuggestions.tags.length > 0) && (
                  <div className="bg-gradient-to-br from-zinc-50 to-blue-50/30 border border-blue-500/15 rounded-2xl p-3.5 space-y-3.5 shadow-sm animate-in fade-in duration-150">
                    
                    {/* Header Label */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00D1FF]" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-700">
                          Live Suggestions
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400">
                        Matches as you type
                      </span>
                    </div>

                    {/* Category Suggestions */}
                    {realTimeSuggestions.categories.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                          Suggested Categories
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {realTimeSuggestions.categories.map(cat => (
                            <button
                              key={cat.name}
                              onClick={() => handleSelectCategorySuggestion(cat.name)}
                              className="px-2.5 py-1.5 bg-white hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-400 rounded-xl text-xs font-medium text-zinc-800 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 group"
                            >
                              <Folder className="w-3 h-3 text-[#00D1FF] group-hover:scale-110 transition-transform" />
                              <span>{highlightMatch(cat.name, searchQuery)}</span>
                              <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded-full">
                                {cat.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword / Brand Tags Suggestions */}
                    {realTimeSuggestions.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                          Related Tags & Brands
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {realTimeSuggestions.tags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSearchQuery(tag);
                                saveSearch(tag);
                              }}
                              className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            >
                              <Tag className="w-2.5 h-2.5 text-zinc-400" />
                              <span>{highlightMatch(tag, searchQuery)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real-Time Product Autocomplete List */}
                    {realTimeSuggestions.products.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                          Product Autocomplete ({realTimeSuggestions.products.length})
                        </span>
                        <div className="space-y-1.5">
                          {realTimeSuggestions.products.map(p => (
                            <div
                              key={`sugg-${p.id}`}
                              onClick={() => handleSelectProduct(p)}
                              className="w-full p-2 bg-white hover:bg-zinc-50 border border-zinc-200/80 hover:border-blue-400/50 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/60 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                                  <img 
                                    src={getImageUrl(p.image)} 
                                    alt={p.name}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                                  />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-zinc-900 truncate leading-snug">
                                    {highlightMatch(p.name, searchQuery)}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                    {p.category && (
                                      <span className="text-[9px] font-mono text-zinc-400">
                                        {p.category}
                                      </span>
                                    )}
                                    <span className="font-mono font-bold text-zinc-900">
                                      GH₵{p.price}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery(p.name);
                                    saveSearch(p.name);
                                  }}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                                  title="Fill search"
                                >
                                  <CornerDownLeft className="w-3 h-3" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Advanced Search Console Banner */}
                <button 
                  onClick={() => onNavigateToFullSearch?.(searchQuery)}
                  className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D1FF] animate-pulse" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-950">Full Search Console</p>
                      <p className="text-[9px] text-zinc-400">Unlock advanced visual sorting & filters</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-1 transition-all rotate-180" />
                </button>

                {/* Results Header */}
                <div className="flex justify-between items-center text-zinc-500 text-xs px-1">
                  <span className="font-medium">All Matching Items</span>
                  <span className="text-[#00D1FF] font-mono font-bold">{filteredResults.length} Results</span>
                </div>
                
                {/* Search Results Grid */}
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-[#00D1FF] animate-spin" />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Filtering Catalog...</span>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredResults.map(product => (
                      <div 
                        key={product.id} 
                        className="glass-sapphire-22-5 border border-[#0F52BA]/40 rounded-2xl overflow-hidden cursor-pointer flex flex-col hover:border-[#0F52BA]/80 hover:shadow-md transition-all active:scale-[0.98]" 
                        onClick={() => handleSelectProduct(product)}
                      >
                         <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                           <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-contain" />
                         </div>
                         <div className="p-2 space-y-1 bg-white border-t border-zinc-50">
                            <p className="text-xs text-zinc-600 line-clamp-1">{product.name}</p>
                            <p className="text-sm font-bold text-zinc-950 font-mono">GH₵{product.price}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-14 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <Search className="w-6 h-6 text-zinc-400 mx-auto mb-2 opacity-50" />
                    <p className="text-zinc-600 text-xs font-bold">No exact products found for "{searchQuery}"</p>
                    <p className="text-zinc-400 text-[10px] mt-1">Try searching by general category like "Shoes", "Bags", or "Accra".</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800">Recent Intel</h3>
                      <button onClick={clearHistory} className="text-zinc-400 hover:text-[#EC4899] transition-colors p-1 cursor-pointer" title="Clear history">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Categories */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00D1FF]" />
                    <span>Popular Categories</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendedSearches.map((name, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setSearchQuery(name);
                          setFilterCategory(name);
                        }}
                        className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-700 hover:bg-blue-50 hover:border-blue-200 hover:text-zinc-950 transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <Folder className="w-3 h-3 text-[#00D1FF]" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPanel;

