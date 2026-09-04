import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';
import { Search, ChevronLeft, Trash2, Clock, Loader2, Sparkles, X, SlidersHorizontal } from 'lucide-react';
import { setCookie, getCookie } from '../lib/cookieUtils';
import { toast } from 'sonner';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductSelect: (p: Product) => void;
  onNavigateToFullSearch?: (query: string) => void;
}

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
    }, 300);
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

  // Wipe the search overlay state when closed/navigated to satisfy rule 2
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

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 left-0 w-full h-full sm:max-w-md bg-white text-black z-[310] shadow-2xl transition-transform duration-300 ease-out border-r border-black/5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          
          {/* Top Search Header */}
          <header className="p-3 border-b border-zinc-100 bg-white flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-950 transition-all rounded-full hover:bg-zinc-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-2 py-1 focus-within:border-[#00D1FF] transition-colors h-10">
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
                placeholder="Search the Archive..." 
                className="bg-transparent border-none outline-none w-full text-sm text-zinc-950 placeholder-zinc-400 pl-2" 
              />
              <div className="flex items-center gap-1 pr-0.5">
                <button 
                  className="bg-zinc-950 text-white font-black uppercase text-[10px] rounded-full px-3 py-1.5 hover:bg-[#00D1FF] transition-colors flex items-center gap-2 min-w-[70px] justify-center" 
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

          {/* Simple Filter Toggle Bar */}
          <div className="p-3 border-b border-zinc-100 bg-white flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider ${
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
                className="px-3 py-2 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
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
                      className={`py-1.5 text-[8px] font-black rounded-md uppercase tracking-wider transition-all ${
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
                    className={`px-2 py-1 text-[8px] font-bold rounded-lg border transition-all ${
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
                      className={`px-2 py-1 text-[8px] font-bold rounded-lg border transition-all ${
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
            {searchQuery ? (
              <div className="p-4 space-y-4">
                {/* Advanced Search Console Banner */}
                <button 
                  onClick={() => onNavigateToFullSearch?.(searchQuery)}
                  className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-2xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D1FF] animate-pulse" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-950">Full Search Console</p>
                      <p className="text-[9px] text-zinc-400">Unlock advanced sorting & filters</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-1 transition-all rotate-180" />
                </button>

                <div className="flex justify-between items-center text-zinc-400 text-xs">
                  <span>Matches Found</span>
                  <span className="text-[#00D1FF]">{filteredResults.length} Results</span>
                </div>
                
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 text-[#00D1FF] animate-spin" />
                    <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing Search...</span>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredResults.map(product => (
                      <div key={product.id} className="glass-sapphire-22-5 border border-[#0F52BA]/40 rounded-2xl overflow-hidden cursor-pointer flex flex-col hover:border-[#0F52BA]/60 transition-colors" onClick={() => { onProductSelect(product); onClose(); }}>
                         <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                           <img src={getImageUrl(product.image)} className="w-full h-full object-contain" />
                         </div>
                         <div className="p-2 space-y-1 bg-white border-t border-zinc-50">
                            <p className="text-xs text-zinc-600 line-clamp-1">{product.name}</p>
                            <p className="text-sm font-bold text-zinc-950">GH₵{product.price}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-zinc-500 text-sm">
                    No products found for "{searchQuery}".
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                
                {/* Recent Searches */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-black">Recent Intel</h3>
                    <button onClick={clearHistory} className="text-zinc-500 hover:text-[#EC4899] transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-all flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommended */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-zinc-950">Recommended</h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendedSearches.map((name, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSearchQuery(name)}
                        className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-all flex items-center gap-1.5"
                      >
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
