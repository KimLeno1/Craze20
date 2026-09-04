import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Mail, MapPin, Sparkles } from 'lucide-react';
import { ViewState } from '../types';

interface FooterProps {
  onNavigate?: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#020617] text-white px-6 md:px-12 py-20 border-t border-zinc-800/80 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-10">
        {/* Brand Column */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">
            CLOSET<span className="text-blue-500 font-sans not-italic font-black ml-0.5">KRAZE</span>
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-mono">
            Curated archive of elevated fashion, distinctive silhouettes, and individual style. Every drop is inspected and authentic. Secure your place in the circuit.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <span 
              onClick={() => onNavigate && onNavigate(ViewState.ABOUT)}
              className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#C5A880] hover:text-white cursor-pointer transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} /> Curator Story
            </span>
          </div>
        </div>
        
        {/* The Protocol */}
        <div className="space-y-6">
          <h4 className="text-[11px] uppercase tracking-[0.4em] font-black text-white font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            The Protocol
          </h4>
          <ul className="space-y-3.5 text-xs text-zinc-400 font-mono">
            <li 
              onClick={() => onNavigate && onNavigate(ViewState.ABOUT)}
              className="text-blue-400 hover:text-white font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              ★ About & Founder Story
            </li>
            <li 
              onClick={() => onNavigate && onNavigate(ViewState.CONTACT)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Logistics & Handling
            </li>
            <li 
              onClick={() => onNavigate && onNavigate(ViewState.LEGAL)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Vault Terms & Policy
            </li>
            <li 
              onClick={() => onNavigate && onNavigate(ViewState.STYLE_PROTOCOL)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              The Style Protocol
            </li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="space-y-6">
          <h4 className="text-[11px] uppercase tracking-[0.4em] font-black text-white font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            Contact
          </h4>
          <div className="space-y-4 text-xs font-mono">
            {/* WhatsApp */}
            <a 
              href="https://wa.me/233553877937?text=Hey%20ClosetKraze%2C%20I%20have%20a%20question%20about%20your%20drops."
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              aria-label="Contact Closet Kraze on WhatsApp +233 55 387 7937"
              className="flex items-center gap-3 text-zinc-300 hover:text-[#25D366] transition-all group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all">
                <WhatsAppIcon size={14} title="WhatsApp Contact" />
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">WhatsApp Comms</span>
                <span className="text-xs font-bold text-white group-hover:text-[#25D366] transition-colors">+233 55 387 7937</span>
              </div>
            </a>

            {/* Email */}
            <a 
              href="mailto:admin@closetkraze.top"
              tabIndex={0}
              aria-label="Send email to admin@closetkraze.top"
              className="flex items-center gap-3 text-zinc-300 hover:text-blue-400 transition-all group"
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-[#0F52BA] group-hover:text-white transition-all">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Direct Dispatch</span>
                <span className="text-xs text-white group-hover:text-blue-400 transition-colors">admin@closetkraze.top</span>
              </div>
            </a>

            {/* Location */}
            <div className="flex items-center gap-3 text-zinc-300">
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Vault HQ</span>
                <span className="text-xs text-zinc-300">Kumasi, Ghana</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-16 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-zinc-800/80 mt-16 text-zinc-500 font-mono text-[10px]">
        <div className="uppercase tracking-[0.3em] font-black italic text-zinc-400">
          Dress to be addressed
        </div>
        <div className="flex gap-8 uppercase tracking-[0.2em]">
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">Encryption Policy</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">User Agreement</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
