import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CategoryInfo, ViewState } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { ArrowLeft, SlidersHorizontal, Sparkles, ShoppingBag, Heart, Search } from 'lucide-react';
import { matchesCategory } from '../lib/categoryUtils';

interface CategoryPageProps {
  categoryIdentifier: string; // can be slug, UUID, or name
  categories: CategoryInfo[];
  products: Product[];
  wishlist: string[];
  onSelectCategory: (category: string) => void;
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product, size?: string) => void;
  onToggleWishlist: (p: Product) => void;
  onNavigate: (view: ViewState) => void;
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  apparel: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1400',
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1400',
  accessories: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1400',
  beauty: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=1400',
  kits: 'https://images.unsplash.com/photo-1549463591-147604343e39?auto=format&fit=crop&q=80&w=1400',
  fragments: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1400',
  home: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1400',
  shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=1400',
  trousers: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1400'
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryIdentifier,
  categories,
  products,
  wishlist,
  onSelectCategory,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_LOW' | 'PRICE_HIGH' | 'DISCOUNT'>('POPULAR');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Identify current category info
  const categoryInfo = useMemo(() => {
    if (!categoryIdentifier || categoryIdentifier === 'All') return null;
    const lower = categoryIdentifier.toLowerCase();
    return categories.find(c => 
      c.id === categoryIdentifier || 
      (c.slug && c.slug.toLowerCase() === lower) || 
      c.name.toLowerCase() === lower
    ) || {
      id: categoryIdentifier,
      name: categoryIdentifier.charAt(0).toUpperCase() + categoryIdentifier.slice(1),
      slug: categoryIdentifier.toLowerCase(),
      heroImage: CATEGORY_FALLBACK_IMAGES[categoryIdentifier.toLowerCase()] || CATEGORY_FALLBACK_IMAGES.apparel,
      inspiration: 'ARCHIVE_SECTOR_PROTOCOL'
    };
  }, [categoryIdentifier, categories]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!matchesCategory(p, categoryIdentifier, categories)) return false;
      if (onlyInStock && !p.inStock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName夺 = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesBrand = p.brand?.toLowerCase().includes(q);
        if (!matchesName夺 && !matchesDesc && !matchesBrand) return false;
      }
      return true;
    });
  }, [products, categoryIdentifier, categories, onlyInStock, searchQuery]);

  // Sort products
  const sortedProducts清洗 = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'PRICE_LOW') {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_HIGH') {
      return list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'DISCOUNT') {
      return list.sort((a, b) => (b.offeredDiscount || 0) - (a.offeredDiscount || 0));
    }
    return list.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
  }, [filteredProducts, sortBy]);

  const heroImageUrl = categoryInfo?.heroImage || 
    (categoryInfo?.slug ? CATEGORY_FALLBACK_IMAGES[categoryInfo.slug] : null) || 
    CATEGORY_FALLBACK_IMAGES.apparel;

  const categoryName = categoryInfo?.name || categoryIdentifier;
  const inspirationCode = categoryInfo?.inspiration || `ARCHIVE_${categoryName.toUpperCase()}_SECTOR`;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Category Hero Banner */}
      <section className="relative h-[42vh] sm:h-[48vh] md:h-[55vh] w-full overflow-hidden border-b border-white/10">
        <img
          src={heroImageUrl}
          alt={categoryName}
          className="w-full h-full object-cover opacity-30 object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-between py-8 sm:py-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-zinc-400">
            <button
              onClick={() => onNavigate(ViewState.LOBBY)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => onNavigate(ViewState.CATEGORIES)}
              className="hover:text-white transition-colors"
            >
              Categories
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-[#C5A880] font-black">{categoryName}</span>
          </nav>

          {/* Title and Manifest Info */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0F52BA]/20 border border-[#0F52BA]/40 text-blue-400 text-[9px] font-black uppercase tracking-[0.25em]">
                Verified Collection
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                {inspirationCode}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif italic tracking-tight text-white">
              {categoryName}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
              Curated luxury and contemporary silhouettes from the {categoryName.toLowerCase()} collection. 
              Showing {filteredProducts.length} verified pieces in rotation.
            </p>
          </div>

          {/* Category Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isActive = (cat.slug && cat.slug.toLowerCase() === categoryIdentifier.toLowerCase()) || 
                               cat.id === categoryIdentifier || 
                               cat.name.toLowerCase() === categoryIdentifier.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.slug || cat.name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="sticky top-16 z-30 bg-black/90 backdrop-blur-md border-b border-white/5 py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search in ${categoryName}...`}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0F52BA]/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={e => setOnlyInStock(e.target.checked)}
                className="rounded border-zinc-700 text-[#0F52BA] focus:ring-0 focus:ring-offset-0 bg-zinc-900"
              />
              <span>In Stock Only</span>
            </label>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#0F52BA]/50"
            >
              <option value="POPULAR">Most Popular</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
              <option value="DISCOUNT">Highest Discount</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-10">
        {sortedProducts清洗.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <p className="text-zinc-500 text-sm uppercase tracking-widest">
              No products found in this sector matching your filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setOnlyInStock(false); }}
              className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-full text-xs font-black uppercase tracking-wider text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedProducts清洗.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-zinc-950/80 border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl"
                >
                  {/* Image container */}
                  <div
                    onClick={() => onProductClick(product)}
                    className="relative aspect-[3/4] w-full overflow-hidden cursor-pointer bg-zinc-900"
                  >
                    <img
                      src={getImageUrl(product.image || product.images?.[0])}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />

                    {/* Discount badge */}
                    {product.offeredDiscount && product.offeredDiscount > 0 ? (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-lg">
                        -{product.offeredDiscount}%
                      </span>
                    ) : null}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                      aria-label="Toggle Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div onClick={() => onProductClick(product)} className="cursor-pointer space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A880] truncate">
                        {product.brand || categoryName}
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-[#C5A880] transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <div className="space-y-0.5">
                        <div className="text-sm font-black text-white font-mono">
                          ${product.price}
                        </div>
                        {product.originalPrice > product.price && (
                          <div className="text-[10px] text-zinc-500 line-through font-mono">
                            ${product.originalPrice}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onAddToCart(product)}
                        className="p-2.5 rounded-xl bg-white text-black hover:bg-[#0F52BA] hover:text-white transition-all flex items-center justify-center shadow-md active:scale-95"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
