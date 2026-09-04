
import React, { useState } from 'react';
import { Product, UserStats, ViewState } from '../types';

interface OutfitBuilderProps {
  products: Product[];
  stats: UserStats;
  onNavigate: (view: ViewState) => void;
  onLockLook: (items: Product[]) => void;
}

const OutfitBuilder: React.FC<OutfitBuilderProps> = ({ products, onLockLook }) => {
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const slots = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];
  
  const handleToggleItem = (product: Product) => {
    if (selectedItems.find(p => p.id === product.id)) {
      setSelectedItems(selectedItems.filter(p => p.id !== product.id));
    } else {
      const filtered = selectedItems.filter(p => p.category !== product.category);
      setSelectedItems([...filtered, product]);
    }
  };

  const calculateTotal = () => selectedItems.reduce((acc, p) => acc + p.price, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
      <div className="lg:col-span-8 space-y-8">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <h2 className="text-4xl font-serif italic text-white tracking-tighter">The Fitting Room</h2>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inventory v1.0</div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => {
            const isSelected = selectedItems.some(p => p.id === product.id);
            return (
              <div 
                key={product.id}
                onClick={() => handleToggleItem(product)}
                className={`group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                  isSelected ? 'border-pink-500 scale-95' : 'border-transparent hover:border-white/20'
                }`}
              >
                <img src={product.image} className="w-full h-full object-cover opacity-80" alt={product.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                   <div className="text-[8px] font-black text-pink-500 uppercase mb-0.5">{product.category}</div>
                   <div className="text-[10px] font-bold text-white uppercase truncate">{product.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8 sticky top-24 h-fit">
        <div className="glass p-8 rounded-[3rem] border-white/10 space-y-8 shadow-3xl">
          <div className="text-center">
            <h3 className="text-2xl font-serif italic text-white mb-2">Live Canvas</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sunk-Cost Estimation Active</p>
          </div>

          <div className="space-y-4">
            {slots.map((slot) => {
              const item = selectedItems.find(p => p.category === slot);
              return (
                <div key={slot} className="flex items-center gap-4 p-3 bg-zinc-950/50 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                    {item ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="opacity-20 text-lg">👕</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{slot}</div>
                    <div className={`text-[10px] font-bold uppercase ${item ? 'text-white' : 'text-zinc-800 italic'}`}>
                      {item ? item.name : 'Empty Slot...'}
                    </div>
                  </div>
                  {item && <span className="text-[10px] font-mono text-zinc-400">GH₵{item.price}</span>}
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="flex justify-between items-center">
               <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Value</div>
               <div className="text-2xl font-black text-white font-mono">GH₵{calculateTotal()}</div>
            </div>
            
            <button 
              disabled={selectedItems.length === 0}
              onClick={() => onLockLook(selectedItems)}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#EC4899] hover:text-white transition-all disabled:opacity-20"
            >
              Lock This Look
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitBuilder;
