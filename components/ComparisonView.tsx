
import React, { useState } from 'react';
import { X, Scale, Star, ShoppingCart, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Product } from '../types';
import { getImageUrl } from '../lib/imageUtils';

interface ComparisonViewProps {
  products: Product[];
  onClose: () => void;
  onRemove: (product: Product) => void;
  onAddToCart: (product: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onProductClick: (product: Product) => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  products,
  onClose,
  onRemove,
  onAddToCart,
  onProductClick
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [pureView, setPureView] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorVariant, setSelectedColorVariant] = useState<{ main: string; secondary: string } | undefined>(undefined);
  const [clickedProductIds, setClickedProductIds] = useState<Record<string, boolean>>({});

  if (products.length === 0) return null;

  const handleAddToCart = (product: Product) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colorVariants && product.colorVariants.length > 0;

    if (hasSizes || hasColors) {
      if (hasSizes) setSelectedSize(product.sizes[0]);
      if (hasColors) setSelectedColorVariant(product.colorVariants![0]);
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
    onAddToCart(product, selectedSize, selectedColorVariant);
    setShowSelectionModal(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden flex flex-col">
      {/* Selection Modal (Global for Comparison) */}
      {showSelectionModal && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in zoom-in duration-300"
          onClick={() => setShowSelectionModal(null)}
        >
          <div 
            className="w-full max-w-sm bg-white p-8 rounded-[2rem] flex flex-col gap-8 border border-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {products.find(p => p.id === showSelectionModal) && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif italic text-zinc-950 line-clamp-1">{products.find(p => p.id === showSelectionModal)?.name}</h3>
                  <button onClick={() => setShowSelectionModal(null)} className="text-zinc-400 hover:text-zinc-950">✕</button>
                </div>

                {/* Color Selection */}
                {products.find(p => p.id === showSelectionModal)?.colorVariants && products.find(p => p.id === showSelectionModal)!.colorVariants!.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Variant</div>
                    <div className="flex flex-wrap gap-4">
                      {products.find(p => p.id === showSelectionModal)!.colorVariants!.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorVariant(variant)}
                          className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                            selectedColorVariant?.main === variant.main 
                              ? 'border-blue-600 scale-110 shadow-lg' 
                              : 'border-zinc-100 opacity-50 hover:opacity-100'
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
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Size</div>
                    <div className="grid grid-cols-3 gap-3">
                      {products.find(p => p.id === showSelectionModal)?.sizes?.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 text-[10px] font-black rounded-xl border transition-all ${
                            selectedSize === size 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                              : 'border-zinc-100 text-zinc-400 hover:border-zinc-300 hover:text-zinc-950'
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
                  className={`w-full py-5 text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-xl ${
                    showSelectionModal && clickedProductIds[showSelectionModal]
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-white hover:bg-blue-600'
                  }`}
                >
                  Take It
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <header className={`flex-shrink-0 flex items-center justify-between px-6 py-4 md:px-12 border-b border-zinc-100 transition-all duration-700 ${pureView ? 'opacity-0 h-0 p-0 overflow-hidden border-none' : 'bg-white/80 backdrop-blur-md'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Scale className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-serif italic text-zinc-950 line-clamp-1">Comparison</h2>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden sm:block">Side-by-side analysis of selected silhouettes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setPureView(!pureView)}
            className={`flex items-center gap-2 px-4 h-10 md:h-12 rounded-full border transition-all ${
              pureView 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white border-zinc-100 text-zinc-400 hover:text-zinc-950 hover:border-zinc-300 shadow-sm'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Pure View</span>
          </button>

          <button 
            onClick={() => setIsFocused(!isFocused)}
            className={`flex items-center gap-2 px-4 h-10 md:h-12 rounded-full border transition-all ${
              isFocused 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                : 'bg-white border-zinc-100 text-zinc-400 hover:text-zinc-950 hover:border-zinc-300 shadow-sm'
            }`}
          >
            {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
              {isFocused ? 'Exit Focus' : 'Focus Mode'}
            </span>
          </button>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-950 transition-colors shadow-sm"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      {/* Comparison Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide bg-zinc-50/30">
        {(isFocused || pureView) ? 
          /* Focus Mode: Side-by-side Images */
          <div className={`grid grid-cols-${products.length > 4 ? '4' : products.length} md:flex h-full w-full min-w-full relative`}>
            {pureView && (
              <button 
                onClick={() => setPureView(false)}
                className="fixed top-8 right-8 z-[100] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-zinc-950 flex items-center justify-center hover:bg-white/20 transition-all border border-zinc-200"
              >
                ✕
              </button>
            )}
            {products.map((product) => (
              <div 
                key={product.id} 
                className={`group relative flex-1 h-full min-w-[280px] border-r border-zinc-100 overflow-hidden transition-all duration-1000`}
              >
                <img 
                  src={getImageUrl(product.image)} 
                  className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out ${pureView ? 'scale-100' : 'scale-[1.1] group-hover:scale-100'}`} 
                  alt={product.name} 
                />
                
                {!pureView && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-12 left-0 right-0 p-8">
                      <h3 className="text-xl md:text-3xl font-serif italic text-zinc-950 mb-2">{product.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {product.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {!pureView && (
                  <button 
                    onClick={() => onRemove(product)}
                    className="absolute top-8 right-8 z-10 w-12 h-12 rounded-full bg-white border border-zinc-200 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {products.length < 2 && !pureView && (
               <div className="flex-1 h-full flex items-center justify-center border-r border-zinc-100 bg-white">
                  <p className="text-zinc-300 text-xs font-black uppercase tracking-widest">Select more items to compare</p>
               </div>
            )}
          </div>
         : 
          <div className="min-w-max p-2 sm:p-4 md:p-12">
            {/* Table-like Grid */}
            <div className="flex border border-zinc-100 bg-white rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl">
              
              {/* Sticky Labels Column */}
              <div className="sticky left-0 z-20 flex flex-col bg-zinc-50 border-r border-zinc-100 shadow-xl">
                <div className="h-[200px] sm:h-[280px] md:h-[400px] w-24 sm:w-32 md:w-48 border-b border-zinc-100"></div> {/* Image Spacer */}
                <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price</div>
                <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</div>
                <div className="p-2 sm:p-4 md:p-6 h-16 sm:h-20 md:h-28 flex items-start pt-2 sm:pt-4 md:pt-8 border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tags</div>
                <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</div>
                <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rating</div>
                <div className="p-2 sm:p-4 md:p-6 h-24 sm:h-32 md:h-40 flex items-start pt-2 sm:pt-4 md:pt-8 border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Features</div>
                <div className="p-2 sm:p-4 md:p-6 h-24 sm:h-32 md:h-40 flex items-start pt-2 sm:pt-4 md:pt-8 border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</div>
                <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Stock</div>
                <div className="p-2 sm:p-4 md:p-6 h-20 sm:h-24 md:h-32 flex items-center text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Action</div>
              </div>

              {/* Product Columns */}
              <div className="flex">
                {products.map((product) => (
                  <div key={product.id} className="flex flex-col w-[180px] sm:w-[240px] md:w-[320px] bg-white group transition-colors hover:bg-zinc-50/50 border-r border-zinc-100">
                    {/* Image & Name */}
                    <div className="h-[200px] sm:h-[280px] md:h-[400px] p-2 sm:p-4 md:p-6 border-b border-zinc-100 relative">
                      <button 
                        onClick={() => onRemove(product)}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white border border-red-100 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <div 
                        className="w-full h-20 sm:h-32 md:h-64 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 mb-2 sm:mb-4 md:mb-6 cursor-pointer shadow-inner"
                        onClick={() => onProductClick(product)}
                      >
                        <img src={getImageUrl(product.image)} className="w-full h-full object-cover transition-all duration-700" alt={product.name} />
                      </div>
                      <h3 className="text-[10px] sm:text-sm md:text-xl font-serif italic text-zinc-950 leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5 sm:mt-1 md:mt-2">{product.brand || 'Elite Archive'}</p>
                    </div>

                    {/* Price */}
                    <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-base md:text-xl font-mono font-bold text-zinc-950">GH₵{product.price}</span>
                        {product.price < product.originalPrice && (
                          <span className="text-[8px] sm:text-[10px] md:text-xs font-mono text-zinc-400 line-through">GH₵{product.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100 text-[8px] sm:text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {product.category}
                    </div>

                    {/* Tags */}
                    <div className="p-2 sm:p-4 md:p-6 h-16 sm:h-20 md:h-28 flex flex-wrap gap-1 border-b border-zinc-100 overflow-y-auto scrollbar-hide pt-2 sm:pt-4 md:pt-8">
                      {product.tags?.map(tag => (
                        <span key={tag} className="text-[6px] sm:text-[7px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 bg-blue-50/30 px-1 sm:px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Status */}
                    <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[8px] sm:text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest">Verified</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 ${star <= 4 ? 'text-amber-500 fill-amber-500' : 'text-zinc-100'}`} 
                          />
                        ))}
                        <span className="text-[6px] sm:text-[8px] md:text-[10px] font-mono text-zinc-300 ml-0.5 sm:ml-1 md:ml-2">(4.0)</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="p-2 sm:p-4 md:p-6 h-24 sm:h-32 md:h-40 flex flex-col gap-1 border-b border-zinc-100 overflow-y-auto custom-scrollbar pt-2 sm:pt-4 md:pt-8">
                      {product.details?.slice(0, 4).map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-1 sm:gap-1.5 md:gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-600 mt-1 sm:mt-1.5 shrink-0"></div>
                          <span className="text-[6px] sm:text-[8px] md:text-[10px] text-zinc-500 leading-tight line-clamp-2">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="p-2 sm:p-4 md:p-6 h-24 sm:h-32 md:h-40 border-b border-zinc-100 overflow-y-auto custom-scrollbar pt-2 sm:pt-4 md:pt-8">
                       <p className="text-[7px] sm:text-[9px] md:text-[11px] text-zinc-400 italic font-serif leading-relaxed line-clamp-3">
                         "{product.description}"
                       </p>
                    </div>

                    {/* Stock Status */}
                    <div className="p-2 sm:p-4 md:p-6 h-14 sm:h-16 md:h-24 flex items-center border-b border-zinc-100">
                      {!product.inStock || product.stockCount === 0 ? (
                        <span className="px-1 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 bg-red-50 text-red-500 text-[5px] sm:text-[6px] md:text-[8px] font-black uppercase tracking-widest rounded-full border border-red-100">Out of Stock</span>
                      ) : product.stockCount < 10 ? (
                        <span className="px-1 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 bg-amber-50 text-amber-500 text-[5px] sm:text-[6px] md:text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-100">Low Stock</span>
                      ) : (
                        <span className="px-1 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 bg-emerald-50 text-emerald-600 text-[5px] sm:text-[6px] md:text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100">In Stock</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-2 sm:p-4 md:p-6 h-20 sm:h-24 md:h-32 flex items-center gap-1.5 sm:gap-3">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className={`flex-1 h-8 sm:h-10 md:h-12 text-[6px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all rounded-md sm:rounded-lg md:rounded-xl shadow-md ${
                          clickedProductIds[product.id]
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-950 text-white hover:bg-blue-600'
                        }`}
                      >
                        Take It
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty Slots */}
              {Array.from({ length: Math.max(1, 4 - products.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex flex-col w-[80px] sm:w-[120px] md:w-[200px] bg-zinc-50 items-center justify-center text-zinc-300 border-r border-zinc-100">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center text-lg md:text-xl">
                    +
                  </div>
                  <p className="text-[6px] md:text-[8px] font-black uppercase tracking-widest mt-2 md:mt-4 text-center px-2">Slot_Available</p>
                </div>
              ))}
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default ComparisonView;
