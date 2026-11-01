import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewState } from '../types';
import { Volume2, VolumeX } from 'lucide-react';

interface TourStep {
  view: ViewState;
  title: string;
  description: string;
  selector?: string; // For visual cues if needed
}

const TOUR_STEPS: TourStep[] = [
  {
    view: ViewState.LOBBY,
    title: "Home Lobby",
    description: "Your main starting point. Discover new arrivals and featured drops as soon as they land."
  },
  {
    view: ViewState.SCROLL_MODE,
    title: "Scroll Mode",
    description: "Enjoy a smooth, full-screen shopping experience. Long-press the Home button to enter. Double-tap to add to wishlist, triple-tap to take it."
  },
  {
    view: ViewState.FAMOUS,
    title: "Flash Sale / QUICK SALES",
    description: "Explore our real-time flash sales and highly demanded aesthetic releases. Catch these exclusive price reductions before the anomaly terminates."
  },
  {
    view: ViewState.BUNDLES,
    title: "Style Bundles",
    description: "Get the complete look with pre-curated outfits. Buying bundles is faster and easier than picking single items."
  },
  {
    view: ViewState.TRY_ON,
    title: "Virtual Fitting",
    description: "Try on clothes virtually using your camera. See how pieces fit your style before you buy."
  },
  {
    view: ViewState.PAY_FOR_ME,
    title: "Pay For Me",
    description: "Found something you love but need a hand? Send a 'Pay For Me' link to a friend or family member."
  },
  {
    view: ViewState.SOCIAL,
    title: "KFam Hub",
    description: "Connect with our exclusive community. Transmit your daily looks, vote on elite grails, earn reputation multipliers, and level up your style rank."
  },
  {
    view: ViewState.PROFILE,
    title: "Your Account",
    description: "Check your rank, track your orders, and manage your fashion points here."
  }
];

interface TutorialProps {
  onComplete: () => void;
  onNavigate: (view: ViewState) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is the welcome screen
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a high-quality female voice
      const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
      const preferredVoice = voices.find(v => 
        v && v.name && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Female')) && 
        v.lang && v.lang.startsWith('en')
      ) || voices.find(v => v && v.lang && v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.pitch = 1.1; // Slightly higher for a chic, professional tone
      utterance.rate = 0.95; // Slightly slower for clarity
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable or blocked:", e);
    }
  }, [isMuted]);

  useEffect(() => {
    if (currentStep === -1) {
      speak("Welcome to Closet Kraze. Ready to upgrade your style? Let's take a quick look around your new fashion vault.");
    } else {
      const step = TOUR_STEPS[currentStep];
      speak(`${step.title}. ${step.description}`);
    }
  }, [currentStep, speak]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (typeof onNavigate === 'function' && TOUR_STEPS[next]?.view) {
        onNavigate(TOUR_STEPS[next].view);
      }
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    localStorage.setItem('cc-seen-tutorial', 'true');
    setIsExiting(true);
    if (typeof onComplete === 'function') {
      setTimeout(onComplete, 500);
    }
  };

  const currentData = currentStep >= 0 ? TOUR_STEPS[currentStep] : null;

  return (
    <div className={`fixed inset-0 z-[600] flex items-center justify-center p-6 transition-all duration-700 ${isExiting ? 'opacity-0 scale-110' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={handleClose} />
      
      {/* Sound Toggle */}
      <button 
        onClick={() => {
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          if (newMuted) window.speechSynthesis.cancel();
          else if (currentStep === -1) speak("Voice enabled.");
        }}
        className="fixed top-8 right-8 z-[700] w-12 h-12 glass-light border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        {isMuted ? <VolumeX size={20} className="text-zinc-500" /> : <Volume2 size={20} className="text-[#00D1FF]" />}
      </button>

      {/* Scanning effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-[#00D1FF] animate-[scan_8s_linear_infinite]" />
      </div>

      <div className="relative z-10 w-full max-w-xl animate-in zoom-in-95 duration-500">
        <div className="bg-[#0F52BA]/15 backdrop-blur-[40px] saturate-[200%] p-10 md:p-16 rounded-[4rem] border border-[#0F52BA]/40 shadow-[0_30px_60px_rgba(15,82,186,0.35),inset_0_1px_4px_rgba(255,255,255,0.4)] relative overflow-hidden group">
          {/* Welcome View */}
          {currentStep === -1 ? (
            <div className="space-y-10 text-center">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-[#00D1FF] to-blue-600 p-0.5 mx-auto animate-bounce">
                <div className="w-full h-full bg-black rounded-[2.4rem] flex items-center justify-center text-4xl">✨</div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-serif italic text-white tracking-tighter">Welcome to <span className="text-white not-italic font-sans font-black">CLOSET KRAZE</span></h1>
                <p className="text-blue-100/75 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed max-w-sm mx-auto">
                  Ready to upgrade your style? Let's take a quick look around your new fashion vault.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleNext()}
                  className="w-full py-6 bg-white text-zinc-950 rounded-3xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white/90 hover:scale-[1.02] transition-all shadow-2xl"
                >
                  Start the Tour
                </button>
                <button 
                  onClick={handleClose}
                  className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-[0.3em] transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          ) : (
            /* Step View */
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-[10px] font-black text-white/85 uppercase tracking-[0.4em]">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
                </div>
                <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">✕</button>
              </header>

              <div className="space-y-4">
                <h2 className="text-4xl font-serif italic text-white tracking-tighter">{currentData?.title}</h2>
                <div className="text-blue-100/80 text-sm font-medium leading-relaxed italic uppercase tracking-tighter">
                  {currentData?.description}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button 
                  onClick={handleNext}
                  className="flex-1 py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/90 hover:scale-[1.01] transition-all shadow-xl"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Start Shopping' : 'Continue'}
                </button>
              </div>

              {/* Step indicator dots */}
              <div className="flex justify-center gap-2">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`h-1 transition-all duration-500 rounded-full ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Technical UI elements */}
          <div className="absolute bottom-4 left-10 text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Tutorial_Guide</div>
          <div className="absolute top-4 right-10 text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Guide_Active</div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Tutorial;