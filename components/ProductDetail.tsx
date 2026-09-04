import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Scale, Info } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import { Product, UserStats, RankBenefits, ProductReview } from '../types';
import { databaseService } from '../services/databaseService';
import ProductCard from './ProductCard';
import ProductReviews from './ProductReviews';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import { toast } from 'sonner';
import { trackPlausibleEvent } from '../lib/analytics';

interface ProductDetailProps {
  product: Product;
  stats: UserStats;
  allProducts: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, selectedSize?: string, selectedColorVariant?: { main: string; secondary: string }, customizationData?: Record<string, string>) => void;
  onUpdateSynergy: (synergy: string) => void;
  onToggleWishlist: (product: Product) => void;
  onProductClick: (product: Product) => void;
  isInWishlist: boolean;
  rank: RankBenefits;
  limitedOfferEnd?: number | null;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
  onQuickBuy?: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  stats,
  allProducts,
  onClose, 
  onAddToCart, 
  onToggleWishlist,
  onProductClick,
  isInWishlist,
  rank,
  limitedOfferEnd,
  onToggleCompare,
  isComparing,
  onQuickBuy
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorVariant, setSelectedColorVariant] = useState<{ main: string; secondary: string } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [customizationData, setCustomizationData] = useState<Record<string, string>>({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isTakeClicked, setIsTakeClicked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isImageFullView, setIsImageFullView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);
  const [showVideoInDetail, setShowVideoInDetail] = useState(!!product.video);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTooltipIdx, setActiveTooltipIdx] = useState<number | null>(null);

  // Sync state when product shifts
  useEffect(() => {
    setShowVideoInDetail(!!product.video);
    setActiveImageIndex(0);
  }, [product]);

  useEffect(() => {
    const fetchReviewsAndHistory = async () => {
      try {
        const data = await databaseService.getProductReviews(product.id);
        if (Array.isArray(data)) {
          setReviews(data);
        }
        
        if (stats.userId && stats.userId !== 'guest') {
          try {
            const history = await databaseService.getUserHistory(stats.userId);
            if (history && history.purchasedProductIds?.includes(product.id)) {
              setHasPurchased(true);
            }
          } catch (err) {
            console.error('Error fetching user history:', err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch reviews or history:', error);
      }
    };
    fetchReviewsAndHistory();
  }, [product.id, stats.userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageFullView(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    
    setIsSubmittingReview(true);
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'Anonymous';
      await databaseService.addProductReview(product.id, {
        userId: stats.userId,
        userHandle,
        rating: newReviewRating,
        comment: newReviewComment
      });
      toast.success('Review submitted successfully');
      setNewReviewComment('');
      setNewReviewRating(5);
      
      // Refresh reviews
      const data = await databaseService.getProductReviews(product.id);
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!limitedOfferEnd) return;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.floor((limitedOfferEnd - Date.now()) / 1000));
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [limitedOfferEnd]);
  
  const activeViewers = useMemo(() => Math.floor(product.viewers / 4) + 12 + Math.floor(Math.random() * 5), [product.viewers]);

  // Base price calculation
  const basePrice = product.isCustom ? (product.priceRange?.min || product.price) : product.price;
  const priceToDisplay = Math.floor(basePrice);

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product.colorVariants && product.colorVariants.length > 0 && !selectedColorVariant) {
      toast.error('Please select a color variant');
      return;
    }
    
    if (product.isCustom && !showCustomForm) {
      setShowCustomForm(true);
      return;
    }

    if (product.isCustom) {
      // Validate customization
      const missingFields = product.customizationFields?.filter(f => f.required && !customizationData[f.id]);
      if (missingFields && missingFields.length > 0) {
        toast.error(`Please complete the customization: ${missingFields[0].label} is required.`);
        return;
      }
    }

    setIsTakeClicked(true);
    setTimeout(() => {
      setIsTakeClicked(false);
    }, 1200);

    trackPlausibleEvent('add_to_cart', {
      product_id: product.id,
      name: product.name,
      category: product.category || 'General',
      price: priceToDisplay,
      currency: 'GHC'
    });

    onAddToCart({ ...product, price: priceToDisplay }, selectedSize, selectedColorVariant || undefined, product.isCustom ? customizationData : undefined);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (detailContainerRef.current) {
        const scroll = detailContainerRef.current.scrollTop;
        setScrollOpacity(Math.min(scroll / 400, 1));
      }
    };
    const container = detailContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    
    // Track view
    if (stats.userId) {
      databaseService.trackAction(stats.userId, product.id, 'view');
    }

    trackPlausibleEvent('view_product', {
      product_id: product.id,
      name: product.name,
      category: product.category || 'General',
      price: product.price || 0,
      currency: 'GHC'
    });

    return () => container?.removeEventListener('scroll', handleScroll);
  }, [product.id, stats.userId]);

  const similarProducts = useMemo(() => {
    const tokenize = (str: string) => {
      if (!str) return [];
      return str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);
    };

    const targetWords = tokenize(product.name);
    const targetTags = (product.tags || []).map(t => t.toLowerCase());

    const scored = allProducts
      .filter(p => p.id !== product.id)
      .map(p => {
        let score = 0;

        // 1. Same category is highest priority
        if (p.category === product.category) {
          score += 100;
        }

        // 2. Similar name (matching words)
        const pWords = tokenize(p.name);
        const nameMatches = targetWords.filter(w => pWords.includes(w)).length;
        score += nameMatches * 10;

        // 3. Similar tags (matching tags)
        const pTags = (p.tags || []).map(t => t.toLowerCase());
        const tagMatches = targetTags.filter(t => pTags.includes(t)).length;
        score += tagMatches * 5;

        return { product: p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.product).slice(0, 4);
  }, [allProducts, product]);

  return (
    <div 
      ref={detailContainerRef}
      className="fixed inset-0 z-[150] bg-white flex flex-col lg:flex-row animate-in fade-in duration-700 overflow-y-auto lg:overflow-hidden font-sans text-zinc-950 scroll-smooth"
    >
      {/* Full View Image Modal */}
      {isImageFullView && (
        <div 
          className="fixed inset-0 z-[300] bg-white/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300"
          onClick={() => setIsImageFullView(false)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors z-10"
            onClick={() => setIsImageFullView(false)}
          >
            <span className="text-2xl">✕</span>
          </button>
          <img 
            src={getImageUrl(product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.image)} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
            alt={product.name} 
          />
          
          {product.images && product.images.length > 1 && (
            <>
               <button 
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => (prev > 0 ? prev - 1 : product.images!.length - 1));
                }}
              >
                <span className="text-2xl">←</span>
              </button>
              <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => (prev < product.images!.length - 1 ? prev + 1 : 0));
                }}
              >
                <span className="text-2xl">→</span>
              </button>
            </>
          )}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <div className="px-6 py-3 rounded-full bg-zinc-50 border border-zinc-100 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 pointer-events-none">
              Full View Archive Mode {product.images && product.images.length > 1 && `[${activeImageIndex + 1}/${product.images.length}]`}
            </div>
          </div>
        </div>
      )}

      {/* Subtle Light Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-100 rounded-full blur-[150px]" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Minimal Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-8 md:py-8 transition-all duration-500 border-b border-zinc-100"
        style={{ backgroundColor: `rgba(255, 255, 255, ${scrollOpacity * 0.95})`, backdropFilter: `blur(${scrollOpacity * 20}px)` }}
      >
        <button 
          onClick={onClose} 
          className="group flex items-center gap-3 md:gap-4 text-zinc-400 hover:text-zinc-950 transition-colors"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-zinc-200 flex items-center justify-center group-hover:border-zinc-950 transition-colors bg-white">
            <span className="text-lg md:text-xl">←</span>
          </div>
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Back to Lobby</span>
        </button>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => {
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
                toast.success('Neural link established. Copied to buffer.');
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 transition-all active:scale-90 text-zinc-300 hover:text-zinc-950"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <motion.button 
            onClick={() => onToggleWishlist(product)}
            whileTap={{ scale: 0.8 }}
            animate={{ scale: isInWishlist ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all text-lg ${isInWishlist ? 'text-rose-500 border-rose-500/30 bg-rose-500/5' : 'text-zinc-200 border-zinc-200 hover:border-zinc-400 bg-white'}`}
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <motion.span
              key={isInWishlist ? 'detail-wish-yes' : 'detail-wish-no'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="inline-block"
            >
              {isInWishlist ? '💖' : '🤍'}
            </motion.span>
          </motion.button>
        </div>
      </header>

      {/* Visual Section (Left) */}
      <div 
        className="w-full lg:w-[55%] h-[60vh] md:h-[70vh] lg:h-full relative bg-zinc-100 overflow-hidden shrink-0 group/image"
      >
        {isMaterializing && (
          <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-zinc-100 border-t-zinc-950 rounded-full animate-spin mb-6"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-400">Materializing Silhouette</span>
          </div>
        )}

        {showVideoInDetail && product.video ? (
          <div className="w-full h-full relative bg-black">
            <video 
              src={product.video} 
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted={isMuted}
              playsInline
              controls
            />
            {/* Small floating info badge */}
            <div className="absolute top-24 left-8 z-10 bg-white border border-zinc-200 px-3 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2 shadow-lg">
              <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-pulse" />
              VIDEO PREVIEW
            </div>
            {/* Custom mute/unmute floating toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-32 right-8 z-20 w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-all text-zinc-950 text-xs border border-zinc-200"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        ) : (
          <div 
            className="w-full h-full cursor-zoom-in"
            onClick={() => setIsImageFullView(true)}
          >
            <img 
              src={getImageUrl(product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.image)} 
              className="w-full h-full object-cover transition-all duration-[2s] group-hover/image:scale-105" 
              alt={product.name} 
            />
          </div>
        )}

        {/* Thumbnails (Supports both Images and Showcase Videos) */}
        {(product.video || (product.images && product.images.length > 1)) && (
          <div className="absolute bottom-8 left-8 z-10 flex gap-3 max-w-[80%] overflow-x-auto pb-2 scrollbar-hide items-center">
            {product.video && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideoInDetail(true);
                }}
                className={`w-16 h-20 rounded-xl overflow-hidden bg-white border-2 transition-all p-0.5 shrink-0 flex flex-col items-center justify-center gap-1.5 ${showVideoInDetail ? 'border-zinc-950 scale-110' : 'border-zinc-200 hover:border-zinc-400'}`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-950">
                  ▶️
                </div>
                <span className="text-[7px] font-black uppercase text-zinc-950 tracking-widest leading-none">VIDEO</span>
              </button>
            )}

            {product.images?.map((img, idx) => (
              <button 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideoInDetail(false);
                  setActiveImageIndex(idx);
                }}
                className={`w-16 h-20 rounded-xl overflow-hidden bg-white border-2 transition-all p-0.5 shrink-0 ${(!showVideoInDetail && activeImageIndex === idx) ? 'border-zinc-950 scale-110' : 'border-zinc-200 hover:border-zinc-400'}`}
              >
                <img src={getImageUrl(img)} className="w-full h-full object-cover rounded-lg" alt={`${product.name} shadow ${idx}`} />
              </button>
            ))}
          </div>
        )}
        
        <div className="absolute bottom-8 right-8 z-10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-[8px] font-black uppercase tracking-widest text-zinc-950 shadow-xl">
             <Scale className="w-3 h-3 text-zinc-400" />
             <span>View Full Silhouette</span>
           </div>
        </div>

        {product.price < product.originalPrice && (
          <div className="absolute top-24 left-8 md:top-32 md:left-12 bg-red-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl z-10 animate-pulse flex items-center gap-3">
            <span>Limited Time Offer</span>
            {limitedOfferEnd && timeLeft && (
              <span className="font-mono border-l border-white/20 pl-3">{timeLeft}</span>
            )}
          </div>
        )}
        
        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/20 to-transparent pointer-events-none"></div>

      </div>

      {/* Content Section (Right) */}
      <div className="w-full lg:w-[45%] bg-white border-l border-zinc-100 flex flex-col relative z-10 backdrop-blur-3xl shadow-2xl">
        <div className="flex-1 p-8 md:p-12 lg:p-20 lg:pt-40 space-y-12 md:space-y-16 overflow-y-auto custom-scrollbar">
          
          {/* Header Info */}
          <section className="space-y-6 md:space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-[8px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-[0.4em] md:tracking-[0.5em]">Sector {product.category}</span>
                {product.appeal && (
                  <>
                    <div className="w-1 h-1 bg-zinc-200 rounded-full"></div>
                    <span className="text-[8px] md:text-[10px] font-bold text-blue-500 uppercase tracking-[0.4em] md:tracking-[0.5em]">{product.appeal}</span>
                  </>
                )}
                <div className="w-1 h-1 bg-zinc-200 rounded-full"></div>
                <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] ${
                  !product.inStock || product.stockCount === 0 
                    ? 'text-red-500' 
                    : product.stockCount < 10 
                      ? 'text-amber-500' 
                      : 'text-emerald-500'
                }`}>
                  {!product.inStock || product.stockCount === 0 ? 'Out of Stock' : product.stockCount < 10 ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif italic text-zinc-950 tracking-tighter leading-none">
                {product.name}
              </h1>
              
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 md:gap-3 pt-2">
                  {product.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="px-2 md:px-3 py-1 bg-zinc-50 border border-zinc-200 text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest shadow-sm">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticity Protocol Indicator */}
            <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl space-y-4 mb-4 md:mb-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol State</span>
                  <div className="text-2xl font-mono font-black text-zinc-950">Verified</div>
                </div>
                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Archive Integrity Valid</div>
              </div>
              <div className="flex gap-1 h-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-1000 ${
                      i < 9
                        ? 'bg-zinc-950 shadow-sm' 
                        : 'bg-zinc-200'
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-4 md:gap-6">
                <span className="text-3xl md:text-4xl lg:text-5xl font-mono font-bold tracking-tighter text-zinc-950">
                  {product.isCustom 
                    ? `GH₵${product.priceRange?.min} - GH₵${product.priceRange?.max}` 
                    : `GH₵${priceToDisplay}`
                  }
                </span>
                {product.price < product.originalPrice && (
                  <span className="text-base md:text-lg font-mono text-zinc-300 line-through">GH₵{product.originalPrice}</span>
                )}
                <div className="px-2 md:px-3 py-1 rounded-full border border-zinc-200 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  {product.isCustom ? 'Custom Order' : product.price < product.originalPrice ? `-${Math.round((1 - product.price/product.originalPrice) * 100)}% Benefit` : 'Standard Release'}
                </div>
              </div>

              {/* Attractive separate breakdown of product price and shipping */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 md:p-5 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold tracking-wide flex items-center gap-1.5">
                    🛍️ Base Item Value
                  </span>
                  <span className="font-mono text-zinc-950 font-bold">
                    {product.isCustom 
                      ? `GH₵${product.priceRange?.min} - GH₵${product.priceRange?.max}` 
                      : `GH₵${priceToDisplay}`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold tracking-wide flex items-center gap-1.5">
                    🚀 Dispatch Logistics (Shipping)
                  </span>
                  <span className="font-mono text-zinc-950 font-bold">
                    + GH₵{product.shippingFee || 0}
                  </span>
                </div>
                <div className="border-t border-zinc-100 my-1"></div>
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Total Combined</span>
                    <span className="text-[8px] text-zinc-400 uppercase tracking-widest block font-medium">Clearance cost on dispatch</span>
                  </div>
                  <span className="font-mono text-lg md:text-xl font-bold text-zinc-950 bg-white px-2.5 py-1 rounded border border-zinc-200 shadow-sm">
                    {product.isCustom 
                      ? `GH₵${(product.priceRange?.min || 0) + (product.shippingFee || 0)} - GH₵${(product.priceRange?.max || 0) + (product.shippingFee || 0)}` 
                      : `GH₵${priceToDisplay + (product.shippingFee || 0)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Customization Form */}
          {showCustomForm && product.isCustom && (
            <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.4em]">Customization Form</span>
                <button 
                  onClick={() => setShowCustomForm(false)}
                  className="text-[9px] font-black text-zinc-500 uppercase hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="space-y-6 bg-zinc-50 border border-zinc-100 p-8 rounded-[2rem]">
                {product.customizationFields?.map(field => (
                  <div key={field.id} className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.type === 'text' && (
                      <input 
                        type="text"
                        value={customizationData[field.id] || ''}
                        onChange={e => setCustomizationData({...customizationData, [field.id]: e.target.value})}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-6 py-4 text-xs text-zinc-950 focus:border-zinc-950 transition-all outline-none"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}

                    {field.type === 'select' && (
                      <select 
                        value={customizationData[field.id] || ''}
                        onChange={e => setCustomizationData({...customizationData, [field.id]: e.target.value})}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-6 py-4 text-xs text-zinc-950 focus:border-zinc-950 transition-all outline-none appearance-none"
                      >
                        <option value="">Select Option</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'color' && (
                      <div className="flex items-center gap-4">
                        <input 
                          type="color"
                          value={customizationData[field.id] || '#000000'}
                          onChange={e => setCustomizationData({...customizationData, [field.id]: e.target.value})}
                          className="w-12 h-12 bg-transparent border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">{customizationData[field.id] || '#000000'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          <section className="space-y-6">
            <div className="h-px w-12 bg-zinc-200"></div>
            <p className="text-lg lg:text-xl font-medium text-zinc-500 leading-relaxed tracking-tight">
              {product.description}
            </p>
          </section>

          {/* Size Selection */}
          {(product.sizes && product.sizes.length > 0) && (
            <section className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Scale Configuration</span>
                <button className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-950 transition-colors underline underline-offset-4">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[80px] h-14 rounded-xl font-mono text-xs font-bold transition-all border ${
                      selectedSize === size 
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl' 
                      : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Color Selection */}
          {(product.colorVariants && product.colorVariants.length > 0) && (
            <section className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Available Colours</span>
                <span className="text-[8px] font-black text-zinc-950 uppercase tracking-widest">
                  {selectedColorVariant ? `${selectedColorVariant.main}/${selectedColorVariant.secondary}` : 'No variant selected'}
                </span>
              </div>
              <div className="flex flex-wrap gap-5">
                {product.colorVariants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorVariant(variant)}
                    className={`group relative flex flex-col items-center gap-3 transition-all duration-500`}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full border-2 p-1 transition-all duration-500 flex -space-x-4 ${selectedColorVariant === variant ? 'border-zinc-950 scale-110 rotate-12 shadow-xl' : 'border-zinc-100 group-hover:border-zinc-300'}`}>
                        <div 
                          className="w-full h-full rounded-full shadow-xl z-20 border border-white/10" 
                          style={{ backgroundColor: variant.main }} 
                        />
                        <div 
                          className="w-full h-full rounded-full shadow-xl z-10 border border-white/10" 
                          style={{ backgroundColor: variant.secondary }} 
                        />
                      </div>
                      <div 
                        className="absolute -top-1 -left-1 z-30"
                        onMouseEnter={() => setActiveTooltipIdx(idx)}
                        onMouseLeave={() => setActiveTooltipIdx(null)}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltipIdx(activeTooltipIdx === idx ? null : idx);
                          }}
                          className="focus:outline-none"
                        >
                          <Info className="w-4 h-4 text-zinc-400 bg-white rounded-full p-0.5 hover:text-zinc-950 transition-colors" />
                        </button>
                        {activeTooltipIdx === idx && (
                          <div className="absolute bottom-full left-0 mb-2 bg-zinc-950 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl z-40 whitespace-nowrap border border-white/10">
                            <div className="font-mono">Main: {variant.main}</div>
                            {variant.secondary && <div className="font-mono">Sec: {variant.secondary}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${selectedColorVariant === variant ? 'text-zinc-950 opacity-100 translate-y-0' : 'text-zinc-500 opacity-80 group-hover:opacity-100 group-hover:text-zinc-950'}`}>
                      {product.colors?.[idx] || variant.main}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Product Details List */}
          {product.details && product.details.length > 0 && (
            <section className="space-y-6">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Technical Details</span>
              <ul className="space-y-4">
                {product.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 mt-1.5 shrink-0"></div>
                    <span className="text-sm text-zinc-500 font-medium leading-relaxed">{detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Core Palette */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <section className="space-y-6">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Available Colours</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.colorVariants.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-6 bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                    <div className="flex -space-x-3">
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-white/10 shadow-xl z-20" 
                        style={{ backgroundColor: variant.main }} 
                      />
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-white/10 shadow-xl z-10" 
                        style={{ backgroundColor: variant.secondary }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Variant_{idx + 1}</div>
                      <div className="text-[10px] font-bold text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                        <span style={{ color: variant.main }}>{variant.main}</span>
                        <span className="text-zinc-200">×</span>
                        <span style={{ color: variant.secondary }}>{variant.secondary}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Scarcity & Rank Info */}
          <section className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 md:p-6 rounded-2xl border border-zinc-100 bg-zinc-50 space-y-2">
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Availability</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${!product.inStock || product.stockCount === 0 ? 'bg-red-500' : product.stockCount < 10 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <p className="text-xs md:text-sm font-bold text-zinc-950">
                  {!product.inStock || product.stockCount === 0 
                    ? 'Out of Stock' 
                    : product.stockCount < 10 
                      ? `Low Stock: Only ${product.stockCount} left` 
                      : `In Stock: ${product.stockCount} available`}
                </p>
              </div>
            </div>
            {product.deliveryTime && (
              <div className="p-4 md:p-6 rounded-2xl border border-zinc-100 bg-zinc-50 space-y-2">
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Delivery Time</span>
                <p className="text-xs md:text-sm font-bold text-zinc-950">{product.deliveryTime}</p>
              </div>
            )}
          </section>

          {/* Reviews Section */}
          <section className="pt-12 border-t border-zinc-100">
            <ProductReviews productId={product.id} productName={product.name} userId={stats.userId} />
          </section>

          {/* Similar Items */}
          {similarProducts.length > 0 && (
            <section className="space-y-8 pt-12 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Similar Products</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {similarProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    isWishlisted={false} // Would need wishlist state here for full accuracy
                    onAddToCart={() => onAddToCart(p)}
                    onToggleWishlist={onToggleWishlist}
                    onClick={() => onProductClick(p)} 
                    saleTimerEnd={p.price < p.originalPrice ? limitedOfferEnd : null}
                    onQuickBuy={onQuickBuy}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

           {/* Action Bar */}
          <div className="p-4 sm:p-6 md:p-8 bg-white border-t border-zinc-100 sticky bottom-0 z-20 backdrop-blur-2xl pb-safe shadow-2xl space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock || product.stockCount === 0}
                className={`flex-[3] h-14 md:h-16 rounded-2xl font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs transition-all active:scale-[0.98] shadow-xl ${
                  (!product.inStock || product.stockCount === 0)
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                  : isTakeClicked
                    ? 'bg-zinc-950 text-white border border-zinc-950 shadow-2xl'
                    : 'bg-zinc-950 text-white hover:bg-black border border-zinc-950'
                }`}
              >
                {!product.inStock || product.stockCount === 0 
                  ? 'SOLD OUT' 
                  : showCustomForm ? 'Confirm Customization' : (product.isCustom ? 'Customize Item' : 'Take It')}
              </button>
              
              <WhatsAppShareButton 
                product={product} 
                variant="pill" 
                className="flex-[2] h-14 md:h-16 text-[10px] md:text-xs tracking-[0.2em] rounded-2xl" 
              />

              {onToggleCompare && (
                <button
                  onClick={() => onToggleCompare(product)}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                    isComparing 
                    ? 'bg-zinc-950 border-zinc-950 text-white shadow-xl' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400'
                  }`}
                  title="Compare Product"
                >
                  <Scale className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </div>
            <p className="text-center text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Secure checkout via account • Global shipping GH₵{product.shippingFee}
            </p>
          </div>
        </div>
      </div>
    );
};

export default ProductDetail;