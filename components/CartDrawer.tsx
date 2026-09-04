import React, { useState, useEffect } from 'react';
import { CartItem, ViewState, PromoCode, RankBenefits, UserStats } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Gift, Share2, Copy, Plus, MapPin, CheckCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onUpdateQuantity: (id: string, delta: number, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onClear: () => void;
  onNavigate?: (view: ViewState) => void;
  activePromo?: PromoCode | null;
  rank: RankBenefits;
  currentView: ViewState;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQuantity, 
  onClear, 
  onNavigate,
  activePromo,
  rank,
  currentView
}) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [applyCredit, setApplyCredit] = useState(false);
  const [haulTarget, setHaulTarget] = useState<number>(() => Number(localStorage.getItem('cc-haul-target') || '0'));
  const [isFlashing, setIsFlashing] = useState(false);

  // Pay For Me state variables
  const [protocols, setProtocols] = useState<any[]>([]);
  const [protocolsLoading, setProtocolsLoading] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [newProtocolForm, setNewProtocolForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    region: ''
  });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{ url: string; requestId: string } | null>(null);

  const fetchProtocols = async () => {
    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      setProtocolsLoading(true);
      try {
        const userProtocols = await databaseService.getUserLogistics(userId);
        setProtocols(Array.isArray(userProtocols) ? userProtocols : []);
      } catch (e) {
        console.error(e);
      } finally {
        setProtocolsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedCartItem) {
      fetchProtocols();
    }
  }, [selectedCartItem]);

  const handleInitiatePayForMe = (item: CartItem) => {
    const userId = localStorage.getItem('cc-user-id');
    if (!userId || userId === 'guest') {
      toast.error("Please authenticate to use the Pay For Me feature.");
      return;
    }
    setSelectedCartItem(item);
    setShowAddProtocol(false);
    setPaymentLink(null);
    setNewProtocolForm({ name: '', phone: '', address: '', city: '', region: '' });
  };

  const handleCreatePayForMeRequest = async (protocol: any) => {
    if (!selectedCartItem) return;
    const userId = localStorage.getItem('cc-user-id') || 'guest';
    const userHandle = localStorage.getItem('cc-user-handle') || 'Guest User';
    
    setGeneratingId(selectedCartItem.id);
    try {
      const requestId = `pfm_${Date.now()}`;
      const itemTotal = (selectedCartItem.price + (selectedCartItem.shippingFee || 0)) * selectedCartItem.quantity;
      
      const newRequest = {
        id: requestId,
        userId: userId,
        userName: userHandle,
        items: [selectedCartItem],
        total: itemTotal,
        amountPaid: 0,
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        message: `Could you please sponsor my request for ${selectedCartItem.name}?`,
        shippingProtocol: protocol
      };

      await databaseService.createPayForMeRequest(newRequest);
      
      const shareLink = `${window.location.origin}/payformeshared/${userHandle}/${selectedCartItem.id}/${requestId}`;
      setPaymentLink({ url: shareLink, requestId });
      
      // Remove item from cart!
      onRemove(selectedCartItem.id, selectedCartItem.selectedSize, selectedCartItem.selectedColorVariant);
      toast.success("Pay For Me request successfully structured!");
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Failed to structure sponsorship request. Please try again.";
      toast.error(msg);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreateProtocolAndSubmit = async () => {
    const userId = localStorage.getItem('cc-user-id') || 'guest';
    const { name, phone, address, city, region } = newProtocolForm;
    if (!name || !phone || !address || !city || !region) {
      toast.error('Strategic alert: All checkout protocol fields must be completed.');
      return;
    }
    
    const newProtocol = {
      id: `cp_${Date.now()}`,
      name,
      phone,
      address,
      city,
      region,
      isDefault: protocols.length === 0
    };
    
    try {
      setGeneratingId(selectedCartItem?.id || 'protocol');
      const updated = [...protocols, newProtocol];
      await databaseService.saveUserLogistics(userId, updated);
      setProtocols(updated);
      toast.success('Logistics protocol registered to profile!');
      setShowAddProtocol(false);
      // Immediately proceed with creating the Pay For Me request!
      await handleCreatePayForMeRequest(newProtocol);
    } catch (e) {
      toast.error('Failed to secure logistics protocol.');
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    localStorage.setItem('cc-haul-target', haulTarget.toString());
  }, [haulTarget]);

  useEffect(() => {
    const fetchUserStats = async () => {
      const userId = localStorage.getItem('cc-user-id');
      if (userId && isOpen) {
        try {
          const stats = await databaseService.getUserStats(userId);
          setUserStats(stats);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchUserStats();
  }, [isOpen]);

  const subtotalProductsMarket = items.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
  const totalShipping = items.reduce((acc, item) => acc + ((item.shippingFee || 0) * item.quantity), 0);
  
  // Base valuation is the shop price
  const subtotalShopPrice = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let baseValuation = subtotalShopPrice;
  
  // Apply Promo Fragment
  if (activePromo) {
    if (activePromo.type === 'PERCENT') {
      baseValuation = baseValuation * (1 - activePromo.value / 100);
    } else {
      baseValuation = Math.max(0, baseValuation - activePromo.value);
    }
  }

  const finalValuationBeforeCredit = Math.floor(baseValuation + totalShipping);
  
  const availableCredit = userStats?.storeCredit || 0;
  const appliedCredit = applyCredit ? Math.min(availableCredit, finalValuationBeforeCredit) : 0;
  const finalValuation = finalValuationBeforeCredit - appliedCredit;

  const [expiry, setExpiry] = useState(600); // 10 minutes
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const timer = setInterval(() => {
      setExpiry(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, items]);

  const min = Math.floor(expiry / 60);
  const sec = expiry % 60;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full md:max-w-xl bg-white z-[210] shadow-[-30px_0_100px_rgba(0,0,0,0.1)] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border-l border-zinc-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col relative overflow-hidden">
          
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <header id="cart-drawer-header" className="relative z-10 px-5 py-6 md:px-12 md:py-10 flex justify-between items-start border-b border-zinc-200 bg-white">
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo1.png" alt="CK Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" referrerPolicy="no-referrer" />
                <div className="flex flex-col">
                  <span className="text-[7px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] md:tracking-[0.4em]">{rank.tier} ARCHIVE</span>
                  <span className="text-[5px] md:text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Protocol ID: {Math.floor(Math.random() * 99999).toString().padStart(5, '0')}</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif italic text-zinc-950 tracking-tighter leading-none">Your Cart</h2>
              
              {currentView === ViewState.SCROLL_MODE && (
                <div className="flex items-center gap-3 py-2 border-t border-zinc-100 mt-3">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Scroll Safeguard</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number" 
                        min="0"
                        value={haulTarget}
                        onChange={(e) => setHaulTarget(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-10 bg-transparent border-b border-blue-200 text-zinc-950 font-mono text-xs focus:border-blue-600 outline-none"
                      />
                      <span className="text-[8px] font-black text-zinc-400 uppercase">Items</span>
                    </div>
                  </div>
                  {haulTarget > 0 && (
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className={items.reduce((acc, i) => acc + i.quantity, 0) > haulTarget ? 'text-red-500 animate-pulse' : 'text-zinc-300'}>
                          {items.reduce((acc, i) => acc + i.quantity, 0) > haulTarget ? `+${items.reduce((acc, i) => acc + i.quantity, 0) - haulTarget} OVER_LIMIT` : 'Progress'}
                        </span>
                        <span className={items.reduce((acc, i) => acc + i.quantity, 0) > haulTarget ? 'text-red-500' : 'text-zinc-300'}>
                           {items.reduce((acc, i) => acc + i.quantity, 0)}/{haulTarget}
                        </span>
                      </div>
                      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${items.reduce((acc, i) => acc + i.quantity, 0) > haulTarget ? 'bg-red-500' : 'bg-blue-600'} shadow-[0_0_10px_currentColor] transition-all duration-700`} 
                          style={{ width: `${Math.min(100, (items.reduce((acc, i) => acc + i.quantity, 0) / haulTarget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              id="cart-drawer-close"
              onClick={onClose} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:bg-blue-600 hover:text-white transition-all hover:rotate-90 group"
            >
              <span className="group-hover:scale-125 transition-transform">✕</span>
            </button>
          </header>


          <div id="cart-items-list" className="flex-1 overflow-y-auto px-5 md:px-12 py-6 md:py-10 space-y-8 md:space-y-14 scrollbar-hide relative z-10 bg-white">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-8">
                <div className="text-6xl md:text-[120px] mb-8 opacity-10 grayscale">🎒</div>
                <h3 className="text-xl font-serif italic text-zinc-300 mb-2">Cart is Empty</h3>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest leading-loose max-w-[180px] mb-10">Search the circuit for rare silhouette drops.</p>
                <button 
                  id="empty-cart-return"
                  onClick={onClose} 
                  className="px-10 py-4 bg-zinc-950 text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                >Return to Circuit</button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div 
                  key={`${item.id}-${item.selectedSize}-${JSON.stringify(item.selectedColorVariant || 'default')}`} 
                  className="group flex flex-row gap-4 sm:gap-8 animate-in slide-in-from-right-12 duration-500 stagger"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-20 sm:w-32 md:w-40 aspect-[3/4] bg-zinc-50 group-hover:-rotate-2 transition-transform duration-700 overflow-hidden relative border border-zinc-100 rounded-xl shrink-0">
                    <img src={getImageUrl(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="text-[7px] md:text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                                {item.isBundle ? 'Synergy Kit' : `Sec_${item.category}`}
                              </div>
                              <span className="w-1 h-1 rounded-full bg-zinc-100"></span>
                              <div className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                {item.selectedSize || 'N/A'}
                              </div>
                              {item.selectedColorVariant && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-zinc-100"></span>
                                  <div className="flex items-center gap-1 group/colors">
                                    <div className="flex -space-x-1">
                                      <div className="w-2 h-2 rounded-full border border-black/10 z-10" style={{ backgroundColor: item.selectedColorVariant.main }} />
                                      <div className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: item.selectedColorVariant.secondary }} />
                                    </div>
                                    <div className="text-[7px] md:text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                      {item.selectedColorVariant.main} / {item.selectedColorVariant.secondary}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <h3 className="text-base md:text-2xl font-serif italic text-zinc-950 tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                        </div>
                        <button 
                          onClick={() => onRemove(item.id, item.selectedSize, item.selectedColorVariant)} 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-300 hover:text-black transition-all text-[10px]"
                        >✕</button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 gap-4 w-fit">
                          <button onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColorVariant)} className="text-lg text-zinc-300 hover:text-black transition-colors w-5 h-5 flex items-center justify-center">-</button>
                          <span className="text-[10px] font-mono font-black text-zinc-950 w-5 text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColorVariant)} className="text-lg text-zinc-300 hover:text-black transition-colors w-5 h-5 flex items-center justify-center">+</button>
                        </div>
                        <button 
                          onClick={() => handleInitiatePayForMe(item)}
                          className="px-3 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-blue-600 hover:border-blue-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                          title="Ask someone to sponsor this item"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Pay For Me
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-end border-t border-zinc-100 pt-3">
                       <div className="flex flex-col">
                         <span className="text-[6px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest">Base Rate</span>
                         <span className="text-zinc-300 text-[10px] font-mono line-through">GH₵{item.originalPrice * item.quantity}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-base md:text-3xl font-mono font-black text-zinc-950 leading-none tracking-tighter">
                             <span className="text-zinc-950">GH₵{item.price * item.quantity}</span>
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <footer id="cart-drawer-footer" className="relative z-10 border-t border-zinc-200 p-6 md:p-12 space-y-8 md:space-y-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] bg-white pb-safe">
              {(userStats?.storeCredit || 0) > 0 && (
                <div id="store-credit-panel" className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 ${applyCredit ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${applyCredit ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                      <span className="text-xs font-black">GH₵</span>
                    </div>
                    <div>
                      <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-0.5">Available Credit</span>
                      <span className="text-base md:text-lg font-mono font-black text-zinc-950">GH₵{userStats?.storeCredit || 0}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setApplyCredit(!applyCredit)}
                    className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-90 ${applyCredit ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'}`}
                  >
                    {applyCredit ? 'Applied' : 'Apply'}
                  </button>
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <div className="w-full bg-zinc-50 border border-zinc-100 p-5 md:p-8 rounded-3xl flex flex-col items-center relative overflow-hidden group hover:bg-zinc-100 transition-colors">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-600/10 transition-all duration-700"></div>
                  <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Value</span>
                  <div className="flex flex-col items-center relative">
                    {applyCredit && (
                      <span className="text-emerald-500 font-mono text-[10px] absolute -top-5 line-through opacity-60">GH₵{finalValuationBeforeCredit}</span>
                    )}
                    <span className="text-2xl md:text-4xl font-mono font-black text-zinc-950 tracking-tighter">GH₵{finalValuation}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  id="checkout-initialize-btn"
                  onClick={() => { 
                    const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
                    if (currentView === ViewState.SCROLL_MODE && haulTarget > 0 && totalItems < haulTarget) {
                      if (!confirm(`Your Scroll Mode Safeguard (${haulTarget} items) is not met. Currently: ${totalItems}. Initialize acquisition anyway?`)) {
                        return;
                      }
                    }
                    setIsFlashing(true);
                    setTimeout(() => {
                      setIsFlashing(false);
                      onClose(); 
                      if (onNavigate) onNavigate(ViewState.CHECKOUT); 
                    }, 500);
                  }} 
                  className={`w-full py-8 md:py-10 text-[12px] md:text-[14px] font-black uppercase tracking-[0.6em] rounded-3xl active:scale-95 transition-all duration-300 relative overflow-hidden group ${
                    isFlashing 
                      ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black shadow-[0_0_80px_rgba(251,191,36,1)] scale-[1.02] border-2 border-[#FFE600]' 
                      : 'bg-zinc-950 text-white hover:bg-blue-600 shadow-xl hover:shadow-blue-500/20'
                  }`}
                >
                  <span className="relative z-10 font-black">
                    {currentView === ViewState.SCROLL_MODE && haulTarget > 0 && items.reduce((acc, i) => acc + i.quantity, 0) < haulTarget 
                      ? 'Incomplete Cart - Finalize?' 
                      : 'Own It'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
                
                <div className="flex justify-center gap-6">
                  <div className="flex items-center gap-2 opacity-30">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-950">Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-950">Verified</span>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>

      {selectedCartItem && (
        <div className="fixed inset-0 z-[600] bg-white/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-zinc-100 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh] text-left">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg md:text-xl font-serif italic text-zinc-950">Structure Sponsorship</h3>
                </div>
                <p className="text-[8px] sm:text-[9px] text-zinc-400 font-black tracking-widest uppercase">
                  Configure delivery credentials for {selectedCartItem.name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCartItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 flex items-center justify-center transition-all cursor-pointer border border-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Loading protocols state */}
            {protocolsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Loading saved logistics...</p>
              </div>
            ) : !paymentLink ? (
              /* SETUP STATE */
              <div className="space-y-6">
                {/* Selected item card brief */}
                <div className="flex gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-sm">
                  <div className="w-16 h-20 bg-white border border-zinc-100 rounded-xl overflow-hidden shrink-0">
                    <img src={getImageUrl(selectedCartItem.image)} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-serif italic text-zinc-950 line-clamp-1">{selectedCartItem.name}</p>
                    <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                      Size: {selectedCartItem.selectedSize || 'Standard'}
                    </p>
                    <p className="text-[9px] font-mono text-blue-600 font-bold">
                      Sponsorship Target: GH₵{(selectedCartItem.price + (selectedCartItem.shippingFee || 0)) * selectedCartItem.quantity}
                    </p>
                  </div>
                </div>

                {/* Protocols selector or Protocol form */}
                {!showAddProtocol ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                        Select delivery destination protocol
                      </p>
                      <button 
                        onClick={() => setShowAddProtocol(true)}
                        className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New Protocol
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                      {protocols.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
                          <p className="text-xs text-zinc-400 font-serif italic mb-3">No delivery protocols on file</p>
                          <button 
                            onClick={() => setShowAddProtocol(true)}
                            className="px-4 py-2 bg-zinc-950 text-white hover:bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                          >
                            Add Protocol
                          </button>
                        </div>
                      ) : (
                        protocols.map((p: any) => (
                          <button
                            key={p.id}
                            disabled={generatingId !== null}
                            onClick={() => handleCreatePayForMeRequest(p)}
                            className="w-full p-4 bg-white border border-zinc-100 hover:border-blue-600/50 hover:bg-blue-50/30 rounded-2xl transition-all text-left flex justify-between items-center cursor-pointer min-h-[64px] active:scale-[0.99] shadow-sm"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-black text-zinc-950 uppercase">{p.name}</p>
                              <p className="text-[9px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                                {p.address}, {p.city} • {p.phone}
                              </p>
                            </div>
                            <CheckCircle className="w-4 h-4 text-zinc-200 hover:text-blue-600 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* ADD PROTOCOL FORM */
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowAddProtocol(false)}
                        className="w-6 h-6 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-950 flex items-center justify-center cursor-pointer transition-all border border-zinc-200"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        Register new delivery credentials
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Recipient Name *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Ama Serwaa"
                          value={newProtocolForm.name}
                          onChange={e => setNewProtocolForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-950 focus:border-blue-600 outline-none rounded-xl shadow-inner placeholder:text-zinc-300"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Phone Number *</label>
                          <input 
                            type="tel" 
                            placeholder="e.g. +233 241234567"
                            value={newProtocolForm.phone}
                            onChange={e => setNewProtocolForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-950 focus:border-blue-600 outline-none rounded-xl shadow-inner placeholder:text-zinc-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">City *</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Accra"
                            value={newProtocolForm.city}
                            onChange={e => setNewProtocolForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-950 focus:border-blue-600 outline-none rounded-xl shadow-inner placeholder:text-zinc-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Delivery Address *</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Plot 15, Ring Road"
                            value={newProtocolForm.address}
                            onChange={e => setNewProtocolForm(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-950 focus:border-blue-600 outline-none rounded-xl shadow-inner placeholder:text-zinc-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Region *</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Greater Accra"
                            value={newProtocolForm.region}
                            onChange={e => setNewProtocolForm(prev => ({ ...prev, region: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-950 focus:border-blue-600 outline-none rounded-xl shadow-inner placeholder:text-zinc-300"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleCreateProtocolAndSubmit}
                        disabled={generatingId !== null}
                        className="w-full py-3.5 bg-blue-600 text-white hover:bg-blue-700 font-black uppercase tracking-widest rounded-xl text-[9px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        {generatingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Register and Structure Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SUCCESS STATE - LINK SHARING */
              <div className="space-y-6 animate-in zoom-in-95 duration-300 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-serif italic text-zinc-950">Sponsorship Request Secured!</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    The sponsorship uplink is secured. Send the generated URL link to your sponsor or contributor.
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3 shadow-inner">
                  <p className="text-[8px] text-blue-600 font-black uppercase tracking-widest text-left">Sponsorship Uplink URL</p>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                    <input 
                      readOnly 
                      value={paymentLink.url}
                      className="flex-1 bg-transparent text-[9px] font-mono text-zinc-400 outline-none overflow-hidden text-ellipsis select-all"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(paymentLink.url);
                        toast.success("Uplink copied to clipboard!");
                      }}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCartItem(null)}
                  className="w-full py-3.5 bg-zinc-100 text-zinc-600 hover:bg-blue-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border border-zinc-200 shadow-sm"
                >
                  Close and View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CartDrawer;