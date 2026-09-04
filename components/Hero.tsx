
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Shuffle } from 'lucide-react';
import { HeroQuoteSlide, getRandomSessionHeroSlides } from '../data/heroQuotes';

interface HeroProps {
  onShopNow: () => void;
}

const Hero: React.FC<HeroProps> = ({ onShopNow }) => {
  const [slides, setSlides] = useState<HeroQuoteSlide[]>(() => getRandomSessionHeroSlides(4));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused || !slides.length) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const activeSlide = slides[currentIndex] || slides[0];

  const handleShuffle = () => {
    try {
      sessionStorage.removeItem('cc_session_hero_slides_v2');
      sessionStorage.removeItem('cc_session_hero_slides');
    } catch (e) {}
    const newSlides = getRandomSessionHeroSlides(4);
    setSlides(newSlides);
    setCurrentIndex(0);
  };

  if (!activeSlide) return null;

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[80vh] md:min-h-[90vh] overflow-hidden flex items-end px-6 md:px-16 pb-16 pt-24 bg-zinc-950 select-none group"
    >
      {/* Background Image Matching Quote */}
      <div className="absolute inset-0 z-0">
        <img 
          key={activeSlide.id}
          src={activeSlide.image} 
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = activeSlide.fallbackImage;
          }}
          className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-all duration-[2500ms] ease-out animate-in fade-in zoom-in-95 duration-1000" 
          alt={activeSlide.quote}
          referrerPolicy="no-referrer"
        />
        {/* Layered gradients to make the text pop down the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
      </div>

      {/* Slide Indicators & Shuffle at Top */}
      <div className="absolute top-8 left-6 right-6 md:left-16 md:right-16 flex items-center justify-between gap-4 z-20">
        <div className="flex gap-2 max-w-md flex-1">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              className="flex-1 h-1.5 bg-white/20 hover:bg-white/40 rounded-full overflow-hidden transition-all relative"
              title={`Quote ${idx + 1}`}
            >
              {currentIndex === idx ? (
                <div className={`h-full bg-white rounded-full animate-slide-progress ${isPaused ? 'animation-pause' : ''}`} />
              ) : currentIndex > idx ? (
                <div className="h-full bg-white/80 rounded-full w-full" />
              ) : (
                <div className="h-full bg-white/10 rounded-full w-0" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleShuffle}
          className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white/90 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95"
          title="Pick 4 new random quotes"
        >
          <Shuffle className="w-3 h-3 text-[#00D1FF]" />
          <span className="hidden sm:inline">Shuffle Quotes</span>
        </button>
      </div>

      {/* Quote Content Written Down The Image */}
      <div className="relative z-10 max-w-4xl space-y-4">
        {/* Quote written down the image */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-serif italic text-white leading-[1.05] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-6 duration-1000">
          "{activeSlide.quote}"
        </h1>
        
        <div className="flex items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <button 
            onClick={onShopNow}
            className="px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] uppercase tracking-[0.4em] font-black transition-all duration-300 shadow-2xl flex items-center gap-3 rounded-2xl hover:scale-105 active:scale-95"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => setCurrentIndex(prev => prev === 0 ? slides.length - 1 : prev - 1)}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 active:scale-95 shadow-xl"
        title="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={() => setCurrentIndex(prev => (prev + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 active:scale-95 shadow-xl"
        title="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-8 text-white/30 text-[10px] font-black uppercase tracking-[0.5em] rotate-90 origin-right">
        <span>Curated Archive // 2026</span>
        <div className="w-16 h-[1px] bg-white/20"></div>
        <span>{activeSlide.theme}</span>
      </div>
    </section>
  );
};

export default Hero;

