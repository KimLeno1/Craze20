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
           <h2 className="text-4xl font-serif italic text-white uppercase tracking-tighter">Thermal Limit Reached</h2>
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-sm mx-auto">
             Your current standing as a {rank.tier} allows {rank.aiTryOnLimit} attempts per solar cycle. Access is restricted until recalibration.
           </p>
        </div>
      </div>
    );
  }

  const currentProducts = activeTab === 'WISHLIST' ? wishlistProducts : haulProducts;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 animate-in fade-in duration-500 pb-40">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 glass px-4 py-2 rounded-full border-[#00D1FF]/20 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Neural Materializer v4.2</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tighter leading-none">
          The <span className="text-[#00D1FF] not-italic font-sans font-black glow-text">MATERIALIZER</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-6">
          {rank.tier} Access Level // Daily attempts used: {stats.aiTryOnsUsedToday}/{rank.aiTryOnLimit}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Visual Terminal */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] w-full rounded-[3.5rem] overflow-hidden bg-zinc-950 border border-white/10 shadow-3xl group">
            <AnimatePresence mode="wait">
              {uploadedImage ? (
                <motion.img
                  key="uploaded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={uploadedImage}
                  className="w-full h-full object-cover"
                  alt="Uploaded silhouette"
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
                  <p className="text-zinc-600 text-[11px] font-black uppercase tracking-[0.3em]">Accessing Visual Terminal...</p>
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
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 z-50">
                <RefreshCw className="w-12 h-12 text-[#00D1FF] animate-spin" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Materializing Neural Mesh...</p>
              </div>
            )}

            {showSuccess && (
              <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 z-50">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">✓</div>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Neural Materialization Complete</p>
              </div>
            )}
            
            {/* UI Overlays */}
            <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between border-[20px] border-transparent">
              <div className="flex justify-between">
                <div className="w-12 h-12 border-t-2 border-l-2 border-[#00D1FF]/50"></div>
                <div className="w-12 h-12 border-t-2 border-r-2 border-[#00D1FF]/50"></div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="glass px-6 py-2 rounded-full border-[#00D1FF]/30">
                   <span className="text-[9px] font-black uppercase text-[#00D1FF] tracking-widest">
                     {isProcessing ? 'SYNCHRONIZING...' : selectedProduct ? `PROJECTING: ${selectedProduct.name}` : 'Scanning Silhouette...'}
                   </span>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00D1FF]/50 to-transparent animate-pulse"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-12 h-12 border-b-2 border-l-2 border-[#00D1FF]/50"></div>
                <div className="w-12 h-12 border-b-2 border-r-2 border-[#00D1FF]/50"></div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-10 right-10 flex gap-4 pointer-events-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all group/btn"
              >
                <Upload className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Upload Photo</span>
              </button>
              {(uploadedImage || selectedProduct) && (
                <button 
                  onClick={reset}
                  className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
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
            className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-[#00D1FF] hover:text-white transition-all shadow-2xl disabled:opacity-30 disabled:grayscale"
          >
            Initiate Neural Try-On
          </button>
        </div>

        {/* Asset Selection */}
        <div className="space-y-8">
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('WISHLIST')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'WISHLIST' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              <Star className="w-3 h-3" />
              Wishlist_Buffer
            </button>
            <button 
              onClick={() => setActiveTab('HAUL')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'HAUL' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              <ShoppingBag className="w-3 h-3" />
              Archived_Haul
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {currentProducts.length === 0 ? (
              <div className="col-span-2 py-20 text-center opacity-30 italic uppercase text-[10px] tracking-widest">
                No assets found in this sector.
              </div>
            ) : (
              currentProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`relative aspect-[4/5] rounded-3xl overflow-hidden border-2 transition-all group ${selectedProduct?.id === product.id ? 'border-[#00D1FF] shadow-[0_0_20px_rgba(0,209,255,0.3)]' : 'border-white/5 hover:border-white/20'}`}
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
                    <p className="text-[7px] font-mono text-[#00D1FF] uppercase mt-1">{product.category}</p>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-[#00D1FF] rounded-full flex items-center justify-center shadow-lg">
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