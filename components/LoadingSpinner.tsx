import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'sapphire' | 'gold' | 'white' | 'dark' | 'emerald';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
  labelPosition?: 'bottom' | 'right';
}

const sizeMap: Record<SpinnerSize, { ring: string; text: string }> = {
  xs: { ring: 'w-3.5 h-3.5 border-[1.5px]', text: 'text-[9px]' },
  sm: { ring: 'w-4 h-4 border-2', text: 'text-[10px]' },
  md: { ring: 'w-6 h-6 border-2', text: 'text-xs' },
  lg: { ring: 'w-8 h-8 border-[2.5px]', text: 'text-sm' },
  xl: { ring: 'w-12 h-12 border-3', text: 'text-base' },
};

const variantMap: Record<SpinnerVariant, { track: string; head: string; label: string }> = {
  sapphire: {
    track: 'border-[#0F52BA]/20',
    head: 'border-t-[#0F52BA] border-r-[#0F52BA]',
    label: 'text-[#0F52BA]',
  },
  gold: {
    track: 'border-[#C5A880]/25',
    head: 'border-t-[#C5A880] border-r-[#E8D3B0]',
    label: 'text-[#C5A880]',
  },
  white: {
    track: 'border-white/20',
    head: 'border-t-white border-r-white',
    label: 'text-white',
  },
  dark: {
    track: 'border-zinc-300',
    head: 'border-t-zinc-950 border-r-zinc-800',
    label: 'text-zinc-950',
  },
  emerald: {
    track: 'border-emerald-500/20',
    head: 'border-t-emerald-600 border-r-emerald-500',
    label: 'text-emerald-600',
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'sapphire',
  className = '',
  label,
  labelPosition = 'right',
}) => {
  const { ring, text } = sizeMap[size];
  const { track, head, label: labelColor } = variantMap[variant];

  const spinnerElement = (
    <div
      role="status"
      aria-label={label || 'Loading...'}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      {/* Outer spinning ring */}
      <div
        className={`rounded-full animate-spin ${ring} ${track} ${head}`}
        style={{ animationDuration: '0.75s' }}
      />
      {/* Inner ambient pulse dot on medium and larger */}
      {(size === 'lg' || size === 'xl') && (
        <div
          className={`absolute w-1.5 h-1.5 rounded-full animate-ping opacity-60 ${
            variant === 'white' ? 'bg-white' : variant === 'gold' ? 'bg-[#C5A880]' : 'bg-[#0F52BA]'
          }`}
        />
      )}
    </div>
  );

  if (!label) {
    return spinnerElement;
  }

  return (
    <div
      className={`inline-flex items-center ${
        labelPosition === 'bottom' ? 'flex-col gap-2' : 'gap-2'
      }`}
    >
      {spinnerElement}
      <span
        className={`font-mono font-bold uppercase tracking-widest ${text} ${labelColor} animate-pulse`}
      >
        {label}
      </span>
    </div>
  );
};

export default LoadingSpinner;
