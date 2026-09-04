import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultEntranceProps {
  onComplete?: () => void;
}

const VaultEntrance: React.FC<VaultEntranceProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

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
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden bg-black" style={{ perspective: '1200px' }}>
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
              className="absolute inset-y-0 left-0 w-1/2 glass-sapphire-70 border-r border-[#0F52BA]/40 flex items-center justify-end pointer-events-auto z-10"
            >
              <div className="relative h-full w-full flex items-center justify-end">
                {/* Left Half of Vault Wheel */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-24 sm:h-32 z-20 pointer-events-none overflow-hidden">
                   <div className="absolute left-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-[#0F52BA]/50 bg-[#0F52BA]/30 backdrop-blur-md shadow-[0_0_30px_rgba(15,82,186,0.3)] flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.8, ease: "anticipate" }}
                        className="w-16 sm:w-24 h-16 sm:h-24 rounded-full border-2 border-dashed border-[#0F52BA]/50 flex items-center justify-center"
                      >
                         <div className="w-1 h-10 sm:h-16 bg-white/55 rounded-full"></div>
                      </motion.div>
                   </div>
                </div>
                 
                {/* Texture/Lines */}
                <div className="absolute inset-0 opacity-10">
                   <div className="h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
              </div>
            </motion.div>

            {/* Right Door */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: isOpen ? '100%' : 0 }}
              transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }}
              className="absolute inset-y-0 right-0 w-1/2 glass-sapphire-70 border-l border-[#0F52BA]/40 flex items-center justify-start pointer-events-auto z-10"
            >
              <div className="relative h-full w-full flex items-center justify-start">
                {/* Right Half of Vault Wheel */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-24 sm:h-32 z-20 pointer-events-none overflow-hidden">
                   <div className="absolute right-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-[#0F52BA]/50 bg-[#0F52BA]/30 backdrop-blur-md shadow-[0_0_30px_rgba(15,82,186,0.3)] flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.8, ease: "anticipate" }}
                        className="w-16 sm:w-24 h-16 sm:h-24 rounded-full border-2 border-dashed border-[#0F52BA]/50 flex items-center justify-center"
                      >
                         <div className="w-1 h-10 sm:h-16 bg-white/55 rounded-full"></div>
                      </motion.div>
                   </div>
                </div>

                {/* Texture/Lines */}
                <div className="absolute inset-0 opacity-10">
                   <div className="h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
              </div>
            </motion.div>

            {/* Center Glow Overlay */}
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: isOpen ? 0 : 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-30"
            >
               <div className="w-[2px] h-full bg-gradient-to-b from-transparent via-[#0F52BA] to-transparent blur-sm"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaultEntrance;
