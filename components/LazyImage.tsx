import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
  placeholderColor?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = 'w-full h-full',
  aspectRatio,
  priority = false,
  placeholderColor,
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already loaded from cache on mount or src change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    if (imgRef.current && imgRef.current.complete) {
      // If it already loaded or cached
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, [src]);

  return (
    <div 
      className={`relative overflow-hidden ${containerClassName.includes('w-') ? '' : 'w-full'} ${containerClassName.includes('h-') ? '' : 'h-full'} ${aspectRatio ? aspectRatio : ''} ${containerClassName}`}
      style={{
        backgroundColor: placeholderColor || undefined
      }}
    >
      {/* Subtle blur-up placeholder & shimmer backdrop */}
      <div 
        className={`absolute inset-0 z-0 bg-gradient-to-tr from-zinc-200 via-zinc-100 to-zinc-200 transition-opacity duration-700 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'
        }`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-white/20 backdrop-blur-xs" />
      </div>

      {hasError ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-3 text-center bg-zinc-100 text-zinc-400">
          <span className="text-xl mb-1 opacity-60">📷</span>
          <span className="text-[9px] font-mono uppercase tracking-wider line-clamp-1">{alt || 'Image Preview'}</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy={referrerPolicy}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out transform-gpu ${
            isLoaded 
              ? 'opacity-100 filter-none scale-100' 
              : 'opacity-0 filter blur-md scale-[1.04]'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
};

export default LazyImage;
