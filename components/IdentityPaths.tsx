
import React from 'react';
import { PATHS } from '../constants';

interface IdentityPathsProps {
  onSelect: (pathId: string) => void;
  currentPath: string | null;
}

const IdentityPaths: React.FC<IdentityPathsProps> = ({ onSelect, currentPath }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 animate-in fade-in duration-1000">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif italic text-white">Choose Your Identity</h2>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">Your path defines your legacy in the Craze circuit</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PATHS.map((path) => (
          <div 
            key={path.id}
            onClick={() => onSelect(path.id)}
            className={`group relative p-8 rounded-[3rem] border transition-all duration-500 cursor-pointer overflow-hidden ${
              currentPath === path.id 
              ? 'border-pink-500 bg-zinc-900/80' 
              : 'border-white/5 bg-zinc-900/20 hover:border-white/20'
            }`}
          >
            {/* Background Glow */}
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-br ${path.color} opacity-10 blur-[60px] group-hover:opacity-30 transition-opacity`}></div>
            
            <div className="relative z-10 space-y-6">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{path.icon}</div>
              <div>
                <h3 className="text-2xl font-serif italic text-white mb-2">{path.name}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed font-medium uppercase tracking-tighter">{path.description}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Active Perks</div>
                {path.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                    <span className="w-1 h-1 bg-pink-500 rounded-full"></span>
                    {perk}
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentPath === path.id 
                ? 'bg-pink-500 text-white shadow-xl shadow-pink-500/20' 
                : 'bg-white text-black hover:bg-pink-500 hover:text-white'
              }`}>
                {currentPath === path.id ? 'Path Active' : 'Select Class'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdentityPaths;
