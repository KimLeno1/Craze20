import React, { useState, useMemo, useEffect } from 'react';
import { RankBenefits, Product, PayForMeRequest, PayForMeStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { Share2, Wallet, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PayForMeProps {
  rank: RankBenefits;
  wishlistProducts: Product[];
  onCompleteAcquisition: (product: Product) => void;
  userHandle: string;
  userId: string;
}

const PayForMe: React.FC<PayForMeProps> = ({ rank, wishlistProducts, onCompleteAcquisition, userHandle, userId }) => {
  const [activeRequests, setActiveRequests] = useState<PayForMeRequest[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [paymentLink, setPaymentLink] = useState<{ url: string; requestId: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [selectedPaidRequest, setSelectedPaidRequest] = useState<PayForMeRequest | null>(null);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [wishlistSearch, setWishlistSearch] = useState('');

  const [storeCredit, setStoreCredit] = useState(0);

  // States for Checkout Protocol selection during registration
  const [selectedProductForSponsorship, setSelectedProductForSponsorship] = useState<Product | null>(null);
  const [showAddProtocolInline, setShowAddProtocolInline] = useState(false);
  const [newProtocolForm, setNewProtocolForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    region: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
        try {
          const u = await databaseService.checkAuth();
          if (u && u.user) {
             setUserEmail(u.user.email);
             const stats = await databaseService.getUserStats(u.user.uid);
             if (stats) setStoreCredit(stats.storeCredit || 0);
          }
        } catch(e) {}
    };
    fetchUser();
    
    const fetchRequests = async () => {
      const allRequests = await databaseService.getPayForMeRequests();
      setActiveRequests(allRequests.filter(r => r.userId === userId || r.userName === userHandle));
    };
    fetchRequests();

    const fetchProtocols = async () => {
      const userProtocols = await databaseService.getUserLogistics(userId);
      setProtocols(Array.isArray(userProtocols) ? userProtocols : []);
    };
    fetchProtocols();

    // Check if rules should be shown
    const hideRules = localStorage.getItem('cc-hide-pfm-rules') === 'true';
    if (!hideRules) {
      setShowRules(true);
    }
  }, [userHandle, userId, activeTab]);

  useEffect(() => {
    const checkCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      
      if (reference || trxref) {
        const ref = reference || trxref;
        if (ref) {
          toast.info("Verifying security handshake...");
          try {
            const data = await databaseService.verifyPaystackTransaction(ref);
            if (data.status && data.data.status === 'success') {
              toast.success('Sponsorship authorized and recorded!');
              const allRequests = await databaseService.getPayForMeRequests();
              setActiveRequests(allRequests.filter(r => r.userId === userId || r.userName === userHandle));
            } else {
              toast.error('Validation failed.');
            }
          } catch (e) {
            console.error("Verification error:", e);
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkCallback();
  }, [userId, userHandle]);

  const canAddMore = activeRequests.filter(r => r.status === PayForMeStatus.PENDING || r.status === PayForMeStatus.APPROVED).length < rank.payForMeSlots;

  const handleInitializeSponsorship = async (product: Product, selectedProtocol: any) => {
    if (!canAddMore) return;
    if (!selectedProtocol) {
      toast.error('Strategic alert: A Delivery/Checkout Protocol must be selected to register.');
      return;
    }
    
    // Stock Check
    if (!product.inStock || product.stockCount <= 0) {
      toast.error('Strategic alert: This silhouette is currently out of stock.');
      return;
    }

    setGeneratingId(product.id);
    try {
      const requestId = `pfm_${Date.now()}`;
      const totalAmount = product.price + (product.shippingFee || 0);
      
      const newRequest: PayForMeRequest = {
        id: requestId,
        userId: userId,
        userName: userHandle,
        items: [{ ...product, quantity: 1, shippingFee: product.shippingFee || 0 }],
        total: totalAmount,
        amountPaid: 0,
        status: PayForMeStatus.PENDING,
        timestamp: new Date().toISOString(),
        message: `I'd love to have this ${product.name}! Can someone help me out?`,
        shippingProtocol: selectedProtocol
      };

      await databaseService.createPayForMeRequest(newRequest);
      
      const shareLink = `${window.location.origin}/payformeshared/${userHandle}/${product.id}/${requestId}`;
      setPaymentLink({ url: shareLink, requestId });
      
      setActiveRequests(prev => [newRequest, ...prev]);
      setIsSelecting(false);
      setSelectedProductForSponsorship(null); // Clear selected product state
    } catch (error) {
      console.error('Failed to initialize sponsorship:', error);
      toast.error('Failed to initialize sponsorship protocol. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePayRemainingPaystack = async (request: PayForMeRequest) => {
    const remaining = request.total - request.amountPaid;
    
    try {
      const response = await databaseService.initializePaystackTransaction(
        userEmail || `${userHandle}@closetkraze.user`,
        remaining,
        {
          payForMeId: request.id,
          sponsorName: userHandle,
          sponsorContact: 'Direct Payment',
          type: 'PAY_FOR_ME'
        },
        { callback_url: `${window.location.origin}${window.location.pathname}` }
      );

      if (response.status) {
        if (response.data.isMock) {
          toast.info("Dev Mode: Handshake simulation active...");
          const callbackUrl = `${window.location.origin}${window.location.pathname}?reference=${response.data.reference}`;
          toast.info("Dev Mode: Redirecting to callback...");
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 1500);
          return;
        }

        if (response.data.authorization_url) {
          toast.info("Redirecting to Paystack secure checkout...");
          window.location.href = response.data.authorization_url;
        } else {
          toast.error("Paystack checkout URL not generated.");
        }
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to initialize payment.');
    }
  };

  const handleConvertToCredit = async (request: PayForMeRequest) => {
    if (request.amountPaid <= 0) {
      try {
        await databaseService.updatePayForMeStatus(request.id, PayForMeStatus.REJECTED);
        setActiveRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: PayForMeStatus.REJECTED } : r));
        toast.success('Request archived.');
      } catch(e) {
        toast.error('Failed to archive request.');
      }
      return;
    }
    
    try {
       const userStats = await databaseService.getUserStats(userId);
       const updatedCredit = (userStats.storeCredit || 0) + request.amountPaid;
       await databaseService.updateUserStats(userId, { ...userStats, storeCredit: updatedCredit });
       await databaseService.updatePayForMeStatus(request.id, PayForMeStatus.REJECTED); // Mark as complete/rejected
       setActiveRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: PayForMeStatus.REJECTED } : r));
       toast.success(`Converted GH₵${request.amountPaid} to Credit Points.`);
    } catch(err) {
       console.error(err);
       toast.error('Failed to convert to credit.');
    }
  };

  const getStatusIcon = (status: PayForMeStatus) => {
    switch (status) {
      case PayForMeStatus.PENDING: return <Clock className="w-4 h-4 text-amber-500" />;
      case PayForMeStatus.APPROVED: return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case PayForMeStatus.PAID: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case PayForMeStatus.REJECTED: return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const filteredWishlistProducts = useMemo(() => {
    if (!wishlistSearch.trim()) return wishlistProducts;
    return wishlistProducts.filter(p => p.name.toLowerCase().includes(wishlistSearch.toLowerCase()));
  }, [wishlistProducts, wishlistSearch]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'ACTIVE') {
      return activeRequests.filter(r => r.status !== PayForMeStatus.REJECTED && r.status !== PayForMeStatus.CLAIMED);
    }
    return activeRequests.filter(r => r.status === PayForMeStatus.REJECTED || r.status === PayForMeStatus.CLAIMED);
  }, [activeRequests, activeTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-32 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col gap-2 relative z-10 pl-2">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_8px_#60a5fa]"></div>
             <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Vanguard Wallet</span>
           </div>
           <h1 className="text-5xl sm:text-7xl font-serif text-white leading-none">
             Pay For ME
           </h1>

        </div>

        <div className="glass-sapphire-main mt-6 p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-2xl relative overflow-hidden group">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] sm:text-xs font-black uppercase text-white/70 tracking-widest">Available Credit</p>
            <p className="text-4xl sm:text-5xl font-serif text-white">${storeCredit.toFixed(2)}</p>
          </div>
          <button className="mt-4 sm:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black tracking-wider uppercase transition-colors relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20">
            Get Store Credit
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-8">
           <div className="flex flex-col">
             <h2 className="text-[14px] sm:text-base font-black uppercase text-white tracking-[0.15em]">Active Requests</h2>
           </div>
           <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <span className="text-sm font-bold text-white/60">{activeRequests.filter(r => r.status === PayForMeStatus.PENDING || r.status === PayForMeStatus.APPROVED).length} Ongoing</span>
           </div>
        </div>
      </header>

      {/* Active Sponsorships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredRequests.map((request) => {
          const product = request.items[0];
          const isPaid = request.status === PayForMeStatus.PAID;
          const isExpired = Date.now() - new Date(request.timestamp).getTime() > 21 * 24 * 60 * 60 * 1000;
          
          return (
            <div key={request.id} className={`glass-sapphire-main p-5 sm:p-6 rounded-3xl border-white/20 relative group shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col justify-between ${activeDropdownId === request.id ? 'z-50' : 'z-10'}`}>
              <div>
                <div className="flex gap-4 items-start sm:items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-lg">
                    <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider truncate max-w-[150px] sm:max-w-[200px]">{product.name}</h3>
                        <div className="mt-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/20 w-fit">
                          <span className="text-[8px] font-black text-white/90 uppercase tracking-widest">{isExpired ? 'EXPIRED' : request.status}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-[10px] font-bold text-white/80">
                    <span>${request.amountPaid.toFixed(2)} Raised</span>
                    <span>${request.total.toFixed(2)} Target</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-300 transition-all duration-1000 shadow-[0_0_10px_#60a5fa]" 
                      style={{ width: (request.status === PayForMeStatus.PAID || request.status === PayForMeStatus.CLAIMED) ? '100%' : `${Math.min(100, Math.max(8, (request.amountPaid / request.total) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expanded Inline Copy & share segment */}
                {activeDropdownId === request.id && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-white/60 tracking-wider">Sponsorship Link</span>
                      <button 
                        onClick={() => setActiveDropdownId(null)}
                        className="text-[8px] font-black text-white/80 hover:text-white uppercase tracking-widest bg-white/10 px-2 py-1 rounded cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                      <span className="flex-1 text-[9px] font-mono text-white/70 truncate pr-1 select-all overflow-hidden text-ellipsis">
                        {`${window.location.origin}/payformeshared/${request.userName || userHandle}/${product.id}/${request.id}`}
                      </span>
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/payformeshared/${request.userName || userHandle}/${product.id}/${request.id}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Sponsorship link copied to clipboard!');
                        }}
                        className="px-2.5 py-1.5 bg-white text-blue-900 rounded text-[8px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    {navigator.share && (
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/payformeshared/${request.userName || userHandle}/${product.id}/${request.id}`;
                          navigator.share({
                            title: `Sponsor my request for ${product.name}`,
                            text: `Could you support my order of "${product.name}" at Closet Kraze?`,
                            url: link
                          }).catch(() => {});
                        }}
                        className="w-full py-2 bg-white/10 text-white hover:bg-white/20 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" /> Share with external apps
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5">
                {!isPaid && !isExpired && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setActiveDropdownId(activeDropdownId === request.id ? null : request.id)}
                      className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 flex-1 min-h-[44px] cursor-pointer"
                    >
                      Share link
                    </button>
                    {request.status === PayForMeStatus.APPROVED && (
                      <button 
                        onClick={() => handlePayRemainingPaystack(request)}
                        className="py-2.5 px-3 bg-blue-300 hover:bg-blue-200 text-blue-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex-1 min-h-[44px] cursor-pointer"
                      >
                        Pay remaining
                      </button>
                    )}
                  </div>
                )}

                {!isPaid && isExpired && (
                  <div className="flex w-full">
                    <button 
                      onClick={() => handleConvertToCredit(request)}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                    >
                      Credit refunded to wallet
                    </button>
                  </div>
                )}

                {isPaid && request.status !== PayForMeStatus.REJECTED && (
                  <div className="flex w-full">
                    <button 
                      onClick={() => setSelectedPaidRequest(request)}
                      className="w-full py-3 bg-white text-blue-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                    >
                      Claim sponsored item
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Sponsorship Button */}
        {activeTab === 'ACTIVE' && canAddMore && !isSelecting && (
          <button 
            onClick={() => setIsSelecting(true)}
            className="h-[200px] sm:h-[240px] rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 hover:border-[#0F52BA]/60 hover:bg-[#0F52BA]/5 transition-all group cursor-pointer p-4 text-center"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-900 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 group-hover:bg-[#0F52BA] group-hover:text-white transition-transform">➕</div>
            <div className="space-y-1">
              <p className="text-xs font-black text-white uppercase tracking-widest group-hover:text-[#C5A880]">New Sponsorship Request</p>
              <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Import direct from wishlist</p>
            </div>
          </button>
        )}

        {filteredRequests.length === 0 && activeTab === 'HISTORY' && (
          <div className="col-span-full py-16 text-center opacity-30 italic uppercase text-[9px] tracking-widest text-white">No archived transmissions found.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button className="glass-sapphire-main p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors shadow-lg border border-white/10 group cursor-pointer">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 group-hover:scale-110 transition-transform"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>
           <span className="text-xs font-black uppercase text-white/90 tracking-[0.15em]">Bank Sync</span>
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className="glass-sapphire-main p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors shadow-lg border border-white/10 group cursor-pointer">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 group-hover:scale-110 transition-transform"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
           <span className="text-xs font-black uppercase text-white/90 tracking-[0.15em]">History</span>
        </button>
      </div>

      {/* Wishlist Selection Modal */}
      {isSelecting && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col max-h-[85vh] shadow-3xl">
            
            {!selectedProductForSponsorship ? (
              // STEP 1: SELECT SILHOUETTE FROM WISHLIST
              <>
                <header className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif italic text-white flex items-center gap-1.5 leading-none">
                      Select Silhouette
                    </h2>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Sponsor slots allocation — Step 1 of 2</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSelecting(false);
                      setSelectedProductForSponsorship(null);
                      setWishlistSearch('');
                    }} 
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white text-md cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </header>

                {/* Mobile Search Bar */}
                {wishlistProducts.length > 0 && (
                  <div className="mb-4 shrink-0">
                    <input 
                      type="text"
                      placeholder="Search items in wishlist..."
                      value={wishlistSearch}
                      onChange={(e) => setWishlistSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 text-xs text-white placeholder-zinc-500 rounded-xl px-4 py-3 outline-none focus:border-[#0F52BA]/60 focus:ring-1 focus:ring-[#0F52BA]/20 transition-all font-sans"
                    />
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[150px]">
                  {wishlistProducts.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="text-4xl text-[#0F52BA]/40">📭</div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Your wishlist is empty</p>
                      <p className="text-[8.5px] text-zinc-600 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                        Favorite products in the showroom first to request backup sponsorship here.
                      </p>
                    </div>
                  ) : filteredWishlistProducts.length === 0 ? (
                    <div className="text-center py-12 space-y-2 text-zinc-500 italic uppercase text-[8.5px] tracking-widest">
                      No matching wishlist silhouettes found.
                    </div>
                  ) : (
                    filteredWishlistProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="flex items-center gap-3.5 p-3 sm:p-4 bg-white/5 border border-white/5 hover:border-[#0F52BA]/40 hover:bg-[#0F52BA]/5 rounded-2xl transition-all group active:scale-[0.99]"
                      >
                        <div className="w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-white uppercase truncate pr-2">{product.name}</h4>
                          <p className="text-[10.5px] font-mono font-medium text-[#C5A880] mt-1">GH₵{product.price}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedProductForSponsorship(product);
                            setWishlistSearch('');
                          }}
                          className="px-4 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0F52BA] hover:text-white active:scale-95 transition-all min-h-[44px] cursor-pointer shadow-md shrink-0 whitespace-nowrap"
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              // STEP 2: SELECT CHECKOUT PROTOCOL
              <>
                <header className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <button 
                      onClick={() => {
                        setSelectedProductForSponsorship(null);
                        setShowAddProtocolInline(false);
                      }}
                      className="text-[#C5A880] hover:underline text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      ← Back to Silhouettes
                    </button>
                    <h2 className="text-lg sm:text-xl font-serif italic text-white leading-tight">Assign Location</h2>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Checkout protocol — Step 2 of 2</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSelecting(false);
                      setSelectedProductForSponsorship(null);
                      setShowAddProtocolInline(false);
                    }} 
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white text-md cursor-pointer shrink-0 active:scale-95 transition-all"
                  >
                    ✕
                  </button>
                </header>

                {/* Confirmed item details */}
                <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-white/5 flex gap-3.5 items-center mb-4 shrink-0">
                  <div className="w-12 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-zinc-950">
                    <img src={selectedProductForSponsorship.image} className="w-full h-full object-cover" alt={selectedProductForSponsorship.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[10.5px] font-black text-white uppercase truncate">{selectedProductForSponsorship.name}</h4>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-zinc-500 text-[8.5px] font-bold uppercase">Price: <span className="text-white font-mono">GH₵{selectedProductForSponsorship.price}</span></span>
                      <span className="text-zinc-500 text-[8.5px] font-bold uppercase">Shipping: <span className="text-[#C5A880] font-mono">+ GH₵{selectedProductForSponsorship.shippingFee || 15}</span></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[7.5px] font-black text-zinc-500 uppercase block tracking-wider leading-none mb-1">Estimated Target</span>
                    <span className="text-[12px] font-mono font-black text-[#C5A880] block">GH₵{selectedProductForSponsorship.price + (selectedProductForSponsorship.shippingFee || 15)}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {!showAddProtocolInline ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Saved Protocols ({protocols.length})</span>
                          <button 
                            onClick={() => setShowAddProtocolInline(true)}
                            className="bg-white/5 hover:bg-white/10 text-[#C5A880] px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            ➕ New Protocol
                          </button>
                        </div>

                        {protocols.length === 0 ? (
                          <div className="text-center py-8 bg-zinc-900/30 rounded-2xl border border-dashed border-white/10 p-5 space-y-3">
                            <p className="text-[9.5px] text-zinc-400 font-black uppercase tracking-widest">No logistics protocols detected</p>
                            <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                              A checkout protocol is required to initiate a sponsorship task so delivery can be pre-configured.
                            </p>
                            <button 
                              onClick={() => setShowAddProtocolInline(true)}
                              className="w-full py-3 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:bg-[#0F52BA] hover:text-white min-h-[44px] flex items-center justify-center font-bold"
                            >
                              Add Address Now
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {protocols.map(p => (
                              <button 
                                key={p.id}
                                disabled={generatingId !== null}
                                onClick={() => handleInitializeSponsorship(selectedProductForSponsorship, p)}
                                className="w-full p-4 bg-zinc-900 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl transition-all text-left flex justify-between items-center cursor-pointer min-h-[64px] active:scale-[0.99]"
                              >
                                <div className="min-w-0 pr-4">
                                  <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase leading-none">{p.name}</p>
                                  <p className="text-[9.5px] text-zinc-400 mt-2 uppercase tracking-wide truncate">{p.address}, {p.city}</p>
                                  <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">Recipient: {p.phone}</p>
                                </div>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-2 rounded-xl transition-all shrink-0 active:scale-95">
                                  {generatingId === selectedProductForSponsorship.id ? 'Structuring...' : 'Select'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Create Logistics Protocol</h3>
                        <button 
                          onClick={() => {
                            setShowAddProtocolInline(false);
                            setNewProtocolForm({ name: '', phone: '', address: '', city: '', region: '' });
                          }}
                          className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Protocol Name (e.g. Home, Office)</label>
                          <input 
                            type="text"
                            placeholder="HOME DISPATCH"
                            value={newProtocolForm.name}
                            onChange={(e) => setNewProtocolForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-zinc-900 border border-white/5 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#0F52BA]/60 transition-all font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Recipient Phone</label>
                            <input 
                              type="tel"
                              placeholder="+233..."
                              value={newProtocolForm.phone}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-zinc-900 border border-white/5 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#0F52BA]/60 transition-all font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Region</label>
                            <input 
                              type="text"
                              placeholder="Greater Accra"
                              value={newProtocolForm.region}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, region: e.target.value }))}
                              className="w-full bg-zinc-900 border border-white/5 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#0F52BA]/60 transition-all font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Address</label>
                            <input 
                              type="text"
                              placeholder="House 44, Oxford Street"
                              value={newProtocolForm.address}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full bg-zinc-900 border border-white/5 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#0F52BA]/60 transition-all font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">City</label>
                            <input 
                              type="text"
                              placeholder="Osu"
                              value={newProtocolForm.city}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full bg-zinc-900 border border-white/5 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#0F52BA]/60 transition-all font-sans"
                            />
                          </div>
                        </div>

                        <button 
                          disabled={generatingId !== null}
                          onClick={async () => {
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
                              const updated = [...protocols, newProtocol];
                              await databaseService.saveUserLogistics(userId, updated);
                              setProtocols(updated);
                              toast.success('Logistics protocol registered to profile!');
                              // Clean up and immediately initialize request with it!
                              handleInitializeSponsorship(selectedProductForSponsorship, newProtocol);
                            } catch (e) {
                              toast.error('Failed to secure logistics protocol.');
                            }
                          }}
                          className="w-full py-3.5 bg-[#0F52BA] hover:bg-[#0B132B] text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all min-h-[44px] cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-lg shadow-[#0F52BA]/30"
                        >
                          🎉 Register Protocol & Initialize
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {paymentLink && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-zinc-950 border border-emerald-500/20 w-full max-w-sm rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-center space-y-6 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <Share2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-serif italic text-white">Request Created</h2>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Your payment link is ready</p>
            </div>
            
            <div className="p-4 bg-black/40 rounded-xl sm:rounded-2xl border border-white/5 space-y-3">
              <p className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Send this URL link to your sponsor</p>
              <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-white/5">
                <input 
                  readOnly 
                  value={paymentLink.url} 
                  className="flex-1 bg-transparent text-[9px] font-mono text-zinc-400 outline-none overflow-hidden text-ellipsis select-all"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(paymentLink.url);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-500 hover:text-white text-black rounded text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <button 
              onClick={() => setPaymentLink(null)}
              className="w-full py-3.5 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all min-h-[44px] cursor-pointer"
            >
              Close and view
            </button>
          </div>
        </div>
      )}

      {/* Perks Summary */}
      <footer className="bg-zinc-950/50 border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-left">
        <div className="text-3xl shrink-0">🛡️</div>
        <div className="space-y-1">
          <h4 className="text-base font-serif italic text-white text-center sm:text-left">Protocol Transparency</h4>
          <p className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed text-center sm:text-left">
            Items reserved via sponsorship remain in the global buffer for {typeof rank.wishlistRetentionDays === 'number' ? `${rank.wishlistRetentionDays} days` : 'Permanently'}.
            <br className="hidden sm:inline" /> Contributors verify the transaction via standard securely automated digital gateway.
          </p>
        </div>
      </footer>

      {/* Protocol Selection Modal */}
      {selectedPaidRequest && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-zinc-950 border border-emerald-500/20 w-full max-w-sm rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-center space-y-6 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            
            {selectedPaidRequest.shippingProtocol ? (
              // CASE A: User already pre-selected a Check Out Protocol during Registration!
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-serif italic text-emerald-400">Confirm Dispatch</h2>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deliver sponsored item</p>
                </div>
                
                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 text-left space-y-2">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Registered Protocol Destination</p>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{selectedPaidRequest.shippingProtocol.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">{selectedPaidRequest.shippingProtocol.address}, {selectedPaidRequest.shippingProtocol.city}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Phone: {selectedPaidRequest.shippingProtocol.phone}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={async () => {
                      await onCompleteAcquisition(selectedPaidRequest.items[0] as Product);
                      await databaseService.updatePayForMeStatus(selectedPaidRequest.id, PayForMeStatus.CLAIMED);
                      setActiveRequests(prev => prev.map(r => r.id === selectedPaidRequest.id ? { ...r, status: PayForMeStatus.CLAIMED } : r));
                      setSelectedPaidRequest(null);
                      toast.success('Dispatched! Delivery logistics protocol initiated.');
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    🚀 Initiate Dispatch
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Remove pre-selected protocol from local state to trigger the manual selection view
                      setSelectedPaidRequest(prev => {
                        if (!prev) return null;
                        const copy = { ...prev };
                        delete copy.shippingProtocol;
                        return copy;
                      });
                    }}
                    className="w-full py-2 bg-transparent text-zinc-500 hover:text-white rounded text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Use a different address
                  </button>
                </div>
              </div>
            ) : (
              // CASE B: Manual/override Address Selection
              <>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-serif italic text-emerald-400">Select Delivery Option</h2>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sponsor protocol finalized</p>
                </div>
                
                <div className="space-y-2.5 text-left max-h-[40vh] overflow-y-auto pr-1">
                  {protocols.length === 0 ? (
                    <p className="text-zinc-500 text-xs text-center py-6">No saved addresses found. Please add a shipping protocol in your profile.</p>
                  ) : (protocols.map(p => (
                    <button 
                      key={p.id}
                      onClick={async () => {
                        await onCompleteAcquisition(selectedPaidRequest.items[0] as Product);
                        await databaseService.updatePayForMeStatus(selectedPaidRequest.id, PayForMeStatus.CLAIMED);
                        setActiveRequests(prev => prev.map(r => r.id === selectedPaidRequest.id ? { ...r, status: PayForMeStatus.CLAIMED } : r));
                        setSelectedPaidRequest(null);
                        toast.success('Protocol selected. Delivery initiated!');
                      }}
                      className="w-full p-3.5 bg-zinc-900 border border-white/5 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left group cursor-pointer"
                    >
                      <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase">{p.name}</p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest truncate">{p.address}, {p.city}</p>
                    </button>
                  )))}
                </div>
              </>
            )}

            <button 
              onClick={() => setSelectedPaidRequest(null)}
              className="w-full py-3.5 bg-white/5 text-white hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules Info Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-[#0F52BA]/40 w-full max-w-sm rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-center space-y-6 shadow-[0_0_100px_rgba(15,82,186,0.2)]">
            <div className="w-16 h-16 bg-[#0F52BA]/20 rounded-full flex items-center justify-center mx-auto border border-[#0F52BA]/30">
              <AlertCircle className="w-6 h-6 text-[#C5A880]" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-serif italic text-white">Pay For Me Rules</h2>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Uplink guidelines</p>
            </div>

            <div className="space-y-4 text-left p-4 sm:p-5 bg-white/5 rounded-xl border border-white/5">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded bg-[#0F52BA]/30 flex items-center justify-center shrink-0 text-[10px] font-black text-[#C5A880]">01</div>
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                  <span className="text-white font-bold">3-Week Expiration:</span> If a sponsorship request is not completed within 3 weeks, any amount paid will be converted into <span className="text-[#C5A880] font-bold">Store Credit</span> for your next purchase.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded bg-[#0F52BA]/30 flex items-center justify-center shrink-0 text-[10px] font-black text-[#C5A880]">02</div>
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                  <span className="text-white font-bold">Overpayment Protocol:</span> Any surplus amount paid exceeding the item configuration is converted automatically into <span className="text-[#C5A880] font-bold">Store Credit</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => setShowRules(false)}
                className="w-full py-3.5 bg-[#0F52BA] hover:bg-[#0B132B] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-xl min-h-[44px] cursor-pointer"
              >
                I Understand
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('cc-hide-pfm-rules', 'true');
                  setShowRules(false);
                }}
                className="w-full py-2 bg-transparent text-zinc-500 hover:text-white rounded text-[8px] font-black uppercase tracking-[0.15em] transition-all min-h-[36px] cursor-pointer"
              >
                Don't show this again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayForMe;