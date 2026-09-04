import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, MessageSquare, Info, Shield, RefreshCcw, ChevronDown, Send, CheckCircle2, Truck } from 'lucide-react';
import { databaseService } from '../services/databaseService';

type SupportTab = 'FAQ' | 'FEEDBACK' | 'ABOUT' | 'TERMS' | 'PRIVACY' | 'REFUND_SHIPPING';

const ContactPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SupportTab>('FEEDBACK');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [faqData, setFaqData] = useState<any[]>([]);
  const [aboutData, setAboutData] = useState<string>('');
  const [termsData, setTermsData] = useState<string>('');
  const [privacyData, setPrivacyData] = useState<string>('');
  const [refundData, setRefundData] = useState<string>('');

  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    topic: 'SYSTEM_SUGGESTION',
    message: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faq, about, terms, privacy, refund] = await Promise.all([
          databaseService.getPanelContent('faq'),
          databaseService.getPanelContent('about'),
          databaseService.getPanelContent('terms'),
          databaseService.getPanelContent('privacy'),
          databaseService.getPanelContent('refund')
        ]);
        
        if (faq && Array.isArray(faq)) setFaqData(faq);
        if (about) setAboutData(about);
        if (terms) setTermsData(terms);
        if (privacy) setPrivacyData(privacy);
        if (refund) setRefundData(refund);
      } catch (error) {
        console.error("Failed to load panel content", error);
      }
    };
    fetchData();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const loggedInUser = localStorage.getItem('userId');
      const payload = {
        userId: loggedInUser || 'GUEST',
        userHandle: formData.identifier,
        email: formData.email,
        topic: formData.topic,
        message: formData.message
      };
      
      const res = await databaseService.submitFeedback(payload);
      if (res && res.status === 'success') {
        setIsSuccess(true);
        setFormData({ identifier: '', email: '', topic: 'SYSTEM_SUGGESTION', message: '' });
        setTimeout(() => setIsSuccess(false), 5000);
      }
    } catch(err) {
       console.error("Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultFaqs = [
    {
      q: "When is the next drop?",
      a: "Drops are scheduled every Friday at 18:00 GMT. High-tier members (Trendsetter rank and above) receive a 2-hour early access window via neural priority uplink."
    },
    {
      q: "Do you ship internationally?",
      a: "Yes, we ship to all major global sectors. Latency in delivery depends on your regional infrastructure, but typically ranges from 3-7 business days."
    },
    {
      q: "What is the 'Hype Score'?",
      a: "The Hype Score is a real-time calculation based on item views, cart additions, and social sentiment. It directly influences price velocity and scarcity alerts."
    },
    {
      q: "How do I increase my Rep score?",
      a: "REP is earned through successful acquisitions, style contributions to the Social Gallery, and completing weekly neural quests."
    },
    {
      q: "What is Pay For Me?",
      a: "Pay For Me is our external sponsorship protocol that allows you to generate a secure link for 3rd parties to fund your acquisitions without needing access to your account."
    }
  ];

  const displayFaqs = faqData.length > 0 ? faqData : defaultFaqs;

  const renderTabIcon = (tab: SupportTab) => {
    switch (tab) {
      case 'FAQ': return <HelpCircle className="w-5 h-5" />;
      case 'FEEDBACK': return <MessageSquare className="w-5 h-5" />;
      case 'ABOUT': return <Info className="w-5 h-5" />;
      case 'TERMS': return <Shield className="w-5 h-5" />;
      case 'PRIVACY': return <Shield className="w-5 h-5" />;
      case 'REFUND_SHIPPING': return <RefreshCcw className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16 pb-40 animate-in fade-in duration-700">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm mb-4">
          <div className="w-2 h-2 rounded-full bg-[#0F52BA] animate-pulse"></div>
          <span className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.4em]">Customer Feedback Uplink</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-serif italic text-zinc-950 tracking-tighter leading-none">
          Customer <span className="text-zinc-950 not-italic font-sans font-black uppercase">Feedback</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">FAQ, System Feedback & Legal Protocols</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide -mx-6 px-6 gap-3 md:justify-center">
        {(['FAQ', 'FEEDBACK', 'ABOUT'] as SupportTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === tab 
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-[0_0_30px_rgba(0,0,0,0.1)]' 
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-950'
            }`}
          >
            {renderTabIcon(tab)}
            {tab === 'REFUND_SHIPPING' ? 'Refund & Shipping' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 md:p-16 rounded-[4rem] border border-zinc-200 shadow-sm min-h-[500px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'FAQ' && (
            <motion.div 
              key="faq"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 mb-12">
                <h2 className="text-4xl font-serif italic text-zinc-950">Frequent Queries</h2>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Instant intelligence retrieval</p>
              </div>
              <div className="grid gap-4">
                {displayFaqs.map((faq, i) => (
                  <div key={i} className={`bg-zinc-50 border rounded-3xl overflow-hidden transition-all duration-500 ${expandedFaq === i ? 'border-blue-300 bg-white shadow-sm' : 'border-zinc-200'}`}>
                    <button 
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="text-sm font-black text-zinc-950 font-mono">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-500 ${expandedFaq === i ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedFaq === i ? 'max-h-60' : 'max-h-0'}`}>
                      <div className="p-6 pt-0 text-[11px] font-medium text-zinc-600 leading-relaxed max-w-2xl border-t border-zinc-200 mt-2 font-mono whitespace-pre-wrap">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'FEEDBACK' && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              {!localStorage.getItem('userId') ? (
                <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-[#0F52BA]/10 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_50px_rgba(15,82,186,0.15)] text-[#0F52BA]">
                    <Shield size={48} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif italic text-zinc-950 tracking-tighter">Access Restricted</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed px-8">
                      You must be logged into your Archiver account to transmit feedback. <br/>
                      This protocol ensures the integrity of our aesthetic directives.
                    </p>
                    <div className="pt-8">
                      <button 
                        onClick={() => window.location.href = '/'}
                        className="px-10 py-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-blue-600 transition-all shadow-xl"
                      >
                        Return to Authentication
                      </button>
                    </div>
                  </div>
                </div>
              ) : isSuccess ? (
                <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_50px_rgba(34,197,94,0.2)] text-green-500">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif italic text-zinc-950">Uplink Successful</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">
                      Your neural feedback has been integrated into the central core. <br/> We appreciate the contribution to the collective aesthetic.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-10">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-4xl font-serif italic text-zinc-950">Direct Feedback</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Influence the future of the platform</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Identifier</label>
                        <input 
                          type="text" required
                          value={formData.identifier}
                          onChange={e => setFormData({...formData, identifier: e.target.value})}
                          className="w-full bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400"
                          placeholder="ARCHIVER HANDLE"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Email Address</label>
                        <input 
                          type="email" required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400"
                          placeholder="your.email@domain.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Topic</label>
                        <select 
                          value={formData.topic}
                          onChange={e => setFormData({...formData, topic: e.target.value})}
                          className="w-full bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="SYSTEM_SUGGESTION">SYSTEM_SUGGESTION</option>
                          <option value="AESTHETIC_REPORT">AESTHETIC_REPORT</option>
                          <option value="USER_EXPERIENCE">USER_EXPERIENCE</option>
                          <option value="GENERAL_QUERY">GENERAL_QUERY</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Transmission Data</label>
                      <textarea 
                        required rows={6}
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-white border border-zinc-200 shadow-sm p-8 rounded-[2.5rem] text-xs font-black text-zinc-950 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-zinc-400"
                        placeholder="Log your experience or suggestions for architectural refinement..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-20 bg-zinc-950 text-white font-black uppercase tracking-[0.5em] text-[10px] rounded-[2.5rem] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Initialize Uplink
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'ABOUT' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12 max-w-3xl"
            >
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-serif italic text-zinc-950 tracking-tighter">The Vision of Kraze</h2>
                <div className="h-1 w-20 bg-[#C5A880]"></div>
              </div>
              <div className="space-y-10 text-zinc-600 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {aboutData || `Closet Kraze is not just an interface for transactions. It is a high-velocity fashion ecosystem designed for those who navigate the intersection of editorial luxury, elevated fashion, and authentic personal style.

Our Philosophy
We believe emotion precedes logic. Every garment in our archive is selected to trigger a psychological response, reinforcing status, exclusivity, and aesthetic authority.

Built for Speed
In the world of Closet Kraze, latency is the enemy. Our drops are governed by Flash sales and scarcity-driven pricing models to ensure a truly competitive commerce experience.`}
              </div>
            </motion.div>
          )}

          </AnimatePresence>
      </div>

      <footer className="grid md:grid-cols-3 gap-8">
        {[
          { label: 'Uplink Status', value: 'OPTIMAL', icon: '📡' },
          { label: 'Intelligence', value: 'ACTIVE', icon: '🧠' },
          { label: 'Support Tier', value: 'GLOBAL', icon: '🌍' }
        ].map((stat, i) => (
          <div key={i} className="bg-white shadow-sm border border-zinc-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-2">
            <span className="text-2xl mb-2">{stat.icon}</span>
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</span>
            <span className="text-xs font-mono font-black text-zinc-950">{stat.value}</span>
          </div>
        ))}
      </footer>
    </div>
  );
};

export default ContactPanel;
