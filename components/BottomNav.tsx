import React, { useState, useRef, useEffect } from 'react';
import { ViewState } from '../types';
import { Home, Package, MoreHorizontal, User, Shield, Bell, LayoutGrid, Wallet, Share2, Flame, Brain, Headphones, LogOut, LogIn, X, Users, Sparkles } from 'lucide-react';

interface BottomNavProps {
  onNotificationOpen: () => void;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenCategories: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout?: () => void;
  handle?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenCategories, 
  isAuthenticated,
  onLogin,
  onLogout,
  onNotificationOpen,
  handle = 'Guest User'
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);
  const hasLongPressedRef = useRef(false);

  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);
    hasLongPressedRef.current = false;
    
    holdTimerRef.current = setTimeout(() => {
      onNavigate(currentView === ViewState.SCROLL_MODE ? ViewState.LOBBY : ViewState.SCROLL_MODE);
      hasLongPressedRef.current = true;
      setIsHolding(false);
      setHoldProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }, 5000);

    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 5000) * 100, 100);
      setHoldProgress(progress);
    }, 50);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const PayForMeIcon = ({ size, strokeWidth, ...props }: any) => (
    <div className="relative" {...props}>
      <Wallet size={size} strokeWidth={strokeWidth} />
    </div>
  );

  const NavItem = ({ id, icon: Icon, label, action, isActive }: any) => (
    <button
      onClick={action}
      className={`flex flex-col items-center justify-end pb-2 gap-1 flex-1 transition-all duration-300 relative h-full ${
        isActive 
          ? 'text-[#C5A880] font-black' 
          : 'text-white/60 hover:text-white'
      }`}
    >
      {isActive && <div className="glow-dot" />}
      <div className={`transition-transform duration-300 mb-0.5 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(197,168,128,0.7)]' : 'hover:scale-105'}`}>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} fill={'none'} className="sm:w-6 sm:h-6" />
      </div>
      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none`}>
        {label}
      </span>
    </button>
  );

  const handleNavClick = (view: ViewState) => {
    setIsMoreOpen(false);
    // Add a small delay to allow the modal to close before heavy navigation
    setTimeout(() => {
      onNavigate(view);
    }, 10);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto overflow-x-hidden flex flex-col items-center justify-between p-6 animate-in fade-in duration-500 bg-[#060B18]/92 backdrop-blur-2xl text-white">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,#0F52BA_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#C5A880_0%,transparent_50%)] pointer-events-none z-0" />

          {/* Close Backdrop Button */}
          <button 
            className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 hover:border-[#C5A880]/50 transition-all hover:scale-105 active:scale-95 shadow-lg"
            onClick={() => setIsMoreOpen(false)}
          >
            <X size={20} className="text-white" />
          </button>

          {/* Header Container */}
          <header className="w-full max-w-md mt-6 relative z-10 animate-in slide-in-from-top-10 duration-500">
            <div className="bg-[#0B132B]/80 border border-[#0F52BA]/40 rounded-full py-5 px-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h1 className="text-white text-xl md:text-2xl font-serif italic tracking-widest uppercase">
                More <span className="text-[#C5A880] not-italic font-sans font-black">Options</span>
              </h1>
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#C5A880]/80 font-mono mt-1">Quick Links & Settings</p>
            </div>
          </header>

          {/* Options Grid */}
          <main className="w-full max-w-md flex-grow flex flex-col justify-center py-10 relative z-10 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-2 gap-4 md:gap-5">
              
              {/* Button 1: Settings / Profile */}
              <button 
                onClick={() => handleNavClick(ViewState.PROFILE)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-[#0F52BA] to-[#0B132B] flex items-center justify-center border border-[#C5A880]/40 group-hover:border-[#C5A880] transition-colors shadow-[0_0_12px_rgba(197,168,128,0.2)]">
                  <span className="text-xl font-black uppercase text-[#E8D3B0]">
                    {handle.trim().charAt(0) || 'G'}
                  </span>
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">Profile</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">My Account</span>
              </button>

              {/* Button 2: Security / AI Stylist */}
              <button 
                onClick={() => handleNavClick(ViewState.STYLIST)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Brain 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">AI Stylist</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Style Advice</span>
              </button>

              {/* Button 3: Support / Kits */}
              <button 
                onClick={() => handleNavClick(ViewState.BUNDLES)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Package 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">Outfits</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Bundle Deals</span>
              </button>

              {/* Button 4: Legal / Flash Sale */}
              <button 
                onClick={() => handleNavClick(ViewState.FAMOUS)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Flame 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">Flash Sales</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Limited Time Deals</span>
              </button>

              {/* Button 5: Legal / Support & Legal */}
              <button 
                onClick={() => handleNavClick(ViewState.CONTACT)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Headphones 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">Help & Support</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Customer Care</span>
              </button>

              {/* Button 6: Log Out or KFam */}
              {isAuthenticated ? (
                <button 
                  onClick={() => { 
                    setIsMoreOpen(false); 
                    if (onLogout) onLogout(); 
                  }}
                  className="bg-[#0B132B]/60 border border-rose-500/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-rose-500/60 hover:bg-rose-500/10 shadow-md backdrop-blur-md"
                >
                  <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-rose-500/40 flex items-center justify-center group-hover:border-rose-500 transition-colors">
                    <LogOut 
                      size={28} 
                      className="text-rose-400 group-hover:text-white transition-colors" 
                    />
                  </div>
                  <span className="text-white text-sm md:text-base font-black uppercase tracking-wider">
                    Log Out
                  </span>
                  <span className="text-rose-400/70 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1">
                    Sign Out
                  </span>
                </button>
              ) : (
                <button 
                  onClick={() => { 
                    setIsMoreOpen(false); 
                    onLogin(); 
                  }}
                  className="bg-[#0B132B]/60 border border-[#C5A880]/40 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880] hover:bg-[#C5A880]/10 shadow-md backdrop-blur-md"
                >
                  <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#C5A880]/40 flex items-center justify-center group-hover:border-[#C5A880] transition-colors">
                    <LogIn 
                      size={28} 
                      className="text-[#C5A880] group-hover:text-white transition-colors" 
                    />
                  </div>
                  <span className="text-white text-sm md:text-base font-black uppercase tracking-wider">
                    Sign In
                  </span>
                  <span className="text-[#C5A880]/70 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1">
                    Log In
                  </span>
                </button>
              )}

              {/* Button 7: About Founder */}
              <button 
                onClick={() => handleNavClick(ViewState.ABOUT)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Sparkles 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">About Us</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Our Story</span>
              </button>

              {/* Button 8: Legal */}
              <button 
                onClick={() => handleNavClick(ViewState.LEGAL)}
                className="bg-[#0B132B]/60 border border-[#0F52BA]/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-all active:scale-95 group hover:border-[#C5A880]/60 hover:bg-[#0F52BA]/20 shadow-md backdrop-blur-md"
              >
                <div className="mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-[#0F52BA]/40 flex items-center justify-center group-hover:border-[#C5A880]/50 transition-colors">
                  <Shield 
                    size={28} 
                    className="text-[#C5A880] group-hover:text-white transition-colors" 
                  />
                </div>
                <span className="text-white text-sm md:text-base font-black uppercase tracking-wider group-hover:text-[#C5A880] transition-colors">Legal</span>
                <span className="text-[#C5A880]/60 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-[#C5A880] transition-colors">Terms & Privacy</span>
              </button>
            </div>
          </main>

          {/* Spacer to balance layout */}
          <div className="h-10 w-full relative z-10" />
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[64px] sm:h-[70px] z-[120] pointer-events-none bg-[#060B18]/85 backdrop-blur-2xl border-t border-[#0F52BA]/30 rounded-t-[1.5rem] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
        style={{
          maskImage: 'radial-gradient(circle at 50% 5px, transparent 38px, black 39px)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 5px, transparent 38px, black 39px)',
        }}
      ></div>

      {/* Curved Border Accent */}
      <div 
        className="fixed bottom-[21px] sm:bottom-[27px] left-1/2 -translate-x-1/2 w-[76px] h-[76px] rounded-full border border-[#C5A880]/40 pointer-events-none z-[122]"
        style={{
          clipPath: 'inset(50% 0 0 0)',
        }}
      ></div>

      <nav className="fixed bottom-0 left-0 right-0 h-[64px] sm:h-[70px] z-[121] flex justify-around items-end pb-1.5 sm:pb-2 px-2 max-w-7xl mx-auto">
        <NavItem 
          id={ViewState.CATEGORIES} 
          icon={LayoutGrid} 
          label="Category" 
          action={onOpenCategories} 
          isActive={currentView === ViewState.CATEGORIES} 
        />
        
        <NavItem 
          id={ViewState.PAY_FOR_ME}
          icon={PayForMeIcon} 
          label="Pay For Me" 
          action={() => onNavigate(ViewState.PAY_FOR_ME)} 
          isActive={currentView === ViewState.PAY_FOR_ME} 
        />

        {/* Floating Center Orb */}
        <div className="relative flex-1 flex justify-center h-full">
          <button
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => {
              if (hasLongPressedRef.current) {
                hasLongPressedRef.current = false;
                return;
              }
              onNavigate(ViewState.LOBBY);
            }}
            className="absolute -top-6 sm:-top-8 w-[64px] h-[64px] sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center bg-transparent group/orb transition-transform duration-500 hover:scale-105 active:scale-95 select-none touch-none no-callout z-[130] breathing-animation"
          >
            {/* Pulsing Aura Circles */}
            <div className="absolute inset-0 rounded-full bg-[#0F52BA]/30 scale-95 animate-ping pointer-events-none z-0"></div>
            <div className="absolute inset-0 rounded-full bg-[#C5A880]/15 scale-90 animate-pulse pointer-events-none z-0 shadow-[0_0_20px_rgba(197,168,128,0.3)]"></div>

            {/* Glossy Sphere */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0F52BA] via-[#0B132B] to-[#060B18] scale-90 backdrop-blur-md border border-[#C5A880]/40 shadow-[0_0_15px_rgba(197,168,128,0.25)]"></div>
            
            {/* Logo */}
            <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-500 group-hover/orb:scale-110">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(197,168,128,0.5)]" referrerPolicy="no-referrer" />
            </div>
          </button>
          
          <span className={`absolute bottom-0.5 sm:bottom-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center ${
            currentView === ViewState.LOBBY ? 'text-[#C5A880]' : 'text-white/80'
          }`}>
            HOME
          </span>
        </div>

        <NavItem 
          id={ViewState.KFAM} 
          icon={Users} 
          label="KFam" 
          action={() => onNavigate(ViewState.KFAM)} 
          isActive={currentView === ViewState.KFAM} 
        />

        <NavItem 
          id="MORE" 
          icon={MoreHorizontal} 
          label="More" 
          action={() => setIsMoreOpen(!isMoreOpen)} 
          isActive={isMoreOpen} 
        />
      </nav>
    </>
  );
};

export default BottomNav;
