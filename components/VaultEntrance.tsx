import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultEntranceProps {
  onComplete?: () => void;
}

const VaultEntrance: React.FC<VaultEntranceProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleFastForward = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setIsZooming(true), 300);
      setTimeout(() => {
        setIsRemoved(true);
        onComplete?.();
      }, 900);
    } else if (!isZooming) {
      setIsZooming(true);
      setTimeout(() => {
        setIsRemoved(true);
        onComplete?.();
      }, 600);
    }
  };

  useEffect(() => {
    // Initial delay before opening doors
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    // Trigger the 3D zoom through the closet after doors open
    const zoomTimer = setTimeout(() => {
      setIsZooming(true);
    }, 1800);

    // Time for animation to finish then remove from DOM
    const removeTimer = setTimeout(() => {
      setIsRemoved(true);
      onComplete?.();
    }, 3800);

    return () => {
      clearTimeout(timer);
      clearTimeout(zoomTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (isRemoved) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden bg-black cursor-pointer" 
      style={{ perspective: '1200px' }}
      onClick={handleFastForward}
    >
      <AnimatePresence>
        {!isRemoved && (
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ scale: 1, z: 0, opacity: 1 }}
            animate={{ 
              z: isZooming ? 1500 : 0, 
              opacity: isZooming ? 0 : 1 
            }}
            transition={{ 
              z: { duration: 1.8, ease: [0.6, 0.01, -0.05, 0.9] },
              opacity: { duration: 0.8, delay: 1.0, ease: "easeOut" }
            }}
          >
            {/* The Interior Behind Doors: Pure Black Background & Radiant White Light */}
            <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
               {/* Center White Light */}
               <div className="absolute flex flex-col items-center justify-center z-0" style={{ transform: 'translateZ(-1400px)' }}>
                 {/* Soft diffused ambient glow */}
                 <div className="w-[700px] h-[700px] bg-white/15 rounded-full blur-[140px] absolute"></div>
                 {/* Radiant aura */}
                 <div className="w-[420px] h-[420px] bg-white/40 rounded-full blur-[80px] absolute"></div>
                 {/* Core brilliant white light */}
                 <div className="w-56 h-56 bg-white rounded-full blur-[25px] absolute shadow-[0_0_120px_rgba(255,255,255,1)]"></div>
                 <div className="w-20 h-20 bg-white rounded-full blur-[8px] absolute"></div>
               </div>
            </div>

            {/* Left Door */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: isOpen ? '-100%' : 0 }}
              transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }}
              className="absolute inset-y-0 left-0 w-1/2 bg-[#060B18] border-r-2 border-[#0F52BA]/60 flex items-center justify-end pointer-events-auto z-10 select-none overflow-hidden"
            >
              <div className="relative h-full w-full flex items-center justify-end">
                {/* Left Half of Vault Wheel */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-24 sm:h-32 z-20 pointer-events-none overflow-hidden">
                   <div className="absolute left-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-[#0F52BA]/60 bg-[#0B132B] shadow-[0_0_35px_rgba(15,82,186,0.45)] flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.8, ease: "anticipate" }}
                        className="w-16 sm:w-24 h-16 sm:h-24 rounded-full border-2 border-dashed border-[#C5A880]/60 flex items-center justify-center"
                      >
                         <div className="w-1.5 h-10 sm:h-16 bg-gradient-to-b from-white to-[#C5A880] rounded-full shadow-[0_0_8px_rgba(197,168,128,0.8)]"></div>
                      </motion.div>
                   </div>
                </div>

                {/* "CLOSET" Typography on the Left Door */}
                <div className="absolute right-4 sm:right-8 md:right-12 lg:right-16 top-1/2 -translate-y-1/2 flex flex-col items-end text-right z-20 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-l from-[#C5A880] to-transparent"></span>
                    <span className="text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[#C5A880]">
                      THE
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif italic text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_30px_rgba(255,255,255,0.4)]">
                    CLOSET
                  </h1>
                  <span className="text-[8px] sm:text-[10px] md:text-xs font-sans uppercase tracking-[0.25em] text-blue-100/70 mt-3 font-semibold">
                    Original Fashion
                  </span>
                </div>
                 
                {/* Texture / Luxury Vault Lines */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                   <div className="h-full w-full bg-[radial-gradient(#0F52BA_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                </div>
                {/* Vertical Decorative Seam Line */}
                <div className="absolute right-14 sm:right-24 inset-y-0 w-[1px] bg-gradient-to-b from-transparent via-[#0F52BA]/30 to-transparent pointer-events-none"></div>
              </div>
            </motion.div>

            {/* Right Door */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: isOpen ? '100%' : 0 }}
              transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }}
              className="absolute inset-y-0 right-0 w-1/2 bg-[#060B18] border-l-2 border-[#0F52BA]/60 flex items-center justify-start pointer-events-auto z-10 select-none overflow-hidden"
            >
              <div className="relative h-full w-full flex items-center justify-start">
                {/* Right Half of Vault Wheel */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-24 sm:h-32 z-20 pointer-events-none overflow-hidden">
                   <div className="absolute right-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-[#0F52BA]/60 bg-[#0B132B] shadow-[0_0_35px_rgba(15,82,186,0.45)] flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.8, ease: "anticipate" }}
                        className="w-16 sm:w-24 h-16 sm:h-24 rounded-full border-2 border-dashed border-[#C5A880]/60 flex items-center justify-center"
                      >
                         <div className="w-1.5 h-10 sm:h-16 bg-gradient-to-b from-white to-[#C5A880] rounded-full shadow-[0_0_8px_rgba(197,168,128,0.8)]"></div>
                      </motion.div>
                   </div>
                </div>

                {/* "KRAZE" Typography on the Right Door */}
                <div className="absolute left-4 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 flex flex-col items-start text-left z-20 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[#C5A880]">
                      THE
                    </span>
                    <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-r from-[#C5A880] to-transparent"></span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-sans font-black text-[#60A5FA] tracking-tight uppercase leading-none drop-shadow-[0_0_35px_rgba(15,82,186,0.8)]">
                    KRAZE
                    <span className="inline-block w-2 sm:w-3 md:w-3.5 h-2 sm:h-3 md:h-3.5 rounded-full bg-[#C5A880] ml-1.5 sm:ml-2 align-middle shadow-[0_0_12px_#C5A880]"></span>
                  </h1>
                  <span className="text-[8px] sm:text-[10px] md:text-xs font-sans uppercase tracking-[0.25em] text-blue-100/70 mt-3 font-semibold">
                    New Arrivals
                  </span>
                </div>

                {/* Texture / Luxury Vault Lines */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                   <div className="h-full w-full bg-[radial-gradient(#0F52BA_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                </div>
                {/* Vertical Decorative Seam Line */}
                <div className="absolute left-14 sm:left-24 inset-y-0 w-[1px] bg-gradient-to-b from-transparent via-[#0F52BA]/30 to-transparent pointer-events-none"></div>
              </div>
            </motion.div>

            {/* Center Glow Overlay */}
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: isOpen ? 0 : 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
               <div className="w-[2px] h-full bg-gradient-to-b from-transparent via-[#0F52BA] to-transparent blur-sm"></div>
            </motion.div>

            {/* Tap to Enter / Skip Hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isOpen ? 0 : 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-[#0B132B] shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-ping"></span>
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/70">
                  Tap to Enter
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaultEntrance;
