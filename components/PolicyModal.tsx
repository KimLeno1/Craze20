
import React from 'react';
import { X, FileText, Shield, Truck, RefreshCcw } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'TERMS' | 'REFUND';
}

const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#00D1FF]">
            {type === 'TERMS' ? <Shield size={24} /> : <RefreshCcw size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-serif italic text-white leading-none">
              {type === 'TERMS' ? 'Terms & Conditions' : 'Refund & Shipping Policy'}
            </h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
              Version 1.4.0 • Last Updated May 2026
            </p>
          </div>
        </div>

        <div className="space-y-6 text-zinc-400 font-mono text-[11px] leading-relaxed h-[400px] overflow-y-auto pr-4 scrollbar-hide">
          {type === 'TERMS' ? (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-white font-black uppercase text-xs tracking-widest">1. ACCEPTANCE OF TERMS</h3>
                <p>By accessing and using Closet Kraze, you agree to be bound by these Terms and Conditions. If you do not agree, you must terminate your uplink connection immediately.</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-white font-black uppercase text-xs tracking-widest">2. USER RESPONSIBILITY</h3>
                <p>You are responsible for the security of your Archiver Handle and neural credentials. Any activity under your account is your sole responsibility.</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-white font-black uppercase text-xs tracking-widest">3. INTELLECTUAL PROPERTY</h3>
                <p>All silhouettes, visual auras, and proprietary code within this terminal are protected by creative protocol. Unauthorized duplication strictly prohibited.</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-white font-black uppercase text-xs tracking-widest">4. TRANSACTION SECURITY</h3>
                <p>We use encrypted gateways for all acquisitions. We are not liable for external sponsorship (Pay For Me) failures outside our central core.</p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <RefreshCcw size={14} />
                  <h3 className="text-white font-black uppercase text-xs tracking-widest">Refund & Return Policy</h3>
                </div>
                <div className="space-y-3">
                  <h4 className="text-white text-[10px] font-bold uppercase">Return Window</h4>
                  <p>• **5 Days Return Protocol:** You have 5 days from the moment of physical delivery to initiate a return sequence.</p>
                  
                  <h4 className="text-white text-[10px] font-bold uppercase mt-4">Conditions for Return</h4>
                  <p>• Item must be in **Original Vault Condition** (unworn, unwashed, all original tags and security seals intact).</p>
                  <p>• Original packaging must be preserved.</p>
                  
                  <h4 className="text-white text-[10px] font-bold uppercase mt-4">Non-Refundable Items</h4>
                  <p>• Underwear and intimate apparel.</p>
                  <p>• Beauty and skincare products (if seal is broken).</p>
                  <p>• Custom-modified silhouettes (Style Protocols).</p>
                  <p>• Limited "Final Drop" items marked as high-scarcity.</p>
                  
                  <h4 className="text-white text-[10px] font-bold uppercase mt-4">Refund Process</h4>
                  <p>• **Inspection:** Once received at our central node, items undergo a 24-hour aesthetic inspection.</p>
                  <p>• **Approval:** If approved, a refund is triggered to your original funding source (Paystack gateway).</p>
                  <p>• **Velocity:** Credits typically materialize within 3-5 business cycles depending on your banking institution.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-500">
                  <Truck size={14} />
                  <h3 className="text-white font-black uppercase text-xs tracking-widest">Shipping Policy</h3>
                </div>
                <div className="space-y-3">
                  <h4 className="text-white text-[10px] font-bold uppercase">Delivery Times</h4>
                  <p>• **Standard Shipping:** 3-10 business days.</p>
                  <p>• **Processing Time:** All orders are sanitized and prepared for dispatch within 24-48 hours.</p>
                  
                  <h4 className="text-white text-[10px] font-bold uppercase mt-4">Tracking</h4>
                  <p>• Real-time neural tracking link provided via the Communication Terminal once the dispatch sequence initializes.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <X size={14} />
                  <h3 className="text-white font-black uppercase text-xs tracking-widest">Cancellation Policy</h3>
                </div>
                <div className="space-y-3">
                  <p>• **Pre-Dispatch:** You may cancel an order anytime before the fulfillment chamber initiates dispatch (typically within 24 hours of acquisition). A full refund will be initiated immediately.</p>
                  <p>• **Post-Dispatch:** Once a tracking system is active, the order cannot be canceled. You must initiate a return sequence upon delivery.</p>
                  <p>• **System Cancellations:** We reserve the right to terminate anomalies—including inventory discrepancies or suspected fraudulent activity. You will be fully refunded if a system cancellation occurs.</p>
                </div>
              </section>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] italic text-zinc-500">Closet Kraze Operational Policy</p>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#00D1FF] hover:text-white transition-all"
        >
          Acknowledge Policy
        </button>
      </div>
    </div>
  );
};

export default PolicyModal;
