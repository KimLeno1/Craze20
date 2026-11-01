import React, { useState, useMemo, useEffect } from 'react';
import { RankBenefits, Product, PayForMeRequest, PayForMeStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { 
  Share2, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Crown, 
  Sparkles, 
  Shield, 
  ChevronRight, 
  Info, 
  Lock, 
  ArrowUpRight,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Truck,
  Heart,
  Search,
  X,
  Gift,
  RefreshCw,
  Loader2,
  Phone,
  MapPin
} from 'lucide-react';
import { PayForMeShareModal } from './PayForMeShareModal';
import { RANK_BENEFITS, RANK_THRESHOLDS } from '../data/rankingSystem';
import { toast } from 'sonner';

interface PayForMeProps {
  rank: RankBenefits;
  wishlistProducts: Product[];
  onCompleteAcquisition: (product: Product) => void;
  userHandle: string;
  userId: string;
}

const PayForMe: React.FC<PayForMeProps> = ({ rank, wishlistProducts = [], onCompleteAcquisition, userHandle, userId }) => {
  const [activeRequests, setActiveRequests] = useState<PayForMeRequest[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [paymentLink, setPaymentLink] = useState<{ url: string; requestId: string } | null>(null);
  const [sharingRequest, setSharingRequest] = useState<PayForMeRequest | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showTierSlotsModal, setShowTierSlotsModal] = useState(false);
  const [selectedPaidRequest, setSelectedPaidRequest] = useState<PayForMeRequest | null>(null);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [storeCredit, setStoreCredit] = useState(0);

  // Fallback safe rank
  const effectiveRank = rank || RANK_BENEFITS['Newcomer'] || {
    tier: 'Newcomer',
    payForMeSlots: 1,
    wishlistRetentionDays: 7
  };

  const safeWishlistProducts = Array.isArray(wishlistProducts) ? wishlistProducts : [];

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
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
    
    const fetchRequests = async () => {
      try {
        const allRequests = await databaseService.getPayForMeRequests();
        const safeReqs = Array.isArray(allRequests) ? allRequests : [];
        setActiveRequests(safeReqs.filter(r => r && (r.userId === userId || r.userName === userHandle)));
      } catch (e) {
        console.error('Failed to fetch requests:', e);
        setActiveRequests([]);
      }
    };
    fetchRequests();

    const fetchProtocols = async () => {
      try {
        const userProtocols = await databaseService.getUserLogistics(userId);
        setProtocols(Array.isArray(userProtocols) ? userProtocols : []);
      } catch (e) {
        setProtocols([]);
      }
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
              const safeReqs = Array.isArray(allRequests) ? allRequests : [];
              setActiveRequests(safeReqs.filter(r => r && (r.userId === userId || r.userName === userHandle)));
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

  const safeActiveRequests = Array.isArray(activeRequests) ? activeRequests : [];
  const activeCount = safeActiveRequests.filter(r => r && (r.status === PayForMeStatus.PENDING || r.status === PayForMeStatus.APPROVED)).length;
  const historyCount = safeActiveRequests.filter(r => r && (r.status === PayForMeStatus.REJECTED || r.status === PayForMeStatus.CLAIMED)).length;
  const maxSlots = Math.max(1, Number(effectiveRank.payForMeSlots) || 1);
  const canAddMore = activeCount < maxSlots;

  const handleInitializeSponsorship = async (product: Product, selectedProtocol: any) => {
    if (!canAddMore) return;
    if (!selectedProtocol) {
      toast.error('Please select a Delivery Address for this sponsorship.');
      return;
    }
    
    // Stock Check
    if (!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)) {
      toast.error('This item is currently out of stock.');
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
        message: `I'd love to have this ${product.name}! Can you help sponsor it?`,
        shippingProtocol: selectedProtocol
      };

      await databaseService.createPayForMeRequest(newRequest);
      
      const shareLink = `${window.location.origin}/payformeshared/${encodeURIComponent(userHandle)}/${encodeURIComponent(product.id)}/${encodeURIComponent(requestId)}`;
      setPaymentLink({ url: shareLink, requestId });
      setSharingRequest(newRequest);
      
      setActiveRequests(prev => [newRequest, ...(Array.isArray(prev) ? prev : [])]);
      setIsSelecting(false);
      setSelectedProductForSponsorship(null);
    } catch (error) {
      console.error('Failed to initialize sponsorship:', error);
      toast.error('Failed to create gift link. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePayRemainingPaystack = async (request: PayForMeRequest) => {
    const remaining = (request.total || 0) - (request.amountPaid || 0);
    
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
        if (response.data?.isMock) {
          toast.info("Dev Mode: Handshake simulation active...");
          const callbackUrl = `${window.location.origin}${window.location.pathname}?reference=${response.data.reference}`;
          toast.info("Redirecting to callback...");
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 1500);
          return;
        }

        if (response.data?.authorization_url) {
          toast.info("Redirecting to Paystack secure checkout...");
          window.location.href = response.data.authorization_url;
        } else {
          toast.error("Paystack checkout URL not generated.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize payment.');
    }
  };

  const handleConvertToCredit = async (request: PayForMeRequest) => {
    if ((request.amountPaid || 0) <= 0) {
      try {
        await databaseService.updatePayForMeStatus(request.id, PayForMeStatus.REJECTED);
        setActiveRequests(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === request.id ? { ...r, status: PayForMeStatus.REJECTED } : r));
        toast.success('Request archived.');
      } catch (e) {
        toast.error('Failed to archive request.');
      }
      return;
    }
    
    try {
      const userStats = await databaseService.getUserStats(userId);
      const updatedCredit = (userStats.storeCredit || 0) + (request.amountPaid || 0);
      await databaseService.updateUserStats(userId, { ...userStats, storeCredit: updatedCredit });
      await databaseService.updatePayForMeStatus(request.id, PayForMeStatus.REJECTED);
      setActiveRequests(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === request.id ? { ...r, status: PayForMeStatus.REJECTED } : r));
      setStoreCredit(updatedCredit);
      toast.success(`Converted GH₵${request.amountPaid} to Store Credit.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert to credit.');
    }
  };

  const getStatusBadge = (status: PayForMeStatus, isExpired: boolean) => {
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
    }
    switch (status) {
      case PayForMeStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Awaiting Sponsor
          </span>
        );
      case PayForMeStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" /> Partially Funded
          </span>
        );
      case PayForMeStatus.PAID:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Fully Funded!
          </span>
        );
      case PayForMeStatus.CLAIMED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Truck className="w-3 h-3" /> Claimed / Dispatching
          </span>
        );
      case PayForMeStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
            <XCircle className="w-3 h-3" /> Archived
          </span>
        );
      default:
        return null;
    }
  };

  const filteredWishlistProducts = useMemo(() => {
    if (!wishlistSearch.trim()) return safeWishlistProducts;
    return safeWishlistProducts.filter(p => p && p.name && p.name.toLowerCase().includes(wishlistSearch.toLowerCase()));
  }, [safeWishlistProducts, wishlistSearch]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'ACTIVE') {
      return safeActiveRequests.filter(r => r && r.status !== PayForMeStatus.REJECTED && r.status !== PayForMeStatus.CLAIMED);
    }
    return safeActiveRequests.filter(r => r && (r.status === PayForMeStatus.REJECTED || r.status === PayForMeStatus.CLAIMED));
  }, [safeActiveRequests, activeTab]);

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 pb-36 animate-in fade-in duration-300">
      {/* Mobile-Optimized Header */}
      <header className="space-y-4 pt-1 sm:pt-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest">
              Gift & Sponsor Network
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer border border-white/5"
            >
              <Info className="w-3 h-3" />
              <span>Rules</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-none flex items-center gap-2">
            <span>Pay For Me</span>
            <span className="text-xl sm:text-2xl text-[#C5A880]">✦</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-xl">
            Have friends, family, or gifters sponsor pieces directly from your vault wishlist.
          </p>
        </div>

        {/* Mobile Stats & Tier Allowance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Card 1: Available Store Credit */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono font-bold uppercase text-zinc-400 tracking-wider">Available Store Credit</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
                  GH₵{storeCredit.toFixed(2)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Automatically applied at checkout</span>
            </div>
          </div>

          {/* Card 2: Tier Slot Allowance */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <p className="text-[9px] font-mono font-bold uppercase text-amber-300 tracking-wider">
                    {effectiveRank.tier} Tier Allowance
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-white">
                  {activeCount} <span className="text-sm font-normal text-zinc-500">/ {maxSlots} Slots</span>
                </p>
              </div>

              <button
                onClick={() => setShowTierSlotsModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Tiers</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Visual Slot Segment Bars */}
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxSlots }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      idx < activeCount 
                        ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' 
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span>{canAddMore ? `${maxSlots - activeCount} slot(s) open` : 'Slot limit reached'}</span>
                <span className="text-zinc-500">{typeof effectiveRank.wishlistRetentionDays === 'number' ? `${effectiveRank.wishlistRetentionDays}d buffer` : 'Permanent buffer'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Segmented Tab Navigation & New Request Trigger */}
      <div className="sticky top-2 z-30 bg-[#050B14]/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xl">
        <div className="flex items-center gap-1 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Active</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>History</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'HISTORY' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {historyCount}
            </span>
          </button>
        </div>

        {activeTab === 'ACTIVE' && canAddMore && !isSelecting && (
          <button
            type="button"
            onClick={() => setIsSelecting(true)}
            className="py-2.5 px-3.5 bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xs:inline sm:inline">New Request</span>
            <span className="xs:hidden sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const product = (Array.isArray(request.items) && request.items.length > 0)
            ? request.items[0]
            : ((request.items as any) || { id: 'unknown', name: 'Vault Piece', image: '', price: request.total || 0 });
          
          const isPaid = request.status === PayForMeStatus.PAID;
          const isExpired = Date.now() - new Date(request.timestamp || Date.now()).getTime() > 21 * 24 * 60 * 60 * 1000;
          const progressPercent = Math.min(100, Math.max(0, Math.round(((request.amountPaid || 0) / (request.total || 1)) * 100)));
          const shareUrl = `${window.location.origin}/payformeshared/${encodeURIComponent(request.userName || userHandle)}/${encodeURIComponent(product.id || 'item')}/${encodeURIComponent(request.id)}`;
          const isCopied = copiedId === request.id;

          return (
            <div 
              key={request.id} 
              className="bg-zinc-900/90 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all hover:border-white/20"
            >
              <div className="flex gap-3.5 sm:gap-4 items-start">
                {/* Product Thumbnail */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-zinc-950 overflow-hidden shrink-0 relative border border-white/10">
                  <img 
                    src={product.image || ''} 
                    className="w-full h-full object-cover" 
                    alt={product.name || 'Product'} 
                  />
                  {product.selectedSize && (
                    <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-amber-300 border border-white/10">
                      Size: {product.selectedSize}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {product.name || 'Selected Piece'}
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                        {product.category || 'Archival Item'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(request.status, isExpired)}
                    </div>
                  </div>

                  {/* Financial Goal & Progress */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">
                        GH₵{(request.amountPaid || 0).toFixed(2)}{' '}
                        <span className="text-zinc-500 font-normal">/ GH₵{(request.total || 0).toFixed(2)}</span>
                      </span>
                      <span className="font-bold text-blue-400">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 rounded-full ${
                          isPaid || request.status === PayForMeStatus.CLAIMED
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'bg-gradient-to-r from-blue-600 to-[#00D1FF] shadow-[0_0_8px_rgba(0,209,255,0.4)]'
                        }`}
                        style={{ width: `${isPaid || request.status === PayForMeStatus.CLAIMED ? 100 : Math.max(progressPercent, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Shipping Address Pill */}
                  {request.shippingProtocol && (
                    <div className="pt-1 flex items-center gap-1 text-[9px] font-mono text-zinc-400 truncate">
                      <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">Ships to: {request.shippingProtocol.name} ({request.shippingProtocol.city})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2">
                {!isPaid && !isExpired && request.status !== PayForMeStatus.CLAIMED && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Share Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setSharingRequest(request)}
                      className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] min-h-[44px]"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Sponsor Link</span>
                    </button>

                    {/* Fast Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedId(request.id);
                        toast.success('Sponsorship URL copied to clipboard!');
                        setTimeout(() => setCopiedId(null), 2500);
                      }}
                      className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] min-h-[44px]"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    {/* Pay Remaining if partially approved */}
                    {request.status === PayForMeStatus.APPROVED && (
                      <button
                        type="button"
                        onClick={() => handlePayRemainingPaystack(request)}
                        className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98] min-h-[44px]"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Pay Remaining</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Claim funded item */}
                {isPaid && request.status !== PayForMeStatus.REJECTED && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaidRequest(request)}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-[0.98] min-h-[44px]"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Claim Item & Confirm Dispatch</span>
                  </button>
                )}

                {/* Expired Item Refund to credit */}
                {!isPaid && isExpired && (
                  <button
                    type="button"
                    onClick={() => handleConvertToCredit(request)}
                    className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>Convert Raised Balance to Store Credit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State / Add New Trigger */}
        {activeTab === 'ACTIVE' && filteredRequests.length === 0 && (
          <div className="py-12 px-4 text-center rounded-3xl bg-zinc-900/40 border border-dashed border-white/10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-2xl text-blue-400">
              <Gift className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Active Sponsorships</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Select any item from your wishlist to create a custom shareable link for gifters.
              </p>
            </div>
            {canAddMore && (
              <button
                type="button"
                onClick={() => setIsSelecting(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Request</span>
              </button>
            )}
          </div>
        )}

        {/* History Empty State */}
        {activeTab === 'HISTORY' && filteredRequests.length === 0 && (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
            No archived or completed sponsorship requests yet.
          </div>
        )}
      </div>

      {/* Wishlist Selection Modal (Mobile Bottom Sheet / Desktop Modal) */}
      {isSelecting && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border-t sm:border border-white/10 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {!selectedProductForSponsorship ? (
              // STEP 1: SELECT PRODUCT
              <>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                      <span>Select Wishlist Item</span>
                    </h2>
                    <p className="text-[10px] font-mono text-zinc-400">
                      Step 1 of 2 • Choose silhouette to sponsor
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSelecting(false);
                      setSelectedProductForSponsorship(null);
                      setWishlistSearch('');
                    }} 
                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                {wishlistProducts.length > 0 && (
                  <div className="pt-3 pb-2 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text"
                        placeholder="Search your wishlist items..."
                        value={wishlistSearch}
                        onChange={(e) => setWishlistSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>
                )}

                {/* Wishlist Items List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2 min-h-[160px]">
                  {wishlistProducts.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Heart className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">Your wishlist is empty</p>
                      <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
                        Explore the curated vault and tap the heart icon on any product to save it here for sponsorship.
                      </p>
                    </div>
                  ) : filteredWishlistProducts.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                      No matching items in wishlist.
                    </div>
                  ) : (
                    filteredWishlistProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-white/5 hover:border-blue-500/40 rounded-2xl transition-all"
                      >
                        <div className="w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950">
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                          <p className="text-xs font-mono font-bold text-[#C5A880] mt-0.5">GH₵{product.price}</p>
                          <span className="text-[9px] font-mono text-zinc-400">{product.category || 'Vault Piece'}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedProductForSponsorship(product);
                            setWishlistSearch('');
                          }}
                          className="px-4 py-2.5 bg-white text-zinc-950 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0 min-h-[40px]"
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              // STEP 2: SHIPPING PROTOCOL
              <>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                  <div>
                    <button 
                      onClick={() => {
                        setSelectedProductForSponsorship(null);
                        setShowAddProtocolInline(false);
                      }}
                      className="text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to Silhouettes
                    </button>
                    <h2 className="text-base sm:text-lg font-bold text-white">Delivery Destination</h2>
                    <p className="text-[10px] font-mono text-zinc-400">Step 2 of 2 • Where should this piece be sent?</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSelecting(false);
                      setSelectedProductForSponsorship(null);
                      setShowAddProtocolInline(false);
                    }} 
                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Product Summary Card */}
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex gap-3 items-center my-3 shrink-0">
                  <div className="w-12 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-950">
                    <img src={selectedProductForSponsorship.image} className="w-full h-full object-cover" alt={selectedProductForSponsorship.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{selectedProductForSponsorship.name}</h4>
                    <p className="text-xs font-mono font-bold text-[#C5A880]">GH₵{selectedProductForSponsorship.price}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] font-mono text-zinc-400 block uppercase">Estimated Target</span>
                    <span className="text-xs font-mono font-bold text-white">
                      GH₵{selectedProductForSponsorship.price + (selectedProductForSponsorship.shippingFee || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2">
                  {!showAddProtocolInline ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Saved Addresses ({protocols.length})</span>
                        <button 
                          onClick={() => setShowAddProtocolInline(true)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-blue-400 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> New Address
                        </button>
                      </div>

                      {protocols.length === 0 ? (
                        <div className="text-center py-6 bg-zinc-900/60 rounded-xl border border-dashed border-white/10 p-4 space-y-3">
                          <MapPin className="w-6 h-6 text-zinc-500 mx-auto" />
                          <p className="text-xs font-bold text-white">No delivery address saved</p>
                          <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                            A shipping address is needed so we can dispatch the item directly to you once sponsored.
                          </p>
                          <button 
                            onClick={() => setShowAddProtocolInline(true)}
                            className="w-full py-3 bg-white text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer min-h-[44px]"
                          >
                            Add Address Now
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {protocols.map(p => (
                            <button 
                              key={p.id}
                              disabled={generatingId !== null}
                              onClick={() => handleInitializeSponsorship(selectedProductForSponsorship, p)}
                              className="w-full p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-blue-500/50 rounded-xl transition-all text-left flex justify-between items-center cursor-pointer min-h-[54px] active:scale-[0.99]"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-white uppercase">{p.name}</p>
                                <p className="text-[10px] text-zinc-400 truncate">{p.address}, {p.city}</p>
                                <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Phone: {p.phone}</p>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-white uppercase bg-blue-600 px-3 py-1.5 rounded-lg shrink-0">
                                {generatingId === selectedProductForSponsorship.id ? 'Creating...' : 'Select'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Add Address Form
                    <div className="space-y-3 bg-zinc-900/90 border border-white/10 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold text-white uppercase">Add New Address</h3>
                        <button 
                          onClick={() => {
                            setShowAddProtocolInline(false);
                            setNewProtocolForm({ name: '', phone: '', address: '', city: '', region: '' });
                          }}
                          className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Label (e.g. Home, Work)</label>
                          <input 
                            type="text"
                            placeholder="Home Address"
                            value={newProtocolForm.name}
                            onChange={(e) => setNewProtocolForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Recipient Phone</label>
                            <input 
                              type="tel"
                              placeholder="+233..."
                              value={newProtocolForm.phone}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Region</label>
                            <input 
                              type="text"
                              placeholder="Greater Accra"
                              value={newProtocolForm.region}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, region: e.target.value }))}
                              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Street Address</label>
                            <input 
                              type="text"
                              placeholder="Oxford Street"
                              value={newProtocolForm.address}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">City</label>
                            <input 
                              type="text"
                              placeholder="Osu"
                              value={newProtocolForm.city}
                              onChange={(e) => setNewProtocolForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button 
                          type="button"
                          disabled={generatingId !== null}
                          onClick={async () => {
                            const { name, phone, address, city, region } = newProtocolForm;
                            if (!name || !phone || !address || !city || !region) {
                              toast.error('Please fill out all address fields.');
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
                              toast.success('Address saved!');
                              handleInitializeSponsorship(selectedProductForSponsorship, newProtocol);
                            } catch (e) {
                              toast.error('Failed to save address.');
                            }
                          }}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>Save & Generate Sponsor Link</span>
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

      {/* Share Modal Triggered */}
      {sharingRequest && (
        <PayForMeShareModal
          existingRequest={sharingRequest}
          onClose={() => setSharingRequest(null)}
        />
      )}

      {/* Dispatch Confirmation Modal */}
      {selectedPaidRequest && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-950 border-t sm:border border-emerald-500/20 w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 text-center space-y-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Confirm Delivery Dispatch</h2>
              <p className="text-[10px] font-mono text-zinc-400">Item is fully funded and ready for dispatch</p>
            </div>

            {selectedPaidRequest.shippingProtocol ? (
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-white/5 text-left space-y-1">
                <p className="text-[9px] font-mono text-emerald-400 uppercase font-bold">Delivery Address</p>
                <p className="text-xs font-bold text-white">{selectedPaidRequest.shippingProtocol.name}</p>
                <p className="text-[10px] text-zinc-400">{selectedPaidRequest.shippingProtocol.address}, {selectedPaidRequest.shippingProtocol.city}</p>
                <p className="text-[9px] font-mono text-zinc-500">Phone: {selectedPaidRequest.shippingProtocol.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Dispatching to default registered user address.</p>
            )}

            <div className="space-y-2 pt-2">
              <button 
                type="button"
                onClick={async () => {
                  const firstItem = (Array.isArray(selectedPaidRequest.items) && selectedPaidRequest.items.length > 0)
                    ? selectedPaidRequest.items[0]
                    : (selectedPaidRequest.items as any);
                  if (firstItem) {
                    await onCompleteAcquisition(firstItem as Product);
                  }
                  await databaseService.updatePayForMeStatus(selectedPaidRequest.id, PayForMeStatus.CLAIMED);
                  setActiveRequests(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === selectedPaidRequest.id ? { ...r, status: PayForMeStatus.CLAIMED } : r));
                  setSelectedPaidRequest(null);
                  toast.success('Order confirmed! Package is queued for courier pickup.');
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] shadow-lg active:scale-95"
              >
                Confirm Dispatch
              </button>

              <button 
                type="button"
                onClick={() => setSelectedPaidRequest(null)}
                className="w-full py-2.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Info Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-950 border-t sm:border border-white/10 w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 text-center space-y-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Pay For Me Guidelines</h2>
              <p className="text-[10px] font-mono text-zinc-400">Safe peer gifting protocols</p>
            </div>

            <div className="space-y-3 text-left p-3.5 bg-zinc-900 rounded-xl border border-white/5">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-blue-300">1</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-white">3-Week Buffer:</strong> If a request isn't fulfilled within 21 days, all contributed funds convert automatically to <span className="text-[#C5A880] font-bold">Store Credit</span> in your wallet.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-blue-300">2</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-white">Surplus Protection:</strong> Any surplus amount is credited back to your account immediately.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button 
                type="button"
                onClick={() => setShowRules(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer active:scale-95"
              >
                Got It
              </button>
              <button 
                type="button"
                onClick={() => {
                  localStorage.setItem('cc-hide-pfm-rules', 'true');
                  setShowRules(false);
                }}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors py-1 cursor-pointer"
              >
                Don't show this again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Slots Allowance Modal */}
      {showTierSlotsModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-950 border-t sm:border border-amber-500/20 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-300">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Tier Slot Capacity</h2>
                  <p className="text-[10px] font-mono text-zinc-400">Concurrent active sponsorship limits</p>
                </div>
              </div>
              <button
                onClick={() => setShowTierSlotsModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Pill */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[8px] font-mono uppercase text-amber-300 tracking-wider">Your Current Rank</p>
                <p className="text-sm font-bold text-white uppercase">{effectiveRank.tier} Tier</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-mono uppercase text-amber-300 tracking-wider">Slots Active</p>
                <p className="text-sm font-mono font-bold text-white">{activeCount} / {effectiveRank.payForMeSlots}</p>
              </div>
            </div>

            {/* Tier Breakdown */}
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Progression Ladder</p>
              
              <div className="space-y-1.5">
                {Object.entries(RANK_BENEFITS).map(([tierName, benefits]) => {
                  const isCurrent = effectiveRank.tier === tierName;
                  const threshold = (RANK_THRESHOLDS as Record<string, number>)[tierName] || 0;
                  
                  return (
                    <div 
                      key={tierName}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-amber-500/10 border-amber-500/40' 
                          : 'bg-zinc-900 border-white/5'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold uppercase ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                            {tierName}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-400 text-black uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-400 font-mono">
                          {threshold > 0 ? `${threshold.toLocaleString()} REP` : 'Starter Rank'}
                        </p>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                        isCurrent 
                          ? 'bg-amber-400 text-black' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {benefits.payForMeSlots} {benefits.payForMeSlots === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-[10px] text-zinc-400 leading-relaxed space-y-1">
              <p className="text-white font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Unlock More Slots:
              </p>
              <p>
                Earn REP points by making purchases, trying on fits, and rating drops to level up your rank and unlock up to 15 concurrent sponsorship slots.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTierSlotsModal(false)}
              className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayForMe;
