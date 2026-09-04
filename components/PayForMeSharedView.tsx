import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayForMeRequest, PayForMeStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Wallet, ShieldCheck, Heart, User, Info, Smartphone, CheckCircle2 } from 'lucide-react';

const PayForMeSharedView: React.FC = () => {
  const { userName, productId, requestId } = useParams<{ userName: string; productId: string; requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PayForMeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [sponsorName, setSponsorName] = useState(() => localStorage.getItem('cc-sponsor-name') || '');
  const [sponsorContact, setSponsorContact] = useState(() => localStorage.getItem('cc-sponsor-contact') || '');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) return;
      try {
        const found = await databaseService.getPayForMeRequestById(requestId);
        
        // Verification logic as requested
        if (found && found.userName === userName && found.items[0].id === productId) {
          setRequest(found);
          setPaymentAmount(found.total - found.amountPaid);
        } else {
          setRequest(null);
        }
      } catch (error) {
        console.error('Failed to fetch request:', error);
        toast.error('Strategic link invalid or corrupted.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, userName, productId]);

  const handlePaystackPayment = async () => {
    if (!request) return;
    if (!sponsorName.trim()) {
      toast.error('Identity required for transaction authorization.');
      return;
    }

    setIsProcessing(true);
    try {
      const email = sponsorContact.includes('@') ? sponsorContact : `${sponsorName.toLowerCase().replace(/\s/g, '_')}@closetkraze.sponsor`;
      
      // Save sponsor name and contact to localStorage for post-redirect retrieval
      localStorage.setItem('cc-sponsor-name', sponsorName);
      localStorage.setItem('cc-sponsor-contact', sponsorContact);

      const response = await databaseService.initializePaystackTransaction(
        email,
        paymentAmount,
        {
          payForMeId: request.id,
          sponsorName,
          sponsorContact,
          type: 'PAY_FOR_ME'
        },
        { callback_url: `${window.location.origin}${window.location.pathname}` }
      );

      if (response.status) {
        if (response.data.authorization_url) {
          toast.info("Redirecting to Paystack secure checkout...");
          window.location.href = response.data.authorization_url;
        } else {
          toast.error("Paystack checkout URL not generated.");
          setIsProcessing(false);
        }
      } else {
        throw new Error(response.message || 'Initialization failed');
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      toast.error('Failed to connect to payment uplink.');
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const data = await databaseService.verifyPaystackTransaction(reference);
      if (data.status && data.data.status === 'success') {
        toast.success('Sponsorship authorized and recorded!');
        // Refresh local state
        const requests = await databaseService.getPayForMeRequests();
        const updated = requests.find(r => r.id === requestId);
        if (updated) setRequest(updated);
      } else {
        toast.error('Validation failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification protocol failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const checkCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      
      if (reference || trxref) {
        const ref = reference || trxref;
        if (ref) {
          setIsProcessing(true);
          try {
            await verifyPayment(ref);
          } catch (e) {
            console.error("Redirect verification error:", e);
          } finally {
            setIsProcessing(false);
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkCallback();
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isExpired = request ? (Date.now() - new Date(request.timestamp).getTime() > 21 * 24 * 60 * 60 * 1000) : false;

  if (!request || isExpired) {
    return <div className="min-h-screen bg-zinc-50"></div>;
  }

  const remaining = request.total - request.amountPaid;
  const isPaid = request.status === PayForMeStatus.PAID || request.status === PayForMeStatus.CLAIMED;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 selection:bg-blue-600 selection:text-white">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">Secure Sponsorship Uplink</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-zinc-950">
            Authorized <br/> <span className="text-zinc-950 not-italic font-black uppercase">Sponsorship</span>
          </h1>
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em]">Protocol ID: {request.id}</p>
        </div>

        {/* Product Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-6 md:space-y-8 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-4xl md:text-6xl font-black pointer-events-none uppercase text-zinc-950">TARGET</div>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            <div className="w-40 h-54 md:w-48 md:h-64 rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-100 shrink-0 shadow-xl skew-y-1">
              <img src={request.items[0].image} className="w-full h-full object-cover" alt={request.items[0].name} />
            </div>
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Requester</p>
                <h2 className="text-2xl md:text-3xl font-serif italic font-medium text-zinc-950">@{request.userName}</h2>
              </div>
              
              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Acquisition Target</p>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight leading-tight text-zinc-950">{request.items[0].name}</h3>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
                  <span className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest">Valuation</span>
                  <span className="text-xl md:text-2xl font-black text-zinc-950">GH₵{request.total}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest">Contributed</span>
                  <span className="text-base md:text-lg font-black text-emerald-600">GH₵{request.amountPaid}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms/Actions */}
        {!isPaid ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 space-y-6 shadow-sm">
              <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Sponsor Identity</label>
                    <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                        <input 
                            type="text" 
                            placeholder="Your Name / Handle"
                            value={sponsorName}
                            onChange={(e) => setSponsorName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-300"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Contact Protocol (Email / Phone)</label>
                    <div className="relative">
                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                        <input 
                            type="text" 
                            placeholder="e.g. sponsor@domain.com"
                            value={sponsorContact}
                            onChange={(e) => setSponsorContact(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-300"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Authorized Amount (GH₵)</label>
                    <div className="flex gap-4">
                        <input 
                            type="number" 
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), remaining))}
                            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none"
                        />
                        <button 
                            onClick={() => setPaymentAmount(remaining)}
                            className="px-6 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                        >
                            Max
                        </button>
                    </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                    disabled={isProcessing || paymentAmount <= 0}
                    onClick={handlePaystackPayment}
                    className="w-full py-6 bg-zinc-950 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-600 transition-all shadow-xl relative overflow-hidden group"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isProcessing ? 'Synchronizing...' : (
                            <>
                                <Wallet className="w-4 h-4" />
                                Authorize Contribution GH₵{paymentAmount}
                            </>
                        )}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
                <div className="mt-6 flex items-center justify-center gap-4 text-zinc-400">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[7px] font-bold text-zinc-500">SP</div>
                        ))}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Join 40+ active sponsors today</span>
                </div>
              </div>
            </div>

            <div className="p-6 border border-zinc-100 rounded-3xl flex items-start gap-4 bg-white shadow-sm">
                <Info className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                    By authorizing this contribution, you agree to the <span className="text-zinc-950 font-bold">Closet Kraze Protocol</span>. 
                    Incomplete acquisitions are converted to user store credit after 21 days.
                </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-emerald-100 p-12 rounded-[3.5rem] text-center space-y-6 animate-in zoom-in-95 duration-700 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-serif italic text-zinc-950">Acquisition <span className="text-emerald-600">Finalized</span></h2>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em]">Transaction protocol complete</p>
            </div>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="text-zinc-950 font-bold">@{sponsorName || request.payerName || 'Oracle Sponsor'}</span>. 
                Your contribution has successfully cleared the acquisition buffer. 
                The asset has been authorized for distribution to <span className="text-zinc-950 font-bold">@{userName}</span>.
            </p>
            <button 
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-zinc-200"
            >
                Return to Buffer
            </button>
          </div>
        )}

        <footer className="pt-20 text-center opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-6 grayscale scale-75">
                <div className="px-4 py-2 border border-zinc-300 rounded font-black text-xs text-zinc-400">PAYSTACK_SECURE</div>
                <div className="font-serif italic text-xl text-zinc-950">ClosetKraze</div>
                <div className="px-4 py-2 border border-zinc-300 rounded font-black text-xs text-zinc-400">ENCRYPTED_UPLINK</div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default PayForMeSharedView;
