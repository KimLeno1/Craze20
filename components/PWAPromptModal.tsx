import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  X, 
  Zap, 
  Bell, 
  ShieldCheck, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'sonner';

interface PWAPromptModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAPromptModal: React.FC<PWAPromptModalProps> = ({ forceOpen, onClose }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isOpen: hookIsOpen,
    install,
    dismiss,
    setIsOpen
  } = usePWAInstall();

  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const isOpen = forceOpen !== undefined ? forceOpen : hookIsOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      dismiss();
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        setJustInstalled(true);
        toast.success("Closet Kraze app installed successfully!");
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else if (outcome === 'manual') {
        if (isIOS) {
          toast.info("Follow the instructions below to add to your Home Screen.");
        } else {
          toast.info("Tap the browser menu (⋮) and select 'Install app' or 'Add to Home Screen'.");
        }
      }
    } catch (err) {
      console.error('Install error:', err);
      toast.error("Could not trigger automatic install. Please use browser menu.");
    } finally {
      setInstalling(false);
    }
  };

  // If already running in standalone mode and not forced open, do not render modal
  if (isInstalled && !forceOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-300">
          {/* Backdrop Click to Dismiss */}
          <div 
            className="absolute inset-0" 
            onClick={handleClose} 
            aria-label="Close download prompt"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8 z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-prompt-title"
          >
            {/* Top Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / App Identity */}
            <div className="flex items-start gap-4 mb-6">
              <div className="relative w-16 h-16 rounded-2xl bg-zinc-950 p-2.5 flex items-center justify-center shadow-lg border border-zinc-800 shrink-0">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Closet Kraze App Icon" 
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback to logo.svg if png is not loaded
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F52BA] rounded-full border-2 border-white flex items-center justify-center text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="space-y-1 pr-6">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0F52BA] text-[9px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Official Mobile App</span>
                </div>
                <h2 id="pwa-prompt-title" className="text-xl font-serif italic text-zinc-950 tracking-tight">
                  Download Closet Kraze
                </h2>
                <p className="text-xs text-zinc-600 font-medium">
                  Fastest way to browse, shop & get instant drop alerts.
                </p>
              </div>
            </div>

            {/* Success State */}
            {justInstalled ? (
              <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">App Installed!</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Closet Kraze is now added to your home screen for one-tap shopping.
                </p>
              </div>
            ) : (
              <>
                {/* Feature Highlights */}
                <div className="space-y-3 mb-6 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-100/80 text-[#0F52BA] flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Lightning-Fast Experience</p>
                      <p className="text-[11px] text-zinc-600 font-normal">Instant catalogue loading & smooth transitions.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Drop & Restock Alerts</p>
                      <p className="text-[11px] text-zinc-600 font-normal">Be first in line when exclusive pieces drop.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">1-Tap Home Screen Access</p>
                      <p className="text-[11px] text-zinc-600 font-normal">Works like a native app with zero store downloads.</p>
                    </div>
                  </div>
                </div>

                {/* iOS Instructions */}
                {isIOS && !isInstallable ? (
                  <div className="space-y-3 mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <p className="text-xs font-bold text-[#0F52BA] uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      How to install on iPhone & iPad:
                    </p>
                    <ol className="text-xs text-zinc-700 space-y-2 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[#0F52BA]">1.</span>
                        <span>
                          Tap the <strong className="text-zinc-900">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-1 align-text-bottom" /> in Safari's bottom toolbar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[#0F52BA]">2.</span>
                        <span>
                          Scroll down and tap <strong className="text-zinc-900">"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-zinc-800 mx-1 align-text-bottom" />.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[#0F52BA]">3.</span>
                        <span>
                          Tap <strong className="text-zinc-900">"Add"</strong> in the top right corner.
                        </span>
                      </li>
                    </ol>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="space-y-2.5">
                  {isInstallable ? (
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="w-full py-4 px-6 rounded-2xl bg-[#0F52BA] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{installing ? 'Installing...' : 'Install Closet Kraze App'}</span>
                    </button>
                  ) : isIOS ? (
                    <button
                      onClick={handleClose}
                      className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>Got It, I'll Add It</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleInstall}
                      className="w-full py-4 px-6 rounded-2xl bg-[#0F52BA] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download App</span>
                    </button>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    Continue in browser
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Size: &lt; 3 MB · No App Store required</span>
                  <span className="font-semibold text-zinc-600">Free Download</span>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PWAPromptModal;
