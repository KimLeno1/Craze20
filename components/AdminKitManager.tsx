
import React, { useState, useEffect } from 'react';
import { Product, Bundle, Supplier } from '../types';
import { databaseService } from '../services/databaseService';

const AdminKitManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState(0);
  const [expiresIn, setExpiresIn] = useState(3600); // Default 1 hour

  useEffect(() => {
    const fetchData = async () => {
      setProducts(await databaseService.getProducts());
      setBundles(await databaseService.getBundles());
      setSuppliers(await databaseService.getSuppliers());
    };
    fetchData();
  }, []);

  const handleCreateBundle = async () => {
    if (!bundleName || selectedProductIds.length === 0) return;

    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    
    const newBundle: Bundle = {
      id: `bundle_${Date.now()}`,
      name: bundleName,
      description: bundleDescription,
      products: selectedProducts,
      bundlePrice: bundlePrice,
      expiresIn: expiresIn
    };

    const updatedBundles = [...bundles, newBundle];
    setBundles(updatedBundles);
    await databaseService.saveBundles([newBundle]);
    
    // Reset form
    setIsCreating(false);
    setBundleName('');
    setBundleDescription('');
    setBundlePrice(0);
    setSelectedProductIds([]);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const deleteBundle = async (id: string) => {
    await databaseService.deleteBundle(id);
    setBundles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-white">Synergy_Kit_Architect</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Bundle Assets into High-Value Synergy Kits</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-8 py-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-green-500 active:bg-green-700 transition-all"
        >
          Initialize_New_Kit
        </button>
      </header>

      {isCreating && (
        <div className="glass-grey border border-white/10 p-10 rounded-[3rem] space-y-10 animate-in slide-in-from-top-8 duration-500">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest border-l-2 border-[#00D1FF] pl-3">Kit Parameters</div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Kit Designation</label>
                <input 
                  type="text"
                  value={bundleName}
                  onChange={e => setBundleName(e.target.value)}
                  placeholder="e.g., Midnight Cyber Synergy"
                  className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#00D1FF] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Synergy Description</label>
                <textarea 
                  rows={3}
                  value={bundleDescription}
                  onChange={e => setBundleDescription(e.target.value)}
                  className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#00D1FF] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Synergy Price (GH₵)</label>
                  <input 
                    type="number"
                    value={bundlePrice}
                    onChange={e => setBundlePrice(Number(e.target.value))}
                    className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Lifespan (Seconds)</label>
                  <input 
                    type="number"
                    value={expiresIn}
                    onChange={e => setExpiresIn(Number(e.target.value))}
                    className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest border-l-2 border-[#00D1FF] pl-3">Asset Selection</div>
              <div className="max-h-[300px] overflow-y-auto pr-4 space-y-2 scrollbar-hide">
                {products.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => toggleProductSelection(p.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      selectedProductIds.includes(p.id) 
                        ? 'border-[#00D1FF] bg-[#00D1FF]/5' 
                        : 'border-white/5 hover:border-white/10 glass-light'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={p.image} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-white uppercase">{p.name}</div>
                        <div className="text-[8px] text-zinc-500 uppercase tracking-widest">
                          Supplier: {suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-zinc-400">GH₵{p.price}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsCreating(false)}
              className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
            >
              Abort_Protocol
            </button>
            <button 
              onClick={handleCreateBundle}
              className="flex-[2] py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-green-500 hover:text-white active:bg-green-700 transition-all shadow-2xl"
            >
              Finalize_Synergy_Kit
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Active_Synergy_Inventory</div>
        {bundles.length === 0 ? (
          <div className="glass-grey border border-dashed border-white/10 p-20 rounded-[3rem] text-center">
            <div className="text-4xl mb-6 opacity-20">📦</div>
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No Synergy Kits Initialized</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bundles.map(bundle => (
              <div key={bundle.id} className="glass-grey border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-[#00D1FF]/30 transition-all">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-serif italic text-white">{bundle.name}</h3>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">{bundle.products.length} Assets Synchronized</p>
                    </div>
                    <div className="text-xl font-mono font-black text-[#00D1FF]">GH₵{bundle.bundlePrice}</div>
                  </div>
                  
                  <div className="flex -space-x-4">
                    {bundle.products.map((p, i) => (
                      <img 
                        key={p.id} 
                        src={p.image} 
                        className="w-12 h-12 rounded-full border-2 border-zinc-950 object-cover" 
                        style={{ zIndex: bundle.products.length - i }}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{bundle.description}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ID: {bundle.id}</div>
                  <button 
                    onClick={() => deleteBundle(bundle.id)}
                    className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition-all"
                  >
                    Decommission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKitManager;
