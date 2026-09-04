
import React, { useState, useEffect } from 'react';
import { Product, PriceAnomaly } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

const AdminPriceAnomalyManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]); // Added anomalies state
  const [config, setConfig] = useState<{
    duration: number;
    productIds: string[];
    discount: number;
    eventId: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setProducts(await databaseService.getProducts());
    setAnomalies(await databaseService.getPriceAnomalies()); // Fetch active anomalies
    const currentConfig = await databaseService.getAnomalyConfig();
    setConfig(currentConfig || {
      duration: 2,
      productIds: [],
      discount: 20,
      eventId: ''
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await databaseService.saveAnomalyConfig({
        duration: config.duration,
        productIds: config.productIds,
        discount: config.discount
      });
      // Refresh config to get new eventId
      const updated = await databaseService.getAnomalyConfig();
      if (updated) setConfig(updated);
      toast.success('Anomaly Protocol Updated Successfully.');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save Anomaly Protocol configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnomaly = async (id: string) => {
    try {
      await databaseService.deletePriceAnomaly(id);
      await fetchData(); // Refresh anomalies list
      toast.success('Anomaly terminated.');
    } catch (error) {
      toast.error('Error terminating anomaly.');
      console.error('Delete anomaly error:', error);
    }
  };

  const toggleProduct = (productId: string) => {
    if (!config) return;
    const newIds = config.productIds.includes(productId)
      ? config.productIds.filter(id => id !== productId)
      : [...config.productIds, productId];
    setConfig({ ...config, productIds: newIds });
  };

  if (!config) return <div className="text-zinc-500 font-black uppercase tracking-widest p-20">Loading_Protocols...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-white">Global_Reduction_Protocols</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Initialize Liquidation Events</p>
        </div>
        <button 
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="bg-green-500 text-white px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-green-500 active:bg-green-700 transition-all disabled:opacity-50"
        >
          {isSaving ? 'UPDATING_PROTOCOLS...' : 'DEPLOY_REDUCTION_EVENT'}
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl space-y-4">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Window_Duration (Hours)</label>
          <input 
            type="number"
            value={config.duration}
            onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) || 0 })}
            className="w-full bg-black border border-white/10 p-4 rounded-xl text-xl font-mono text-white outline-none focus:border-[#00D1FF]"
          />
          <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Time allowed per user session</p>
        </div>

        <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl space-y-4">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Discount_Factor (%)</label>
          <input 
            type="number"
            value={config.discount}
            onChange={e => setConfig({ ...config, discount: parseInt(e.target.value) || 0 })}
            className="w-full bg-black border border-white/10 p-4 rounded-xl text-xl font-mono text-white outline-none focus:border-[#00D1FF]"
          />
          <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Global reduction applied to selected assets</p>
        </div>

        <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl space-y-4">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active_Event_ID</label>
          <div className="w-full bg-black/50 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-500 overflow-hidden text-ellipsis">
            {config.eventId || 'NO_ACTIVE_EVENT'}
          </div>
          <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Unique identifier for current protocol</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-widest">Active_Liquidation_Events</h3>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{anomalies.length} Events Active</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {anomalies.map(a => {
            const product = products.find(p => p.id === a.productId);
            return (
              <div key={a.id} className="glass-light border border-white/5 p-6 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden">
                    {product && <img src={product.image} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{product?.name || 'Unknown Asset'}</div>
                    <div className="text-[9px] font-mono text-zinc-500">End: {new Date(a.anomalyEndTime).toLocaleString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAnomaly(a.id)}
                  className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                >
                  Terminate
                </button>
              </div>
            );
          })}
          {anomalies.length === 0 && (
             <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-3xl text-[10px] uppercase font-black text-zinc-700 italic">No active reduction events.</div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-widest">Target_Assets_Selection</h3>
          <span className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest">{config.productIds.length} Assets Selected</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => toggleProduct(p.id)}
              className={`relative group aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all ${
                config.productIds.includes(p.id) 
                  ? 'border-[#00D1FF] scale-[0.98]' 
                  : 'border-white/5 grayscale hover:grayscale-0 hover:border-white/20'
              }`}
            >
              <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <div className="text-[8px] font-black text-white uppercase truncate">{p.name}</div>
                <div className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">GH₵{p.price}</div>
              </div>
              {config.productIds.includes(p.id) && (
                <div className="absolute top-3 right-3 bg-[#00D1FF] text-white p-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPriceAnomalyManager;
