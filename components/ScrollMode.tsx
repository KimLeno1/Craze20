import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Share2, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Product, UserPreferences, CartItem } from '../types';
import { toast } from 'sonner';
import { sortProductsByProtocol } from '../lib/styleProtocol';

interface ScrollModeProps {
  products: Product[];
  onAddToCart: (product: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  userPrefs: UserPreferences | null;
  cartCount: number;
}

const ScrollMode: React.FC<ScrollModeProps> = ({
  products,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  wishlist,
  userPrefs,
  cartCount
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubIndices, setActiveSubIndices] = useState<Record<number, number>>({});
  const [showInstruction, setShowInstruction] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [haulTarget, setHaulTarget] = useState<number>(() => Number(localStorage.getItem('cc-haul-target') || '0'));
  const [filter, setFilter] = useState<string | null>(null);

  const hasProtocol = useMemo(() => {
    if (!userPrefs) return false;
    return !!(
      userPrefs.styleProtocolCompleted || 
      (userPrefs.preferredCategories && userPrefs.preferredCategories.length > 0) ||
      (userPrefs.preferredGenders && userPrefs.preferredGenders.length > 0) ||
      (userPrefs.styleArchetype && userPrefs.styleArchetype.trim() !== '')
    );
  }, [userPrefs]);

  const processedProducts = useMemo(() => {
    if (hasProtocol) {
      return sortProductsByProtocol(products, userPrefs);
    } else {
      // Shuffled random order when no protocol is set
      const arr = [...products];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }, [products, userPrefs, hasProtocol]);

  const filteredProducts = useMemo(() => {
    if (!filter) return processedProducts;
    return processedProducts.filter(p => p.category === filter);
  }, [processedProducts, filter]);

  const categories = useMemo(() => Array.from(new Set(processedProducts.map(p => p.category))), [processedProducts]);

  const handleFilterToggle = () => {
    if (!filter) setFilter(categories[0]);
    else {
      const idx = categories.indexOf(filter);
      if (idx === categories.length - 1) setFilter(null);
      else setFilter(categories[idx + 1]);
    }
  };

  // Swipe detection for sub-images
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, productIndex: number, product: Product) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    // Check if it's a horizontal swipe (and not too much vertical movement)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) {
        // Swipe Right (Go Prev)
        handlePrevSubImage(productIndex, product);
      } else {
        // Swipe Left (Go Next)
        handleNextSubImage(productIndex, product);
      }
    }
    touchStartRef.current = null;
  };

  const handleNextSubImage = (productIndex: number, product: Product) => {
    const images = product.images || [product.image];
    const currentIndex = activeSubIndices[productIndex] || 0;
    setActiveSubIndices(prev => ({
      ...prev,
      [productIndex]: (currentIndex + 1) % images.length
    }));
  };

  const handlePrevSubImage = (productIndex: number, product: Product) => {
    const images = product.images || [product.image];
    const currentIndex = activeSubIndices[productIndex] || 0;
    setActiveSubIndices(prev => ({
      ...prev,
      [productIndex]: currentIndex === 0 ? images.length - 1 : currentIndex - 1
    }));
  };

  const handleEditTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = prompt("DEALING_MODE: Adjust your Checkout Safeguard:", haulTarget.toString());
    if (target !== null) {
      const num = parseInt(target);
      if (!isNaN(num) && num >= 0) {
        setHaulTarget(num);
        localStorage.setItem('cc-haul-target', num.toString());
        toast.success(`Checkout Safeguard updated: ${num} units`);
      }
    }
  };

  // Gesture tracking
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<any>(null);

  const handleInteraction = (product: Product) => {
    setClickCount(prev => prev + 1);
    
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    
    clickTimerRef.current = setTimeout(() => {
      if (clickCount === 1) { // This will be the 2nd click because of state update lag? No, let's use a ref for count or use the value from closure
        // Handled in a better way below
      }
      setClickCount(0);
    }, 400); // 400ms window for taps
  };

  // Improved tap handling
  const lastTapRef = useRef<number>(0);
  const consecutiveTapsRef = useRef<number>(0);

  const handleTap = (product: Product) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      consecutiveTapsRef.current += 1;
    } else {
      consecutiveTapsRef.current = 1;
    }
    lastTapRef.current = now;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      if (consecutiveTapsRef.current === 2) {
        onToggleWishlist(product);
        toast.success(`Priority: ${product.name} added to wishlist`);
      } else if (consecutiveTapsRef.current === 3) {
        onAddToCart(product);
        toast.success(`Acquired: ${product.name} added to cart`);
      }
      consecutiveTapsRef.current = 0;
    }, 400);
  };

  useEffect(() => {
    // Passive check - don't prompt on mount as it affects normal flow feelings.
    // User can set target in CartDrawer if they are in Scroll Mode.
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    const index = Math.round(scrollPos / itemHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-[115] bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide select-none touch-pan-y"
    >
      {/* Feed Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] flex gap-1 px-2 py-1">
        {filteredProducts.map((_, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 rounded-full transition-all duration-300 ${i <= activeIndex ? 'bg-[#00D1FF]' : 'bg-white/10'}`} 
          />
        ))}
      </div>

      {filteredProducts.map((product, idx) => {
        const isNear = Math.abs(idx - activeIndex) <= 1;
        return (
          <div 
            key={product.id} 
            className="relative h-full w-full snap-start flex flex-col items-center justify-center overflow-hidden"
            onClick={() => handleTap(product)}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, idx, product)}
          >
            {isNear ? (
              <>
                {/* Product Image/Video Background */}
                <div className="absolute inset-0 z-0">
                  {product.video && activeIndex === idx ? (
                    <div className="w-full h-full relative">
                      <video
                        src={product.video}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                      />
                      
                      {/* Audio overlay toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="absolute bottom-36 left-6 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-all text-white border border-white/10 pointer-events-auto active:scale-95"
                        title={isMuted ? "Unmute Video" : "Mute Video"}
                      >
                        {isMuted ? '🔇' : '🔊'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.img 
                          key={`${product.id}-${activeSubIndices[idx] || 0}`}
                          src={product.images && product.images.length > 0 ? product.images[activeSubIndices[idx] || 0] : product.image} 
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: activeIndex === idx ? 1 : 0.5, scale: activeIndex === idx ? 1 : 1.1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1 }}
                          className="w-full h-full object-cover"
                          alt={product.name}
                        />
                      </AnimatePresence>

                      {/* Sub-image Navigation Controls */}
                      {product.images && product.images.length > 1 && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handlePrevSubImage(idx, product); }}
                              className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all pointer-events-auto active:scale-90 shadow-md"
                            >
                              ←
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNextSubImage(idx, product); }}
                              className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all pointer-events-auto active:scale-90 shadow-md"
                            >
                              →
                            </button>
                          </div>

                          {/* Sub-images indicator dots */}
                          <div className="absolute top-1/2 right-16 -translate-y-1/2 flex flex-col gap-2 z-20 pointer-events-none">
                            {product.images.map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1 h-3 rounded-full transition-all duration-300 ${ (activeSubIndices[idx] || 0) === i ? 'bg-[#00D1FF] h-6 shadow-[0_0_8px_rgba(0,209,255,0.6)]' : 'bg-white/20'}`} 
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                </div>

                {/* Product Data Layer */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Action Panel (Right Side) */}
                  <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 pointer-events-auto">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={activeIndex === idx ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <motion.button 
                          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                          whileTap={{ scale: 0.8 }}
                          animate={{ scale: wishlist.includes(product.id) ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            wishlist.includes(product.id) ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-lg shadow-[#00D1FF]/20' : 'bg-black/60 border-white/20 text-white hover:bg-black/80 shadow-md'
                          }`}
                        >
                          <motion.div
                            key={wishlist.includes(product.id) ? 'scroll-wish-yes' : 'scroll-wish-no'}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <Heart size={24} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                          </motion.div>
                        </motion.button>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">{product.likes || 0}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                          className="w-12 h-12 rounded-full bg-black border border-white/20 text-white flex items-center justify-center focus:bg-[#00D1FF] focus:text-black focus:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all duration-300 shadow-2xl"
                        >
                          <ShoppingCart size={24} />
                        </button>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Take</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewProduct(product); }}
                          className="w-12 h-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-all shadow-md"
                        >
                          <Info size={24} />
                        </button>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Info</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            const baseUrl = window.location.origin + window.location.pathname;
                            const shareUrl = `${baseUrl}?productId=${product.id}`;
                            
                            if (navigator.share) {
                              navigator.share({
                                title: product.name,
                                text: `Check out ${product.name} on Closet Kraze!`,
                                url: shareUrl,
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(`${product.name} - ${shareUrl}`);
                              toast.success('Link copied to clipboard!');
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-all active:scale-90 shadow-md"
                        >
                          <Share2 size={24} />
                        </button>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Share</span>
                      </div>

                      {/* Spinning Disk Accessory */}
                      <div className="mt-4 relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-black border-2 border-white/20 flex items-center justify-center animate-[spin_3s_linear_infinite]">
                          <div className="w-4 h-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-[#00D1FF]" />
                          </div>
                        </div>
                        {/* Music icon or something */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00D1FF] rounded-full flex items-center justify-center animate-bounce">
                          <div className="w-1 h-1 bg-black rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Info Panel (Bottom Left) */}
                  <div className="absolute left-6 bottom-24 max-w-[70%]">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={activeIndex === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#00D1FF] text-black text-[9px] font-black uppercase tracking-widest rounded-sm">
                          {product.category}
                        </span>
                        {!!product.isNew && (
                          <span className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-sm">
                            NEW
                          </span>
                        )}
                      </div>

                      <div>
                        <h2 className="text-3xl font-serif italic text-white tracking-tighter leading-none mb-1">
                          {product.name}
                        </h2>
                        <p className="text-zinc-400 text-[10px] font-medium leading-tight line-clamp-2 uppercase tracking-tighter">
                          {product.description || "Limited edition piece from our collection."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-sans font-black text-white">GH₵{product.price}</div>
                        <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          V_ID: {product.id.slice(0, 8)}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Gesture Instruction Overlay (First Item Only) */}
                <AnimatePresence>
                  {idx === 0 && activeIndex === 0 && showInstruction && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 1, duration: 1 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 pointer-events-auto cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setShowInstruction(false); }}
                    >
                      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2rem] text-center space-y-6 max-w-[280px] shadow-2xl">
                        <div className="flex justify-between items-center w-full">
                          <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.5em]">Quick Controls</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowInstruction(false); }} 
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-bold">2X</div>
                            <div className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-[#00D1FF]">Add to Wishlist</div>
                          </div>
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-bold">3X</div>
                            <div className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-white">Add to Bag</div>
                          </div>
                          {/* HOLD doesn't exist yet but we keep instruction */}
                        </div>
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] pt-4 border-t border-white/5">
                          Shortcuts
                          <br/><span className="text-[#00D1FF] mt-2 inline-block">Tap anywhere to dismiss</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#00D1FF]/20 border-t-[#00D1FF] animate-spin" />
              </div>
            )}
          </div>
        );
      })}

      <div className="fixed top-8 left-0 w-full z-[120] flex items-center justify-between px-6 pointer-events-none">
        {/* Left Spacer to balance layout */}
        <div className="w-12 h-12 hidden sm:block" />

        {/* Centered Haul Target UI */}
        <div className="flex-1 flex justify-center">
          <button 
            onClick={handleEditTarget}
            className="pointer-events-auto flex items-center gap-6 px-10 py-4 bg-zinc-950 border border-zinc-700 rounded-[2rem] text-white shadow-2xl active:scale-95 transition-all group"
          >
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">Target</span>
              <span className="text-sm font-mono font-black text-rose-500 group-hover:text-white transition-colors">{haulTarget === 0 ? '∞' : haulTarget}</span>
            </div>
            
            <div className="w-px h-8 bg-zinc-800" />
            
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">Acquired</span>
              <span className={`text-sm font-mono font-black transition-colors ${cartCount >= haulTarget && haulTarget > 0 ? 'text-amber-500' : 'text-[#00D1FF]'}`}>
                {cartCount}
              </span>
            </div>
            
            <div className="hidden sm:flex flex-col items-start ml-2">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none">Status</span>
              <span className="text-[9px] font-black uppercase text-white tracking-widest">
                {haulTarget === 0 ? 'Browsing' : cartCount >= haulTarget ? 'Goal Reached' : 'Collecting Items'}
              </span>
            </div>
          </button>
        </div>

        {/* Right Side Filter Toggle */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleFilterToggle}
            className="w-12 h-12 md:w-14 md:h-14 bg-zinc-950 border border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-white hover:bg-[#00D1FF] hover:text-white transition-all group relative shadow-2xl"
            title="Filter Products"
          >
            <div className="flex flex-col items-center gap-0.5">
               <div className={`w-4 h-0.5 bg-current rounded-full transition-all ${filter ? 'w-2' : ''}`} />
               <div className="w-4 h-0.5 bg-current rounded-full" />
               <div className={`w-4 h-0.5 bg-current rounded-full transition-all ${filter ? 'w-2' : ''}`} />
            </div>
            {filter && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[7px] font-black flex items-center justify-center">!</span>
            )}
            <span className="mt-1 text-[6px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 whitespace-nowrap">{filter || 'All'}</span>
          </button>
        </div>
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default ScrollMode;
