import React, { useState, useEffect } from 'react';

interface GlobalLoadingBarProps {
  isLoading?: boolean;
  color?: 'sapphire' | 'gold' | 'emerald';
}

export const GlobalLoadingBar: React.FC<GlobalLoadingBarProps> = ({
  isLoading: controlledLoading = false,
  color = 'sapphire',
}) => {
  const [eventLoading, setEventLoading] = useState(false);

  useEffect(() => {
    let timeoutId: any;

    const handleStart = () => setEventLoading(true);
    const handleEnd = () => setEventLoading(false);
    const handleTrigger = (e: any) => {
      setEventLoading(true);
      const ms = e.detail?.durationMs || 800;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setEventLoading(false), ms);
    };

    window.addEventListener('app:loading-start', handleStart);
    window.addEventListener('app:loading-end', handleEnd);
    window.addEventListener('app:loading-trigger', handleTrigger as EventListener);

    return () => {
      window.removeEventListener('app:loading-start', handleStart);
      window.removeEventListener('app:loading-end', handleEnd);
      window.removeEventListener('app:loading-trigger', handleTrigger as EventListener);
      clearTimeout(timeoutId);
    };
  }, []);

  const active = controlledLoading || eventLoading;

  if (!active) return null;

  const colorGradients = {
    sapphire: 'from-[#0F52BA] via-[#60A5FA] to-[#09285E]',
    gold: 'from-[#C5A880] via-[#F3E5AB] to-[#967447]',
    emerald: 'from-emerald-600 via-emerald-400 to-emerald-700',
  };

  return (
    <div
      role="progressbar"
      aria-valuetext="Loading content"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3.5px] bg-transparent pointer-events-none overflow-hidden"
    >
      <div
        className={`h-full w-full bg-gradient-to-r ${colorGradients[color]} shadow-[0_0_14px_rgba(15,82,186,0.8)] animate-[global-load_1.2s_ease-in-out_infinite] origin-left`}
      />
    </div>
  );
};

export default GlobalLoadingBar;
