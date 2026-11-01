import React from 'react';
import { motion } from 'framer-motion';

export type LoaderVariant = 'luxury-ring' | 'dots' | 'pulse-glow' | 'bar' | 'minimal';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AnimatedLoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: string; // custom color class or hex
  text?: string;
  className?: string;
  subtext?: string;
  fullscreen?: boolean;
}

const sizeMap: Record<LoaderSize, { ring: string; dots: string; icon: string }> = {
  xs: { ring: 'w-3.5 h-3.5 border', dots: 'w-1 h-1', icon: 'w-3 h-3' },
  sm: { ring: 'w-4 h-4 border-[1.5px]', dots: 'w-1.5 h-1.5', icon: 'w-4 h-4' },
  md: { ring: 'w-6 h-6 border-2', dots: 'w-2 h-2', icon: 'w-6 h-6' },
  lg: { ring: 'w-10 h-10 border-[2.5px]', dots: 'w-2.5 h-2.5', icon: 'w-10 h-10' },
  xl: { ring: 'w-16 h-16 border-3', dots: 'w-3.5 h-3.5', icon: 'w-14 h-14' }
};

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  variant = 'luxury-ring',
  size = 'md',
  color = '#0F52BA',
  text,
  subtext,
  className = '',
  fullscreen = false
}) => {
  const sizeClasses = sizeMap[size];

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`inline-flex items-center gap-1.5 ${className}`} aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={`${sizeClasses.dots} rounded-full bg-current shadow-sm`}
                animate={{
                  y: [0, -6, 0],
                  opacity: [0.35, 1, 0.35],
                  scale: [0.85, 1.15, 0.85]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        );

      case 'pulse-glow':
        return (
          <div className={`relative flex items-center justify-center ${className}`}>
            <motion.div
              className={`absolute rounded-full bg-[#0F52BA]/30 ${
                size === 'xs' || size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-12 h-12' : 'w-20 h-20'
              }`}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <motion.div
              className={`rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#C5A880] shadow-[0_0_15px_rgba(15,82,186,0.5)] ${sizeClasses.ring}`}
              animate={{ scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        );

      case 'bar':
        return (
          <div className={`w-full overflow-hidden rounded-full bg-white/10 h-1 relative ${className}`}>
            <motion.div
              className="h-full bg-gradient-to-r from-[#0F52BA] via-[#C5A880] to-[#0F52BA] rounded-full absolute"
              animate={{
                left: ['-40%', '100%'],
                width: ['40%', '60%']
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
        );

      case 'minimal':
        return (
          <svg
            className={`animate-spin ${sizeClasses.icon} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );

      case 'luxury-ring':
      default:
        return (
          <div className={`relative inline-flex items-center justify-center ${className}`}>
            {/* Outer spinning ring with gradient accents */}
            <motion.div
              className={`rounded-full border-solid border-transparent border-t-[#0F52BA] border-r-[#C5A880]/80 ${sizeClasses.ring}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner counter-spinning micro-accent for medium to large sizes */}
            {(size === 'md' || size === 'lg' || size === 'xl') && (
              <motion.div
                className="absolute w-1/2 h-1/2 rounded-full border border-solid border-transparent border-b-[#C5A880] border-l-[#0F52BA]/60"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        );
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-2.5 text-center">
      {renderLoader()}
      {text && (
        <motion.span
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-mono font-bold tracking-widest uppercase ${
            size === 'xs' || size === 'sm'
              ? 'text-[9px] text-zinc-400'
              : size === 'md'
              ? 'text-xs text-zinc-300'
              : 'text-sm text-white'
          }`}
        >
          {text}
        </motion.span>
      )}
      {subtext && (
        <span className="text-[10px] text-zinc-500 max-w-xs font-sans">
          {subtext}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 p-4">
        <div className="p-8 rounded-3xl bg-[#0B132B]/90 border border-white/10 shadow-2xl flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default AnimatedLoader;
