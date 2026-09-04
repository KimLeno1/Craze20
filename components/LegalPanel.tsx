import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Book, FileText, Scale } from 'lucide-react';
import { databaseService } from '../services/databaseService';

type LegalTab = 'TERMS' | 'PRIVACY' | 'REFUND_SHIPPING';

const LegalPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LegalTab>('TERMS');
  const [termsData, setTermsData] = useState<string>('');
  const [privacyData, setPrivacyData] = useState<string>('');
  const [refundData, setRefundData] = useState<string>('');

  useEffect(() => {
    Promise.all([
      databaseService.getPanelContent('terms'),
      databaseService.getPanelContent('privacy'),
      databaseService.getPanelContent('refund')
    ]).then(([terms, privacy, refund]) => {
      if (terms) setTermsData(terms);
      if (privacy) setPrivacyData(privacy);
      if (refund) setRefundData(refund);
    });
  }, []);

  const renderTabIcon = (tab: string) => {
    switch (tab) {
      case 'TERMS': return <Book className="w-4 h-4" />;
      case 'PRIVACY': return <Shield className="w-4 h-4" />;
      case 'REFUND_SHIPPING': return <Scale className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16 pb-40 animate-in fade-in duration-700">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full border border-zinc-100 mb-4 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.4em]">Compliance Core</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-serif italic text-zinc-950 tracking-tighter leading-none">
          Legal <span className="text-zinc-950 not-italic font-sans font-black uppercase">Protocols</span>
        </h1>
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em]">Terms, Privacy & Operations</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide -mx-6 px-6 gap-3 md:justify-center">
        {(['TERMS', 'PRIVACY', 'REFUND_SHIPPING'] as LegalTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === tab 
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-[0_10px_30px_rgba(0,0,0,0.1)]' 
                : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-300 hover:text-zinc-950'
            }`}
          >
            {renderTabIcon(tab)}
            {tab === 'REFUND_SHIPPING' ? 'Refund & Shipping' : tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 md:p-16 rounded-[4rem] border border-zinc-100 min-h-[500px] relative overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.03)]">
        <AnimatePresence mode="wait">
          {activeTab === 'TERMS' && (
            <motion.div 
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 font-mono"
            >
              <div className="space-y-2 mb-10">
                <h2 className="text-4xl font-serif italic text-zinc-950">Terms of Protocol</h2>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Usage governance version 3.0.0</p>
              </div>
              <div className="space-y-12 text-[11px] text-zinc-600 leading-relaxed h-[400px] overflow-y-auto pr-6 scrollbar-hide whitespace-pre-wrap">
                {termsData || `1. Node Membership\nBy accessing the terminal, you agree to abide by the community standards of the Social Gallery. Automated scraping of pricing anomalies is strictly forbidden and may result in neural-link termination.\n\n2. Transaction Security\nAll payments are processed through high-security encryptions. We do not store raw credit card data within our central database.\n\n3. Intellectual Property\nThe visual aura, brand identity, and custom silhouettes featured on this platform are proprietary assets. Unauthorized cloning is a breach of creative protocol.\n\n4. User Liability\nUsers are responsible for maintaining the security of their Archiver Handles. We are not liable for data loss occurring through unsecured user devices.`}
              </div>
            </motion.div>
          )}

          {activeTab === 'PRIVACY' && (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 font-mono"
            >
              <div className="space-y-2 mb-10">
                <h2 className="text-4xl font-serif italic text-zinc-950">Privacy Cipher</h2>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data protection protocols</p>
              </div>
              <div className="space-y-12 text-[11px] text-zinc-600 leading-relaxed h-[400px] overflow-y-auto pr-6 scrollbar-hide whitespace-pre-wrap">
                {privacyData || `I. Data Collection\nWe only collect data essential for the neural styling experience. This includes aesthetic preferences, sizing parameters, and acquisition history. We do not Sell your data to external sectors.\n\nII. Biometric & Behavioral Data\nBrowsing metrics (Hype Score alignment) are anonymized and used strictly for optimizing price velocity algorithms and catalog curation.\n\nIII. Encryption\nAll communications between your terminal and our central core are encrypted using end-to-end AES-256 standards.`}
              </div>
            </motion.div>
          )}

          {activeTab === 'REFUND_SHIPPING' && (
            <motion.div 
              key="refund"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12 max-w-3xl"
            >
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-serif italic text-zinc-950 tracking-tighter">Refund, Shipping & Cancellation Protocol</h2>
                <div className="h-1 w-20 bg-orange-500"></div>
              </div>
              <div className="space-y-10 text-zinc-600 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {refundData || `**Cancellation Policy**\n• Pre-Dispatch: Cancel anytime before fulfillment for a full refund.\n• Post-Dispatch: Once tracking is active, initiate a return after delivery.\n• System Cancellations: Anomalies or suspected fraud will be auto-canceled and refunded.\n\n**Refund Policy**\n• 5-Day Return: Initiated within 5 days of delivery.\n• Condition: Original unworn state with security tags.\n• Exclusions: Intimates, custom silhouettes, and "Final Drop" items.\n\n**Shipping Policy**\n• Velocity: 24-48h processing time.\n• Standard: 3-10 business days global delivery.`}
                <div className="p-8 border border-zinc-100 bg-zinc-50 rounded-3xl text-[10px] text-zinc-400 italic space-y-2 mt-8">
                  <p>We prioritize consumer protection, quality assurance, and transparent logistics.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LegalPanel;
