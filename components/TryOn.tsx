import React, { useRef, useEffect, useState } from 'react';
import { RankBenefits, UserStats, Product } from '../types';
import { Camera, Upload, Image as ImageIcon, RefreshCw, Star, ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TryOnProps {
  rank: RankBenefits;
  stats: UserStats;
  onUsed: () => void;
  wishlistProducts: Product[];
  haulProducts: Product[];
}

const TryOn: React.FC<TryOnProps> = ({ rank, stats, onUsed, wishlistProducts, haulProducts }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'WISHLIST' | 'HAUL'>('WISHLIST');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (stats.aiTryOnsUsedToday >= rank.aiTryOnLimit) {
      setIsDenied(true);
      return;
    }

    if (!uploadedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [uploadedImage]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCamera(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setHasCamera(false);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = () => {
    if (!selectedProduct || (!hasCamera && !uploadedImage)) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      onUsed();
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const reset = () => {
    setUploadedImage(null);
    setSelectedProduct(null);
    startCamera();
  };

  if (isDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-12 text-center space-y-8 animate-in fade-in">
        <div className="text-8xl grayscale opacity-20">🚫</div>
        <div className="space-y-4">
           <h2 className="text-4xl font-serif italic text-zinc-950 uppercase tracking-tighter">Daily Limit Reached</h2>
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-sm mx-auto">
             Your account tier ({rank.tier}) allows {rank.aiTryOnLimit} virtual try-ons per day. Access resets tomorrow.
           </p>
        </div>
      </div>
    );
  }

  const currentProducts = activeTab === 'WISHLIST' ? wishlistProducts : haulProducts;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 animate-in fade-in duration-500 pb-40">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#0F52BA] animate-pulse"></div>
          <span className="text-[10px] font-black text-[#0F52BA] uppercase tracking-[0.4em]">Virtual Fitting Room</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-serif italic text-zinc-950 tracking-tighter leading-none">
          Virtual <span className="text-[#0F52BA] not-italic font-sans font-black">TRY-ON</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-6">
          {rank.tier} Tier • Attempts used today: {stats.aiTryOnsUsedToday}/{rank.aiTryOnLimit}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Visual Terminal */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] w-full rounded-[3.5rem] overflow-hidden bg-zinc-950 border border-zinc-200 shadow-2xl group">
            <AnimatePresence mode="wait">
              {uploadedImage ? (
                <motion.img
                  key="uploaded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={uploadedImage}
                  className="w-full h-full object-cover"
                  alt="Uploaded photo"
                />
              ) : hasCamera ? (
                <motion.video
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <motion.div
                  key="no-input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <span className="text-6xl grayscale opacity-20 group-hover:opacity-100 transition-all">📷</span>
                  <p className="text-zinc-600 text-[11px] font-black uppercase tracking-[0.3em]">Starting Camera...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Product Overlay Simulation */}
            {selectedProduct && !isProcessing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.7, scale: 1 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center p-20"
              >
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="max-w-full max-h-full object-contain mix-blend-screen grayscale brightness-150"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-6 z-50">
                <RefreshCw className="w-12 h-12 text-[#0F52BA] animate-spin" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Applying garment preview...</p>
              </div>
            )}

            {showSuccess && (
              <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center space-y-6 z-50">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl">✓</div>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Preview Ready</p>
              </div>
            )}
            
            {/* UI Overlays */}
            <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between border-[20px] border-transparent">
              <div className="flex justify-between">
                <div className="w-12 h-12 border-t-2 border-l-2 border-[#0F52BA]/50"></div>
                <div className="w-12 h-12 border-t-2 border-r-2 border-[#0F52BA]/50"></div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white/95 px-6 py-2 rounded-full border border-zinc-200 shadow-md">
                   <span className="text-[9px] font-black uppercase text-[#0F52BA] tracking-widest">
                     {isProcessing ? 'PROCESSING...' : selectedProduct ? `FITTING: ${selectedProduct.name}` : 'Position in frame'}
                   </span>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#0F52BA]/50 to-transparent animate-pulse"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-12 h-12 border-b-2 border-l-2 border-[#0F52BA]/50"></div>
                <div className="w-12 h-12 border-b-2 border-r-2 border-[#0F52BA]/50"></div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-10 right-10 flex gap-4 pointer-events-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-4 bg-white text-zinc-950 border border-zinc-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all group/btn shadow-md"
              >
                <Upload className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Upload Photo</span>
              </button>
              {(uploadedImage || selectedProduct) && (
                <button 
                  onClick={reset}
                  className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <button 
            disabled={!selectedProduct || isProcessing}
            onClick={handleTryOn}
            className="w-full py-5 bg-[#0F52BA] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl disabled:opacity-30 disabled:grayscale"
          >
            Try On Selected Item
          </button>
        </div>

        {/* Asset Selection */}
        <div className="space-y-8">
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
            <button 
              onClick={() => setActiveTab('WISHLIST')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'WISHLIST' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-950'}`}
            >
              <Star className="w-3 h-3" />
              Saved Wishlist
            </button>
            <button 
              onClick={() => setActiveTab('HAUL')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'HAUL' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-950'}`}
            >
              <ShoppingBag className="w-3 h-3" />
              My Bag
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {currentProducts.length === 0 ? (
              <div className="col-span-2 py-20 text-center text-zinc-400 italic uppercase text-[10px] tracking-widest">
                No items found here.
              </div>
            ) : (
              currentProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`relative aspect-[4/5] rounded-3xl overflow-hidden border-2 transition-all group bg-white ${selectedProduct?.id === product.id ? 'border-[#0F52BA] shadow-[0_0_20px_rgba(15,82,186,0.25)]' : 'border-zinc-200 hover:border-[#0F52BA]/40'}`}
                >
                  <img 
                    src={product.image} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${selectedProduct?.id === product.id ? 'scale-110' : 'group-hover:scale-105'}`} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <p className="text-[8px] font-black text-white uppercase truncate">{product.name}</p>
                    <p className="text-[7px] font-mono text-[#E8D3B0] uppercase mt-1">{product.category}</p>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-[#0F52BA] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for checkmark
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default TryOn;