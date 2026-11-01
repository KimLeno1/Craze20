
import React, { useState } from 'react';
import { ViewState } from '../types';

interface RewardOption {
  id: string;
  title: string;
  cost: number;
  currency: 'COINS' | 'GEMS';
  reward: string;
  icon: string;
}

const REWARDS: RewardOption[] = [
  { id: 'r1', title: 'District Voucher', cost: 1000, currency: 'COINS', reward: 'GH₵50 Off Next Order', icon: '🎫' },
  { id: 'r2', title: 'Express Uplink', cost: 2500, currency: 'COINS', reward: 'Free Global Shipping', icon: '🚀' },
  { id: 'r3', title: 'Elite Discount', cost: 5000, currency: 'COINS', reward: '20% Storewide Access', icon: '💎' },
  { id: 'r4', title: 'Gems Liquidation', cost: 50, currency: 'GEMS', reward: 'GH₵100 Wallet Credit', icon: '✨' },
  { id: 'r5', title: 'Archiver Multiplier', cost: 200, currency: 'GEMS', reward: 'Permanent 2x XP Gain', icon: '📈' },
];

interface PayoutProps {
  onNavigate: (view: ViewState) => void;
  balances?: { coins: number; gems: number; xp: number };
}

const Payout: React.FC<PayoutProps> = ({ onNavigate, balances = { coins: 4250, gems: 120, xp: 8500 } }) => {
  const [activeTab, setActiveTab] = useState<'REDEEM' | 'HISTORY'>('REDEEM');

  return (
    <div className="p-6 md:p-12 space-y-12 animate-in fade-in duration-700 pb-40 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#EC4899] glow-text animate-pulse"></div>
             <span className="text-[10px] font-black text-[#EC4899] uppercase tracking-[0.4em]">Rewards</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif italic text-white tracking-tighter leading-none">
            Reward <span className="text-white not-italic font-sans font-black uppercase glow-text">Center</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Redeem points for discounts and rewards</p>
        </div>

        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-white/10 px-6 py-3 rounded-xl transition-all"
        >
          ← Return to Profile
        </button>
      </header>

      {/* Balances Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Craze Coins', value: balances.coins.toLocaleString(), icon: '🪙', color: 'text-yellow-500' },
          { label: 'Neural Gems', value: balances.gems.toLocaleString(), icon: '✨', color: 'text-[#EC4899]' },
          { label: 'Accumulated XP', value: balances.xp.toLocaleString(), icon: '🧬', color: 'text-blue-500' }
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center space-y-3 group hover:border-white/20 transition-all">
            <span className="text-4xl group-hover:scale-110 transition-transform">{stat.icon}</span>
            <div className="text-center">
              <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-3xl font-mono font-black ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Area */}
      <div className="space-y-10">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('REDEEM')}
            className={`text-sm font-black uppercase tracking-[0.3em] pb-2 transition-all border-b-2 ${activeTab === 'REDEEM' ? 'text-white border-[#EC4899]' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
          >
            Redeem Rewards
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`text-sm font-black uppercase tracking-[0.3em] pb-2 transition-all border-b-2 ${activeTab === 'HISTORY' ? 'text-white border-[#EC4899]' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
          >
            Transaction Log
          </button>
        </div>

        {activeTab === 'REDEEM' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {REWARDS.map(reward => {
              const canAfford = reward.currency === 'COINS' ? balances.coins >= reward.cost : balances.gems >= reward.cost;
              return (
                <div 
                  key={reward.id} 
                  className={`group glass p-8 rounded-[3rem] border transition-all flex flex-col justify-between h-80 ${canAfford ? 'border-white/5 hover:border-[#EC4899]/30' : 'opacity-40 border-transparent'}`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="text-4xl">{reward.icon}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${reward.currency === 'COINS' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-[#EC4899]/10 text-[#EC4899]'}`}>
                        {reward.cost} {reward.currency}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif italic text-white tracking-tight">{reward.title}</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">
                        {reward.reward}
                      </p>
                    </div>
                  </div>

                  <button 
                    disabled={!canAfford}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all ${
                      canAfford 
                      ? 'bg-white text-black hover:bg-green-500 hover:text-white active:bg-green-700' 
                      : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Claim Reward' : 'Not Enough Points'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-[3rem] border-white/5 overflow-hidden animate-in fade-in duration-500">
             <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                   <tr>
                      <th className="px-10 py-6">ID</th>
                      <th className="px-10 py-6">Type</th>
                      <th className="px-10 py-6 text-right">Amount</th>
                      <th className="px-10 py-6 text-right">Date</th>
                   </tr>
                </thead>
                <tbody className="text-[10px] font-mono text-zinc-400">
                   {[
                     { id: 'TX_9921', type: 'ARENA_WIN_BONUS', value: '+150 COINS', time: '2h ago' },
                     { id: 'TX_9918', type: 'REWARD_REDEEM', value: '-1000 COINS', time: '1d ago' },
                     { id: 'TX_9915', type: 'GAME_RPS_REWARD', value: '+50 GEMS', time: '2d ago' },
                     { id: 'TX_9912', type: 'BUNDLE_PURCHASE', value: '+450 XP', time: '3d ago' },
                   ].map((tx, idx) => (
                     <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-10 py-6 font-black text-white">{tx.id}</td>
                        <td className="px-10 py-6 uppercase">{tx.type}</td>
                        <td className={`px-10 py-6 text-right font-black ${tx.value.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{tx.value}</td>
                        <td className="px-10 py-6 text-right opacity-40">{tx.time}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Psychological Disclaimer */}
      <footer className="bg-zinc-950/50 border border-white/5 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="text-4xl grayscale opacity-30">🛡️</div>
            <div className="space-y-1">
               <h4 className="text-lg font-serif italic text-white">Secure Asset Management</h4>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
                  Currency is synthetic until finalized via redemption. <br/> Withdrawal operations are non-reversible once initialized.
               </p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="text-right">
               <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">System Status</div>
               <div className="text-[10px] font-mono font-bold text-white">ACTIVE</div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Payout;
