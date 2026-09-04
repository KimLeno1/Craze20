
import React, { useState, useEffect } from 'react';
import { getStylingAdvice, generateDreamOutfit } from '../services/geminiService';
import { UserStats, RankBenefits, Product } from '../types';
import { toast } from 'sonner';

interface StylistAIProps {
  stats?: UserStats;
  rank?: RankBenefits;
  onUpdateStats?: (stats: UserStats) => void;
  products?: Product[];
  onProductClick?: (product: Product) => void;
}

const StylistAI: React.FC<StylistAIProps> = ({ stats, rank, onUpdateStats, products = [], onProductClick }) => {
  const [mood, setMood] = useState('');
  const [occasion, setOccasion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceLoadingText, setAdviceLoadingText] = useState('Consulting...');

  const [dreamDescription, setDreamDescription] = useState('');
  const [dreamImage, setDreamImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageLoadingText, setImageLoadingText] = useState('Synthesizing...');
  const [isHighFi, setIsHighFi] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'tryon'>('tryon');
  const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null);

  const usageCount = stats?.stylistAiUses || 0;
  const usageLimit = rank?.stylistAiLimit || 0;
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
      setAdvice("Local sensors jammed. Maintain baseline.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleGenerateDream = async () => {
    if (!canUseAI) {
      toast.error("Usage Limit Reached: Increase tier for more Synthesis allocations.");
      return;
    }

    if (!dreamDescription && activeTab === 'blueprint') return;
    if (!selectedProductForTryOn && activeTab === 'tryon') return;
    
    if (isHighFi && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGeneratingImage(true);
    setDreamImage(null);
    try {
      const inputDesc = activeTab === 'blueprint' 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 md:py-24 pb-40">
      <header className="text-center mb-16 md:mb-32">
        <h1 className="text-4xl sm:text-6xl lg:text-[8rem] font-serif italic mb-6 tracking-tighter leading-[0.9] animate-in slide-in-from-top-4 duration-1000">
          Neural Style <span className="text-[#00D1FF] not-italic font-sans font-black uppercase glow-text">Studio</span>
        </h1>
        <div className="flex items-center justify-center gap-4 opacity-40">
           <div className="h-px w-20 bg-[#00D1FF]"></div>
           <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.5em]">AI_TRY_ON_SYNTHESIS</p>
           <div className="h-px w-20 bg-[#00D1FF]"></div>
        </div>
      </header>

      <div className="space-y-32 md:space-y-64">
        {/* Section 1: Synthesis Lab (Try On / Blueprint) */}
        <section className="grid lg:grid-cols-2 gap-20 items-start">
          <div className="order-2 lg:order-1 space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-serif italic text-white tracking-tighter">Virtual <span className="text-[#00D1FF] not-italic">Fitting</span></h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest leading-loose">Access the internal image buffer. Materialize a verified silhouette from the local circuit, or generate purely from your imagination.</p>
              
              <div className="flex items-center gap-4 py-4 px-6 glass-light border border-white/10 rounded-2xl w-fit">
                <span className="text-2xl">🤖</span>
                <div>
                   <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.3em]">Tier Allocation: {usageCount} / {usageLimit} Used</div>
                   {!canUseAI && <div className="text-[8px] font-bold text-red-500 uppercase">Limit Reached. Upgrade Rank.</div>}
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-10 md:p-14 rounded-[4rem] border border-white/5 space-y-10">
              <div className="flex justify-between items-center px-1">
                <div className="flex bg-black p-1 rounded-2xl border border-white/10">
                   <button 
                     onClick={() => setActiveTab('tryon')} 
                     className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'tryon' ? 'bg-[#00D1FF] text-white' : 'text-zinc-500 hover:text-white'}`}
                   >
                     AI Try On
                   </button>
                   <button 
                     onClick={() => setActiveTab('blueprint')} 
                     className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'blueprint' ? 'bg-purple-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                   >
                     Custom Blueprint
                   </button>
                </div>
                <button onClick={() => setIsHighFi(!isHighFi)} className={`px-4 py-1.5 rounded-full border transition-all text-[8px] font-black uppercase ${isHighFi ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-zinc-900 border-white/5 text-zinc-700'}`}>
                  {isHighFi ? 'High-Fi Active' : 'Standard Res'}
                </button>
              </div>

              {activeTab === 'blueprint' ? (
                <textarea 
                  value={dreamDescription} onChange={(e) => setDreamDescription(e.target.value)}
                  placeholder="Describe textures, silhouettes, and aura..."
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-[2rem] px-8 py-6 text-white focus:border-purple-500 outline-none font-mono resize-none"
                />
              ) : (
                <div className="space-y-4">
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Select Product</div>
                   <div className="relative">
                      <select 
                        className="w-full bg-black border border-white/10 rounded-[2rem] px-8 py-6 text-white focus:border-[#00D1FF] outline-none font-mono appearance-none"
                        value={selectedProductForTryOn?.id || ''}
                        onChange={(e) => {
                          const p = products.find(p => p.id === e.target.value);
                          setSelectedProductForTryOn(p || null);
                        }}
                      >
                         <option value="">-- Choose Item For Scan --</option>
                         {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (GH₵{p.price})</option>
                         ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-8 text-zinc-500">
                        ▼
                      </div>
                   </div>
                   {selectedProductForTryOn && (
                     <div className="flex flex-col items-center gap-4 mt-6 p-6 glass-light rounded-3xl border border-[#00D1FF]/30">
                       <img src={selectedProductForTryOn.image} alt={selectedProductForTryOn.name} className="w-16 h-16 rounded-2xl object-cover" />
                       <div className="text-sm font-black text-white">{selectedProductForTryOn.name}</div>
                     </div>
                   )}
                </div>
              )}

              <button 
                onClick={handleGenerateDream} disabled={isGeneratingImage || (!dreamDescription && activeTab === 'blueprint') || (!selectedProductForTryOn && activeTab === 'tryon') || !canUseAI}
                className={`w-full py-8 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#00D1FF] hover:text-white transition-all shadow-2xl ${
                  !canUseAI ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGeneratingImage ? imageLoadingText : 'Authorize Materialization'}
              </button>
            </div>
          </div>

          <div className="order-1 lg:order-2 aspect-[3/4] bg-zinc-950 rounded-[4rem] border border-white/5 overflow-hidden relative group hover:shadow-[0_0_80px_-20px_rgba(0,209,255,0.3)] transition-all duration-1000">
            {isGeneratingImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-black z-10">
                <div className="text-6xl animate-pulse">🧱</div>
                <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[1em] animate-pulse">Synthesizing...</div>
              </div>
            ) : dreamImage ? (
              <img src={dreamImage} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Synthesis Result" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-5">
                <div className="text-[12rem]">🪄</div>
                <p className="text-[10px] font-black uppercase tracking-[1em]">Lab Idle</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Styling Verdict */}
        <section className="grid lg:grid-cols-2 gap-20 items-center border-t border-white/5 pt-32">
          <div className="space-y-12 bg-zinc-950/50 p-10 md:p-16 rounded-[4rem] border border-white/5 backdrop-blur-xl">
            <h2 className="text-3xl md:text-5xl font-serif italic text-white tracking-tighter mb-8">AI Fashion <span className="text-purple-500 not-italic">Oracle</span></h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Atmosphere</label>
                <input 
                  type="text" value={mood} onChange={(e) => setMood(e.target.value)}
                  placeholder="Lethal / Minimalist"
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Mission</label>
                <input 
                  type="text" value={occasion} onChange={(e) => setOccasion(e.target.value)}
                  placeholder="District 9 Gala"
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>
            </div>
            <button 
              onClick={handleConsult} disabled={isLoadingAdvice || !mood || !occasion}
              className="w-full py-7 bg-white text-black rounded-3xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-purple-500 hover:text-white transition-all shadow-2xl"
            >
              {isLoadingAdvice ? adviceLoadingText : 'Initialize Scan'}
            </button>
          </div>

          <div className="min-h-[300px] flex items-center justify-center">
            {isLoadingAdvice ? (
              <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            ) : advice ? (
              <div className="w-full p-12 bg-white/5 border border-white/10 rounded-[4rem] relative group overflow-hidden animate-in zoom-in-95 duration-700">
                <div className="absolute top-0 right-0 p-8 text-purple-500/5 text-[15rem] font-serif italic pointer-events-none select-none">"</div>
                <p className="text-2xl md:text-3xl font-serif italic text-white relative z-10 leading-relaxed">&ldquo;{advice}&rdquo;</p>
              </div>
            ) : (
              <div className="text-center opacity-10 group hover:opacity-30 transition-opacity">
                <div className="text-[10rem]">🧬</div>
                <p className="text-[10px] font-black uppercase tracking-[1em]">Awaiting Inputs</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StylistAI;
