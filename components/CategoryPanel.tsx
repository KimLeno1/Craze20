
import React, { useState, useMemo } from 'react';
import { Category, ViewState, Product, CategoryInfo } from '../types';
import { APP_CATEGORIES } from '../constants';
import { matchesCategory } from '../lib/categoryUtils';

interface CategoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  onNavigate: (view: ViewState) => void;
  activeCategory: Category;
  products: Product[];
  categories?: CategoryInfo[];
  onProductSelect: (product: Product) => void;
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  onSelectCategory, 
  onNavigate,
  activeCategory,
  products,
  categories,
  onProductSelect
}) => {
  const categoriesWithCounts = useMemo(() => {
    return APP_CATEGORIES.map(cat => {
      const count = products.filter(p => matchesCategory(p, cat.id, categories)).length;
      return { ...cat, count: count.toString() };
    });
  }, [products, categories]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Side Panel Drawer */}
      <div className={`fixed top-0 left-0 h-full w-full sm:max-w-sm bg-white z-[210] shadow-2xl transition-transform duration-500 ease-out border-r border-zinc-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <header className="p-6 sm:p-8 border-b border-zinc-200 flex items-center justify-between bg-white">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-serif italic text-zinc-950 tracking-tighter">Aesthetic Sectors</h2>
              <div className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-[0.5em]">Sector_Index</div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-950 transition-all"
            >
              <span className="text-lg">✕</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
            <div className="p-6 sm:p-8 space-y-8 sm:space-y-10">
              
              {/* Categories List */}
              <div className="space-y-4 sm:space-y-6">
                <div className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Sector</div>
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {categoriesWithCounts.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectCategory(cat.id);
                          onClose();
                        }}
                        className={`w-full group flex items-center justify-between p-3 sm:p-4 border transition-all ${
                          isActive ? 'bg-[#00D1FF] border-[#00D1FF] text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-zinc-300 hover:text-zinc-950'
                        }`}
                      >
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 overflow-hidden border border-zinc-200">
                            <img src={cat.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                          </div>
                          <div className="text-left">
                            <span className="block text-[10px] sm:text-xs font-black uppercase tracking-widest">{cat.label}</span>
                            <span className="text-[7px] sm:text-[8px] font-mono opacity-40 uppercase tracking-widest">Sector_{cat.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-[8px] sm:text-[10px] font-mono opacity-40">{cat.count}</span>
                          <span className="text-base sm:text-lg opacity-20 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Global Archive Link */}
              <button 
                onClick={() => {
                  onSelectCategory('All');
                  onClose();
                }}
                className="w-full py-4 sm:py-6 border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-200 transition-all text-center space-y-1 sm:space-y-2 group"
              >
                <div className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-950 transition-colors">Global Inventory</div>
                <div className="text-[7px] sm:text-[8px] font-mono text-zinc-300 uppercase tracking-[0.5em]">Access_All_Silhouettes</div>
              </button>

            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-6 sm:p-8 bg-white border-t border-zinc-200">
            <button 
              onClick={() => {
                onNavigate(ViewState.PROFILE);
                onClose();
              }}
              className="w-full py-4 sm:py-5 bg-zinc-950 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#00D1FF] transition-all flex items-center justify-center gap-3 sm:gap-4"
            >
              <span>View My Dossier</span>
              <span className="text-base sm:text-lg">→</span>
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default CategoryPanel;
