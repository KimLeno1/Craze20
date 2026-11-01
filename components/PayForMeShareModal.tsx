import React, { useState } from 'react';
import { CartItem, PayForMeRequest } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';
import { toast } from 'sonner';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  CreditCard, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  Tag, 
  Smartphone,
  Gift,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { trackPlausibleEvent } from '../lib/analytics';

interface PayForMeShareModalProps {
  items?: CartItem[];
  total?: number;
  existingRequest?: PayForMeRequest | null;
  onClose: () => void;
  onRequestCreated?: (request: PayForMeRequest) => void;
  tryOnImage?: string;
  initialMessage?: string;
  isFromTryOn?: boolean;
}

const PRESET_MESSAGES = [
  "Do you want me to look like this...",
  "Could you please sponsor this piece for me?",
  "Birthday gift request from Closet Kraze vault!",
  "Would love your support to cop this grail!",
  "Help me acquire this archival piece"
];

export const PayForMeShareModal: React.FC<PayForMeShareModalProps> = ({ 
  items = [], 
  total = 0, 
  existingRequest = null,
  onClose,
  onRequestCreated,
  tryOnImage,
  initialMessage,
  isFromTryOn = false
}) => {
  const [request, setRequest] = useState<PayForMeRequest | null>(existingRequest);
  const defaultInitialMessage = initialMessage || (isFromTryOn || tryOnImage ? "Do you want me to look like this..." : "Could you please sponsor this piece for me on Closet Kraze?");
  const [message, setMessage] = useState<string>(
    existingRequest?.message || defaultInitialMessage
  );
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  // Derive the active product from either request or items prop
  const activeItem: CartItem | undefined = request?.items?.[0] || items[0];
  const activeTotal = request?.total ?? total;
  const requesterName = request?.userName || localStorage.getItem('cc-user-handle') || 'Anonymous';

  // Derive active image: prefer tryOnImage if provided
  const activeTryOnImage = tryOnImage || activeItem?.tryOnImage || request?.tryOnImage;
  const firstImageRaw = activeTryOnImage || (activeItem ? (activeItem.images && activeItem.images.length > 0 ? activeItem.images[0] : activeItem.image) : '');
  const firstImageUrl = getImageUrl(firstImageRaw);
  const absoluteImageUrl = firstImageUrl.startsWith('http')
    ? firstImageUrl
    : typeof window !== 'undefined' ? `${window.location.origin}${firstImageUrl}` : firstImageUrl;

  // Selected size from cart item
  const selectedSize = activeItem?.selectedSize || 'Standard';

  // Construct sponsor link if request exists
  const shareLink = request && activeItem 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://closetkraze.top'}/payformeshared/${encodeURIComponent(request.userName || requesterName)}/${encodeURIComponent(activeItem.id)}/${encodeURIComponent(request.id)}`
    : '';

  // Formatted WhatsApp message
  const formatWhatsAppText = (link: string, msg: string) => {
    return [
      `🌟 *CLOSET KRAZE SPONSORSHIP REQUEST* 🌟`,
      activeTryOnImage ? `✨ *AI Virtual Fitting / Try-On Look Attached*` : ``,
      ``,
      `👤 *Requester:* ${requesterName}`,
      `📦 *Item:* ${activeItem?.name || 'Vault Piece'}`,
      `🏷️ *Category:* ${activeItem?.category || 'Curated Piece'}`,
      `📏 *Size:* ${selectedSize}`,
      `💰 *Total Goal:* GH₵${activeTotal}`,
      `💬 *Caption:* "${msg}"`,
      ``,
      `🖼️ *Fitting Preview:* ${absoluteImageUrl}`,
      ``,
      `🔗 *Sponsor & Support Here:*`,
      `${link}`
    ].filter(line => line !== undefined).join('\n');
  };

  // Formatted Rich Text Card
  const formatRichCardText = (link: string, msg: string) => {
    return [
      `🌟 CLOSET KRAZE SPONSORSHIP CARD 🌟`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      activeTryOnImage ? `✨ VIRTUAL TRY-ON FIT INCLUDED` : ``,
      `👤 REQUESTER: ${requesterName}`,
      `📦 ITEM: ${activeItem?.name || 'Vault Piece'}`,
      `📏 SIZE: ${selectedSize}`,
      `💰 TOTAL GOAL: GH₵${activeTotal}`,
      `💬 CAPTION: "${msg}"`,
      ``,
      `🖼️ PREVIEW: ${absoluteImageUrl}`,
      `🔗 SPONSOR LINK: ${link}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Verified on closetkraze.top`
    ].filter(line => line !== undefined).join('\n');
  };

  const handleCreateOrGetRequest = async (): Promise<PayForMeRequest | null> => {
    if (request) return request;

    const userId = localStorage.getItem('cc-user-id');
    const userName = localStorage.getItem('cc-user-handle') || 'Anonymous';
    
    if (!userId) {
      toast.error('Please log in to generate a Pay for Me link.');
      return null;
    }

    if (!items || items.length === 0) {
      toast.error('No items to sponsor.');
      return null;
    }

    // Attach tryOnImage to item if applicable
    const safeItems = Array.isArray(items) ? items : (items ? [items] : []);
    const itemsToSave = safeItems.map((itm, idx) => {
      if (idx === 0 && activeTryOnImage) {
        return { ...itm, tryOnImage: activeTryOnImage };
      }
      return itm;
    });

    setIsCreating(true);
    try {
      const newReq = await databaseService.createPayForMeRequest({
        userId,
        userName,
        items: itemsToSave,
        total: activeTotal,
        amountPaid: 0,
        message,
        tryOnImage: activeTryOnImage
      });
      setRequest(newReq);
      if (onRequestCreated) {
        onRequestCreated(newReq);
      }
      return newReq;
    } catch (error) {
      console.error('Failed to create Pay for Me request:', error);
      toast.error('Failed to create Pay for Me link.');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    let currentReq = request;
    if (!currentReq) {
      currentReq = await handleCreateOrGetRequest();
      if (!currentReq) return;
    }

    const item = (Array.isArray(currentReq.items) && currentReq.items[0]) || (currentReq.items as any) || activeItem || { id: 'item', name: 'Item' };
    const link = `${window.location.origin}/payformeshared/${encodeURIComponent(currentReq.userName || requesterName)}/${encodeURIComponent(item.id || 'item')}/${encodeURIComponent(currentReq.id)}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Sponsorship link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);

      trackPlausibleEvent('payforme_share_copy_link', {
        item_id: item.id || 'item',
        item_name: item.name || 'Item'
      });
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleWhatsAppShare = async () => {
    let currentReq = request;
    if (!currentReq) {
      currentReq = await handleCreateOrGetRequest();
      if (!currentReq) return;
    }

    const item = (Array.isArray(currentReq.items) && currentReq.items[0]) || (currentReq.items as any) || activeItem || { id: 'item', name: 'Item' };
    const link = `${window.location.origin}/payformeshared/${encodeURIComponent(currentReq.userName || requesterName)}/${encodeURIComponent(item.id || 'item')}/${encodeURIComponent(currentReq.id)}`;
    const text = formatWhatsAppText(link, message);

    trackPlausibleEvent('payforme_share_whatsapp', {
      item_id: item.id || 'item',
      item_name: item.name || 'Item'
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    let currentReq = request;
    if (!currentReq) {
      currentReq = await handleCreateOrGetRequest();
      if (!currentReq) return;
    }

    const item = (Array.isArray(currentReq.items) && currentReq.items[0]) || (currentReq.items as any) || activeItem || { id: 'item', name: 'Item', selectedSize: 'Standard' };
    const link = `${window.location.origin}/payformeshared/${encodeURIComponent(currentReq.userName || requesterName)}/${encodeURIComponent(item.id || 'item')}/${encodeURIComponent(currentReq.id)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Closet Kraze Sponsorship: ${item.name || 'Item'}`,
          text: `[Size: ${item.selectedSize || selectedSize || 'Standard'} • GH₵${currentReq.total}] "${message}"`,
          url: link
        });
        toast.success('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyAsCard = async () => {
    let currentReq = request;
    if (!currentReq) {
      currentReq = await handleCreateOrGetRequest();
      if (!currentReq) return;
    }

    const item = (Array.isArray(currentReq.items) && currentReq.items[0]) || (currentReq.items as any) || activeItem || { id: 'item', name: 'Item' };
    const link = `${window.location.origin}/payformeshared/${encodeURIComponent(currentReq.userName || requesterName)}/${encodeURIComponent(item.id || 'item')}/${encodeURIComponent(currentReq.id)}`;
    const cardText = formatRichCardText(link, message);

    try {
      await navigator.clipboard.writeText(cardText);
      setCopiedCard(true);
      toast.success('Formatted sponsorship card copied!');
      setTimeout(() => setCopiedCard(false), 2500);
    } catch (err) {
      toast.error('Failed to copy card.');
    }
  };

  const handleDownloadVCard = async () => {
    let currentReq = request;
    if (!currentReq) {
      currentReq = await handleCreateOrGetRequest();
      if (!currentReq) return;
    }

    const item = (Array.isArray(currentReq.items) && currentReq.items[0]) || (currentReq.items as any) || activeItem || { id: 'item', name: 'Item' };
    const link = `${window.location.origin}/payformeshared/${encodeURIComponent(currentReq.userName || requesterName)}/${encodeURIComponent(item.id || 'item')}/${encodeURIComponent(currentReq.id)}`;
    
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:Pay For Me: ${currentReq.userName || requesterName}`,
      `ORG:Closet Kraze Sponsorship`,
      `TITLE:Payment Request for ${item.name} (${selectedSize})`,
      `REV:${new Date().toISOString()}`,
      `NOTE:Please sponsor this item (Size: ${selectedSize}, GH₵${currentReq.total}): ${link}\nMessage: ${message}`,
      `URL:${link}`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${currentReq.userName}_PayForMe.vcf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('VCard downloaded successfully');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border-t sm:border border-zinc-800 text-zinc-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] p-4 sm:p-7 space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Pay For Me Sponsorship Link
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                Includes First Photo, Size, Price & Message
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Visual Preview Card */}
        {activeItem && (
          <div className="p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex gap-4 items-center relative overflow-hidden group">
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-zinc-950 overflow-hidden shrink-0 relative border border-zinc-800">
              <img 
                src={firstImageUrl} 
                alt={activeItem.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-purple-400">
                {activeTryOnImage ? '✨ Try-On Look' : 'Item Photo'}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {activeTryOnImage && (
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Fit
                  </span>
                )}
                <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase">
                  {activeItem.category || 'Grail Wish'}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Sponsor Verified
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeItem.name}
              </h3>

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  GH₵{activeTotal}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Requested by @{requesterName}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Tag className="w-3 h-3" />
                <span>Selected Size: {selectedSize}</span>
              </div>
            </div>
          </div>
        )}

        {/* Short Message Input */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-purple-400" />
              <span>Sponsorship Note / Message</span>
            </label>
            <span className="text-[9px] font-mono text-zinc-500">
              {message.length}/140 chars
            </span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 140))}
            placeholder="Add a personalized message for your sponsor or contributor..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 transition-all resize-none font-sans"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MESSAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(preset)}
                className={`text-[9px] font-mono px-2 py-1 rounded-lg border transition-all cursor-pointer truncate max-w-full ${
                  message === preset
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/40'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Link Display */}
        {shareLink && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Sponsor URL
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <input 
                readOnly 
                value={shareLink}
                className="flex-1 bg-transparent px-2 text-[10px] font-mono text-zinc-400 outline-none select-all overflow-hidden text-ellipsis"
              />
              <button 
                onClick={handleCopyLink}
                className="px-3 py-2 bg-white text-zinc-950 hover:bg-purple-400 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={isCreating}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
          >
            <WhatsAppIcon size={18} />
            <span>{isCreating ? 'Generating...' : 'Share Sponsor Link on WhatsApp'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Native Mobile Share */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isCreating}
              className="py-3 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Device Share</span>
            </button>

            {/* Copy Link / Card */}
            <button
              type="button"
              onClick={handleCopyAsCard}
              disabled={isCreating}
              className="py-3 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedCard ? 'Card Copied!' : 'Copy Styled Card'}</span>
            </button>
          </div>

          {/* Download VCard */}
          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-mono text-zinc-500">
            <button 
              onClick={handleDownloadVCard}
              disabled={isCreating}
              className="hover:text-purple-400 transition-colors underline cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Download Contact VCard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayForMeShareModal;
