
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, DollarSign, TrendingUp, Landmark, Send, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import WithdrawalModal from './WithdrawalModal';
import { Withdrawal } from '../types';

interface SupplierWalletViewProps {
  supplierId: string;
}

const SupplierWalletView: React.FC<SupplierWalletViewProps> = ({ supplierId }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutDescription, setPayoutDescription] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [supplierId]);

  const fetchData = async () => {
    try {
      const [walletData, withdrawalData] = await Promise.all([
        databaseService.getWallet(supplierId),
        databaseService.getWithdrawals(supplierId)
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalData);
      setPayoutAmount(walletData.balance);
    } catch (error) {
      console.error('Error fetching supplier wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0 || payoutAmount > wallet.balance) {
      toast.error('Invalid payout amount.');
      return;
    }

    try {
      await databaseService.requestPayout(supplierId, payoutAmount, payoutDescription || 'Supplier Payout Request');
      toast.success('Payout request initialized successfully.');
      setIsPayoutModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Payout error:', error);
      toast.error('Failed to initialize payout.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wallet) return <div className="text-center py-20 text-zinc-500 uppercase font-black text-[10px]">Node wallet not initialized.</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif italic text-white">Node_Treasury</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Managing manufacturing yields and payouts</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-[#f59e0b]/20 flex items-center gap-8 shadow-2xl shadow-[#f59e0b]/5">
              <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-3xl flex items-center justify-center text-3xl">🏦</div>
              <div>
                 <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Available Yield</div>
                 <div className="text-4xl font-mono font-black text-white">GH₵{wallet.balance.toLocaleString()}</div>
              </div>
           </div>
           
           <div className="flex flex-col gap-3">
             <button 
               onClick={() => setIsWithdrawModalOpen(true)}
               disabled={wallet.balance <= 0}
               className="bg-[#f59e0b] text-black px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-2xl disabled:opacity-50 disabled:grayscale flex items-center gap-2"
             >
               <Send size={14} />
               Withdraw via Paystack
             </button>
             <button 
               onClick={() => setIsPayoutModalOpen(true)}
               disabled={wallet.balance <= 0}
               className="bg-zinc-900 text-zinc-400 px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all border border-white/5 disabled:opacity-50"
             >
               Manual Payout Request
             </button>
           </div>
        </div>
      </header>

      {isWithdrawModalOpen && (
        <WithdrawalModal 
          userId={supplierId}
          currentBalance={wallet.balance}
          onClose={() => setIsWithdrawModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-[#f59e0b]" />
                Yield Metrics
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Total Earnings</span>
                    <span className="text-sm font-mono text-green-500 font-black">GH₵{wallet.transactions.filter((t: any) => t.type === 'EARNING').reduce((acc: number, t: any) => acc + t.amount, 0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Total Payouts</span>
                    <span className="text-sm font-mono text-red-500 font-black">GH₵{wallet.transactions.filter((t: any) => t.type === 'PAYOUT').reduce((acc: number, t: any) => acc + Math.abs(t.amount), 0).toLocaleString()}</span>
                 </div>
                 <div className="h-px bg-white/5"></div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Net Balance</span>
                    <span className="text-sm font-mono text-[#f59e0b] font-black">GH₵{wallet.balance.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-xl">🛡️</div>
              <p className="text-[9px] text-zinc-500 uppercase leading-relaxed font-medium">
                Earnings are automatically distributed upon order delivery. Payouts are processed within 48-72 hours of request.
              </p>
           </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} className="text-[#f59e0b]" />
                  Ledger_History
                </h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{wallet.transactions.length} Entries</span>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-white/5 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                      <tr>
                         <th className="px-8 py-6">Type</th>
                         <th className="px-8 py-6">Description</th>
                         <th className="px-8 py-6 text-right">Amount</th>
                         <th className="px-8 py-6 text-right">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="text-[10px] font-mono">
                      {wallet.transactions.map((t: any) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                   t.type === 'EARNING' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                 }`}>
                                    {t.type === 'EARNING' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                 </div>
                                 <span className="font-black uppercase tracking-widest">{t.type}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-zinc-400">{t.description}</td>
                           <td className={`px-8 py-6 text-right font-black ${
                             t.amount > 0 ? 'text-green-500' : 'text-red-500'
                           }`}>
                             {t.amount > 0 ? '+' : ''}GH₵{t.amount.toLocaleString()}
                           </td>
                           <td className="px-8 py-6 text-right text-zinc-600">{new Date(t.timestamp).toLocaleString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</td>
                        </tr>
                      ))}
                      {wallet.transactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center italic text-zinc-800 uppercase font-black tracking-widest">No ledger entries detected.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Paystack Withdrawal History */}
          <div className="bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} className="text-[#f59e0b]" />
                  Withdrawal_History (Paystack)
                </h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{withdrawals.length} Entries</span>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-white/5 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                      <tr>
                         <th className="px-8 py-6">Bank</th>
                         <th className="px-8 py-6">Account</th>
                         <th className="px-8 py-6 text-right">Amount</th>
                         <th className="px-8 py-6 text-center">Status</th>
                         <th className="px-8 py-6 text-right">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="text-[10px] font-mono">
                      {withdrawals.map((w: Withdrawal) => (
                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="font-black uppercase tracking-widest">{w.bankName}</span>
                                 <span className="text-[8px] text-zinc-600">{w.bankCode}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-zinc-400">{w.accountNumber}</span>
                                 <span className="text-[8px] text-zinc-600 uppercase">{w.accountName}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-white">
                             GH₵{w.amount.toLocaleString()}
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex justify-center">
                                 <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                   w.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                                   w.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                                   'bg-yellow-500/10 text-yellow-500'
                                 }`}>
                                    {w.status === 'SUCCESS' && <CheckCircle2 size={10} />}
                                    {w.status === 'FAILED' && <XCircle size={10} />}
                                    {w.status === 'PENDING' && <Clock size={10} className="animate-pulse" />}
                                    <span className="text-[8px] font-black uppercase tracking-widest">{w.status}</span>
                                 </div>
                                 {w.status === 'PENDING' && (
                                   <button 
                                     onClick={async () => {
                                       try {
                                         await databaseService.verifyTransfer(w.reference);
                                         fetchData();
                                       } catch (err) {
                                         console.error('Verification failed', err);
                                       }
                                     }}
                                     className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-white"
                                     title="Verify Status"
                                   >
                                     <RefreshCw size={10} />
                                   </button>
                                 )}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right text-zinc-600">{new Date(w.timestamp).toLocaleString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center italic text-zinc-800 uppercase font-black tracking-widest">No withdrawal history detected.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6 scroll-smooth scrollbar-hide">
           <div className="bg-[#050505] border border-white/10 w-full max-w-lg rounded-[3rem] p-8 sm:p-12 animate-in zoom-in-95 duration-500 flex flex-col my-auto max-h-[85vh] sm:max-h-[80vh] md:max-h-[85vh] overflow-hidden">
              <div className="space-y-2 shrink-0 mb-6 sm:mb-8">
                 <h3 className="text-2xl sm:text-3xl font-serif italic text-white">Payout_Auth</h3>
                 <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initializing yield liquidation protocol</p>
              </div>
              
              <form 
                onSubmit={handlePayoutRequest} 
                className="space-y-6 overflow-y-auto flex-1 pr-1 overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-zinc-850"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Liquidation Amount (GH₵)</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      max={wallet.balance}
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(parseInt(e.target.value))}
                      className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#f59e0b] outline-none"
                    />
                    <div className="flex justify-between px-1">
                       <span className="text-[8px] font-black text-zinc-700 uppercase">Available: GH₵{wallet.balance.toLocaleString()}</span>
                       <button 
                         type="button" 
                         onClick={() => setPayoutAmount(wallet.balance)}
                         className="text-[8px] font-black text-[#f59e0b] uppercase hover:underline"
                       >
                         Max Yield
                       </button>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Payout Reference / Description</label>
                    <input 
                      type="text" 
                      value={payoutDescription}
                      onChange={e => setPayoutDescription(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#f59e0b] outline-none"
                      placeholder="e.g. Monthly Settlement"
                    />
                 </div>
                 
                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsPayoutModalOpen(false)}
                      className="flex-1 py-4 bg-zinc-950 text-zinc-600 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-white transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-[#f59e0b] text-black rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-[#f59e0b] transition-all shadow-2xl"
                    >
                      Initialize Liquidation
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierWalletView;
