import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Zap, Sparkles, TrendingUp, ShieldCheck, Trophy, BadgeCheck, Share2, Star, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CartItem } from '../types';

interface PurchaseCelebrationProps {
  onDismiss: () => void;
  orderTotal: number;
  deliveryCity: string;
  items?: CartItem[];
}

interface ConfettiParticle {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'circle' | 'square' | 'triangle';
  delay: number;
  duration: number;
  pulseSpeed: number;
}

export const PurchaseCelebration: React.FC<PurchaseCelebrationProps> = ({
  onDismiss,
  orderTotal,
  deliveryCity,
  items = [],
}) => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [badgeStep, setBadgeStep] = useState<number>(0);
  const [badgeClaimed, setBadgeClaimed] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');

  // Sound effects emulation or visual pinging
  useEffect(() => {
    // Generate high-intensity particles
    const generated: ConfettiParticle[] = [];
    
    // Left burst, Right burst, and Center burst
    // Left burst: launching from bottom-left (5–15vw, 100vh) to top-center-right
    // Right burst: launching from bottom-right (85–95vw, 100vh) to top-center-left
    // Center burst: spraying everywhere from center-bottom
    
    const colors = [
      '#00D1FF', // Cyan
      '#EC4899', // Cyber Pink
      '#10B981', // Emerald
      '#F59E0B', // Neon Amber
      '#8B5CF6', // Neon Purple
      '#FFFFFF', // Digital White
      '#FFE600', // Laser Yellow
    ];

    for (let i = 0; i < 120; i++) {
      let startX = 50; 
      let startY = 100;
      let midX = 50;
      let midY = 30;
      let endX = 50;
      let endY = 110;

      const sideRandom = Math.random();
      if (sideRandom < 0.35) {
        // Left shooter
        startX = Math.random() * 10;
        midX = startX + 25 + Math.random() * 30;
        midY = 10 + Math.random() * 30;
        endX = midX + 10 + Math.random() * 15;
      } else if (sideRandom < 0.7) {
        // Right shooter
        startX = 90 + Math.random() * 10;
        midX = startX - 25 - Math.random() * 30;
        midY = 10 + Math.random() * 30;
        endX = midX - 10 - Math.random() * 15;
      } else {
        // Center splash
        startX = 40 + Math.random() * 20;
        midX = startX + (Math.random() - 0.5) * 40;
        midY = 5 + Math.random() * 25;
        endX = midX + (Math.random() - 0.5) * 20;
      }

      const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
      generated.push({
        id: i,
        startX,
        startY,
        midX,
        midY,
        endX,
        endY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 720 - 360,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 0.4,
        duration: Math.random() * 2.2 + 1.8,
        pulseSpeed: Math.random() * 1.5 + 0.5,
      });
    }

    setParticles(generated);

    // Trigger high-quality canvas-confetti explosions!
    let confettiTimeout: NodeJS.Timeout | undefined;
    try {
      // Initial big splash
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00D1FF', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF', '#FFE600']
      });

      // Side cannons starting slightly after
      const end = Date.now() + 2500; // 2.5 seconds
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: ['#00D1FF', '#EC4899', '#8B5CF6']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: ['#00D1FF', '#EC4899', '#8B5CF6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      confettiTimeout = setTimeout(frame, 350);
    } catch (e) {
      console.error('Confetti error:', e);
    }

    // Staggered presentation of the achievement badge
    const timer1 = setTimeout(() => setBadgeStep(1), 600);
    const timer2 = setTimeout(() => setBadgeStep(2), 1400);
    const timer3 = setTimeout(() => setBadgeStep(3), 2200);

    return () => {
      if (confettiTimeout) clearTimeout(confettiTimeout);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleClaim = () => {
    setBadgeClaimed(true);
    toast.success('Social Proof synchronization complete: +502 REP added to profile.', {
      icon: '⚡',
      duration: 3500,
    });
    setTimeout(() => {
      onDismiss();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden p-4 sm:p-6 select-none font-sans">
      
      {/* Laser grids & Cyber ambiance backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#0F52BA] to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0F52BA]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#C5A880]/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Physics Confetti Simulation with framer-motion */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              left: `${p.startX}vw`, 
              top: `${p.startY}vh`, 
              rotate: 0, 
              opacity: 1,
              scale: 0.5
            }}
            animate={{
              left: [`${p.startX}vw`, `${p.midX}vw`, `${p.endX}vw`],
              top: [`${p.startY}vh`, `${p.midY}vh`, `${p.endY}vh`],
              rotate: [0, p.rotation, p.rotation * 2],
              scale: [0.5, 1, 0.7],
              opacity: [1, 1, 0.9, 0],
            }}
            transition={{
              duration: p.duration,
              ease: [0.1, 0.8, 0.25, 1], // Launch fast, float & drift, descend smoothly
              delay: p.delay,
            }}
            style={{
              position: 'absolute',
              width: `${p.size}px`,
              height: p.shape === 'triangle' ? '0' : `${p.size}px`,
              backgroundColor: p.shape === 'triangle' ? 'transparent' : p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
              boxShadow: `0 0 10px ${p.color}80`,
            }}
          />
        ))}
      </div>

      {/* Main Celebration and Cloud Social Proof Card */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="relative max-w-lg w-full bg-[#0B132B]/95 border border-[#C5A880]/40 rounded-[2.5rem] p-6 sm:p-10 text-center shadow-[0_0_80px_rgba(15,82,186,0.2)] overflow-hidden z-20"
        >
          {/* Glowing corner borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A880]/80 rounded-tl-[2.4rem]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C5A880]/80 rounded-tr-[2.4rem]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C5A880]/80 rounded-bl-[2.4rem]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A880]/80 rounded-br-[2.4rem]"></div>

          {/* Holographic background diagonal stripes */}
          <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_12px)] pointer-events-none" />

          {/* Success Top Flag */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#0F52BA]/20 border border-[#0F52BA]/40 px-4 py-1.5 rounded-full text-[9px] font-mono font-black text-blue-400 uppercase tracking-[0.3em] mb-6 sm:mb-8"
          >
            <span className="w-1.5 h-1.5 bg-[#0F52BA] rounded-full animate-ping"></span>
            AUTHENTIC_ACQUISITION_VERIFIED
          </motion.div>

          <h1 className="text-4xl sm:text-6xl font-serif italic text-white mb-2 tracking-tighter leading-none uppercase">Order Placed!</h1>
          <p className="text-zinc-400 text-[9px] font-mono font-bold uppercase tracking-[0.4em] mb-8">
            DISPATCHING SECURELY TO {deliveryCity.toUpperCase()} • TOTAL: GH₵{orderTotal.toLocaleString()}
          </p>

          {/* Achievement Trophy Badge Showcase */}
          <div className="relative py-6 sm:py-8 my-2 flex justify-center">
            
            {/* Outer rotating/pulsing halo rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              className="absolute w-32 h-32 sm:w-40 sm:h-40 border border-dashed border-[#C5A880]/30 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="absolute w-28 h-28 sm:w-36 sm:h-36 border border-dashed border-[#0F52BA]/30 rounded-full"
            />
            <div className="absolute w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-tr from-[#0F52BA]/15 to-[#C5A880]/15 rounded-full blur-2xl animate-pulse" />

            {/* Glowing Badge Container */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-b from-[#1E293B] to-[#0B132B] border-2 border-[#C5A880] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(197,168,128,0.3)] z-10 overflow-hidden group"
            >
              {/* Internal shine sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="absolute top-1 right-2 text-[#C5A880]/60 text-[7px] font-mono font-black">CK-VIP</div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  >
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-[#C5A880] drop-shadow-[0_0_15px_rgba(197,168,128,0.5)]" />
                  </motion.div>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#C5A880] animate-bounce" />
                </div>
                <div className="text-[7.5px] font-mono font-black mt-2 text-[#C5A880] tracking-[0.2em]">PATRON STATUS</div>
              </div>
            </motion.div>
          </div>

          {/* Details & Social Proof Text Block */}
          <div className="space-y-4 max-w-sm mx-auto mb-8 sm:mb-10 text-center">
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: badgeStep >= 1 ? 1 : 0 }}
              className="text-lg sm:text-xl font-serif italic font-extrabold text-[#C5A880] uppercase tracking-wide flex items-center justify-center gap-1.5"
            >
              <Award size={18} className="text-[#C5A880]" />
              VERIFIED CONNOISSEUR
            </motion.h3>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: badgeStep >= 1 ? 1 : 0 }}
              className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed font-semibold"
            >
              By fueling decentralized commerce, you have contributed essential social proof vector points to the central grid registry. Your active status has escalated.
            </motion.p>
          </div>

          {/* Social Proof Metric counters */}
          <div className="grid grid-cols-3 gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-8 sm:mb-10 text-left font-mono">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: badgeStep >= 1 ? 1 : 0, scale: badgeStep >= 1 ? 1 : 0.8 }}
              className="text-center border-r border-white/5"
            >
              <div className="text-[#C5A880] text-lg sm:text-xl font-black">+250</div>
              <div className="text-zinc-400 text-[7.5px] font-black uppercase tracking-wider">Patron Points</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: badgeStep >= 2 ? 1 : 0, scale: badgeStep >= 2 ? 1 : 0.8 }}
              className="text-center border-r border-white/5"
            >
              <div className="text-[#0F52BA] text-lg sm:text-xl font-black">+200</div>
              <div className="text-zinc-400 text-[7.5px] font-black uppercase tracking-wider">Style Credit</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: badgeStep >= 3 ? 1 : 0, scale: badgeStep >= 3 ? 1 : 0.8 }}
              className="text-center"
            >
              <div className="text-emerald-400 text-lg sm:text-xl font-black">Verified</div>
              <div className="text-zinc-400 text-[7.5px] font-black uppercase tracking-wider">Authenticity</div>
            </motion.div>
          </div>

          {/* KFAM REFERRAL PROMPT CARD */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/60 border border-[#0F52BA]/30 rounded-2xl p-5 mb-8 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A880]">Kraze Family Referral Privilege</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-black">EARN GH₵20</span>
            </div>
            <p className="text-xs text-zinc-300 font-medium mb-3">
              Share Closet Kraze with friends. They receive <strong className="text-white">GH₵20 OFF</strong> their premier order, and you earn <strong className="text-emerald-400">GH₵20 Store Credit</strong> upon delivery!
            </p>
            <button
              onClick={() => {
                const userCode = localStorage.getItem('cc-referral-code') || 'CK-MEMBER';
                const link = `https://closetkraze.top/?ref=${userCode}`;
                const text = `Hey! Just acquired an exclusive piece from Closet Kraze! Use my code ${userCode} for GH₵20 off your first purchase: ${link}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Share2 size={16} /> Forward Privilege on WhatsApp
            </button>
          </div>

          {/* Action Button Section with Claim animations */}
          <div className="relative flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleClaim}
              disabled={badgeClaimed}
              className={`relative overflow-hidden w-full py-5 rounded-2xl font-mono font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs text-white bg-[#0F52BA] hover:bg-[#0B132B] transition-all duration-300 shadow-[0_0_30px_rgba(15,82,186,0.3)] active:shadow-none pointer-events-auto cursor-pointer ${badgeClaimed ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <AnimatePresence mode="wait">
                {badgeClaimed ? (
                  <motion.span 
                    key="syncing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center items-center gap-2"
                  >
                    <Zap size={14} className="animate-spin text-white" />
                    REGISTERING ORDER...
                  </motion.span>
                ) : (
                  <motion.span 
                    key="claim"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center items-center gap-2 font-black"
                  >
                    CONFIRM & RETURN TO STORE
                    <Sparkles size={14} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const hash = Math.random().toString(36).substring(2, 9);
                setGeneratedLink(`https://closetkraze.top/haul/ck-${hash}`);
                setShowShareModal(true);
              }}
              className="w-full py-4 rounded-2xl font-mono font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs text-[#C5A880] bg-white/[0.03] hover:bg-[#C5A880]/10 border border-[#C5A880]/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={13} />
              SHARE CURATED HAUL ({items.length} ITEMS)
            </motion.button>

            <div className="text-zinc-600 text-[7.5px] font-mono font-black uppercase tracking-[0.2em] mt-1">
              Synchronizing node state directly with Neo Tokyo database ledger
            </div>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Share Curated Haul Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#090d1a] border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Close Icon button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full cursor-pointer text-xs font-bold"
              >
                ✕
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-ping" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C5A880] font-mono">PRIVATE HAUL CURATION</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif italic text-white tracking-tight leading-none uppercase">
                  SHARE YOUR <span className="text-[#C5A880] font-serif font-black">CURATION</span>
                </h2>
                <p className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest">
                  VERIFIED STYLING ARCHIVE
                </p>
              </div>

              {/* Items Haul Mini List representation */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3 max-h-36 overflow-y-auto scrollbar-none">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1.5">
                  Acquired Silhouettes ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-8 rounded bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[9px] font-black text-white truncate">{item.name}</p>
                          <p className="text-[7.5px] text-zinc-500 font-mono">QTY: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-[#C5A880] font-black shrink-0">GH₵{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copyable share link */}
              <div className="space-y-2">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">Your Private Haul Link</span>
                <div className="flex gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl items-center">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-transparent px-2 text-[9px] font-mono text-zinc-300 outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      setCopiedLink(true);
                      toast.success('Curated Haul link copied to clipboard!');
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-[#0F52BA]/20 hover:bg-[#0F52BA]/30 text-blue-400 border border-[#0F52BA]/40 rounded-lg text-[8px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>{copiedLink ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* Social Channels share */}
              <div className="space-y-2">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">Share Via</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const tweet = `Just acquired exceptional pieces at Closet Kraze! 💎 Total: GH₵${orderTotal.toLocaleString()}. View my curation here: ${generatedLink} @ClosetKraze`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
                    }}
                    className="py-2.5 bg-[#1D9BF0]/10 hover:bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/20 hover:border-[#1D9BF0]/40 rounded-xl text-[8px] font-black uppercase tracking-widest text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                  >
                    𝕏 Share on X
                  </button>

                  <button
                    onClick={() => {
                      const msg = `Check out my Closet Kraze selection of ${items.length} items! Total value GH₵${orderTotal.toLocaleString()}. View here: ${generatedLink}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-[8px] font-black uppercase tracking-widest text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>

              {/* Code Generator / Friend Import */}
              <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-center space-y-1">
                <p className="text-[8px] font-black text-white uppercase tracking-wider font-mono">VIP Reference Code</p>
                <p className="text-[7.5px] text-zinc-500 leading-normal font-mono">
                  Friends can enter Haul ID <span className="font-mono text-[#C5A880] font-black select-all">CK-{Math.floor(100000 + Math.random() * 900000)}</span> in their dashboard to view this curation.
                </p>
              </div>

              {/* Done button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 bg-white/10 hover:bg-[#EC4899] hover:text-white text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center font-mono border border-white/10 hover:border-[#EC4899]/50"
              >
                Close share protocol
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
