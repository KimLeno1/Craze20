import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Product } from '../types';
import { trackPlausibleEvent } from '../lib/analytics';

interface WhatsAppShareButtonProps {
  product: Product;
  className?: string;
  variant?: 'pill' | 'compact' | 'full';
}

const WHATSAPP_PHONE = '233553877937';

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  product,
  className = '',
  variant = 'pill',
}) => {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    trackPlausibleEvent('whatsapp_click', {
      location: 'product_share',
      product_id: product.id,
      product_name: product.name
    });

    const productUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `https://closetkraze.top/product/${product.id}`;
      
    const message = `Check this out: ${product.name} — GH₵${product.price} | ${productUrl}`;
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getProductShareUrl = () => {
    const productUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `https://closetkraze.top/product/${product.id}`;
    const message = `Check this out: ${product.name} — GH₵${product.price} | ${productUrl}`;
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  };

  return (
    <a
      href={getProductShareUrl()}
      onClick={handleShare}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share ${product.name} on WhatsApp`}
      tabIndex={0}
      className={`inline-flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-md hover:shadow-lg ${
        variant === 'pill'
          ? 'px-5 py-3 rounded-full text-xs'
          : variant === 'compact'
          ? 'p-3 rounded-2xl text-xs'
          : 'w-full py-4 px-6 rounded-2xl text-xs md:text-sm'
      } ${className}`}
    >
      <WhatsAppIcon size={18} className="shrink-0" title={`Share ${product.name} on WhatsApp`} />
      <span>Share on WhatsApp</span>
    </a>
  );
};

export default WhatsAppShareButton;
