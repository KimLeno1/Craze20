
import React, { useState, useEffect } from 'react';
import { Product, PriceAnomaly, ViewState } from '../types';
import { databaseService } from '../services/databaseService';

interface PriceAnomaliesProps {
  onAddToCart: (anomaly: PriceAnomaly) => void;
  onNavigate: (view: ViewState) => void;
  session?: { endTime: number } | null;
}

const PriceAnomalies: React.FC<PriceAnomaliesProps> = ({ onAddToCart, onNavigate, session: propSession }) => {
  const [anomalies, setAnomalies] = useState<PriceAnomaly[]>([]);
  const [session, setSession] = useState<{ endTime: number } | null>(propSession || null);

  useEffect(() => {
    if (propSession) {
      setSession(propSession);
    }
  }, [propSession]);

  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem('cc-user-id');
      if (userId) {
        const userAnomalies = await databaseService.getPriceAnomalies(userId);
        setAnomalies(userAnomalies);
        
        if (!propSession) {
          const userSession = await databaseService.getUserAnomalySession(userId);
          setSession(userSession);
        }
      } else {
        // Fallback or show nothing if not logged in
        setAnomalies([]);
      }

      const timer = setInterval(() => {
        setAnomalies(prev => [...prev]); // Force re-render for timer
      }, 1000);
      return () => clearInterval(timer);
    };
    init();
  }, []);

  const formatTime = (endTime: number) => {
    const seconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWindowActive = session && Date.now() < session.endTime;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-40 animate-in fade-in duration-1000">
      <header className="py-8 md:py-24 px-4 sm:px-6 md:px-20 border-b border-white/5 bg-gradient-to-b from-[#00D1FF]/10 to-transparent">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="px-2 md:px-3 py-1 bg-[#00D1FF] text-[7px] md:text-[8px] font-black text-white uppercase tracking-[0.3em] md:tracking-[0.5em] animate-pulse">
              {isWindowActive ? 'Reduction_Active' : 'Window_Closed'}
            </div>
            <div className="h-px w-8 md:w-20 bg-[#00D1FF]/20"></div>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-serif italic tracking-tighter leading-none">
            Global <span className="text-[#00D1FF] not-italic font-sans">Reductions</span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-black max-w-md leading-relaxed">
              High-velocity reductions active in the archive. These assets are de-materializing rapidly. Secure them before the window collapses.
            </p>
            {session && (
              <div className="bg-zinc-900/50 border border-[#00D1FF]/20 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center min-w-[140px] md:min-w-[200px] w-fit">
                <span className="text-[7px] md:text-[8px] font-black text-[#00D1FF] uppercase tracking-widest mb-1 md:mb-2">Reduction Window Collapse</span>
                <span className="text-2xl md:text-4xl font-mono font-black text-white">{formatTime(session.endTime)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-20 py-12 md:py-20">
        {!isWindowActive ? (
          <div className="text-center py-24 md:py-40 space-y-8">
            <div className="text-7xl md:text-9xl grayscale opacity-20">⌛</div>
            <h2 className="text-3xl md:text-4xl font-serif italic text-white/40">The window has collapsed.</h2>
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em]">Return tomorrow for a new reduction window.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {anomalies.map(anomaly => {
              const isVoided = !isWindowActive; // Global window controls all
              return (
                <div 
                  key={anomaly.id}
                  className={`group relative bg-zinc-950 border rounded-[2.5rem] md:rounded-[3rem] overflow-hidden transition-all duration-500 ${
                    isVoided ? 'border-white/5 opacity-50' : 'border-[#00D1FF]/20 hover:border-[#00D1FF]/50 shadow-2xl'
                  }`}
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={anomaly.image} 
                      className={`w-full h-full object-cover transition-transform duration-1000 ${!isVoided && 'group-hover:scale-110'}`}
                      alt={anomaly.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    
                    {!isVoided && (
                      <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#00D1FF] text-white text-[8px] md:text-[9px] font-black px-3 md:px-4 py-1.5 md:py-2 rounded-full uppercase tracking-widest animate-pulse">
                        -{anomaly.discountPercent}%
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                    <div className="space-y-2">
                      <div className="text-[8px] md:text-[9px] font-black text-[#00D1FF] uppercase tracking-widest">Reduction_ID: {anomaly.id}</div>
                      <h3 className="text-2xl md:text-3xl font-serif italic text-white">{anomaly.name}</h3>
                    </div>

                    <div className="flex justify-between items-end border-b border-white/5 pb-6">
                      <div className="space-y-1">
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest">Base_Cost</div>
                        <div className="text-lg md:text-xl font-mono text-zinc-700 line-through">GH₵{anomaly.originalPrice}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-[8px] text-[#00D1FF] uppercase tracking-widest">Reduction_Price</div>
                        <div className="text-3xl md:text-4xl font-mono text-white">GH₵{anomaly.price}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => onAddToCart(anomaly)}
                      disabled={isVoided}
                      className={`w-full py-5 md:py-6 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                        isVoided 
                        ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-[#00D1FF] hover:text-white active:scale-95'
                      }`}
                    >
                      {isVoided ? 'REDUCTION_VOIDED' : 'Secure_Asset'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAnomalies;
