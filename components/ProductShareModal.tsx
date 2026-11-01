import React, { useState } from 'react';
import { Product } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { toast } from 'sonner';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Sparkles, 
  ExternalLink, 
  Send, 
  FileText,
  Tag,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { trackPlausibleEvent } from '../lib/analytics';

interface ProductShareModalProps {
  product: Product;
  initialSize?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MESSAGES = [
  "Check out this vault drop!",
  "What do you think of this size?",
  "Could you get this grail for me?",
  "Curated piece from Closet Kraze vault",
  "Must-have outfit recommendation"
];

export const ProductShareModal: React.FC<ProductShareModalProps> = ({
  product,
  initialSize,
  isOpen,
  onClose
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(
    initialSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard')
  );
  const [shortMessage, setShortMessage] = useState<string>("Check out this curated grail on Closet Kraze!");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);

  if (!isOpen) return null;

  // Derive first image URL (ensuring absolute URL for rich preview sharing)
  const firstImageRaw = (product.images && product.images.length > 0) ? product.images[0] : product.image;
  const firstImageUrl = getImageUrl(firstImageRaw);
  
  // Build full absolute image URL for external chat platforms
  const absoluteImageUrl = firstImageUrl.startsWith('http') 
    ? firstImageUrl 
    : `${window.location.origin}${firstImageUrl}`;

  // Build clean product direct share URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://closetkraze.top';
  const queryParams = new URLSearchParams();
  queryParams.set('productId', product.id);
  if (selectedSize && selectedSize !== 'Standard') {
    queryParams.set('size', selectedSize);
  }
  if (shortMessage && shortMessage.trim() !== "") {
    queryParams.set('msg', shortMessage.trim());
  }
  const shareUrl = `${baseUrl}/?${queryParams.toString()}`;

  // Format rich WhatsApp text
  const formatWhatsAppText = () => {
    return [
      `🔥 *CLOSET KRAZE VAULT DROP* 🔥`,
      `*${product.name}* (${product.category || 'Curated Piece'})`,
      ``,
      `📏 *Size:* ${selectedSize}`,
      `💰 *Price:* GH₵${product.price}${product.originalPrice && product.originalPrice > product.price ? ` _(Orig: GH₵${product.originalPrice})_` : ''}`,
      `💬 *Note:* "${shortMessage}"`,
      ``,
      `🖼️ *Item Preview:* ${absoluteImageUrl}`,
      ``,
      `⚡ *Inspect & Secure:* ${shareUrl}`
    ].join('\n');
  };

  // Format Rich Stylized Card Text
  const formatRichCardText = () => {
    return [
      `🔥 CLOSET KRAZE • VAULT CURATION 🔥`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 ITEM: ${product.name}`,
      `🏷️ CATEGORY: ${product.category || 'Grail Piece'}`,
      `📏 SIZE: ${selectedSize}`,
      `💰 PRICE: GH₵${product.price}`,
      `💬 NOTE: "${shortMessage}"`,
      ``,
      `🖼️ PREVIEW: ${absoluteImageUrl}`,
      `🔗 DIRECT LINK: ${shareUrl}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Authenticity Verified in Kumasi, Ghana • closetkraze.top`
    ].join('\n');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
      
      trackPlausibleEvent('product_share_copy_link', {
        product_id: product.id,
        product_name: product.name
      });
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleCopyRichCard = async () => {
    try {
      await navigator.clipboard.writeText(formatRichCardText());
      setCopiedCard(true);
      toast.success('Formatted product card copied!');
      setTimeout(() => setCopiedCard(false), 2500);

      trackPlausibleEvent('product_share_copy_card', {
        product_id: product.id,
        product_name: product.name
      });
    } catch (err) {
      toast.error('Failed to copy card.');
    }
  };

  const handleWhatsAppShare = () => {
    trackPlausibleEvent('product_share_whatsapp', {
      product_id: product.id,
      product_name: product.name
    });

    const text = formatWhatsAppText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Closet Kraze: ${product.name}`,
          text: `[Size: ${selectedSize} • GH₵${product.price}] "${shortMessage}"`,
          url: shareUrl
        });
        toast.success('Shared successfully!');
        trackPlausibleEvent('product_share_native', {
          product_id: product.id,
          product_name: product.name
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    const text = `Check out ${product.name} (Size: ${selectedSize} • GH₵${product.price}) on Closet Kraze! "${shortMessage}"`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const text = `🔥 ${product.name} (Size: ${selectedSize} • GH₵${product.price})\n"${shortMessage}"`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[2rem] p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D1FF]/10 border border-[#00D1FF]/30 flex items-center justify-center text-[#00D1FF]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Share Vault Piece
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                Includes First Photo, Size, Price & Message
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Visual Card Preview */}
        <div className="p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex gap-4 items-center relative overflow-hidden group">
          {/* First Product Image */}
          <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-zinc-950 overflow-hidden shrink-0 relative border border-zinc-800">
            <img 
              src={firstImageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-[#00D1FF]">
              Cover Pic
            </div>
          </div>

          {/* Product Info & Selected Size / Price */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono font-bold text-[#00D1FF] bg-[#00D1FF]/10 px-2 py-0.5 rounded border border-[#00D1FF]/20 uppercase">
                {product.category || 'Vault Piece'}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-base sm:text-lg font-mono font-black text-white">
                GH₵{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs font-mono text-zinc-500 line-through">
                  GH₵{product.originalPrice}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Tag className="w-3 h-3" />
              <span>Sharing Size: {selectedSize}</span>
            </div>
          </div>
        </div>

        {/* Size Selection Segment */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Select Size to Highlight</span>
              <span className="text-[9px] text-zinc-500 lowercase">tap to change</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-[#00D1FF] text-zinc-950 shadow-[0_0_12px_rgba(0,209,255,0.4)] border border-[#00D1FF]'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Short Message Input & Presets */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-[#00D1FF]" />
              <span>Personal Short Message</span>
            </label>
            <span className="text-[9px] font-mono text-zinc-500">
              {shortMessage.length}/120 chars
            </span>
          </div>

          <textarea
            value={shortMessage}
            onChange={(e) => setShortMessage(e.target.value.slice(0, 120))}
            placeholder="Add a personalized short note for the recipient..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#00D1FF] transition-all resize-none font-sans"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MESSAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setShortMessage(preset)}
                className={`text-[9px] font-mono px-2 py-1 rounded-lg border transition-all cursor-pointer truncate max-w-full ${
                  shortMessage === preset
                    ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/40'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Link Input Box */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Direct Product Link
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <input 
              readOnly 
              value={shareUrl}
              className="flex-1 bg-transparent px-2 text-[10px] font-mono text-zinc-400 outline-none select-all overflow-hidden text-ellipsis"
            />
            <button 
              onClick={handleCopyLink}
              className="px-3 py-2 bg-white text-zinc-950 hover:bg-[#00D1FF] rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="space-y-3 pt-2">
          {/* Primary WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
          >
            <WhatsAppIcon size={18} />
            <span>Share on WhatsApp (With Image & Specs)</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Native Mobile / OS Share */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00D1FF]" />
              <span>Device Share</span>
            </button>

            {/* Copy Formatted Rich Card */}
            <button
              type="button"
              onClick={handleCopyRichCard}
              className="py-3 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedCard ? 'Card Copied!' : 'Copy Rich Card'}</span>
            </button>
          </div>

          {/* Secondary Social Channels */}
          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-mono text-zinc-500">
            <span>Also share via:</span>
            <button 
              onClick={handleTwitterShare}
              className="hover:text-[#00D1FF] transition-colors underline cursor-pointer"
            >
              X / Twitter
            </button>
            <span>•</span>
            <button 
              onClick={handleTelegramShare}
              className="hover:text-[#00D1FF] transition-colors underline cursor-pointer"
            >
              Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShareModal;
