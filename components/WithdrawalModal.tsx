
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { X, Landmark, CreditCard, User, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WithdrawalModalProps {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ userId, currentBalance, onClose, onSuccess }) => {
  const [step, setStep] = useState<'DETAILS' | 'CONFIRM' | 'PROCESSING' | 'SUCCESS'>('DETAILS');
  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    type: 'bank' as 'bank' | 'mobile_money',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await databaseService.getBanks(formData.type === 'mobile_money' ? 'mobile_money' : 'ghipss');
        if (response.status) {
          setBanks(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch banks:', err);
        setError('Failed to load bank list. Please try again.');
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [formData.type]);

  const handleResolveAccount = async () => {
    if (formData.accountNumber.length < 10 || !formData.bankCode) return;
    
    setResolvingAccount(true);
    setError(null);
    try {
      const response = await databaseService.resolveAccount(formData.accountNumber, formData.bankCode);
      if (response.status) {
        setFormData(prev => ({ ...prev, accountName: response.data.account_name }));
      } else {
        setError('Could not resolve account name. Please check details.');
      }
    } catch (err) {
      setError('Account resolution failed. Verify account number and bank.');
    } finally {
      setResolvingAccount(false);
    }
  };

  // Automatic resolution removed as per user request to "remove Account Verification for suppliers"
  // Manual resolution is still available via the verify button if needed

  const handleWithdraw = async () => {
    if (formData.amount <= 0 || formData.amount > currentBalance) {
      setError('Invalid amount.');
      return;
    }
    if (!formData.accountName) {
      setError('Please resolve account name first.');
      return;
    }

    setStep('PROCESSING');
    setError(null);
    try {
      const bankName = banks.find(b => b.code === formData.bankCode)?.name || 'Unknown Bank';
      const response = await databaseService.withdrawFunds({
        userId,
        ...formData,
        bankName
      });
      if (response.success) {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        setError(response.error || 'Withdrawal failed.');
        setStep('DETAILS');
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed.');
      setStep('DETAILS');
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/50 overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6 scroll-smooth scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white border border-zinc-200 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col my-auto max-h-[85vh] sm:max-h-[80vh] md:max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif italic text-zinc-950">Withdraw Funds</h3>
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em]">Direct payout to your bank or mobile money</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors shadow-xs">
            <X size={20} />
          </button>
        </div>

        <div 
          className="p-8 sm:p-10 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {step === 'DETAILS' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Balance Card */}
              <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-3xl flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Available Balance</span>
                  <div className="text-2xl font-mono font-black text-zinc-950">GH₵{currentBalance.toLocaleString()}</div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <Landmark size={24} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">Withdrawal Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'bank', bankCode: '', accountName: ''})}
                      className={`p-4 rounded-2xl border text-xs font-bold transition-all ${formData.type === 'bank' ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'}`}
                    >
                      Bank Transfer
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'mobile_money', bankCode: '', accountName: ''})}
                      className={`p-4 rounded-2xl border text-xs font-bold transition-all ${formData.type === 'mobile_money' ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'}`}
                    >
                      Mobile Money
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">Withdrawal Amount (GH₵)</label>
                  <input 
                    type="number"
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-sm font-bold text-zinc-950 outline-none focus:border-emerald-600 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">{formData.type === 'bank' ? 'Select Bank' : 'Select Provider'}</label>
                    <div className="relative">
                      <select 
                        value={formData.bankCode}
                        onChange={e => setFormData({...formData, bankCode: e.target.value, accountName: ''})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-950 outline-none focus:border-emerald-600 transition-all appearance-none"
                      >
                        <option value="">Choose {formData.type === 'bank' ? 'Bank' : 'Provider'}</option>
                        {banks.map(b => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                      {loadingBanks && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 size={12} className="animate-spin text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">{formData.type === 'bank' ? 'Account Number' : 'Phone Number'}</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={formData.accountNumber}
                        onChange={e => setFormData({...formData, accountNumber: e.target.value, accountName: ''})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-sm font-bold text-zinc-950 outline-none focus:border-emerald-600 transition-all"
                        placeholder={formData.type === 'bank' ? '0000000000' : '0240000000'}
                      />
                      {formData.accountNumber.length >= 10 && formData.bankCode && !formData.accountName && formData.type === 'bank' && (
                        <button 
                          onClick={handleResolveAccount}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          Verify Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">Account Name</label>
                  <input 
                    type="text"
                    value={formData.accountName}
                    onChange={e => setFormData({...formData, accountName: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-sm font-bold text-zinc-950 outline-none focus:border-emerald-600 transition-all"
                    placeholder="Account Name"
                  />
                </div>

                {resolvingAccount ? (
                  <div className="flex items-center gap-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">
                    <Loader2 size={12} className="animate-spin" />
                    Verifying Account...
                  </div>
                ) : formData.accountName && !resolvingAccount ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <User size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Verified Name</div>
                      <div className="text-[10px] font-black text-zinc-950 uppercase tracking-wider">{formData.accountName}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                ) : null}
              </div>

              <button 
                onClick={() => setStep('CONFIRM')}
                disabled={!formData.accountName || !formData.bankCode || formData.amount <= 0 || formData.amount > currentBalance}
                className="w-full py-5 bg-zinc-950 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-emerald-600 transition-all disabled:opacity-30 active:scale-95 shadow-xl"
              >
                Continue to Review
              </button>
            </div>
          )}

          {step === 'CONFIRM' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">🏦</div>
              <div className="space-y-2">
                <h4 className="text-2xl font-serif italic text-zinc-950">Confirm Withdrawal</h4>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Verify the following transaction details</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-8 space-y-6 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Withdrawal Amount</span>
                  <span className="text-xl font-mono font-black text-zinc-950">GH₵{formData.amount.toLocaleString()}</span>
                </div>
                <div className="h-px bg-zinc-200"></div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Institution</span>
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-wider">{banks.find(b => b.code === formData.bankCode)?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Account Number</span>
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-wider">{formData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Recipient Name</span>
                    <span className="text-[10px] font-black text-zinc-950 uppercase tracking-wider">{formData.accountName}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep('DETAILS')} className="flex-1 py-5 bg-zinc-100 text-zinc-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-zinc-200 transition-all">Back</button>
                <button onClick={handleWithdraw} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-700 transition-all shadow-md">Confirm & Send</button>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">⚡</div>
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-2xl font-serif italic text-zinc-950 uppercase tracking-tighter">Processing Transfer...</h4>
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Contacting Payment Gateway</p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
              <div className="w-24 h-24 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-4xl text-emerald-600 shadow-sm">✓</div>
              <div className="space-y-3">
                <h4 className="text-4xl font-serif italic text-zinc-950 tracking-tighter">Transfer Initiated</h4>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] max-w-[250px] mx-auto leading-relaxed">Funds are on their way. Payouts usually complete within 5-10 minutes.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WithdrawalModal;
