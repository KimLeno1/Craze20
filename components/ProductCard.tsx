
import React from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/imageUtils';
import { Product } from '../types';
import { Scale, ShoppingCart, Check, Bell, Loader2, Heart } from 'lucide-react';
import LazyImage from './LazyImage';
import WaitlistModal from './WaitlistModal';
import { triggerHaptic } from '../lib/haptics';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onAddToCart: (product: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  saleTimerEnd?: number | null;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
  onQuickBuy?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClick, 
  onAddToCart, 
  onToggleWishlist, 
  isWishlisted,
  saleTimerEnd,
  onToggleCompare,
  isComparing,
  onQuickBuy
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');
  const [selectedSize, setSelectedSize] = React.useState<string>(product.sizes?.[0] || '');
  const [selectedColorVariant, setSelectedColorVariant] = React.useState<{ main: string; secondary: string } | undefined>(product.colorVariants?.[0]);
  const [showSelectionModal, setShowSelectionModal] = React.useState(false);
  const [isTakeClicked, setIsTakeClicked] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [quickBuyPhase, setQuickBuyPhase] = React.useState<'idle' | 'loading' | 'success'>('idle');
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = React.useState(false);

  const isOutOfStock = !product.inStock || product.stockCount === 0;

  const handleQuickBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quickBuyPhase !== 'idle' || !onQuickBuy) return;
    if (isOutOfStock) {
      triggerHaptic('selection');
      setIsWaitlistModalOpen(true);
      return;
    }
    setQuickBuyPhase('loading');
    triggerHaptic('selection');
    
    setTimeout(() => {
      onQuickBuy(product);
      setQuickBuyPhase('success');
      triggerHaptic('success');
      setTimeout(() => {
        setQuickBuyPhase('idle');
      }, 1200);
    }, 450);
  };

  React.useEffect(() => {
    if (!saleTimerEnd) return;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.floor((saleTimerEnd - Date.now()) / 1000));
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [saleTimerEnd]);

  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const isOnSale = product.price < product.originalPrice;
  const isHighHeat = (product.price || 0) > 1000; 
  const isTrendsetterPick = (product.viewers || 0) >= 100 || ((product as any).hypeScore || 0) >= 95;
  const demandWidth = Math.min(100, (product.viewers / 200) * 100);
  const stockStatus = !product.inStock || product.stockCount === 0 
    ? { label: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-500/10' }
    : product.stockCount <= 5 
      ? { label: `Only ${product.stockCount} left`, color: 'text-amber-700 font-black', bg: 'bg-amber-500/20 animate-pulse' }
      : product.stockCount < 10 
        ? { label: 'Low Stock', color: 'text-amber-500', bg: 'bg-amber-500/10' }
        : { label: 'In Stock', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };

  const hasNoRequiredSelections = (!product.sizes || product.sizes.length <= 1) && (!product.colorVariants || product.colorVariants.length <= 1);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      triggerHaptic('selection');
      setIsWaitlistModalOpen(true);
      return;
    }
    const hasMultipleSizes = product.sizes && product.sizes.length >= 2;

    if (hasMultipleSizes && !showSelectionModal) {
      triggerHaptic('selection');
      setShowSelectionModal(true);
    } else {
      setIsAdding(true);
      triggerHaptic('selection');
      setTimeout(() => {
        setIsAdding(false);
        setIsTakeClicked(true);
        triggerHaptic('success');
        onAddToCart(product, selectedSize, selectedColorVariant);
        setTimeout(() => {
          setIsTakeClicked(false);
          setShowSelectionModal(false);
        }, 900);
      }, 400);
    }
  };

  return (
    <div className={`group relative flex flex-col h-full animate-in fade-in duration-700 bg-white border border-zinc-200 rounded-[1.75rem] p-3.5 sm:p-5 transition-all duration-300 hover:shadow-lg hover:border-[#0F52BA]/30 ${isComparing ? 'ring-2 ring-[#C5A880]' : ''}`}>
      {/* Royal Sapphire specular light bar on hover */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"></div>

      {/* Selection Modal */}
      {showSelectionModal && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300"
          onClick={(e) => { e.stopPropagation(); setShowSelectionModal(false); }}
        >
          <div 
            className="w-full max-w-md bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 flex flex-col gap-6 relative shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-16 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200/80 shrink-0">
                  <LazyImage 
                    src={getImageUrl(product.image)} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-all duration-700" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-serif italic text-zinc-950 line-clamp-1">{product.name}</h4>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#0F52BA]">{product.category}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSelectionModal(false)}
                className="text-zinc-400 hover:text-zinc-950 transition-colors p-1.5 hover:bg-zinc-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Color Selection */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="space-y-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Select Variant</span>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColorVariant(variant)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
                        selectedColorVariant?.main === variant.main 
                          ? 'border-[#0F52BA] scale-110 shadow-lg' 
                          : 'border-zinc-200 hover:border-[#C5A880]'
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
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Select Size</span>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                        selectedSize === size 
                          ? 'bg-[#0B132B] border-[#C5A880] text-[#E8D3B0] shadow-md' 
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-[#0F52BA]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isTakeClicked
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-[#0F52BA] to-[#0B132B] text-white hover:border-[#C5A880] shadow-xl'
              }`}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Securing Item...</span>
                </>
              ) : isTakeClicked ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          </div>
        </div>
      )}
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-zinc-100 cursor-pointer mb-3 sm:mb-5 rounded-2xl border border-zinc-200/60 shadow-inner"
        onClick={() => onClick(product)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onKeyDown={(e) => e.key === 'Enter' && onClick(product)}
      >
        {product.video ? (
          <video 
            src={`${product.video}#t=1`}
            poster={product.image && !product.image.includes('placeholder') ? getImageUrl(product.image || (product.images && product.images[0])) : undefined}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105"
          />
        ) : (
          <LazyImage 
            src={getImageUrl(product.image || (product.images && product.images.length > 0 ? product.images[0] : ''))} 
            alt={product.name} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105"
          />
        )}
        
        {/* Always Visible Top-Right Wishlist Heart Button */}
        <motion.button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            triggerHaptic('like');
            onToggleWishlist(product); 
          }}
          whileTap={{ scale: 0.8 }}
          animate={{ scale: isWishlisted ? [1, 1.25, 0.95, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className={`absolute top-2.5 right-2.5 z-40 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer border ${
            isWishlisted 
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/30 ring-2 ring-rose-300/50' 
              : 'bg-white/90 hover:bg-white text-zinc-700 border-zinc-200/80 hover:border-[#0F52BA] backdrop-blur-md'
          }`}
          title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-white text-white scale-105' : 'text-zinc-600 hover:text-rose-500'}`} />
        </motion.button>

        {/* Prestige Discount Badge */}
        {product.offeredDiscount !== undefined && product.offeredDiscount > 0 && (
          <div className="absolute top-2.5 right-12 z-30 bg-[#C5A880] text-zinc-950 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest shadow-lg border border-white/40">
            -{Math.round(product.offeredDiscount)}% OFF
          </div>
        )}
        
        {/* Badges Overlays */}
        <div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-1 items-start max-w-[70%]">
          {!!isTrendsetterPick && (
            <div className="bg-gradient-to-r from-[#C5A880] to-[#E8D3B0] text-zinc-950 px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow-md border border-white/60 flex items-center gap-1">
              <span>👑 Trendsetter's Pick</span>
            </div>
          )}
          {!!product.video && (
            <div className="bg-[#0F52BA] text-white px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Video
            </div>
          )}
          {!!product.isNew && (
            <div className="bg-[#0B132B] text-[#C5A880] border border-[#C5A880]/30 px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow-sm">
              New
            </div>
          )}
          {!!isHighHeat && (
            <div className="bg-[#967447] text-white px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow-sm">
              Popular
            </div>
          )}
          {!!isOnSale && (
            <div className="bg-[#0F52BA]/90 text-white px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow-sm">
              Sale
            </div>
          )}
        </div>

        {/* Compare Toggle */}
        {onToggleCompare && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
            className={`absolute bottom-2.5 right-2.5 z-40 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-md border ${
              isComparing 
                ? 'bg-[#0F52BA] text-white border-[#0F52BA] font-black text-[8px] sm:text-[9px]' 
                : 'bg-white/85 hover:bg-white backdrop-blur-md text-zinc-900 border-[#0F52BA]/20 hover:border-[#C5A880] active:scale-95 text-[8px] sm:text-[9px] font-bold'
            } uppercase tracking-wider`}
            title="Compare Product"
          >
            <Scale className="w-3.5 h-3.5 shrink-0 text-[#0F52BA]" />
            <span>{isComparing ? 'Comparing' : 'Compare'}</span>
          </button>
        )}

        {/* Choice Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-white/90 via-transparent to-transparent hidden sm:flex">
          <div className="flex gap-3">
            {isOutOfStock ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  setIsWaitlistModalOpen(true);
                }}
                className="px-4 h-11 flex items-center gap-1.5 justify-center transition-all shadow-xl rounded-full bg-zinc-950 text-[#E8D3B0] hover:bg-black hover:scale-105 border border-[#C5A880]/50 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                title="Join Restock Waitlist"
              >
                <Bell className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Waitlist</span>
              </button>
            ) : (
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`w-11 h-11 flex items-center justify-center transition-all shadow-xl rounded-full cursor-pointer ${
                  isAdding
                    ? 'bg-[#09285E] text-amber-300 scale-95'
                    : isTakeClicked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B132B] text-white hover:bg-[#0F52BA] hover:scale-105 border border-[#C5A880]/40'
                }`}
                title="Add to Cart"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : isTakeClicked ? (
                  <Check className="w-4 h-4 stroke-[3px]" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </button>
            )}
            <motion.button 
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHaptic('like');
                onToggleWishlist(product); 
              }}
              whileTap={{ scale: 0.8 }}
              animate={{ scale: isWishlisted ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`w-11 h-11 flex items-center justify-center border transition-all rounded-full shadow-md cursor-pointer ${
                isWishlisted ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white border-[#0F52BA]/20 text-zinc-900 hover:border-[#C5A880]'
              }`}
            >
              <motion.span 
                key={isWishlisted ? 'wish-yes' : 'wish-no'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-sm inline-block"
              >
                {isWishlisted ? '💖' : '🤍'}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 px-1 mt-auto" onClick={() => onClick(product)}>
        <div className="flex flex-col gap-3">
          <div className="space-y-1 w-full">
            <div className="flex items-start justify-between gap-1">
              <h3 className="text-xs sm:text-base font-serif italic text-zinc-950 leading-tight line-clamp-2 transition-colors group-hover:text-[#0F52BA]">{product.name}</h3>
              <span className={`shrink-0 text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-zinc-200 ${stockStatus.bg} ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
              <span className="text-[#0F52BA]">{product.category}</span>
              <div className="w-1 h-1 bg-[#C5A880] rounded-full"></div>
              {product.tags && product.tags.length > 0 && (
                <>
                  {product.tags.slice(0, 3).map((tag, i) => (
                    <React.Fragment key={`${tag}-${i}`}>
                      <span className="text-zinc-400">#{tag}</span>
                      <div className="w-0.5 h-0.5 bg-zinc-200 rounded-full"></div>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg font-mono tracking-tighter text-zinc-950 font-black">
                GH₵{product.price + (product.shippingFee || 0)}
              </span>
              <span className="text-[8px] font-black text-[#967447] uppercase tracking-widest bg-[#C5A880]/15 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                Shipping Included
              </span>
            </div>
            
            {isOutOfStock ? (
              <button
                id={`waitlist-${product.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  setIsWaitlistModalOpen(true);
                }}
                className="w-full py-2.5 px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans border bg-zinc-950 text-[#E8D3B0] border-[#C5A880]/40 hover:border-[#C5A880] hover:bg-black"
              >
                <Bell className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Join Waitlist</span>
              </button>
            ) : hasNoRequiredSelections && onQuickBuy && (
              <button
                id={`quick-buy-${product.id}`}
                onClick={handleQuickBuyClick}
                disabled={quickBuyPhase !== 'idle'}
                className={`w-full py-2.5 px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans border ${
                  quickBuyPhase === 'loading'
                    ? 'bg-[#09285E] text-amber-300 border-[#C5A880]'
                    : quickBuyPhase === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gradient-to-r from-[#0F52BA] to-[#09285E] hover:from-[#09285E] hover:to-[#0F52BA] border-[#C5A880]/40 text-white hover:border-[#C5A880] hover:shadow-[0_4px_20px_rgba(15,82,186,0.25)]'
                }`}
              >
                {quickBuyPhase === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>Securing Piece...</span>
                  </>
                ) : quickBuyPhase === 'success' ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Acquired!</span>
                  </>
                ) : (
                  <>
                    <span>Quick Buy</span>
                  </>
                )}
              </button>
            )}
            
            {/* Mobile Actions */}
            <div className="flex gap-2 sm:hidden">
              <motion.button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  triggerHaptic('like');
                  onToggleWishlist(product); 
                }}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isWishlisted ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex-1 h-11 flex items-center justify-center border transition-all rounded-xl cursor-pointer ${
                  isWishlisted ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-zinc-200 text-zinc-950 active:bg-zinc-50 shadow-xs'
                }`}
              >
                <motion.span 
                  key={isWishlisted ? 'wish-mob-yes' : 'wish-mob-no'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-sm inline-block"
                >
                  {isWishlisted ? '💖' : '🤍'}
                </motion.span>
              </motion.button>
              {isOutOfStock ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    setIsWaitlistModalOpen(true);
                  }}
                  className="flex-1 h-11 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center bg-zinc-950 text-[#E8D3B0] border border-[#C5A880]/40 cursor-pointer"
                  title="Join Waitlist"
                >
                  <Bell className="w-4 h-4 text-[#C5A880]" />
                </button>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 h-11 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                    isAdding
                      ? 'bg-[#09285E] text-amber-300'
                      : isTakeClicked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-[#0F52BA] to-[#0B132B] text-white border border-[#C5A880]/40'
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  ) : isTakeClicked ? (
                    <Check className="w-4 h-4 stroke-[3px]" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal
        product={product}
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        initialSize={selectedSize}
      />
    </div>
  );
};

export default ProductCard;
