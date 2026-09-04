import React, { useState, useEffect, useRef } from 'react';
import { Users, Copy, Check, Share2, MessageCircle, Gift, Sparkles, Trophy, ArrowRight, ShieldCheck, Clock, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, Send, Image, Plus, RefreshCw, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { ReferralRecord, ReferralStats, UserPost } from '../types';

interface KFamViewProps {
  userId?: string;
  onNavigate?: (view: any) => void;
  onOpenAuth?: () => void;
}

const GHANA_STYLE_PRESETS = [
  {
    name: 'Cyber Accra Alt',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
    description: 'Vibrant neon styling with industrial straps and tailored cargo detailing.'
  },
  {
    name: 'Kente Fusion Contemporary',
    url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=600',
    description: 'Modern asymmetric jacket with woven custom kente trim accents.'
  },
  {
    name: 'Minimalist Linen Drop',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600',
    description: 'Breezy minimalist linen ensemble tailored for the warm climate.'
  },
  {
    name: 'Accra High Fashion Trench',
    url: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&q=80&w=600',
    description: 'Accra-core high fashion statement featuring layered editorial cuts.'
  }
];

export const KFamView: React.FC<KFamViewProps> = ({ userId, onNavigate, onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'community'>('referrals');
  
  // Referrals State
  const [referralCode, setReferralCode] = useState<string>('');
  const [storeCredit, setStoreCredit] = useState<number>(0);
  const [stats, setStats] = useState<ReferralStats>({
    totalInvited: 0,
    completedCount: 0,
    pendingCount: 0,
    totalEarned: 0
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'casual' | 'story' | 'drop'>('casual');

  // Community Feed State
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [showNewPostForm, setShowNewPostForm] = useState<boolean>(false);
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [newPostCaption, setNewPostCaption] = useState<string>('');
  const [isFeedLoading, setIsFeedLoading] = useState<boolean>(false);

  // Group Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      if (userId && userId !== 'guest') {
        const data = await databaseService.getMyReferralStats();
        if (data && data.status === 'success') {
          setReferralCode(data.referralCode || '');
          setStoreCredit(data.storeCredit || 0);
          if (data.stats) setStats(data.stats);
          if (data.referrals) setReferrals(data.referrals);
        }
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityData = async () => {
    setIsFeedLoading(true);
    setIsChatLoading(true);
    try {
      // Fetch Dressing style posts (which will be automatically 5-day filtered by backend)
      const postData = await databaseService.getSocialPosts();
      // Sort newest first
      setPosts(postData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // Fetch Group Chat Messages
      const messageData = await databaseService.getGroupMessages();
      setMessages(messageData);
    } catch (err) {
      console.error('Error fetching community data:', err);
    } finally {
      setIsFeedLoading(false);
      setIsChatLoading(false);
    }
  };

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://closetkraze.top/?ref=${referralCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Referral link copied!');
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success('Referral code copied!');
    }
  };

  const templates = {
    casual: `Hey! Check out Closet Kraze for fire fashion & curated style drops. Use my code ${referralCode} to get GH₵20 off your first order over GH₵100! 🚀\n${referralLink}`,
    story: `Just copped from Closet Kraze and the quality is crazy! Grab GH₵20 off your first drop with code ${referralCode}: ${referralLink}`,
    drop: `New Closet Kraze drop is live! Use my code ${referralCode} for GH₵20 off your order: ${referralLink}`
  };

  const handleWhatsAppShare = () => {
    const text = templates[selectedTemplate];
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Community Feed Actions
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostImage) {
      toast.error('Please select a preset style or enter an image URL');
      return;
    }
    setIsPosting(true);
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'KrazeMember';
      const postObj = {
        id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: userId!,
        userHandle: userHandle,
        image: newPostImage,
        likes: 0,
        dislikes: 0,
        reports: 0,
        timestamp: new Date().toISOString(),
        weekId: 'week_' + Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
      };
      await databaseService.createSocialPost(postObj);
      toast.success('Your fashion styling post is live!');
      setNewPostImage('');
      setNewPostCaption('');
      setShowNewPostForm(false);
      fetchCommunityData();
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast.error(err.message || 'Failed to post dressing style');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostInteraction = async (postId: string, type: 'LIKE' | 'DISLIKE') => {
    try {
      await databaseService.interactWithPost(postId, userId!, type);
      // Fast local update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          if (type === 'LIKE') {
            return { ...p, likes: p.likes + 1 };
          } else {
            return { ...p, dislikes: p.dislikes + 1 };
          }
        }
        return p;
      }));
      toast.success(type === 'LIKE' ? 'Liked style! 🔥' : 'Disliked style. ❄️');
    } catch (err) {
      console.error('Interaction error:', err);
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      await databaseService.reportPost(postId, userId!, 'EXPLICIT_CONTENT');
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post reported and filtered for explicit content review.');
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  // Group Chat Actions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const currentText = newMessageText;
    setNewMessageText('');
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'KrazeMember';
      await databaseService.sendGroupMessage(userId!, userHandle, currentText);
      // Reload chat messages
      const messageData = await databaseService.getGroupMessages();
      setMessages(messageData);
    } catch (err) {
      console.error('Error sending group message:', err);
      toast.error('Failed to send message.');
    }
  };

  const handleReportMessage = async (msgId: string) => {
    try {
      await databaseService.reportGroupMessage(msgId, userId!);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success('Message reported and hidden from group chat.');
    } catch (err) {
      console.error('Error reporting message:', err);
    }
  };

  if (!userId || userId === 'guest') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
          <Users size={36} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3">
          Join the <span className="text-blue-500">KFAM</span> Community
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
          Sign in or register to get your unique referral code, check out styling tips from other members, and chat inside the exclusive group platform!
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 pt-6 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
      
      {/* TABS SELECTOR */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl w-full max-w-md shadow-lg shadow-black/40">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gift size={16} />
            Referrals & Rewards
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'community'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            KFam Community
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'referrals' ? (
          <motion.div
            key="referrals-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/40 border border-zinc-800 p-8 sm:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                  <Sparkles size={14} /> Kraze Family Referral Hub
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                  GIVE <span className="text-emerald-400">GH₵20</span>.<br />
                  GET <span className="text-blue-400">GH₵20</span>.
                </h1>
                <p className="text-zinc-400 text-base sm:text-lg font-medium leading-relaxed mb-8 max-w-2xl">
                  Invite your friends to Closet Kraze using your unique code. When they place their first order over GH₵100, they get <strong className="text-white">GH₵20 OFF</strong> immediately, and you automatically earn <strong className="text-white">GH₵20 Store Credit</strong> upon delivery!
                </p>

                {/* STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Invited</p>
                    <p className="text-2xl font-black text-white">{stats.totalInvited}</p>
                  </div>
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Completed</p>
                    <p className="text-2xl font-black text-emerald-400">{stats.completedCount}</p>
                  </div>
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Pending</p>
                    <p className="text-2xl font-black text-amber-400">{stats.pendingCount}</p>
                  </div>
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Store Credit Balance</p>
                    <p className="text-2xl font-black text-blue-400">GH₵ {storeCredit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* REFERRAL CODE & SHARE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* REFERRAL CODE CARD */}
              <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Your Kraze Referral Code</h3>
                    <Gift className="text-blue-400" size={20} />
                  </div>

                  <div className="bg-zinc-950 border border-blue-500/30 rounded-2xl p-5 mb-6 text-center relative group">
                    <p className="text-3xl sm:text-4xl font-black tracking-widest font-mono text-blue-400 select-all">
                      {referralCode || 'GENERATING...'}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Share this code directly or send your instant invitation link to your squad via WhatsApp, SMS, or Social Media.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => copyToClipboard(referralCode, false)}
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  >
                    {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                    {copiedCode ? 'Copied Code!' : 'Copy Code'}
                  </button>

                  <button
                    onClick={() => copyToClipboard(referralLink, true)}
                    className="w-full py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
                    {copiedLink ? 'Copied Link!' : 'Copy Invitation Link'}
                  </button>
                </div>
              </div>

              {/* WHATSAPP SHARE TEMPLATES */}
              <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight">WhatsApp Share Templates</h2>
                    <p className="text-xs text-zinc-400">Select a pre-crafted message variant to post to your chat or story</p>
                  </div>
                </div>

                {/* TEMPLATE SELECTOR BUTTONS */}
                <div className="flex bg-zinc-950 p-1.5 rounded-2xl mb-6 border border-zinc-800">
                  <button
                    onClick={() => setSelectedTemplate('casual')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedTemplate === 'casual'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Casual
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('story')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedTemplate === 'story'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Story
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('drop')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedTemplate === 'drop'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Drop Alert
                  </button>
                </div>

                {/* TEMPLATE PREVIEW BOX */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-6 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {templates[selectedTemplate]}
                </div>

                <button
                  onClick={handleWhatsAppShare}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={18} />
                  Share on WhatsApp
                </button>
              </div>
            </div>

            {/* HOW IT WORKS VISUAL STEPS */}
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                <Trophy className="text-blue-400" size={20} /> How Kraze Referral Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 font-black flex items-center justify-center mb-4 text-base border border-blue-500/20">
                    01
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white mb-2">Share Your Code</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Send your custom referral code or invitation link to your friends, family, or squad.
                  </p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 font-black flex items-center justify-center mb-4 text-base border border-emerald-500/20">
                    02
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white mb-2">Friend Gets GH₵20 Off</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your referee enters your code at checkout to enjoy GH₵20 off their first purchase (min GH₵100).
                  </p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 font-black flex items-center justify-center mb-4 text-base border border-purple-500/20">
                    03
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white mb-2">You Get GH₵20 Credit</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    As soon as their order is delivered, GH₵20 store credit is added directly to your account balance!
                  </p>
                </div>
              </div>
            </div>

            {/* REFERRALS LIST TABLE */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Recent Referrals</h2>
                  <p className="text-xs text-zinc-400">Track your invited squad and reward statuses</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                  {referrals.length} Total
                </span>
              </div>

              {referrals.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                  <Users className="mx-auto text-zinc-600 mb-3" size={36} />
                  <p className="text-sm font-bold text-zinc-400 mb-1">No Referrals Yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Share your code <span className="font-mono font-bold text-blue-400">{referralCode}</span> with friends to start earning GH₵20 store credit!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest font-black">
                        <th className="pb-4">Referee</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Reward</th>
                        <th className="pb-4 text-right">Date Invited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-black text-blue-400 text-xs uppercase">
                              {ref.refereeName?.charAt(0) || 'U'}
                            </div>
                            <span>@{ref.refereeName}</span>
                          </td>
                          <td className="py-4">
                            {ref.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black uppercase text-[10px]">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black uppercase text-[10px]">
                                <Clock size={12} /> Pending Delivery
                              </span>
                            )}
                          </td>
                          <td className="py-4 font-mono font-bold text-emerald-400">
                            GH₵ {ref.rewardAmount.toFixed(2)}
                          </td>
                          <td className="py-4 text-right text-zinc-400 font-mono">
                            {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="community-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* LEFT COLUMN: FASHION & STYLE FITS FEED (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="text-blue-400" size={24} /> Fashion & Style Fits Feed
                  </h2>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> Fits expire & disappear in <span className="text-blue-400 font-bold">5 days</span> to keep inspiration fresh!
                  </p>
                </div>
                
                <button
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  Post Fit
                </button>
              </div>

              {/* NEW POST FORM EXPANDABLE */}
              <AnimatePresence>
                {showNewPostForm && (
                  <motion.form
                    onSubmit={handleCreatePost}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl"
                  >
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Select a Ghana Style Preset</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {GHANA_STYLE_PRESETS.map((preset) => (
                          <button
                            type="button"
                            key={preset.name}
                            onClick={() => setNewPostImage(preset.url)}
                            className={`relative text-left rounded-xl overflow-hidden border-2 h-24 group transition-all ${
                              newPostImage === preset.url
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                                : 'border-zinc-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 flex flex-col justify-end">
                              <p className="text-[10px] font-black uppercase tracking-wide text-white leading-tight">{preset.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Image size={16} />
                      </div>
                      <input
                        type="url"
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                        placeholder="Or paste any custom fashion photo URL..."
                        className="w-full pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {newPostImage && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-4">
                        <img src={newPostImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-zinc-800" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-xs font-black uppercase text-emerald-400">Selected Style Ready</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-xs">{newPostImage}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewPostImage('');
                          setShowNewPostForm(false);
                        }}
                        className="px-5 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPosting}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20"
                      >
                        {isPosting ? 'Posting fit...' : 'Post fits style'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* SOCIAL POST FEED */}
              {isFeedLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="animate-spin text-blue-500 mb-3" size={32} />
                  <p className="text-xs text-zinc-500">Loading K-Family style inspirations...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-[2rem] bg-zinc-900/30">
                  <Image className="mx-auto text-zinc-600 mb-3" size={40} />
                  <p className="text-sm font-bold text-zinc-400 mb-1">No Community Fits Yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                    Be the very first trendsetter of Closet Kraze to showcase your outfit style to the family!
                  </p>
                  <button
                    onClick={() => setShowNewPostForm(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider"
                  >
                    Share dressing style
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <motion.div
                      layout
                      key={post.id}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg group relative flex flex-col justify-between"
                    >
                      {/* HEADER */}
                      <div className="p-4 flex items-center justify-between border-b border-zinc-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 font-black flex items-center justify-center text-xs border border-blue-500/20 uppercase">
                            {post.userHandle.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-white">@{post.userHandle}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono font-bold">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {/* POST FIT IMAGE */}
                      <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
                        <img
                          src={post.image}
                          alt="Ghana Style Inspiration"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* SOCIAL CONTROLS */}
                      <div className="p-4 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handlePostInteraction(post.id, 'LIKE')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 transition-all active:scale-95"
                            title="Love fit style"
                          >
                            <ThumbsUp size={14} />
                            <span className="text-xs font-mono font-black">{post.likes}</span>
                          </button>
                          
                          <button
                            onClick={() => handlePostInteraction(post.id, 'DISLIKE')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all active:scale-95"
                            title="Dislike fit style"
                          >
                            <ThumbsDown size={14} />
                            <span className="text-xs font-mono font-black">{post.dislikes}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleReportPost(post.id)}
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Report explicit content"
                        >
                          <Flag size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: LIVE GROUP CHAT (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between h-[650px] relative">
                
                {/* CHAT HEADER */}
                <div className="pb-4 border-b border-zinc-800/80 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-md">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-white">KFam Group Lounge</h3>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Exclusive chat platform
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fetchCommunityData}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Reload lounge"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* MESSAGES VIEWPORT */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {isChatLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="animate-spin text-blue-500" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-zinc-800 rounded-2xl">
                      <MessageCircle className="text-zinc-600 mb-2" size={28} />
                      <p className="text-xs font-bold text-zinc-400">Welcome to the Lounge</p>
                      <p className="text-[10px] text-zinc-500 max-w-xs mt-0.5">
                        Send a message to say hello to the Closet Kraze family!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === userId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group max-w-full`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-black text-zinc-400">@{msg.userHandle}</span>
                            <span className="text-[8px] text-zinc-600 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 max-w-[85%]">
                            {!isMe && (
                              <button
                                onClick={() => handleReportMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-zinc-950 border border-zinc-850 hover:border-red-500/40 text-zinc-600 hover:text-red-400 transition-all"
                                title="Report message"
                              >
                                <Flag size={10} />
                              </button>
                            )}

                            <div className={`p-3 rounded-2xl text-xs break-words shadow-sm leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-zinc-950 text-zinc-300 border border-zinc-850 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>

                            {isMe && (
                              <button
                                onClick={() => handleReportMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-zinc-950 border border-zinc-850 hover:border-red-500/40 text-zinc-600 hover:text-red-400 transition-all"
                                title="Report message"
                              >
                                <Flag size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* CHAT INPUT FORM */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-zinc-800/80 flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type family message..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KFamView;
