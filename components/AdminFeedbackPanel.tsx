import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Skeleton } from './Skeleton';
import { Trash2, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { FeedbackMessage } from '../types';

const AdminFeedbackPanel: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Panel content states
  const [faqData, setFaqData] = useState<string>('[]');
  const [aboutData, setAboutData] = useState<string>('');
  const [termsData, setTermsData] = useState<string>('');
  const [privacyData, setPrivacyData] = useState<string>('');
  const [refundData, setRefundData] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'INBOX' | 'CONTENT'>('INBOX');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const fb = await databaseService.getFeedback();
      setFeedbacks(fb);

      const faq = await databaseService.getPanelContent('faq');
      setFaqData(faq ? JSON.stringify(faq, null, 2) : '[]');

      const about = await databaseService.getPanelContent('about');
      setAboutData(about || '');

      const terms = await databaseService.getPanelContent('terms');
      setTermsData(terms || '');

      const privacy = await databaseService.getPanelContent('privacy');
      setPrivacyData(privacy || '');

      const refund = await databaseService.getPanelContent('refund');
      setRefundData(refund || '');

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await databaseService.updateFeedbackStatus(id, status);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await databaseService.deleteFeedback(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      let parsedFaq;
      try {
        parsedFaq = JSON.parse(faqData);
      } catch (e) {
        alert("Invalid JSON for FAQ data");
        setIsSaving(false);
        return;
      }

      await databaseService.savePanelContent('faq', parsedFaq);
      await databaseService.savePanelContent('about', aboutData);
      await databaseService.savePanelContent('terms', termsData);
      await databaseService.savePanelContent('privacy', privacyData);
      await databaseService.savePanelContent('refund', refundData);
      
      alert("Content saved successfully");
    } catch (e) {
      console.error(e);
      alert("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xl font-serif italic text-white">Feedback & Communications</h3>
          <p className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">Manage user feedback and dynamic panel content</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('INBOX')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'INBOX' ? 'bg-white text-black' : 'glass-light text-zinc-500 hover:text-white border border-white/5'
            }`}
          >
            User Inbox
          </button>
          <button 
            onClick={() => setActiveTab('CONTENT')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'CONTENT' ? 'bg-white text-black' : 'glass-light text-zinc-500 hover:text-white border border-white/5'
            }`}
          >
            Panel Content
          </button>
        </div>
      </div>

      {activeTab === 'INBOX' && (
        <div className="grid gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="glass-grey p-6 border border-white/5 rounded-3xl space-y-4">
                 <Skeleton className="w-1/3 h-6" />
                 <Skeleton className="w-full h-16" />
              </div>
            ))
          ) : feedbacks.length === 0 ? (
            <div className="text-center p-12 glass-grey border border-white/5 rounded-3xl text-zinc-500 uppercase tracking-widest space-y-4 font-black">
              <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
              <p>No feedback received yet</p>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div key={fb.id} className="glass-grey p-6 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between gap-6 transition-all hover:bg-white/5">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-[#00D1FF] uppercase px-3 py-1 bg-[#00D1FF]/10 rounded-full">{fb.topic}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{new Date(fb.timestamp).toLocaleString()}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                      fb.status === 'UNREAD' ? 'border-red-500/50 text-red-500' :
                      fb.status === 'READ' ? 'border-amber-500/50 text-amber-500' :
                      'border-green-500/50 text-green-500'
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{fb.userHandle || 'Anonymous'} <span className="text-zinc-500 font-normal">({fb.email})</span></div>
                    <div className="mt-2 text-xs font-mono text-zinc-400 whitespace-pre-wrap">{fb.message}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-start shrink-0">
                  {fb.status === 'UNREAD' && (
                    <button 
                      onClick={() => handleUpdateStatus(fb.id, 'READ')}
                      className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all rounded"
                    >
                      Mark Read
                    </button>
                  )}
                  {fb.status !== 'REPLIED' && (
                    <a 
                      href={`mailto:${fb.email}?subject=Kraze System Support: Re: ${fb.topic}`}
                      onClick={() => handleUpdateStatus(fb.id, 'REPLIED')}
                      className="px-4 py-2 text-[9px] flex items-center justify-center gap-2 font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all rounded"
                    >
                      <Mail size={12} /> Reply
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(fb.id)}
                    className="px-4 py-2 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'CONTENT' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={handleSaveContent}
              disabled={isSaving}
              className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#00D1FF] hover:text-white transition-all rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Deploy Content Changes'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">FAQ Content (JSON format required)</label>
              <textarea 
                value={faqData}
                onChange={e => setFaqData(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-white focus:border-[#00D1FF] outline-none rounded-2xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">About Content</label>
              <textarea 
                value={aboutData}
                onChange={e => setAboutData(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-white focus:border-[#00D1FF] outline-none rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Terms Content</label>
              <textarea 
                value={termsData}
                onChange={e => setTermsData(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-white focus:border-[#00D1FF] outline-none rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Privacy Content</label>
              <textarea 
                value={privacyData}
                onChange={e => setPrivacyData(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-white focus:border-[#00D1FF] outline-none rounded-2xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Refund & Shipping Content</label>
              <textarea 
                value={refundData}
                onChange={e => setRefundData(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-white focus:border-[#00D1FF] outline-none rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeedbackPanel;
