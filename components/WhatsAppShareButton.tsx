import React from 'react';
import { Share2 } from 'lucide-react';
import { Product } from '../types';
import { trackPlausibleEvent } from '../lib/analytics';
import { getImageUrl } from '../lib/imageUtils';
import { triggerHaptic } from '../lib/haptics';

interface WhatsAppShareButtonProps {
  product: Product;
  selectedSize?: string;
  customMessage?: string;
  className?: string;
  variant?: 'pill' | 'compact' | 'full';
  onClick?: (e: React.MouseEvent) => void;
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  product,
  selectedSize,
  customMessage,
  className = '',
  variant = 'pill',
  onClick
}) => {
  const getSharePayload = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://closetkraze.top';
    const productUrl = `${baseUrl}/?productId=${product.id}${selectedSize ? `&size=${encodeURIComponent(selectedSize)}` : ''}`;
    const sizeText = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes.join('/') : 'Standard');
    const text = customMessage || `Check out ${product.name} (${sizeText} • GH₵${product.price}) on Closet Kraze: ${productUrl}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    triggerHaptic('selection');
    if (onClick) {
      onClick(e);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    trackPlausibleEvent('share_click', {
      location: 'product_share',
      product_id: product.id,
      product_name: product.name
    });

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://closetkraze.top';
    const productUrl = `${baseUrl}/?productId=${product.id}${selectedSize ? `&size=${encodeURIComponent(selectedSize)}` : ''}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Closet Kraze`,
          url: productUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    window.open(getSharePayload(), '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={getSharePayload()}
      onClick={handleShare}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share ${product.name}`}
      tabIndex={0}
      className={`inline-flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow cursor-pointer ${
        variant === 'pill'
          ? 'px-5 py-3 rounded-full text-xs'
          : variant === 'compact'
          ? 'p-3 rounded-2xl text-xs'
          : 'w-full py-4 px-6 rounded-2xl text-xs md:text-sm'
      } ${className}`}
    >
      <Share2 size={16} className="shrink-0 text-zinc-700" />
      <span>Share</span>
    </a>
  );
};

export default WhatsAppShareButton;

