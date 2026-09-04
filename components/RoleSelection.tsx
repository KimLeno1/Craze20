
import React from 'react';
import { ViewState } from '../types';

interface RoleSelectionProps {
  onSelect: (role: 'ADMIN' | 'SUPPLIER') => void;
  onCancel: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[500] bg-black text-white font-mono flex items-center justify-center p-6 overflow-hidden">
      {/* Background Matrix/Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#ec4899 1px, transparent 1px), linear-gradient(90deg, #ec4899 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      ></div>

      <div className="w-full max-w-4xl space-y-12 relative z-10 animate-in fade-in zoom-in-95 duration-700 text-center">
        <div className="space-y-4">
          <div className="inline-block px-6 py-2 border border-[#ec4899]/30 rounded-full bg-black/50 backdrop-blur-md mb-4">
            <span className="text-[10px] font-black text-[#ec4899] uppercase tracking-[0.6em] animate-pulse">Identity_Verification_Required</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-[0.3em] glow-text italic">TERMINAL_LINK</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.6em] font-black">Select Access Protocol to Proceed</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <button 
            onClick={() => onSelect('ADMIN')}
            className="group relative bg-zinc-950 border border-white/5 p-12 rounded-[4rem] hover:border-[#00ff41]/50 transition-all duration-500 text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[15rem] font-black group-hover:scale-110 transition-transform duration-1000 select-none pointer-events-none text-[#00ff41]">A</div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#00ff41]/10 flex items-center justify-center text-4xl border border-[#00ff41]/20 group-hover:bg-[#00ff41]/20 transition-all">🧠</div>
              <div>
                <h3 className="text-3xl font-serif italic text-white group-hover:text-[#00ff41] transition-colors">Root Architect</h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2 font-black">Full System Governance // Sector 01</p>
              </div>
              <div className="text-[8px] text-zinc-700 uppercase tracking-widest pt-6 border-t border-white/5">System: Admin</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('SUPPLIER')}
            className="group relative bg-zinc-950 border border-white/5 p-12 rounded-[4rem] hover:border-[#f59e0b]/50 transition-all duration-500 text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[15rem] font-black group-hover:scale-110 transition-transform duration-1000 select-none pointer-events-none text-[#f59e0b]">S</div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#f59e0b]/10 flex items-center justify-center text-4xl border border-[#f59e0b]/20 group-hover:bg-[#f59e0b]/20 transition-all">🏭</div>
              <div>
                <h3 className="text-3xl font-serif italic text-white group-hover:text-[#f59e0b] transition-colors">Supplier Panel</h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2 font-black">Supply Chain Management // Regional Auth</p>
              </div>
              <div className="text-[8px] text-zinc-700 uppercase tracking-widest pt-6 border-t border-white/5">System: Node Uplink</div>
            </div>
          </button>
        </div>

        <button 
          onClick={onCancel}
          className="text-[10px] text-zinc-600 hover:text-white uppercase tracking-[0.4em] font-black pt-10 transition-colors"
        >
          ← Disconnect From Terminal
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
