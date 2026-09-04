
import React, { useState, useEffect } from 'react';
import { Timer, Zap, ShoppingBag } from 'lucide-react';

interface LimitedTimeOfferBannerProps {
  endTime: number;
  onReset: () => void;
  onAction: () => void;
}

const LimitedTimeOfferBanner: React.FC<LimitedTimeOfferBannerProps> = ({ endTime, onReset, onAction }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      if (seconds <= 0) {
        onReset();
        return;
      }
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setTimeLeft(`${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onReset]);

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 py-3 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 relative overflow-hidden group">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_70%)] animate-pulse"></div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 animate-bounce">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.3em]">Limited Time Offer</h3>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10">
          <Timer className="w-4 h-4 text-white/70" />
          <span className="text-xl sm:text-2xl font-mono font-black text-white tabular-nums drop-shadow-lg">
            {timeLeft}
          </span>
        </div>
        
        <button 
          onClick={onAction}
          className="group/btn flex items-center gap-3 bg-white text-orange-600 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl active:scale-95"
        >
          <ShoppingBag className="w-4 h-4 group-hover/btn:animate-bounce" />
          Get Offer
        </button>
      </div>

      {/* Decorative Scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-white/30 top-0 animate-[scan_4s_linear_infinite]"></div>
      </div>
    </div>
  );
};

export default LimitedTimeOfferBanner;
