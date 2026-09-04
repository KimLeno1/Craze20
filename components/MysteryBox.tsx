import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';

interface MysteryBoxProps {
  onReveal: (reward: any) => void;
  cost: number;
}

const MysteryBox: React.FC<MysteryBoxProps> = ({ onReveal, cost }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<string | null>(null);

  const handleOpen = async () => {
    if (isOpening) return;
    setIsOpening(true);
    
    // Simulate decryption delay
    setTimeout(async () => {
      const rewards = [
        "15% Off Your Entire Cart",
        "500 Bonus Kraze Coins",
        "Free Express Shipping",
        "Exclusive 'VIP' Badge Unlocked",
        "Early Access to Drop #42"
      ];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      
      const userId = localStorage.getItem('cc-user-id');
      if (userId) {
        try {
          await databaseService.logMysteryBoxOpening({ userId, boxType: 'CYBER_VAULT', reward: win });
        } catch (error) {
          console.error('Error logging mystery box opening:', error);
        }
      }
      
      setReward(win);
      setIsOpening(false);
      onReveal(win);
    }, 2500);
  };

  return (
    <div className="max-w-md mx-auto relative group">
      {/* Decorative Border Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative p-10 rounded-[28px] bg-zinc-950 border border-white/10 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Tech Readouts Decoration */}
        <div className="absolute top-4 left-6 text-[8px] font-mono text-zinc-700 uppercase tracking-widest">Vault_Access_01</div>
        <div className="absolute top-4 right-6 flex gap-1">
          <div className={`w-1 h-1 rounded-full bg-pink-500 ${isOpening ? 'animate-ping' : ''}`}></div>
          <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
          <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
        </div>

        {!reward ? (
          <>
            <div className={`relative mb-8 transition-all duration-500 ${isOpening ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>
              <div className="text-8xl filter drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                {isOpening ? '⚡' : '🔒'}
              </div>
              {isOpening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-serif italic text-white mb-3">Cyber Vault</h2>
            <p className="text-zinc-500 text-xs font-medium mb-8 max-w-[240px] leading-relaxed uppercase tracking-tighter">
              Authorized personnel only. <br/>Rare loot & legendary status inside.
            </p>
            
            <button
              disabled={isOpening}
              onClick={handleOpen}
              className="group relative h-14 w-full bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:bg-green-500 hover:text-white active:bg-green-700 disabled:opacity-50 overflow-hidden shadow-2xl"
            >
              <span className="relative z-10">{isOpening ? 'Decrypting...' : `Unlock [${cost} GEMS]`}</span>
              <div className="absolute inset-0 bg-zinc-900 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
            </button>
          </>
        ) : (
          <div className="animate-in zoom-in-95 duration-700 flex flex-col items-center">
            <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center text-4xl mb-6 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
              ✨
            </div>
            <div className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Vault Result</div>
            <h2 className="text-4xl font-serif text-white mb-6 italic leading-tight px-4">
              {reward}
            </h2>
            <div className="h-px w-24 bg-zinc-800 mb-6"></div>
            <button
              onClick={() => setReward(null)}
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <span>Relock Vault</span>
              <span className="text-lg">↺</span>
            </button>
          </div>
        )}

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
      </div>
    </div>
  );
};

export default MysteryBox;