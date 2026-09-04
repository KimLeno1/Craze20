
import React, { useState, useEffect } from 'react';
import { CartItem, ViewState, OrderStatus, PromoCode, CheckoutProtocol } from '../types';
import { getImageUrl } from '../lib/imageUtils';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { PurchaseCelebration } from './PurchaseCelebration';
import { trackPlausibleEvent } from '../lib/analytics';

interface CheckoutViewProps {
  items: CartItem[];
  onComplete: (orderDetails: any) => void;
  onCancel: () => void;
  balances: { coins: number; gems: number; rep: number; credit?: number };
  activePromo?: PromoCode | null;
  rank?: any;
  protocols: CheckoutProtocol[];
  onSaveProtocol: (protocol: CheckoutProtocol) => Promise<void>;
  onClearCart?: () => void;
}

const REGIONS = [
  { id: 'accra', name: 'Greater Accra', icon: '🏛️', cities: ['Accra', 'Tema', 'Madina', 'Adenta', 'Ashaiman'] },
  { id: 'ashanti', name: 'Ashanti', icon: '🏺', cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong'] },
  { id: 'western', name: 'Western', icon: '⚓', cities: ['Sekondi-Takoradi', 'Tarkwa', 'Axim', 'Elubo'] },
  { id: 'central', name: 'Central', icon: '🏰', cities: ['Cape Coast', 'Winneba', 'Kasoa', 'Saltpond'] },
  { id: 'eastern', name: 'Eastern', icon: '⛰️', cities: ['Koforidua', 'Nkawkaw', 'Nsawam', 'Akosombo'] },
  { id: 'northern', name: 'Northern', icon: '🕌', cities: ['Tamale', 'Yendi', 'Savelugu'] },
  { id: 'volta', name: 'Volta', icon: '🌊', cities: ['Ho', 'Hohoe', 'Kpando', 'Aflao'] },
  { id: 'bono', name: 'Bono', icon: '🌳', cities: ['Sunyani', 'Berekum', 'Dormaa Ahenkro'] },
  { id: 'bono-east', name: 'Bono East', icon: '🌽', cities: ['Techiman', 'Kintampo', 'Nkoranza'] },
  { id: 'ahafo', name: 'Ahafo', icon: '💎', cities: ['Goaso', 'Mim', 'Bechem'] },
  { id: 'upper-east', name: 'Upper East', icon: '🌞', cities: ['Bolgatanga', 'Bawku', 'Navrongo'] },
  { id: 'upper-west', name: 'Upper West', icon: '🏹', cities: ['Wa', 'Jirapa', 'Tumu'] },
  { id: 'savannah', name: 'Savannah', icon: '🐘', cities: ['Damongo', 'Buipe', 'Salaga'] },
  { id: 'north-east', name: 'North East', icon: '🛡️', cities: ['Nalerigu', 'Gambaga', 'Walewale'] },
  { id: 'oti', name: 'Oti', icon: '🛶', cities: ['Dambai', 'Jasikan', 'Nkwanta'] },
  { id: 'western-north', name: 'Western North', icon: '🌲', cities: ['Sefwi Wiawso', 'Enchi', 'Bibiani'] }
];

const CheckoutView: React.FC<CheckoutViewProps> = ({ 
  items, 
  onComplete, 
  onCancel, 
  balances, 
  activePromo,
  protocols,
  onSaveProtocol,
  onClearCart
}) => {
  const [step, setStep] = useState<'SELECTION' | 'GEO_ZONING' | 'LOGISTICS' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS'>(
    protocols.length > 0 ? 'SELECTION' : 'GEO_ZONING'
  );
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('cc-checkout-formData');
    try {
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      name: '',
      phone: '',
      address: '',
      region: '',
      city: '',
      verificationPhrase: ''
    };
  });
  const [paymentMethod] = useState<'PAYSTACK'>('PAYSTACK');

  const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalShipping = items.reduce((acc, item) => acc + ((item.shippingFee || 0) * item.quantity), 0);
  const userCredit = balances.credit || 0;
  
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [appliedCodeInput, setAppliedCodeInput] = useState('');
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleApplyCode = async () => {
    const code = appliedCodeInput.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCode(true);
    setCodeMessage(null);

    try {
      // 1. Try referral code validation
      const refRes = await databaseService.validateReferralCode(code);
      if (refRes && refRes.valid) {
        if (rawSubtotal < (refRes.minOrderAmount || 100)) {
          setCodeMessage({ text: `Min order amount of GH₵${refRes.minOrderAmount || 100} required for referral code.`, type: 'error' });
          setReferralDiscount(0);
        } else {
          setReferralDiscount(refRes.discountAmount || 20);
          setCodeMessage({ text: `✓ KFAM Referral discount applied! Saved GH₵${refRes.discountAmount || 20}`, type: 'success' });
          // Track referral link for this user
          const userId = localStorage.getItem('cc-user-id');
          if (userId) {
            databaseService.trackReferral(code, userId);
          }
        }
        setIsValidatingCode(false);
        return;
      }
    } catch (e) {}

    // 2. Try standard promo code
    try {
      const promos = await databaseService.getPromoCodes();
      const match = promos.find((p: any) => p.code?.toUpperCase() === code);
      if (match) {
        const disc = match.type === 'PERCENT' ? Math.floor(rawSubtotal * (match.value / 100)) : match.value;
        setReferralDiscount(disc);
        setCodeMessage({ text: `✓ Promo code "${code}" applied! Saved GH₵${disc}`, type: 'success' });
      } else {
        setCodeMessage({ text: 'Invalid promo or referral code.', type: 'error' });
        setReferralDiscount(0);
      }
    } catch (e) {
      setCodeMessage({ text: 'Failed to validate code.', type: 'error' });
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Calculate Savings
  let promoDiscount = referralDiscount;
  if (activePromo && !referralDiscount) {
    if (activePromo.type === 'PERCENT') {
      promoDiscount = Math.floor(rawSubtotal * (activePromo.value / 100));
    } else {
      promoDiscount = Math.min(rawSubtotal, activePromo.value);
    }
  }
  
  const subtotalAfterPromo = Math.max(0, rawSubtotal - promoDiscount);
  const creditApplied = useStoreCredit ? Math.min(subtotalAfterPromo + totalShipping, userCredit) : 0;
  const finalTotal = Math.max(0, Math.floor(subtotalAfterPromo + totalShipping - creditApplied));
  const availableCities = REGIONS.find(r => r.name === formData.region)?.cities || [];
  const userEmail = localStorage.getItem('cc-user-email') || 'buyer@closetkraze.top';

  useEffect(() => {
    trackPlausibleEvent('start_checkout', {
      amount: finalTotal,
      currency: 'GHC',
      item_count: items.reduce((acc, i) => acc + i.quantity, 0)
    });
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'GEO_ZONING') {
      if (!formData.region || !formData.city) {
        toast.error("Regional Lock: Region and City required.");
        return;
      }
      setStep('LOGISTICS');
    } else if (step === 'LOGISTICS') {
      setStep('PAYMENT');
    }
  };

  const handleFinalize = async () => {
    handlePaystackPayment();
  };

  const handlePaystackPayment = async () => {
    const userEmail = localStorage.getItem('cc-user-email') || 'buyer@closetkraze.top';
    const userId = localStorage.getItem('cc-user-id') || 'guest';
    setStep('PROCESSING');
    try {
      const orderId = `ord_${Date.now()}`;
      
      const orderDetails = {
        id: orderId,
        userId: userId,
        userName: formData.name,
        total: finalTotal,
        status: 'PROCESSING',
        timestamp: new Date().toISOString(),
        items: items.map(item => ({
          ...item, 
          customizationDetails: item.customizationData,
          selectedColorVariant: item.selectedColorVariant
        })),
        deliveryAddress: JSON.stringify(formData),
        creditUsed: creditApplied
      };

      // Save form data to localStorage for persistence across redirect callback
      localStorage.setItem('cc-checkout-formData', JSON.stringify(formData));

      if (finalTotal === 0) {
        toast.info("Order fully covered by Credit Points.");
        const createRes = await databaseService.createOrder(orderDetails);
        if (createRes.status === 'success') {
           setStep('SUCCESS');
           trackPlausibleEvent('complete_purchase', {
             amount: 0,
             currency: 'GHC',
             order_id: orderId,
             item_count: items.reduce((acc, i) => acc + i.quantity, 0)
           });
           if (onClearCart) onClearCart();
        } else {
           toast.error(createRes.message || "Order creation failed.");
           setStep('PAYMENT');
        }
        
        // Save logistics for future use
        if (userId !== 'guest') {
          const isNewProtocol = !protocols.some(p => p.name === formData.name && p.city === formData.city);
          if (isNewProtocol && protocols.length < 3) {
            await onSaveProtocol({
              id: `proto_${Date.now()}`,
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
              region: formData.region,
              city: formData.city
            });

            const currentPrefs = await databaseService.getUserPreferences(userId);
            await databaseService.saveUserPreferences(userId, {
              ...currentPrefs,
              userId,
              checkoutProtocolCompleted: true
            });
          }
        }
        return;
      }
      
      const data = await databaseService.initializePaystackTransaction(
        userEmail,
        finalTotal,
        { 
           orderId, 
           type: 'STANDARD_CHECKOUT',
           orderDetails 
        },
        { callback_url: `${window.location.origin}${window.location.pathname}` }
      );
      
      if (data.status) {
        // We no longer create the order here. We verify payment before adding the order.
        
        // Save logistics for future use
        if (userId !== 'guest') {
          const isNewProtocol = !protocols.some(p => p.name === formData.name && p.city === formData.city);
          if (isNewProtocol && protocols.length < 3) {
            await onSaveProtocol({
              id: `proto_${Date.now()}`,
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
              region: formData.region,
              city: formData.city
            });

            // Update preferences
            if (userId !== 'guest') {
              const currentPrefs = await databaseService.getUserPreferences(userId);
              await databaseService.saveUserPreferences(userId, {
                ...currentPrefs,
                userId,
                checkoutProtocolCompleted: true
              });
            }
          }
        }

        // Standard Checkout Redirect flow
        if (data.data.authorization_url) {
          toast.info("Redirecting to Paystack secure checkout...");
          window.location.href = data.data.authorization_url;
        } else {
          toast.error("Paystack checkout URL not generated.");
          setStep('PAYMENT');
        }
      } else {
        toast.error("Paystack Initialization Failed: " + (data.message || "Unknown error"));
        setStep('PAYMENT');
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Payment Error. Check console.");
      setStep('PAYMENT');
    }
  };

  const verifyPayment = async (reference: string, orderId?: string) => {
    setStep('PROCESSING');
    try {
      // Although we call verifyPaystackTransaction here which updates paystack_transactions,
      // the real verfication happens synchronously inside createOrder API now!
      const data = await databaseService.verifyPaystackTransaction(reference);
      if (data.status && data.data.status === 'success') {
        
        const userId = localStorage.getItem('cc-user-id') || 'guest';
        const finalOrderId = orderId || `ord_${Date.now()}`;
        
        // Add the order to the database ONLY after verification!
        const createRes = await databaseService.createOrder({
          id: finalOrderId,
          userId: userId,
          userName: formData.name,
          total: finalTotal,
          status: 'PROCESSING',
          timestamp: new Date().toISOString(),
          items: items.map(item => ({
            ...item, 
            customizationDetails: item.customizationData,
            selectedColorVariant: item.selectedColorVariant
          })),
          deliveryAddress: JSON.stringify(formData),
          paystackReference: reference,
          creditUsed: creditApplied
        });

        if (createRes.status === 'success') {
           setStep('SUCCESS');
           if (onClearCart) onClearCart();
        } else {
           toast.error(createRes.message || "Order creation failed after payment.");
           setStep('PAYMENT');
        }
      } else {
        toast.error("Payment verification failed.");
        setStep('PAYMENT');
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStep('PAYMENT');
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    
    if (reference || trxref) {
      const ref = reference || trxref;
      if (ref) verifyPayment(ref);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);



  if (step === 'PROCESSING') {
    return (
      <div className="fixed inset-0 z-[250] bg-white flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="relative">
          <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-zinc-100 border-t-zinc-950 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl">⚡</div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif italic text-zinc-950 mt-8 sm:mt-12 tracking-tighter uppercase">Processing Order...</h2>
        <p className="text-[7px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-[0.5em] mt-4">Preparing your items</p>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <PurchaseCelebration
        orderTotal={finalTotal}
        deliveryCity={formData.city || 'Central Protocol'}
        items={items}
        onDismiss={() => 
          onComplete({ 
            ...formData, 
            items: items.map(item => ({
              ...item,
              customizationDetails: item.customizationData // Map to customizationDetails for order consistency
            })), 
            total: finalTotal 
          })
        }
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col lg:flex-row animate-in fade-in duration-500 overflow-y-auto overflow-x-hidden">
      {/* Order Summary Panel (Sidebar) */}
      {step === 'PAYMENT' && (
        <div className="w-full lg:w-[400px] bg-zinc-50 p-5 sm:p-8 flex flex-col gap-4 sm:gap-10 border-l border-zinc-100 order-2 lg:order-2 shrink-0">
           <div className="space-y-2">
              <h2 className="text-lg sm:text-2xl font-serif italic text-zinc-950 underline decoration-zinc-200 underline-offset-8">Order Summary</h2>
           </div>

           <div className="space-y-3 sm:space-y-4 max-h-[30vh] lg:max-h-none overflow-y-auto pr-2 scrollbar-hide">
               {items.map(item => (
                 <div key={`${item.id}-${item.selectedSize}-${JSON.stringify(item.selectedColorVariant || 'default')}`} className="flex gap-3 sm:gap-4 items-center bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-100 group hover:border-zinc-300 transition-all shadow-sm">
                    <div className="w-8 h-12 sm:w-12 sm:h-16 rounded-lg overflow-hidden transition-all bg-zinc-100 flex-shrink-0">
                       <img src={getImageUrl(item.image)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="text-[7.5px] sm:text-[9px] font-black text-zinc-950 uppercase truncate">{item.name}</div>
                       <div className="text-[6px] sm:text-[7px] text-zinc-400 font-black uppercase mt-1 flex flex-wrap gap-1 items-center">
                         {item.isBundle ? 'Synergy Kit' : `Size: ${item.selectedSize || 'OS'}`} 
                         {item.selectedColorVariant && (
                           <>
                             <span>•</span>
                             <div className="flex items-center -space-x-0.5">
                               <div className="w-1.5 h-1.5 rounded-full border border-black/30 z-10" style={{ backgroundColor: item.selectedColorVariant.main }} />
                               <div className="w-1.5 h-1.5 rounded-full border border-black/30" style={{ backgroundColor: item.selectedColorVariant.secondary }} />
                             </div>
                             <span className="text-[6px]">{item.selectedColorVariant.main} / {item.selectedColorVariant.secondary}</span>
                           </>
                         )}
                         <span>•</span> Qty: {item.quantity}
                       </div>
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-mono font-black text-zinc-950 whitespace-nowrap">GH₵{item.price * item.quantity}</div>
                 </div>
               ))}
           </div>

           <div className="pt-4 sm:pt-8 border-t border-zinc-100 space-y-3 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                 <div className="flex justify-between items-center text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-zinc-500">GH₵{rawSubtotal}</span>
                 </div>
                 <div className="flex justify-between items-center text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Shipping</span>
                    <span>+ GH₵{totalShipping}</span>
                 </div>
                 {activePromo && (
                   <div className="flex justify-between items-center text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-600">
                      <span>Promo</span>
                      <span>- GH₵{promoDiscount}</span>
                   </div>
                 )}
                 {creditApplied > 0 && (
                   <div className="flex justify-between items-center text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-950">
                      <span>Credit</span>
                      <span>- GH₵{creditApplied}</span>
                   </div>
                 )}
              </div>

              <div className="flex flex-col items-end border-t border-zinc-100 pt-4">
                 <span className="text-[7px] sm:text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-1">Final Valuation</span>
                 <div className="text-2xl sm:text-5xl font-mono font-black text-zinc-950 tracking-tighter">GH₵{finalTotal}</div>
              </div>
           </div>
        </div>
      )}

      {/* Logic Panel (Main Flow) */}
      <div className="flex-1 p-5 sm:p-8 lg:p-12 order-1 flex flex-col min-h-[70vh] lg:min-h-screen">
        <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-12">
          {/* Progress Indication */}
          <div className="flex items-center gap-3 sm:gap-6">
            {['GEO_ZONING', 'LOGISTICS', 'PAYMENT'].map((s, idx) => {
              const isActive = step === s;
              const isPast = ['LOGISTICS', 'PAYMENT', 'SUCCESS'].includes(step) && s === 'GEO_ZONING' || (step === 'PAYMENT' && s === 'LOGISTICS');
              return (
                <div key={s} className="flex items-center gap-3 sm:gap-6 flex-1 last:flex-none">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[8px] sm:text-xs font-black border transition-all duration-500 ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : isPast ? 'bg-emerald-50 text-white border-emerald-500' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                    {isPast ? '✓' : idx + 1}
                  </div>
                  {idx < 2 && <div className={`h-[1px] flex-1 transition-all duration-700 ${isPast ? 'bg-emerald-500/30' : 'bg-zinc-100'}`}></div>}
                </div>
              );
            })}
          </div>

          {step === 'SELECTION' && (
            <div className="space-y-6 sm:space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-2xl sm:text-5xl font-serif italic text-zinc-950 leading-none tracking-tighter">Checkout Protocol</h2>
                <p className="text-[7px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Select a saved identity for rapid deployment</p>
              </div>

              <div className="grid gap-3">
                {protocols.map((protocol) => (
                  <button
                    key={protocol.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        ...protocol,
                        verificationPhrase: ''
                      });
                      setStep('PAYMENT');
                      toast.success(`Protocol Linked: ${protocol.name}`);
                    }}
                    className="w-full bg-white border border-zinc-100 p-5 rounded-2xl flex items-center justify-between group hover:border-zinc-300 transition-all text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-sm font-black text-zinc-950 uppercase truncate">{protocol.name}</div>
                        <div className="text-[7.5px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest">{protocol.city}, {protocol.region}</div>
                      </div>
                    </div>
                    <span className="text-[7.5px] font-black text-zinc-950 uppercase tracking-widest hidden sm:block">Select →</span>
                  </button>
                ))}

                {protocols.length < 3 && (
                  <button
                    onClick={() => setStep('GEO_ZONING')}
                    className="w-full border-2 border-dashed border-zinc-100 p-6 rounded-2xl flex items-center justify-center gap-3 text-zinc-300 hover:text-zinc-950 transition-all group hover:border-zinc-300"
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform">+</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">New Protocol</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setStep('GEO_ZONING')}
                  className="w-full py-4 border border-zinc-100 text-zinc-400 hover:text-zinc-950 rounded-2xl font-black uppercase text-[8px] tracking-widest hover:bg-zinc-50 transition-all"
                >
                  Skip to Manual Entry
                </button>
              </div>
            </div>
          )}

          {step === 'GEO_ZONING' && (
            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
               <div className="flex justify-between items-start">
                  <div className="space-y-2 sm:space-y-3">
                     <h2 className="text-3xl sm:text-5xl font-serif italic text-zinc-950 leading-none tracking-tighter">What is your region?</h2>
                     <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Select your location in Ghana</p>
                  </div>
               </div>

               <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {REGIONS.map(r => {
                      const isSelected = formData.region === r.name;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setFormData({...formData, region: r.name, city: ''})}
                          className={`p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] border transition-all duration-500 flex flex-col items-center gap-2 group ${isSelected ? 'bg-zinc-950 border-zinc-950 shadow-xl' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-300'}`}
                        >
                          <span className={`text-xl sm:text-2xl transition-transform group-hover:scale-110 ${isSelected ? 'grayscale-0' : 'grayscale opacity-40'}`}>{r.icon}</span>
                          <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{r.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.region && (
                    <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-top-4 duration-500">
                       <label className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Select City</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                          {availableCities.map(city => {
                            const isSelected = formData.city === city;
                            return (
                              <button
                                key={city}
                                onClick={() => setFormData({...formData, city})}
                                className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border transition-all duration-300 text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'bg-zinc-950 border-zinc-950 text-white shadow-xl' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400'}`}
                              >
                                {city}
                              </button>
                            );
                          })}
                       </div>
                    </div>
                  )}
               </div>

               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                 <button 
                  onClick={() => setStep('LOGISTICS')} 
                  disabled={!formData.region || !formData.city} 
                  className="w-full py-6 sm:py-8 bg-blue-600 text-white rounded-[2rem] sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-[12px] tracking-[0.4em] hover:bg-blue-700 transition-all disabled:opacity-20 active:scale-95 shadow-2xl relative overflow-hidden group"
                 >
                   <span className="relative z-10">Confirm Region</span>
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                 </button>
               </div>
            </div>
          )}

          {step === 'LOGISTICS' && (
            <form onSubmit={handleNextStep} className="space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
               <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-3xl sm:text-5xl font-serif italic text-zinc-950 leading-none tracking-tighter">Shipping Details</h2>
                  <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Enter your delivery information</p>
               </div>
               
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Full Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-xs font-black text-zinc-950 focus:border-zinc-950 outline-none placeholder:text-zinc-200" placeholder="YOUR NAME" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Phone Number</label>
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-xs font-black text-zinc-950 focus:border-zinc-950 outline-none placeholder:text-zinc-200" placeholder="+233 XX XXX XXXX" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Delivery Address</label>
                      <textarea required rows={1} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-xs font-black text-zinc-950 focus:border-zinc-950 outline-none resize-none placeholder:text-zinc-200" placeholder="STREET / APARTMENT / LANDMARK" />
                    </div>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                 <button type="button" onClick={() => setStep('GEO_ZONING')} className="w-full sm:flex-1 py-4 sm:py-6 bg-zinc-50 text-zinc-400 rounded-[2rem] sm:rounded-[2.5rem] font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:text-zinc-950 transition-all border border-zinc-100">Back</button>
                 <button type="submit" className="w-full sm:flex-[2] py-6 sm:py-8 bg-blue-600 text-white rounded-[2rem] sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-[12px] tracking-[0.4em] hover:bg-blue-700 transition-all shadow-2xl active:scale-95">Confirm Details</button>
               </div>
            </form>
          )}

          {step === 'PAYMENT' && (
            <div className="space-y-8 sm:space-y-12 animate-in slide-in-from-bottom-6 duration-700 pb-20">
               <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-3xl sm:text-5xl font-serif italic text-zinc-950 leading-none tracking-tighter">Payment Method</h2>
                  <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Choose how you want to pay</p>
               </div>

               <div className="space-y-4">
                 {/* PROMO / REFERRAL CODE INPUT */}
                 <div className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem]">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Have a Promo or KFAM Referral Code?</label>
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={appliedCodeInput}
                       onChange={e => setAppliedCodeInput(e.target.value.toUpperCase())}
                       placeholder="e.g. CK-KWAM1234 or PROMO10"
                       className="flex-1 bg-white border border-zinc-200 px-4 py-3 rounded-xl text-xs font-mono font-black text-zinc-950 focus:border-blue-600 outline-none uppercase"
                     />
                     <button
                       type="button"
                       onClick={handleApplyCode}
                       disabled={isValidatingCode || !appliedCodeInput.trim()}
                       className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-all disabled:opacity-50"
                     >
                       {isValidatingCode ? 'Checking...' : 'Apply'}
                     </button>
                   </div>
                   {codeMessage && (
                     <p className={`text-[10px] font-bold mt-2 px-3 py-1.5 rounded-lg ${
                       codeMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                     }`}>
                       {codeMessage.text}
                     </p>
                   )}
                 </div>

                 {userCredit > 0 && (
                   <div className="bg-zinc-50 border border-zinc-100 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem]">
                     <div className="flex items-center justify-between gap-4">
                       <div>
                         <div className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-widest">Apply Credit Points</div>
                         <div className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Balance: GH₵{userCredit}</div>
                       </div>
                       <button
                         type="button"
                         onClick={() => setUseStoreCredit(!useStoreCredit)}
                         className={`w-12 h-6 sm:w-16 sm:h-8 rounded-full border-2 transition-all flex items-center p-1 ${useStoreCredit ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-200 bg-zinc-100'}`}
                       >
                         <div className={`w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-white transition-all transform ${useStoreCredit ? 'translate-x-5 sm:translate-x-7 shadow-lg' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 )}
               </div>

               <div className="bg-white border border-zinc-100 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] space-y-6 sm:space-y-8 shadow-sm">
                  <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                     <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <div>
                           <div className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">Paystack Gateway</div>
                           <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Active Secure Terminal</div>
                        </div>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>

                  <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    <span>Destination</span>
                    <span className="text-zinc-950">{formData.city}, {formData.region}</span>
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-t border-zinc-100 pt-4 sm:pt-6">
                    <span>Total Amount</span>
                    <span className="text-zinc-950 font-mono text-lg sm:text-xl">GH₵{finalTotal}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-100 text-center space-y-2">
                    <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest">Redirecting to Paystack Secure Gateway</p>
                    <div className="flex justify-center gap-2">
                      <span className="w-2 h-2 bg-zinc-950 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-zinc-950 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-zinc-950 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-4 sm:gap-6">
                 <button onClick={handleFinalize} className="w-full py-6 sm:py-10 bg-blue-600 text-white rounded-[2rem] sm:rounded-[3rem] font-black uppercase text-xs sm:text-sm tracking-[0.5em] hover:bg-blue-700 transition-all shadow-2xl active:scale-95">
                   Confirm Order
                 </button>
                 <button onClick={() => setStep('LOGISTICS')} className="text-[8px] sm:text-[10px] font-black text-zinc-300 hover:text-zinc-950 uppercase tracking-[0.5em] transition-colors mx-auto underline decoration-zinc-100 underline-offset-8">Review Details</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
