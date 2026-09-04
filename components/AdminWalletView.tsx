
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, DollarSign, TrendingUp, Landmark, Send, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import WithdrawalModal from './WithdrawalModal';
import { Withdrawal } from '../types';

const AdminWalletView: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [paystackBalance, setPaystackBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [walletData, withdrawalData, pBalanceRes] = await Promise.all([
        databaseService.getWallet('ADMIN_WALLET'),
        databaseService.getWithdrawals('ADMIN_WALLET'),
        databaseService.getPaystackBalance()
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalData);
      if (pBalanceRes.status) {
        setPaystackBalance(pBalanceRes.balance);
      }
    } catch (error) {
      console.error('Error fetching admin wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetCommission = async () => {
    if (window.confirm("Are you sure you want to reset Commission Yield to 0?")) {
      try {
        await databaseService.resetAdminCommission();
        fetchData();
      } catch (err) {
        console.error("Failed to reset commission yield", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00D1FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wallet) return <div className="text-center py-20 text-zinc-500 uppercase font-black text-[10px]">Wallet not initialized.</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif italic text-white">Central_Treasury</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Managing platform commission yields</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="glass-grey p-8 rounded-[2.5rem] border border-[#00D1FF]/20 flex items-center gap-8 shadow-2xl shadow-[#00D1FF]/5 relative group">
              <div className="w-16 h-16 glass-light rounded-3xl flex items-center justify-center text-3xl">🏦</div>
              <div>
                 <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                   Commission Yield
                   <button 
                     title="Reset to 0"
                     onClick={handleResetCommission}
                     className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded hover:bg-red-500 hover:text-white"
                   >
                     RESET
                   </button>
                 </div>
                 <div className="text-2xl font-mono font-black text-white">GH₵{wallet.balance.toLocaleString()}</div>
              </div>
           </div>
           
           <div className="glass-grey p-8 rounded-[2.5rem] border border-[#00D1FF]/10 flex items-center gap-8 shadow-2xl shadow-[#00D1FF]/5">
              <div className="w-16 h-16 glass-light rounded-3xl flex items-center justify-center text-3xl">💹</div>
              <div>
                 <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Paystack Balance</div>
                 <div className="text-2xl font-mono font-black text-emerald-400">GH₵{paystackBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
           </div>

           <button 
             onClick={() => setIsWithdrawModalOpen(true)}
             disabled={wallet.balance <= 0}
             className="bg-[#00D1FF] text-black px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-2xl disabled:opacity-50 disabled:grayscale flex items-center gap-2"
           >
             <Send size={14} />
             Withdraw via Paystack
           </button>
        </div>
      </header>

      {isWithdrawModalOpen && (
        <WithdrawalModal 
          userId="ADMIN_WALLET"
          currentBalance={wallet.balance}
          onClose={() => setIsWithdrawModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-8">
           <div className="glass-grey p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-[#00D1FF]" />
                Treasury Metrics
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Total Inflow</span>
                    <span className="text-sm font-mono text-green-500 font-black">GH₵{wallet.transactions.filter((t: any) => t.type === 'COMMISSION').reduce((acc: number, t: any) => acc + t.amount, 0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Total Payouts</span>
                    <span className="text-sm font-mono text-red-500 font-black">GH₵{wallet.transactions.filter((t: any) => t.type === 'PAYOUT').reduce((acc: number, t: any) => acc + Math.abs(t.amount), 0).toLocaleString()}</span>
                 </div>
                 <div className="h-px bg-white/5"></div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Net Yield</span>
                    <span className="text-sm font-mono text-[#00D1FF] font-black">GH₵{wallet.balance.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="glass-grey p-8 rounded-[2.5rem] border border-white/5 space-y-4">
              <div className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-xl">🛡️</div>
              <p className="text-[9px] text-zinc-500 uppercase leading-relaxed font-medium">
                All transactions are cryptographically logged to the platform ledger. Payouts require multi-sig authorization from the core team.
              </p>
           </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-grey border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} className="text-[#00D1FF]" />
                  Ledger_History
                </h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{wallet.transactions.length} Entries</span>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="glass-light text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                      <tr>
                         <th className="px-8 py-6">Type</th>
                         <th className="px-8 py-6">Description</th>
                         <th className="px-8 py-6 text-right">Amount</th>
                         <th className="px-8 py-6 text-right">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="text-[10px] font-mono">
                      {wallet.transactions.map((t: any) => (
                        <tr key={t.id} className="border-b border-white/5 hover:glass-light transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                   t.type === 'COMMISSION' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                 }`}>
                                    {t.type === 'COMMISSION' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
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
          <div className="glass-grey border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} className="text-[#00D1FF]" />
                  Withdrawal_History (Paystack)
                </h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{withdrawals.length} Entries</span>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="glass-light text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
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
                        <tr key={w.id} className="border-b border-white/5 hover:glass-light transition-colors">
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
    </div>
  );
};

export default AdminWalletView;
