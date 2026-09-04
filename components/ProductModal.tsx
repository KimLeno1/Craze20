import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { WhatsAppShareButton } from './WhatsAppShareButton';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted }) => {
  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-12">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-7xl h-full md:h-fit md:max-h-[90vh] flex flex-col md:flex-row shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-zinc-200 rounded-none md:rounded-[3rem]">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200 flex items-center justify-center hover:bg-zinc-950 hover:text-white transition-all shadow-lg text-zinc-950"
        >
          ✕
        </button>

        <div className="w-full md:w-3/5 h-[40vh] md:h-auto overflow-hidden relative">
          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-8 left-8 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#00D1FF] px-4 py-2 rounded-xl shadow-[0_10px_20px_rgba(0,209,255,0.3)]">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  URGENT: {discountPercent}% VALUE SECURED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-white">
          <div className="space-y-12">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.4em]">{product.category} // ARCHIVE SKU-{product.id}</div>
                <div className="text-[10px] font-black text-zinc-400 uppercase">Tier 01 // ARCHIVED</div>
              </div>
              <h2 className="text-5xl md:text-7xl font-serif italic mb-6 leading-[0.85] tracking-tighter text-zinc-950">{product.name}</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {/* Gender Tag */}
                <span className="bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  {product.gender}
                </span>
                {product.tags?.map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    #{tag}
                  </span>
                ))}
              </div>

              {product.colorVariants && product.colorVariants.length > 0 && (
                <div className="mb-8 space-y-3">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Available Schemes</span>
                  <div className="flex flex-wrap gap-3">
                    {product.colorVariants.map((variant, i) => (
                      <div key={i} className="flex -space-x-2 group/color">
                        <div className="w-4 h-4 rounded-full border border-zinc-200 z-10" style={{ backgroundColor: variant.main }} />
                        <div className="w-4 h-4 rounded-full border border-zinc-200" style={{ backgroundColor: variant.secondary }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-baseline gap-4">
                <div className="text-4xl font-mono font-black tracking-tighter text-zinc-950">GH₵{product.price}</div>
                <div className="text-xl font-mono text-zinc-300 line-through">GH₵{product.originalPrice}</div>
              </div>
            </div>

            <div className="space-y-8">
              <p className="text-zinc-500 text-sm leading-relaxed max-w-md uppercase font-bold tracking-tight italic">
                "{product.description}"
              </p>
              <div className="grid grid-cols-1 gap-4">
                {product.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    <span className="w-4 h-[1px] bg-[#00D1FF]" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>

            {/* Psychological Trigger: Scarcity */}
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                   <div className="text-[10px] font-black text-red-500 uppercase tracking-widest text-left">Inventory Critical</div>
                   <div className="text-[11px] font-bold text-zinc-950 uppercase text-left">Only {product.stockCount} units remaining.</div>
                </div>
              </div>
              <div className="text-[10px] font-black text-red-500 animate-pulse">Rarity 10/10</div>
            </div>

            <div className="pt-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button 
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  disabled={!product.inStock}
                  className={`flex-[3] py-5 sm:py-6 text-[12px] uppercase tracking-[0.4em] font-black transition-all shadow-2xl relative overflow-hidden group rounded-2xl ${
                    product.inStock 
                    ? 'bg-zinc-950 text-white hover:bg-black border border-zinc-800 shadow-xl' 
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <span className="relative z-10">{product.inStock ? 'Take It' : 'Archive Locked'}</span>
                </button>

                <WhatsAppShareButton
                  product={product}
                  variant="pill"
                  className="flex-[2] py-5 sm:py-6 rounded-2xl text-xs tracking-wider"
                />
                
                {onToggleWishlist && (
                  <motion.button 
                    onClick={() => onToggleWishlist(product)}
                    whileTap={{ scale: 0.8 }}
                    animate={{ scale: isWishlisted ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`w-16 h-16 sm:w-auto sm:flex-1 rounded-2xl border flex items-center justify-center text-xl transition-all shrink-0 ${
                      isWishlisted 
                      ? 'bg-[#00D1FF] border-[#00D1FF] text-white shadow-lg' 
                      : 'bg-white border-zinc-200 text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <motion.span
                      key={isWishlisted ? 'modal-wish-yes' : 'modal-wish-no'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="inline-block"
                    >
                      {isWishlisted ? '💖' : '🤍'}
                    </motion.span>
                  </motion.button>
                )}
              </div>
              <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">
                Secured Checkout Protected by CC Protocol
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;