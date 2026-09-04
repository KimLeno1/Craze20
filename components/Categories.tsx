
import React from 'react';
import { motion } from 'motion/react';
import { ViewState, CategoryInfo } from '../types';
import { APP_CATEGORIES } from '../constants';

interface CategoriesProps {
  categories: CategoryInfo[];
  onSelectCategory: (category: string) => void;
  onNavigate: (view: ViewState) => void;
}

const Categories: React.FC<CategoriesProps> = ({ categories, onSelectCategory, onNavigate }) => {
  return (
    <div className="p-8 space-y-12 pb-32">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl font-serif italic text-white">The <span className="text-blue-500 not-italic font-sans font-black">COLLECTIONS</span></h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Filter the curated fashion archive by category.</p>
      </motion.header>

      <div className="grid grid-cols-1 gap-6">
        {APP_CATEGORIES.map((cat, idx) => (
          <motion.div 
            key={cat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            onClick={() => {
              onSelectCategory(cat.id);
              onNavigate(ViewState.FAMOUS);
            }}
            className="group relative h-48 rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/5 hover:border-[#0F52BA]/40 transition-all shadow-2xl"
          >
            <img 
              src={cat.img} 
              className="w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-1000" 
              alt={cat.label}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-0 p-10 flex items-center justify-between">
              <div className="space-y-2">
                <motion.span 
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="text-4xl block mb-2"
                >
                  {cat.id === 'Apparel' ? '🧥' : cat.id === 'Footwear' ? '👟' : cat.id === 'Accessories' ? '🕶️' : cat.id === 'Beauty' ? '💄' : '📦'}
                </motion.span>
                <h3 className="text-3xl font-serif italic text-white group-hover:text-[#C5A880] transition-colors">{cat.label}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Authenticated Archive</p>
                </div>
                <p className="text-[7px] text-zinc-600 uppercase tracking-[0.2em] font-mono mt-2 italic truncate max-w-[200px]">
                  PID: {cat.inspiration}
                </p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.1, x: 5 }}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_20px_rgba(15,82,186,0.3)]"
              >
                <span className="text-[#C5A880] text-xl font-bold">→</span>
              </motion.div>
            </div>
            
            {/* Ambient inner glow */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0F52BA]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
