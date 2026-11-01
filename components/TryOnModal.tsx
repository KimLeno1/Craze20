import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Upload, 
  Camera, 
  Check, 
  Download, 
  RefreshCw, 
  ShoppingBag, 
  Sliders, 
  Info, 
  Shirt, 
  ArrowRight,
  AlertCircle,
  Lock,
  Crown,
  Zap,
  Shield,
  Award,
  Gift
} from 'lucide-react';
import { Product, RankBenefits, UserStats, CartItem } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { triggerHaptic } from '../lib/haptics';
import { toast } from 'sonner';
import { PayForMeShareModal } from './PayForMeShareModal';

interface ModelAvatar {
  id: string;
  name: string;
  label: string;
  imageUrl: string;
}

interface TryOnModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
  selectedColor?: { main: string; secondary: string } | null;
  onAddToCart?: (product: Product, size?: string) => void;
  rank?: RankBenefits;
  stats?: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
}

const TIER_META: Record<string, { label: string; defaultLimit: number; icon: string; color: string; badgeBg: string }> = {
  'Newcomer': { label: 'Newcomer', defaultLimit: 2, icon: '👤', color: 'text-zinc-600 dark:text-zinc-400', badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' },
  'Stylist': { label: 'Stylist', defaultLimit: 6, icon: '🌟', color: 'text-blue-600 dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  'Trendsetter': { label: 'Trendsetter', defaultLimit: 12, icon: '💎', color: 'text-indigo-600 dark:text-indigo-400', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  'Fashion Icon': { label: 'Fashion Icon', defaultLimit: 18, icon: '🔥', color: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  'Closet Royalty': { label: 'Closet Royalty', defaultLimit: 24, icon: '👑', color: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  'Kraze Legend': { label: 'Kraze Legend', defaultLimit: 30, icon: '⚡', color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' }
};

const FALLBACK_AVATARS: ModelAvatar[] = [
  {
    id: 'avatar_model_1',
    name: 'Streetwear Minimalist',
    label: 'Male / Unisex',
    imageUrl: '/hero/hero_model_freedom_1788236993279.jpg'
  },
  {
    id: 'avatar_model_2',
    name: 'Contemporary Editorial',
    label: 'Female / Unisex',
    imageUrl: '/hero/hero_model_identity_1788237069856.jpg'
  },
  {
    id: 'avatar_model_3',
    name: 'Avant-Garde Silhouette',
    label: 'Editorial',
    imageUrl: '/hero/hero_model_gallery_1788237022752.jpg'
  },
  {
    id: 'avatar_model_4',
    name: 'High-Fashion Tailored',
    label: 'Urban Modern',
    imageUrl: '/hero/hero_model_harder_1788237010924.jpg'
  }
];

export const TryOnModal: React.FC<TryOnModalProps> = ({
  product,
  isOpen,
  onClose,
  selectedSize,
  selectedColor,
  onAddToCart,
  rank,
  stats,
  onUpdateStats
}) => {
  const [avatars, setAvatars] = useState<ModelAvatar[]>(FALLBACK_AVATARS);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(FALLBACK_AVATARS[0].id);
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [denoiseSteps, setDenoiseSteps] = useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPayForMeOpen, setIsPayForMeOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'result' | 'split' | 'original'>('result');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Tier Ranking and Daily Allocations
  const userTier = rank?.tier || (stats?.rank as any) || 'Newcomer';
  const tierMeta = TIER_META[userTier] || TIER_META['Newcomer'];
  const dailyLimit = rank?.aiTryOnLimit ?? tierMeta.defaultLimit;

  const todayKey = new Date().toISOString().slice(0, 10);
  const getLocalUsage = (): number => {
    try {
      const stored = localStorage.getItem(`cc_vton_used_${todayKey}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  };

  const [usedCount, setUsedCount] = useState<number>(() => {
    return Math.max(stats?.aiTryOnsUsedToday || 0, getLocalUsage());
  });

  useEffect(() => {
    if (isOpen) {
      setUsedCount(Math.max(stats?.aiTryOnsUsedToday || 0, getLocalUsage()));
    }
  }, [isOpen, stats?.aiTryOnsUsedToday]);

  const remainingUses = Math.max(0, dailyLimit - usedCount);
  const hasReachedLimit = remainingUses <= 0;

  // Fetch presets on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/tryon/avatars')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.avatars) && data.avatars.length > 0) {
            setAvatars(data.avatars);
          }
        })
        .catch(err => {
          console.warn('Could not fetch avatars, using defaults:', err);
        });
    }
  }, [isOpen]);

  // Reset state when product changes or modal reopens
  useEffect(() => {
    if (isOpen) {
      setResultImage(null);
      setErrorMessage(null);
      setIsGenerating(false);
      setProgressPercent(0);
      setViewMode('result');
    }
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  const currentAvatar = avatars.find(a => a.id === selectedAvatarId) || avatars[0];
  const activePersonImage = activeTab === 'upload' && userUploadedImage 
    ? userUploadedImage 
    : currentAvatar?.imageUrl;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG or PNG)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size must be under 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setUserUploadedImage(base64);
      setActiveTab('upload');
      setResultImage(null);
      setErrorMessage(null);
      triggerHaptic('selection');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateTryOn = async () => {
    if (!activePersonImage) {
      toast.error('Please choose a model avatar or upload your photo first');
      return;
    }

    if (hasReachedLimit) {
      triggerHaptic('error');
      toast.error(`Daily limit reached for ${userTier} tier (${dailyLimit} try-ons/day). Upgrade tier or wait until tomorrow!`);
      return;
    }

    triggerHaptic('medium');
    setIsGenerating(true);
    setErrorMessage(null);
    setResultImage(null);
    setProgressPercent(10);
    setGenerationStage('Connecting to IDM-VTON Gradio client...');

    // Simulated progress ticker while awaiting HF GPU
    const interval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev < 30) {
          setGenerationStage('Analyzing body posture & silhouette...');
          return prev + 6;
        } else if (prev < 65) {
          setGenerationStage('Extracting garment textures & geometry...');
          return prev + 3;
        } else if (prev < 88) {
          setGenerationStage('Synthesizing neural diffusion drape (Gradio HF Space)...');
          return prev + 2;
        } else if (prev < 95) {
          setGenerationStage('Refining micro-folds and fabric shadows...');
          return prev + 0.5;
        }
        return prev;
      });
    }, 1200);

    try {
      const garmentImageUrl = getImageUrl(product.image);

      const response = await fetch('/api/ai/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personImage: activePersonImage,
          garmentImage: garmentImageUrl,
          garmentDescription: `${product.name} ${product.category || ''} high-end streetwear garment`,
          denoiseSteps: denoiseSteps,
          seed: Math.floor(Math.random() * 10000)
        })
      });

      clearInterval(interval);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Virtual try-on processing failed');
      }

      setProgressPercent(100);
      setGenerationStage('Complete!');
      setResultImage(data.resultUrl || data.remoteUrl);
      setViewMode('result');
      triggerHaptic('success');

      // Record daily try-on usage
      const nextUsed = usedCount + 1;
      setUsedCount(nextUsed);
      try {
        localStorage.setItem(`cc_vton_used_${todayKey}`, nextUsed.toString());
      } catch {}

      if (stats && onUpdateStats) {
        onUpdateStats({
          ...stats,
          aiTryOnsUsedToday: nextUsed
        });
      }

      // Sync with backend if auth token present
      try {
        const token = localStorage.getItem('ck_user_token') || localStorage.getItem('cc-auth-token') || localStorage.getItem('cc_auth_token');
        if (token) {
          fetch('/api/user/ai-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type: 'tryon' })
          }).catch(() => {});
        }
      } catch {}

      const remainingAfter = Math.max(0, dailyLimit - nextUsed);
      toast.success(`AI Try-On look generated! (${remainingAfter} left today on ${userTier} Tier)`);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Try-On request error:', err);
      triggerHaptic('error');
      setErrorMessage(
        err.message || 'Public Gradio queue is currently busy. Please wait a moment and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `closet-kraze-tryon-${product.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic('selection');
    toast.success('Saved to your downloads');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                    Virtual Try-On
                  </h2>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    IDM-VTON Gradio
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Visualize garment fit and drape before ordering
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Top Product Summary Pill */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-300 dark:border-zinc-700">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-zinc-950 dark:text-white line-clamp-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-0.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">GH₵{product.price}</span>
                    {selectedSize && (
                      <span className="px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">
                        Size: {selectedSize}
                      </span>
                    )}
                    {selectedColor && (
                      <span className="flex items-center gap-1 text-[9px]">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/20" 
                          style={{ backgroundColor: selectedColor.main }} 
                        />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Shirt className="w-4 h-4 text-zinc-500" />
                <span>Garment Loaded</span>
              </div>
            </div>

            {/* Tier Ranking & Daily Allocation Status Bar */}
            <div className={`p-4 rounded-2xl border transition-all ${
              hasReachedLimit 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border shrink-0 ${tierMeta.badgeBg}`}>
                    <span>{tierMeta.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                        {userTier} Tier
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                        hasReachedLimit
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700'
                      }`}>
                        {remainingUses} of {dailyLimit} left today
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      {hasReachedLimit 
                        ? `Daily limit reached (${dailyLimit}/${dailyLimit} used). Resets at 00:00 midnight.` 
                        : `Your account tier grants ${dailyLimit} virtual try-ons per day.`}
                    </p>
                  </div>
                </div>

                {/* Progress Meter */}
                <div className="w-full sm:w-48 shrink-0 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-500">
                    <span>Usage Today</span>
                    <span>{Math.min(dailyLimit, usedCount)} / {dailyLimit}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full transition-all duration-500 ${hasReachedLimit ? 'bg-amber-500' : 'bg-[#0F52BA]'}`}
                      style={{ width: `${Math.min(100, (usedCount / dailyLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Stage Grid: Studio Controls & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Model Selection & Inputs (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Limit Reached Warning & Tier Ranking Breakdown */}
                {hasReachedLimit && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          Daily Try-On Limit Reached
                        </h5>
                        <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                          Your <span className="font-bold">{userTier}</span> rank allows {dailyLimit} virtual try-ons per day. Quota resets tomorrow.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                        Tier Allowances:
                      </p>
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Newcomer</span><br/><b className="text-zinc-900 dark:text-zinc-200">2/day</b>
                        </div>
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Stylist</span><br/><b className="text-zinc-900 dark:text-zinc-200">6/day</b>
                        </div>
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Trendsetter</span><br/><b className="text-zinc-900 dark:text-zinc-200">12/day</b>
                        </div>
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Icon</span><br/><b className="text-zinc-900 dark:text-zinc-200">18/day</b>
                        </div>
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Royalty</span><br/><b className="text-zinc-900 dark:text-zinc-200">24/day</b>
                        </div>
                        <div className="p-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 text-center">
                          <span className="text-zinc-500">Legend</span><br/><b className="text-zinc-900 dark:text-zinc-200">30/day</b>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        Earn REP from orders, reviews, and quests to increase your tier and try-on limits.
                      </p>
                    </div>
                  </div>
                )}
                {/* Tabs for Avatar Selection vs Upload */}
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('preset');
                      triggerHaptic('selection');
                    }}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === 'preset'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Model Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('upload');
                      triggerHaptic('selection');
                    }}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'upload'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {activeTab === 'preset' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Select a model silhouette to preview immediately:
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {avatars.map(avatar => {
                        const isSelected = selectedAvatarId === avatar.id && activeTab === 'preset';
                        return (
                          <div
                            key={avatar.id}
                            onClick={() => {
                              setSelectedAvatarId(avatar.id);
                              setResultImage(null);
                              triggerHaptic('selection');
                            }}
                            className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                              isSelected
                                ? 'border-zinc-950 dark:border-white shadow-md'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                              <img
                                src={avatar.imageUrl}
                                alt={avatar.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                                <p className="text-[11px] font-bold line-clamp-1">{avatar.name}</p>
                                <p className="text-[9px] font-mono text-zinc-300">{avatar.label}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {userUploadedImage ? (
                      <div className="space-y-3">
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-950 dark:border-white bg-zinc-100 dark:bg-zinc-900 relative">
                          <img
                            src={userUploadedImage}
                            alt="Uploaded user portrait"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Change Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-950 dark:hover:border-zinc-300 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center gap-3 min-h-[220px]"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Click or drop a portrait photo
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Half or full-body portrait, standing straight
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full font-bold">
                          Supports PNG, JPG, WebP
                        </span>
                      </div>
                    )}

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-bold">
                        <Info className="w-3.5 h-3.5" />
                        <span>Best Results Checklist</span>
                      </div>
                      <p>• Plain background or good lighting</p>
                      <p>• Upper torso clearly visible with natural stance</p>
                    </div>
                  </div>
                )}

                {/* Advanced Settings Accordion */}
                <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Inference Settings</span>
                    </span>
                    <span className="text-[10px] font-bold">{showAdvanced ? 'Hide' : 'Tune'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-2.5 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Denoising Steps</span>
                        <span className="font-mono font-bold text-zinc-950 dark:text-white">{denoiseSteps}</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={40}
                        step={2}
                        value={denoiseSteps}
                        onChange={e => setDenoiseSteps(Number(e.target.value))}
                        className="w-full accent-zinc-950 dark:accent-white"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                        <span>20 (Faster)</span>
                        <span>30 (Balanced)</span>
                        <span>40 (Max Precision)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Generate CTA */}
                <button
                  type="button"
                  id="generate-vton-btn"
                  disabled={isGenerating || hasReachedLimit}
                  onClick={handleGenerateTryOn}
                  className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    hasReachedLimit
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 cursor-not-allowed opacity-80'
                      : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-100 disabled:opacity-50'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : hasReachedLimit ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>Limit Reached ({usedCount}/{dailyLimit} Used)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{resultImage ? 'Regenerate Try-On' : 'Generate AI Try-On'} ({remainingUses} left)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Interactive Fitting Studio Preview (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 min-h-[380px] relative overflow-hidden">
                {isGenerating ? (
                  <div className="w-full max-w-sm space-y-5 text-center py-8">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 animate-ping opacity-25" />
                      <div className="w-full h-full rounded-full border-4 border-t-zinc-950 dark:border-t-white border-zinc-200 dark:border-zinc-800 animate-spin flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-zinc-950 dark:text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                        {generationStage}
                      </h3>
                      <p className="text-xs text-zinc-500 font-mono">
                        Neural diffusion warping & fabric blending
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-zinc-950 dark:bg-white h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>Hugging Face Gradio Space</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-500 text-left">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-0.5">Queue Notice</p>
                      <p className="leading-relaxed">
                        Public HF Spaces run on shared zero-cost GPUs. Most renders complete in 25–40 seconds.
                      </p>
                    </div>
                  </div>
                ) : resultImage ? (
                  <div className="w-full flex flex-col items-center space-y-4">
                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('result')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          viewMode === 'result'
                            ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                            : 'text-zinc-500'
                        }`}
                      >
                        AI Try-On Fit
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          viewMode === 'split'
                            ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                            : 'text-zinc-500'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('original')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          viewMode === 'original'
                            ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                            : 'text-zinc-500'
                        }`}
                      >
                        Original
                      </button>
                    </div>

                    {/* Image Stage */}
                    <div className="w-full max-w-md">
                      {viewMode === 'result' && (
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 relative group">
                          <img
                            src={resultImage}
                            alt="Virtual Try-On Result"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-full">
                            VTON Render
                          </div>
                        </div>
                      )}

                      {viewMode === 'split' && (
                        <div className="grid grid-cols-2 gap-2 aspect-[3/4]">
                          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
                            <img
                              src={activePersonImage}
                              alt="Original silhouette"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-mono px-2 py-0.5 rounded">
                              Before
                            </span>
                          </div>
                          <div className="rounded-2xl overflow-hidden border border-zinc-950 dark:border-white relative shadow-lg">
                            <img
                              src={resultImage}
                              alt="Try-On look"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded">
                              After (VTON)
                            </span>
                          </div>
                        </div>
                      )}

                      {viewMode === 'original' && (
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
                          <img
                            src={activePersonImage}
                            alt="Original silhouette"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-full">
                            Base Silhouette
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Result Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-md pt-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save Look</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPayForMeOpen(true)}
                        className="flex-1 h-11 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Ask someone to pay for this piece with your Try-On look and caption 'Do you want me to look like this...'"
                      >
                        <Gift className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                        <span>Pay For Me</span>
                      </button>

                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('success');
                            onAddToCart(product, selectedSize);
                            onClose();
                            toast.success('Added piece to cart!');
                          }}
                          className="flex-[1.5] h-11 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-zinc-100 transition-colors shadow-lg cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Take It • GH₵{product.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="w-full max-w-md p-6 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                        Try-On Service Notice
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                        {errorMessage}
                      </p>
                    </div>

                    <div className="text-[11px] text-zinc-500 text-left bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">Quick Tips:</p>
                      <p>• The free public Gradio space is accessed by thousands of users worldwide.</p>
                      <p>• A retry often succeeds on the next GPU slot.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateTryOn}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-md hover:bg-black transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Try-On</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                      <Shirt className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Ready for Virtual Fitting
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Select a model silhouette on the left or upload your photo, then hit "Generate AI Try-On"
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Powered by IDM-VTON diffusion</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {isPayForMeOpen && (
        <PayForMeShareModal
          items={[{
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            shippingFee: product.shippingFee || 0,
            image: resultImage || (product.images && product.images.length > 0 ? product.images[0] : product.image),
            images: resultImage ? [resultImage] : product.images,
            tryOnImage: resultImage || undefined,
            quantity: 1,
            selectedSize: selectedSize || 'Standard',
            selectedColorVariant: selectedColor || undefined,
            category: product.category
          }]}
          total={product.price + (product.shippingFee || 0)}
          tryOnImage={resultImage || undefined}
          initialMessage="Do you want me to look like this..."
          isFromTryOn={true}
          onClose={() => setIsPayForMeOpen(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default TryOnModal;
