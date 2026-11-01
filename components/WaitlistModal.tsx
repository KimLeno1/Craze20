import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Check, Sparkles, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Product, User } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { databaseService } from '../services/databaseService';
import { triggerHaptic } from '../lib/haptics';
import LazyImage from './LazyImage';

interface WaitlistModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  initialSize?: string;
  user?: User | null;
  onSuccess?: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  product,
  isOpen,
  onClose,
  initialSize,
  user,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>(initialSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard'));
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  // Prepopulate with user data or existing waitlist entry
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name || user.handle || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
      } else {
        try {
          const savedContact = localStorage.getItem('closet-kraze-waitlist-contact');
          if (savedContact) {
            const parsed = JSON.parse(savedContact);
            if (parsed.name) setName(parsed.name);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.phone) setPhone(parsed.phone);
          }
        } catch {}
      }

      if (initialSize) {
        setSelectedSize(initialSize);
      } else if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }

      const isJoined = databaseService.checkWaitlistStatus(product.id, user?.email);
      setAlreadyJoined(isJoined);
      setIsSuccess(false);
    }
  }, [isOpen, product, user, initialSize]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await databaseService.joinWaitlist({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.image,
        selectedSize: selectedSize || undefined,
        userName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredChannel: channel
      });

      // Cache contact info for convenient future use
      try {
        localStorage.setItem('closet-kraze-waitlist-contact', JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim()
        }));
      } catch {}

      triggerHaptic('success');
      setIsSuccess(true);
      setAlreadyJoined(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 my-auto"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-7 relative">
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-black">
                Vault Priority Alert
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-white">
              Join Restock Waitlist
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Be the first to know when this archive piece returns to inventory.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Product Mini Overview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-200 shrink-0 relative">
                <LazyImage
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    Currently Out of Stock
                  </span>
                </div>
                <h4 className="font-serif italic text-base text-zinc-950 truncate">
                  {product.name}
                </h4>
                <p className="text-xs font-mono font-bold text-zinc-700 mt-0.5">
                  GH₵{product.price}
                </p>
              </div>
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[3px]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif italic text-zinc-950 font-bold">
                    You're On The Priority List!
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    We will notify you via <strong className="text-zinc-950 capitalize">{channel}</strong> as soon as size <span className="font-mono font-bold text-zinc-950">{selectedSize}</span> is back in stock.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#C5A880]/10 border border-[#C5A880]/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-[#967447] text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Need It Faster?</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-normal">
                    Contact founders Lemuel & Methodius on WhatsApp for custom requests or estimated procurement dates.
                  </p>
                  <a
                    href={`https://wa.me/233544774393?text=${encodeURIComponent(`Hi Lemuel & Methodius, I'm on the waitlist for "${product.name}" (Size: ${selectedSize}). Any ETA on restocking?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat With Founders on WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Size Preference if product has sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                      Preferred Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setSelectedSize(s);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                            selectedSize === s
                              ? 'bg-zinc-950 text-white shadow-md'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedSize('Any Size');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                          selectedSize === 'Any Size'
                            ? 'bg-zinc-950 text-white shadow-md'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        Any Size
                      </button>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-950 focus:outline-hidden text-xs font-medium text-zinc-900 transition-colors"
                  />
                </div>

                {/* Contact Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp / Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="054 123 4567"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-950 focus:outline-hidden text-xs font-medium text-zinc-900 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kwame@example.com"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-950 focus:outline-hidden text-xs font-medium text-zinc-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Notification Channel Preference */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                    Notify Me Via
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                      { id: 'email', label: 'Email', icon: Mail },
                      { id: 'both', label: 'Both', icon: Bell }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = channel === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setChannel(opt.id as any);
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-zinc-950 text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-zinc-950 hover:bg-black text-white font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
                        <span>Reserving Spot...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 text-[#C5A880]" />
                        <span>{alreadyJoined ? 'Update Waitlist Spot' : 'Join Priority Waitlist'}</span>
                      </>
                    )}
                  </button>
                  <p className="text-[9px] font-mono text-center text-zinc-400 mt-2">
                    Zero spam. Only a direct restock notification ping when available.
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WaitlistModal;
