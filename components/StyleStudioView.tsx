import React, { useState, useEffect } from 'react';
import { Product, UserStats, RankBenefits, ViewState } from '../types';
import OutfitBuilder from './OutfitBuilder';
import TryOn from './TryOn';
import { getStylingAdvice, generateDreamOutfit } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Shirt, ChevronLeft, Bot, Cpu, Camera, 
  Layers, RefreshCw, Zap, Check, ArrowRight, ShieldCheck,
  Flame, Sliders, Image as ImageIcon, Star, Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

export interface StyleStudioViewProps {
  initialPanel?: 'hub' | 'assembler' | 'tryon' | 'oracle';
  products: Product[];
  stats: UserStats;
  rank: RankBenefits;
  onNavigate: (view: ViewState) => void;
  onLockLook?: (items: Product[]) => Promise<void> | void;
  onUpdateStats?: (stats: UserStats) => void;
  wishlistProducts?: Product[];
  haulProducts?: Product[];
  onTryOnUsed?: () => void;
  onProductClick?: (product: Product) => void;
}

export const StyleStudioView: React.FC<StyleStudioViewProps> = ({
  initialPanel = 'hub',
  products = [],
  stats,
  rank,
  onNavigate,
  onLockLook = () => {},
  onUpdateStats,
  wishlistProducts = [],
  haulProducts = [],
  onTryOnUsed = () => {},
  onProductClick
}) => {
  const [currentPanel, setCurrentPanel] = useState<'hub' | 'assembler' | 'tryon' | 'oracle'>(initialPanel);

  // Stylist AI Oracle State
  const [mood, setMood] = useState('');
  const [occasion, setOccasion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceLoadingText, setAdviceLoadingText] = useState('Consulting...');

  // Blueprint / Custom Synthesis State
  const [dreamDescription, setDreamDescription] = useState('');
  const [dreamImage, setDreamImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageLoadingText, setImageLoadingText] = useState('Synthesizing...');
  const [isHighFi, setIsHighFi] = useState(false);
  const [activeOracleTab, setActiveOracleTab] = useState<'oracle' | 'tryon_gen' | 'blueprint'>('oracle');
  const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null);

  const usageCount = stats?.stylistAiUses || 0;
  const usageLimit = rank?.stylistAiLimit || 6;
  const canUseAI = usageCount < usageLimit;

  useEffect(() => {
    let interval: any;
    if (isLoadingAdvice) {
      const texts = ['SYNCING_CORE', 'INDEXING_VIBE', 'ARCHIVING_VERDICT'];
      let i = 0;
      interval = setInterval(() => setAdviceLoadingText(texts[i++ % texts.length]), 600);
    }
    return () => clearInterval(interval);
  }, [isLoadingAdvice]);

  useEffect(() => {
    let interval: any;
    if (isGeneratingImage) {
      const texts = ['SYNTHESIZING...', 'BLUEPRINTING', 'MESH_WEAVING', 'MATERIALIZING'];
      let i = 0;
      interval = setInterval(() => setImageLoadingText(texts[i++ % texts.length]), 700);
    }
    return () => clearInterval(interval);
  }, [isGeneratingImage]);

  const recordUsage = () => {
    if (stats && onUpdateStats) {
      onUpdateStats({ ...stats, stylistAiUses: usageCount + 1 });
    }
  };

  const handleConsult = async () => {
    if (!mood || !occasion) return;
    setIsLoadingAdvice(true);
    try {
      const result = await getStylingAdvice(mood, occasion);
      setAdvice(result);
    } catch (error) {
      setAdvice("Local sensors jammed. Maintain baseline style protocol.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleGenerateDream = async () => {
    if (!canUseAI) {
      toast.error("Usage Limit Reached: Increase tier rank for more AI allocations.");
      return;
    }

    if (!dreamDescription && activeOracleTab === 'blueprint') return;
    if (!selectedProductForTryOn && activeOracleTab === 'tryon_gen') return;

    if (isHighFi && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGeneratingImage(true);
    setDreamImage(null);
    try {
      const inputDesc = activeOracleTab === 'blueprint' 
        ? dreamDescription 
        : `A virtual try-on featuring: ${selectedProductForTryOn?.name}. Describe the texture and drape visually. Include elements: ${selectedProductForTryOn?.description || ''}`;
      
      const imageUrl = await generateDreamOutfit(inputDesc, isHighFi);
      setDreamImage(imageUrl);
      recordUsage();
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found")) {
        (window as any).aistudio?.openSelectKey();
      } else {
        toast.error("Materialization Failed: " + error.message);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-sans selection:bg-[#0F52BA] selection:text-white pb-32">
      
      {/* STICKY TOP NAVIGATION BAR */}
      <div className="sticky top-0 z-40 bg-[#050B14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xl">
        <button
          onClick={() => {
            if (currentPanel !== 'hub') {
              setCurrentPanel('hub');
            } else {
              onNavigate(ViewState.LOBBY);
            }
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>{currentPanel !== 'hub' ? 'Studio Hub' : 'Exit Studio'}</span>
        </button>

        {/* SEGMENTED TAB SWITCHER */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setCurrentPanel('hub')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              currentPanel === 'hub' ? 'bg-[#0F52BA] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <button
            onClick={() => setCurrentPanel('assembler')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              currentPanel === 'assembler' ? 'bg-[#0F52BA] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Shirt size={13} />
            <span className="hidden sm:inline">Outfit Assembler</span>
          </button>

          <button
            onClick={() => setCurrentPanel('tryon')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              currentPanel === 'tryon' ? 'bg-[#0F52BA] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Virtual Try-On</span>
          </button>

          <button
            onClick={() => setCurrentPanel('oracle')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              currentPanel === 'oracle' ? 'bg-[#0F52BA] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Bot size={13} />
            <span className="hidden sm:inline">AI Oracle</span>
          </button>
        </div>

        {/* TIER ALLOCATION BADGE */}
        <div className="hidden md:flex items-center gap-3 bg-zinc-950/70 px-4 py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{rank.tier} Tier</span>
          <span className="text-zinc-600">|</span>
          <span className="text-blue-400">AI Try-Ons: {stats.aiTryOnsUsedToday || 0}/{rank.aiTryOnLimit}</span>
        </div>
      </div>

      {/* MAIN CONTENT CANVAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ==================== HUB VIEW ==================== */}
        {currentPanel === 'hub' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-12"
          >
            {/* HERO TITLE & BANNER */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" />
                <span>Unified Studio & AI Suite</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-serif italic text-white tracking-tighter leading-none">
                Neural Style <span className="text-[#0F52BA] not-italic font-sans font-black uppercase">Studio</span>
              </h1>
              
              <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
                Assemble high-fashion lookbooks, test AI virtual try-ons, and consult our Gemini Fashion Oracle — all in one integrated user experience.
              </p>
            </div>

            {/* QUICK STATS & ALLOCATION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span>Virtual Try-Ons</span>
                  <Sparkles size={14} className="text-blue-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {stats.aiTryOnsUsedToday || 0} / {rank.aiTryOnLimit}
                  <span className="text-xs font-normal text-zinc-500 ml-2">used today</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((stats.aiTryOnsUsedToday || 0) / rank.aiTryOnLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span>AI Oracle Consults</span>
                  <Bot size={14} className="text-indigo-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {usageCount} / {usageLimit}
                  <span className="text-xs font-normal text-zinc-500 ml-2">allocations</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (usageCount / usageLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span>Account Rank</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{rank.tier}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30 uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Tier unlocks daily try-on allowances</p>
              </div>
            </div>

            {/* THREE PRIMARY PORTAL CARDS (LIKE KFAM) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CARD 1: OUTFIT ASSEMBLER */}
              <div 
                onClick={() => setCurrentPanel('assembler')}
                className="group relative bg-zinc-950 border border-zinc-800 hover:border-blue-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_40px_rgba(15,82,186,0.25)] cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Shirt size={28} />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                      Fitting Room
                    </span>
                    <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                      Outfit Assembler
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Interactive canvas for pairing tops, bottoms, shoes & accessories. Save custom looks directly into your vault.
                    </p>
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between text-xs font-black uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors relative z-10 border-t border-zinc-900 mt-6">
                  <span>Launch Builder</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* CARD 2: VIRTUAL TRY-ON LAB */}
              <div 
                onClick={() => setCurrentPanel('tryon')}
                className="group relative bg-zinc-950 border border-zinc-800 hover:border-indigo-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                      AI Fitting
                    </span>
                    <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                      Virtual Try-On
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Test clothes virtually via live webcam or uploaded photo. High-fidelity fitting simulation with catalog items.
                    </p>
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between text-xs font-black uppercase tracking-wider text-white group-hover:text-indigo-400 transition-colors relative z-10 border-t border-zinc-900 mt-6">
                  <span>Start Fitting</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* CARD 3: AI FASHION ORACLE */}
              <div 
                onClick={() => setCurrentPanel('oracle')}
                className="group relative bg-zinc-950 border border-zinc-800 hover:border-purple-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Bot size={28} />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                      Gemini AI Oracle
                    </span>
                    <h3 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                      Fashion Verdict Oracle
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Input your atmosphere & mission for AI fashion consultation or generate custom high-resolution outfit blueprints.
                    </p>
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between text-xs font-black uppercase tracking-wider text-white group-hover:text-purple-400 transition-colors relative z-10 border-t border-zinc-900 mt-6">
                  <span>Consult AI Oracle</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* DAILY STYLE TIP & RECOMMENDATION BANNER */}
            <div className="bg-gradient-to-r from-blue-950/40 via-zinc-950 to-indigo-950/40 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Style Tip of the Day</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Contrast oversized silhouettes with tailored footwear for balanced street elegance. Use the Outfit Assembler to verify color matches before ordering!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentPanel('assembler')}
                className="px-5 py-3 rounded-2xl bg-white text-zinc-950 font-black text-xs uppercase tracking-wider hover:bg-blue-400 hover:text-white transition-all shrink-0 cursor-pointer shadow-lg"
              >
                Assemble Outfit Now
              </button>
            </div>

          </motion.div>
        )}

        {/* ==================== OUTFIT ASSEMBLER PANEL ==================== */}
        {currentPanel === 'assembler' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OutfitBuilder
              products={products}
              stats={stats}
              onNavigate={onNavigate}
              onLockLook={onLockLook}
            />
          </motion.div>
        )}

        {/* ==================== VIRTUAL TRY-ON PANEL ==================== */}
        {currentPanel === 'tryon' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TryOn
              rank={rank}
              stats={stats}
              onUsed={onTryOnUsed}
              wishlistProducts={wishlistProducts}
              haulProducts={haulProducts}
            />
          </motion.div>
        )}

        {/* ==================== AI FASHION ORACLE PANEL ==================== */}
        {currentPanel === 'oracle' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-4xl sm:text-6xl font-serif italic text-white tracking-tighter">
                Neural Style <span className="text-[#00D1FF] not-italic font-sans font-black uppercase">Oracle</span>
              </h2>
              <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest">
                Gemini-Powered Styling Advice & Generative Outfit Blueprint Studio
              </p>
            </div>

            {/* Oracle Sub-Tabs */}
            <div className="flex justify-center">
              <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setActiveOracleTab('oracle')}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    activeOracleTab === 'oracle' ? 'bg-[#00D1FF] text-black shadow-lg font-bold' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Fashion Advice Oracle
                </button>
                <button
                  onClick={() => setActiveOracleTab('tryon_gen')}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    activeOracleTab === 'tryon_gen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  AI Product Fitting
                </button>
                <button
                  onClick={() => setActiveOracleTab('blueprint')}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    activeOracleTab === 'blueprint' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Custom Blueprint
                </button>
              </div>
            </div>

            {/* ORACLE ADVICE SECTION */}
            {activeOracleTab === 'oracle' && (
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-10 rounded-3xl space-y-6">
                  <h3 className="text-2xl font-serif italic text-white">Consult Oracle</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Atmosphere / Vibe</label>
                      <input 
                        type="text" 
                        value={mood} 
                        onChange={(e) => setMood(e.target.value)}
                        placeholder="e.g. Minimalist Streetwear, Cyberpunk Luxury..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white focus:border-[#00D1FF] outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mission / Occasion</label>
                      <input 
                        type="text" 
                        value={occasion} 
                        onChange={(e) => setOccasion(e.target.value)}
                        placeholder="e.g. Accra High-Fashion Gala, Rooftop Lounge..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white focus:border-[#00D1FF] outline-none font-sans"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleConsult} 
                    disabled={isLoadingAdvice || !mood.trim() || !occasion.trim()}
                    className="w-full py-4 bg-[#00D1FF] hover:bg-blue-400 disabled:opacity-40 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg cursor-pointer"
                  >
                    {isLoadingAdvice ? adviceLoadingText : 'Initialize Styling Scan'}
                  </button>
                </div>

                <div className="min-h-[300px] flex items-center justify-center bg-zinc-950 border border-zinc-800 p-8 rounded-3xl">
                  {isLoadingAdvice ? (
                    <div className="flex flex-col items-center gap-4 text-[#00D1FF]">
                      <RefreshCw className="w-10 h-10 animate-spin" />
                      <span className="text-xs font-mono uppercase tracking-widest">{adviceLoadingText}</span>
                    </div>
                  ) : advice ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="text-amber-400 text-3xl font-serif">“</div>
                      <p className="text-lg sm:text-xl font-serif italic text-white leading-relaxed">
                        {advice}
                      </p>
                      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Oracle Verdict Generated</span>
                        <span>Gemini 2.5 Flash</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-zinc-600 space-y-2">
                      <Bot size={48} className="mx-auto opacity-30" />
                      <p className="text-xs font-bold uppercase tracking-widest">Awaiting Atmosphere & Mission Inputs</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCT FITTING / BLUEPRINT GENERATOR SECTION */}
            {(activeOracleTab === 'tryon_gen' || activeOracleTab === 'blueprint') && (
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-10 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif italic text-white">
                      {activeOracleTab === 'blueprint' ? 'Outfit Blueprint Synthesis' : 'AI Product Fit Generator'}
                    </h3>
                    
                    <button 
                      onClick={() => setIsHighFi(!isHighFi)} 
                      className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase transition-all ${
                        isHighFi ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isHighFi ? '✨ High-Fi Active' : 'Standard Res'}
                    </button>
                  </div>

                  {activeOracleTab === 'blueprint' ? (
                    <textarea 
                      value={dreamDescription} 
                      onChange={(e) => setDreamDescription(e.target.value)}
                      placeholder="Describe your dream outfit style, colors, drape, and cut..."
                      rows={5}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-white focus:border-purple-500 outline-none font-sans resize-none"
                    />
                  ) : (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Product From Vault</label>
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-white focus:border-indigo-500 outline-none font-sans"
                        value={selectedProductForTryOn?.id || ''}
                        onChange={(e) => {
                          const p = products.find(prod => prod.id === e.target.value);
                          setSelectedProductForTryOn(p || null);
                        }}
                      >
                        <option value="">-- Choose Item for Fitting Scan --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (GH₵{p.price})</option>
                        ))}
                      </select>

                      {selectedProductForTryOn && (
                        <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                          <img src={selectedProductForTryOn.image} alt="" className="w-14 h-14 object-cover rounded-xl" />
                          <div>
                            <h4 className="text-xs font-bold text-white">{selectedProductForTryOn.name}</h4>
                            <p className="text-[10px] text-zinc-400">GH₵{selectedProductForTryOn.price}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleGenerateDream} 
                    disabled={isGeneratingImage || (!dreamDescription && activeOracleTab === 'blueprint') || (!selectedProductForTryOn && activeOracleTab === 'tryon_gen') || !canUseAI}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg cursor-pointer"
                  >
                    {isGeneratingImage ? imageLoadingText : 'Authorize AI Synthesis'}
                  </button>
                </div>

                <div className="aspect-[3/4] bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden relative flex items-center justify-center">
                  {isGeneratingImage ? (
                    <div className="flex flex-col items-center gap-4 text-purple-400">
                      <RefreshCw className="w-12 h-12 animate-spin" />
                      <span className="text-xs font-mono uppercase tracking-widest">{imageLoadingText}</span>
                    </div>
                  ) : dreamImage ? (
                    <img src={dreamImage} alt="Synthesis Result" className="w-full h-full object-cover animate-in fade-in" />
                  ) : (
                    <div className="text-center text-zinc-600 space-y-2">
                      <Sparkles size={48} className="mx-auto opacity-30" />
                      <p className="text-xs font-bold uppercase tracking-widest">Synthesis Output Canvas Idle</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        )}

      </main>
    </div>
  );
};

export default StyleStudioView;
