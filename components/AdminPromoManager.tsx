
import React, { useState, useEffect } from 'react';
import { PromoCode } from '../types';
import { databaseService } from '../services/databaseService';
import { Ticket, Plus, Trash2, Calendar, Percent, Tag } from 'lucide-react';

const AdminPromoManager: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: 0,
    type: 'PERCENT' as 'PERCENT' | 'FIXED',
    expiryDate: '',
    usageLimit: 100
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const data = await databaseService.getPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      console.error('Fetch promos error:', error);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promoData = {
        ...newPromo,
        id: `promo_${Date.now()}`,
        isActive: true,
        usedCount: 0,
        value: newPromo.discount,
        description: `${newPromo.discount}${newPromo.type === 'PERCENT' ? '%' : ' GH₵'} discount code`
      };
      
      await databaseService.savePromoCodes([promoData as any]);
      setIsAdding(false);
      setNewPromo({ code: '', discount: 0, type: 'PERCENT', expiryDate: '', usageLimit: 100 });
      fetchPromos();
    } catch (error) {
      console.error('Create promo error:', error);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await databaseService.deletePromoCode(id);
      fetchPromos();
    } catch (error) {
      console.error('Delete promo error:', error);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-white flex items-center gap-4">
            <Ticket className="w-8 h-8 text-[#00D1FF]" />
            Promo Codes
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Manage store discounts and coupons</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white active:bg-green-700 transition-all shadow-xl flex items-center gap-3"
        >
          <Plus className="w-4 h-4" />
          Create Promo Code
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-3xl font-serif italic text-white">New Promo Code</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Set discount amount and limits</p>
            </div>
            
            <form onSubmit={handleCreatePromo} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Promo Code</label>
                <input 
                  type="text" 
                  required
                  value={newPromo.code}
                  onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  placeholder="e.g. DISCOUNT20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Discount Value</label>
                  <input 
                    type="number" 
                    required
                    value={newPromo.discount}
                    onChange={e => setNewPromo({...newPromo, discount: parseInt(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Type</label>
                  <select 
                    value={newPromo.type}
                    onChange={e => setNewPromo({...newPromo, type: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none appearance-none"
                  >
                    <option value="PERCENT">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED (GH₵)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={newPromo.expiryDate}
                    onChange={e => setNewPromo({...newPromo, expiryDate: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Usage Limit</label>
                  <input 
                    type="number" 
                    required
                    value={newPromo.usageLimit}
                    onChange={e => setNewPromo({...newPromo, usageLimit: parseInt(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-green-500 active:bg-green-700 transition-all shadow-2xl"
                >
                  Save Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promoCodes.map(promo => (
          <div key={promo.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-8 rounded-[2.5rem] transition-all group relative overflow-hidden shadow-lg">
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
                  <Tag className="w-5 h-5 text-[#00D1FF]" />
                </div>
                <button 
                  onClick={() => handleDeletePromo(promo.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-tighter">{promo.code}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#00D1FF] uppercase tracking-widest">
                  {promo.type === 'PERCENT' ? <Percent className="w-3 h-3" /> : 'GH₵'}
                  {promo.discount}{promo.type === 'PERCENT' ? '%' : ''} OFF
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Usage</span>
                  <span className="text-xs font-mono font-black text-white">{promo.usedCount} / {promo.usageLimit}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Expires</span>
                  <span className="text-xs font-mono font-black text-zinc-400">{promo.expiryDate}</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00D1FF]" 
                  style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {promoCodes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[3rem] text-zinc-700 text-[10px] uppercase font-black tracking-widest">
            No active promo codes right now.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPromoManager;
