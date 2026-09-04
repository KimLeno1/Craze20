
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
            Promo_Engine
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Managing neural discount systems</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white active:bg-green-700 transition-all shadow-xl flex items-center gap-3"
        >
          <Plus className="w-4 h-4" />
          Generate Protocol
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="glass-grey border border-white/10 w-full max-w-lg rounded-[3rem] p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <div className="space-y-2">
              <h3 className="text-3xl font-serif italic text-white">New_Promo_Auth</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Configuring discount parameters</p>
            </div>
            
            <form onSubmit={handleCreatePromo} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Promo Code Handle</label>
                <input 
                  type="text" 
                  required
                  value={newPromo.code}
                  onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="w-full glass-light border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  placeholder="e.g. NEOMESH20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Discount Value</label>
                  <input 
                    type="number" 
                    required
                    value={newPromo.discount}
                    onChange={e => setNewPromo({...newPromo, discount: parseInt(e.target.value)})}
                    className="w-full glass-light border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Type</label>
                  <select 
                    value={newPromo.type}
                    onChange={e => setNewPromo({...newPromo, type: e.target.value as any})}
                    className="w-full glass-light border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none appearance-none"
                  >
                    <option value="PERCENT">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED (GH₵)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={newPromo.expiryDate}
                    onChange={e => setNewPromo({...newPromo, expiryDate: e.target.value})}
                    className="w-full glass-light border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Usage Limit</label>
                  <input 
                    type="number" 
                    required
                    value={newPromo.usageLimit}
                    onChange={e => setNewPromo({...newPromo, usageLimit: parseInt(e.target.value)})}
                    className="w-full glass-light border border-white/10 p-5 rounded-2xl text-xs font-black text-white focus:border-[#00D1FF] outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 glass-grey text-zinc-600 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-white transition-all"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-green-500 active:bg-green-700 transition-all shadow-2xl"
                >
                  Initialize Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promoCodes.map(promo => (
          <div key={promo.id} className="glass-grey p-8 rounded-[2.5rem] border border-white/5 hover:border-[#00D1FF]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D1FF]/5 blur-[40px] rounded-full group-hover:bg-[#00D1FF]/10 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="glass-light p-3 rounded-2xl border border-white/10">
                  <Tag className="w-5 h-5 text-[#00D1FF]" />
                </div>
                <button 
                  onClick={() => handleDeletePromo(promo.id)}
                  className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
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

              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Usage</span>
                  <span className="text-xs font-mono font-black text-white">{promo.usedCount} / {promo.usageLimit}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Expires</span>
                  <span className="text-xs font-mono font-black text-zinc-400">{promo.expiryDate}</span>
                </div>
              </div>

              <div className="w-full h-1 glass-light rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00D1FF] shadow-[0_0_10px_#00D1FF]" 
                  style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {promoCodes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[3rem] text-zinc-700 text-[10px] uppercase font-black tracking-widest">
            No active promo protocols detected.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPromoManager;
