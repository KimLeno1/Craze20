import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, Copy, Check, Share2, MessageCircle, Gift, Sparkles, Trophy, 
  ArrowRight, ShieldCheck, Clock, CheckCircle2, MessageSquare, ThumbsUp, 
  ThumbsDown, AlertTriangle, Send, Image, Plus, RefreshCw, Flag, 
  Upload, Camera, Tag, Info, Calendar, Flame, Snowflake, ExternalLink,
  MessageCircleQuestion, Sparkle, X, ChevronRight, HelpCircle,
  Layers, Database, Lock, Cpu, CheckCircle, ArrowLeft, Radio, Heart, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { ReferralRecord, ReferralStats, UserPost, SocialComment, SocialCycleInfo } from '../types';

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

const STYLE_TAG_OPTIONS = [
  'Streetwear', 'Accra-Core', 'Minimalist', 'KenteFusion', 
  'Vintage', 'OldMoney', 'Avant-Garde', 'Y2K', 'Casual', 'NightOut'
];

export const KFamView: React.FC<KFamViewProps> = ({ userId, onNavigate, onOpenAuth }) => {
  // Navigation panel: 'hub' (overview with 2 cards), 'referrals' (referral panel), or 'social' (social area panel)
  const [currentPanel, setCurrentPanel] = useState<'hub' | 'referrals' | 'social'>('hub');
  
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
  const [ledgerBlocks, setLedgerBlocks] = useState<any[]>([]);
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [chainVerificationResult, setChainVerificationResult] = useState<any>(null);
  const [bindCodeInput, setBindCodeInput] = useState<string>('');
  const [isBindingCode, setIsBindingCode] = useState<boolean>(false);
  const [bindMessage, setBindMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'casual' | 'story' | 'drop'>('casual');

  // Community Feed State
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [cycleInfo, setCycleInfo] = useState<SocialCycleInfo | null>(null);
  const [showResetInfoModal, setShowResetInfoModal] = useState<boolean>(false);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [showNewPostForm, setShowNewPostForm] = useState<boolean>(false);
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostCaption, setNewPostCaption] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUploadSource, setImageUploadSource] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isFeedLoading, setIsFeedLoading] = useState<boolean>(false);
  const [countdownString, setCountdownString] = useState<string>('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, SocialComment[]>>({});
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Group Chat State & Media Extensions
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatAttachedImage, setChatAttachedImage] = useState<string | null>(null);
  const [isUploadingChatImage, setIsUploadingChatImage] = useState<boolean>(false);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [chatFilterMode, setChatFilterMode] = useState<'all' | 'images'>('all');
  const [showPresetPicker, setShowPresetPicker] = useState<boolean>(false);
  const [chatSelectedLightboxImage, setChatSelectedLightboxImage] = useState<string | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReferralData();
    fetchCommunityData();
    fetchCycleInfo();
  }, [userId]);

  // Periodic polling for chat messages & cycle status when in social panel or hub
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChatMessagesSilently();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Live Friday countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const day = now.getUTCDay(); // 0 = Sun, 5 = Fri
      const daysUntilFriday = (5 - day + 7) % 7;
      
      const targetFriday = new Date(now);
      if (daysUntilFriday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) {
        targetFriday.setUTCDate(now.getUTCDate() + 7);
      } else {
        targetFriday.setUTCDate(now.getUTCDate() + daysUntilFriday);
      }
      targetFriday.setUTCHours(0, 0, 0, 0);

      const diffMs = targetFriday.getTime() - now.getTime();
      if (diffMs <= 0) {
        setCountdownString('Resetting for Friday!');
        return;
      }

      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);

      if (days > 0) {
        setCountdownString(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdownString(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && currentPanel === 'social') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentPanel]);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      if (userId && userId !== 'guest') {
        const data = await databaseService.getMyReferralStats();
        if (data && data.status === 'success') {
          setReferralCode(data.referralCode || '');
          setStoreCredit(data.storeCredit || 0);
          if (data.stats) setStats(data.stats);
          if (data.referrals) setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
          if (data.ledger) setLedgerBlocks(Array.isArray(data.ledger) ? data.ledger : []);
        }

        try {
          const ledgerRes = await databaseService.getReferralLedger();
          if (ledgerRes && ledgerRes.status === 'success' && Array.isArray(ledgerRes.blocks)) {
            setLedgerBlocks(ledgerRes.blocks);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBindReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = bindCodeInput.trim().toUpperCase();
    if (!clean) return;

    setIsBindingCode(true);
    setBindMessage(null);
    try {
      const res = await databaseService.bindReferralCode(clean);
      if (res && res.status === 'success') {
        toast.success('Referral code linked successfully!');
        setBindMessage({ text: res.message || 'Referral applied successfully!', type: 'success' });
        setBindCodeInput('');
        fetchReferralData();
      } else {
        const msg = res?.message || 'Failed to bind referral code.';
        toast.error(msg);
        setBindMessage({ text: msg, type: 'error' });
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to bind referral code.';
      toast.error(msg);
      setBindMessage({ text: msg, type: 'error' });
    } finally {
      setIsBindingCode(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    setIsVerifyingChain(true);
    try {
      const res = await databaseService.verifyReferralBlockchain();
      if (res && res.status === 'success') {
        setChainVerificationResult(res.verification);
        if (res.verification.isValid) {
          toast.success(`Blockchain Verified: All ${res.verification.totalBlocks} blocks valid with 0 tampering!`);
        } else {
          toast.error(`Ledger Discrepancy: ${res.verification.errors?.join(', ') || 'Verification failed'}`);
        }
      }
    } catch (err: any) {
      console.error('Error verifying blockchain:', err);
      toast.error('Failed to verify blockchain ledger');
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const fetchCycleInfo = async () => {
    try {
      const cycle = await databaseService.getSocialCycleInfo();
      setCycleInfo(cycle);
    } catch (e) {
      console.error('Error fetching cycle info:', e);
    }
  };

  const fetchCommunityData = async () => {
    setIsFeedLoading(true);
    setIsChatLoading(true);
    try {
      const [postData, messageData] = await Promise.all([
        databaseService.getSocialPosts(),
        databaseService.getGroupMessages()
      ]);
      setPosts(Array.isArray(postData) ? postData : []);
      setMessages(Array.isArray(messageData) ? messageData : []);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setPosts([]);
      setMessages([]);
    } finally {
      setIsFeedLoading(false);
      setIsChatLoading(false);
    }
  };

  const fetchChatMessagesSilently = async () => {
    try {
      const messageData = await databaseService.getGroupMessages();
      setMessages(Array.isArray(messageData) ? messageData : []);
    } catch (err) {
      // silent
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadRes = await databaseService.uploadFeedImage(file);
      if (uploadRes && uploadRes.url) {
        setNewPostImage(uploadRes.url);
        toast.success('Style photo uploaded successfully!');
      } else {
        throw new Error('Upload returned invalid response');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Failed to upload photo. Try another image.');
    } finally {
      setIsUploadingImage(false);
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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostImage) {
      toast.error('Please upload a photo, select a preset, or enter an image URL');
      return;
    }
    setIsPosting(true);
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'KrazeMember';
      const postObj = {
        userId: userId!,
        userHandle: userHandle,
        image: newPostImage,
        styleTitle: newPostTitle.trim() || undefined,
        caption: newPostCaption.trim() || undefined,
        tags: selectedTags,
        likes: 0,
        dislikes: 0,
        reports: 0
      };
      await databaseService.createSocialPost(postObj);
      toast.success('Your fashion styling post is live for this Friday cycle! 🔥');
      setNewPostImage('');
      setNewPostTitle('');
      setNewPostCaption('');
      setSelectedTags([]);
      setShowNewPostForm(false);
      fetchCommunityData();
      fetchCycleInfo();
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast.error(err.message || 'Failed to post dressing style');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostInteraction = async (postId: string, type: 'LIKE' | 'DISLIKE') => {
    try {
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
      await databaseService.interactWithPost(postId, userId!, type);
      toast.success(type === 'LIKE' ? 'Voted Fire Fit! 🔥' : 'Voted Cold! ❄️');
    } catch (err) {
      console.error('Interaction error:', err);
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      await databaseService.reportPost(postId, userId!, 'EXPLICIT_CONTENT');
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post reported and filtered from your view.');
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
    } else {
      setExpandedCommentsPostId(postId);
      try {
        const comments = await databaseService.getPostComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: Array.isArray(comments) ? comments : [] }));
      } catch (e) {
        console.error('Error fetching comments:', e);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'KrazeMember';
      await databaseService.addPostComment(postId, userId!, userHandle, newCommentText.trim());
      setNewCommentText('');
      const comments = await databaseService.getPostComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: Array.isArray(comments) ? comments : [] }));
      toast.success('Comment posted!');
    } catch (e) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB.');
      return;
    }

    setIsUploadingChatImage(true);
    try {
      const uploadRes = await databaseService.uploadFeedImage(file);
      if (uploadRes && uploadRes.url) {
        setChatAttachedImage(uploadRes.url);
        toast.success('Style photo attached to chat!');
      } else {
        throw new Error('Upload returned invalid response');
      }
    } catch (err: any) {
      console.error('Chat image upload error:', err);
      toast.error(err.message || 'Failed to attach photo to chat');
    } finally {
      setIsUploadingChatImage(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, predefinedText?: string, predefinedImage?: string) => {
    if (e) e.preventDefault();
    const textToSend = predefinedText !== undefined ? predefinedText : newMessageText;
    const imageToSend = predefinedImage !== undefined ? predefinedImage : chatAttachedImage;

    if (!textToSend.trim() && !imageToSend) return;
    
    if (predefinedText === undefined) {
      setNewMessageText('');
    }
    if (predefinedImage === undefined) {
      setChatAttachedImage(null);
    }
    setShowPresetPicker(false);
    
    try {
      const userHandle = localStorage.getItem('cc-user-handle') || 'KrazeMember';
      await databaseService.sendGroupMessage(userId!, userHandle, textToSend, imageToSend || undefined);
      const messageData = await databaseService.getGroupMessages();
      setMessages(Array.isArray(messageData) ? messageData : []);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error sending group message:', err);
      toast.error('Failed to send message.');
    }
  };

  const handleReactToMessage = (msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      const msgMap = prev[msgId] || {};
      const currentCount = msgMap[emoji] || 0;
      return {
        ...prev,
        [msgId]: {
          ...msgMap,
          [emoji]: currentCount + 1
        }
      };
    });
    toast.success(`Reacted with ${emoji}`);
  };

  const filteredMessages = useMemo(() => {
    let list = messages;
    if (chatFilterMode === 'images') {
      list = list.filter(m => m.imageUrl && m.imageUrl.trim().length > 0);
    }
    if (chatSearchQuery.trim()) {
      const q = chatSearchQuery.toLowerCase().trim();
      list = list.filter(m => 
        (m.text && m.text.toLowerCase().includes(q)) ||
        (m.userHandle && m.userHandle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [messages, chatFilterMode, chatSearchQuery]);

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
          Sign in or register to showcase your styling pics, participate in the weekly Friday lounge chat, and earn referral commissions!
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20 cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-white pb-32 pt-2 sm:pt-4 px-3.5 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: KFAM GATEWAY HUB (TWO MAIN CARDS)                     */}
      {/* ------------------------------------------------------------- */}
      {currentPanel === 'hub' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Header Banner */}
          <header className="space-y-3 pt-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest">
                K-Family Network Hub
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-none flex items-center justify-center sm:justify-start gap-2">
                <span>KFAM Network</span>
                <span className="text-xl sm:text-2xl text-[#C5A880]">✦</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-2xl">
                Explore the two pillars of the K-Family: Earn 10% lifetime commissions through the Referral Alliance, or showcase your outfits and chat live in the Social Area.
              </p>
            </div>
          </header>

          {/* TWO PRIMARY GATEWAY CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            
            {/* CARD 1: REFERRALS & REWARDS ALLIANCE */}
            <div 
              onClick={() => setCurrentPanel('referrals')}
              className="group relative rounded-3xl bg-gradient-to-br from-[#08152B] via-[#0B1E3F] to-[#0A162B] border border-blue-500/20 hover:border-blue-400/50 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] cursor-pointer overflow-hidden min-h-[380px]"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-all" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                    <Gift className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-[9px] font-mono font-bold uppercase tracking-wider text-blue-300">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" /> 10% Lifetime Store Credit
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-200 transition-colors">
                    Referral Alliance
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                    Share your unique referral code with friends. Earn <strong>10% lifetime store credit</strong> on every purchase they make, backed by cryptographic SHA-256 blockchain verification.
                  </p>
                </div>

                {/* Quick Live Stats Pill Row */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Earned</p>
                    <p className="text-base sm:text-lg font-mono font-black text-emerald-400">GH₵{Math.round(stats.totalEarned)}</p>
                  </div>
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Friends</p>
                    <p className="text-base sm:text-lg font-mono font-black text-white">{stats.totalInvited}</p>
                  </div>
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Blocks</p>
                    <p className="text-base sm:text-lg font-mono font-black text-blue-400">{ledgerBlocks.length}</p>
                  </div>
                </div>

                {/* Code Snippet Box */}
                {referralCode && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(referralCode, false);
                    }}
                    className="p-3 bg-zinc-950/90 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs font-mono group/code"
                  >
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Your Referral Code</span>
                      <span className="font-bold text-blue-400 text-sm tracking-wider">{referralCode}</span>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                      {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300">
                  Open Referrals Panel
                </span>
                <div className="w-9 h-9 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-lg shadow-blue-600/30">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            {/* CARD 2: SOCIAL AREA & FRIDAY FITS LOUNGE */}
            <div 
              onClick={() => setCurrentPanel('social')}
              className="group relative rounded-3xl bg-gradient-to-br from-[#061826] via-[#0A2438] to-[#081524] border border-cyan-500/20 hover:border-cyan-400/50 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] cursor-pointer overflow-hidden min-h-[380px]"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                    <Calendar className="w-3 h-3 text-cyan-400" /> Weekly Friday Cleanse
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                    Social Area & Lounge
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                    Post your weekly styling shots, vote on community fits (Fire vs Cold), and join real-time conversations in the members-only KFam Group Lounge.
                  </p>
                </div>

                {/* Quick Live Stats Pill Row */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Friday Reset</p>
                    <p className="text-xs sm:text-sm font-mono font-black text-cyan-300 truncate">{countdownString || 'Fri 00:00'}</p>
                  </div>
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Live Fits</p>
                    <p className="text-base sm:text-lg font-mono font-black text-white">{posts.length}</p>
                  </div>
                  <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-mono uppercase text-zinc-400 tracking-wider">Lounge Chat</p>
                    <p className="text-base sm:text-lg font-mono font-black text-blue-400">{messages.length} msgs</p>
                  </div>
                </div>

                {/* Ghana Presets Mini Bar */}
                <div className="p-3 bg-zinc-950/90 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Style Presets Available</span>
                    <span className="font-bold text-cyan-300 text-xs">Accra-Core • Streetwear • Kente</span>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase font-bold">
                    + Post Fit
                  </span>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300">
                  Enter Social Area
                </span>
                <div className="w-9 h-9 rounded-full bg-cyan-600 group-hover:bg-cyan-500 text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-lg shadow-cyan-600/30">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: DEDICATED REFERRALS & REWARDS PANEL                   */}
      {/* ------------------------------------------------------------- */}
      {currentPanel === 'referrals' && (
        <motion.div
          key="referrals-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-8"
        >
          {/* Top Panel Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <button
              onClick={() => setCurrentPanel('hub')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Back to KFam Hub</span>
            </button>

            {/* Quick Switch to Social Area */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline uppercase">Switch Portal:</span>
              <button
                onClick={() => setCurrentPanel('social')}
                className="px-3.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={13} className="text-cyan-400" />
                <span>Social Area & Lounge →</span>
              </button>
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-blue-900/40 via-zinc-900 to-indigo-950/40 border border-blue-500/20 p-5 sm:p-8 md:p-10 overflow-hidden shadow-2xl">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black tracking-wider uppercase">
                <Gift size={14} /> K-Family Lifetime Referral Alliance
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Invite Friends. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Earn 10% For Life</span> on Every Purchase.
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                Share your exclusive code with your circle. Whenever someone you referred makes a purchase, you get <strong>10% of their product amount as store credit for life</strong> (rounded to the nearest whole number). Every commission is permanently secured on our cryptographic blockchain ledger.
              </p>

              {/* PROTOCOL PILLS */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider text-blue-300">
                  <CheckCircle size={11} className="text-blue-400" /> 10% Lifetime Store Credit
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  <CheckCircle size={11} className="text-indigo-400" /> Rounded to Nearest Whole Number
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <Database size={11} className="text-emerald-400" /> SHA-256 Blockchain Verified
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <Lock size={11} className="text-amber-400" /> Anti-Circular Referral Guard
                </span>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8">
              <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Friends Invited</p>
                <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalInvited}</p>
              </div>
              <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Purchases Rewarded</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.completedCount}</p>
              </div>
              <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Blockchain Blocks</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-400">{ledgerBlocks.length}</p>
              </div>
              <div className="bg-blue-600/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Lifetime Credit Earned</p>
                <p className="text-2xl sm:text-3xl font-black text-white">GH₵{Math.round(stats.totalEarned)}</p>
              </div>
            </div>
          </div>

          {/* REFERRAL CODE SHARING & CODE BINDING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* CODE & LINK BOX */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">Your Unique Referral Code</h3>
                <p className="text-xs text-zinc-400">Friends who use this code grant you 10% of all their future product purchases for life</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Referral Code</p>
                    <p className="text-xl sm:text-2xl font-mono font-black text-blue-400 tracking-wider">
                      {referralCode || 'GENERATING...'}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode, false)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="truncate mr-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Direct Invite Link</p>
                    <p className="text-xs font-mono text-zinc-400 truncate">
                      {referralLink}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, true)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>

            {/* WHATSAPP SHARING */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Share2 className="text-emerald-400" size={20} /> Instant WhatsApp Share
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">Select a pre-crafted message variant to share with your circle</p>
              </div>

              <div className="space-y-3">
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {(['casual', 'story', 'drop'] as const).map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        selectedTemplate === tmpl
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
                  {templates[selectedTemplate]}
                </div>
              </div>

              <button
                onClick={handleWhatsAppShare}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <Share2 size={16} /> Share on WhatsApp
              </button>
            </div>
          </div>

          {/* BIND A FRIEND'S CODE & CIRCULAR RULES NOTICE */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Lock className="text-amber-400" size={20} /> Apply a Friend's Referral Code
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Link yourself to a friend to reward them with 10% of your future product purchases for life.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 max-w-sm">
                <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                <span>Rule: You cannot use the referral code of someone you referred.</span>
              </div>
            </div>

            <form onSubmit={handleBindReferralCode} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={bindCodeInput}
                onChange={(e) => setBindCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter friend's code (e.g. CK-USER1234 or @handle)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isBindingCode || !bindCodeInput.trim()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isBindingCode ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                <span>{isBindingCode ? 'Validating...' : 'Apply Code'}</span>
              </button>
            </form>

            {bindMessage && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                bindMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}>
                {bindMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                <span>{bindMessage.text}</span>
              </div>
            )}
          </div>

          {/* BLOCKCHAIN AUDIT LEDGER SECTION */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2.5">
                  <Cpu className="text-blue-400" size={22} /> KFAM Referral Blockchain Ledger
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cryptographic SHA-256 Proof-of-Work blockchain recording every 10% purchase commission.
                </p>
              </div>

              <button
                onClick={handleVerifyBlockchain}
                disabled={isVerifyingChain}
                className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={13} className={isVerifyingChain ? 'animate-spin text-blue-400' : 'text-blue-400'} />
                <span>{isVerifyingChain ? 'Auditing Ledger...' : 'Audit Blockchain'}</span>
              </button>
            </div>

            {chainVerificationResult && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                chainVerificationResult.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {chainVerificationResult.isValid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>
                    {chainVerificationResult.isValid
                      ? `Chain Authenticated: All ${chainVerificationResult.totalBlocks} Blocks Intact & Validated`
                      : 'Chain Verification Warning'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 font-mono">
                  Genesis Hash: {chainVerificationResult.genesisHash} | Verified At: {new Date(chainVerificationResult.verifiedAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {ledgerBlocks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                <Database className="mx-auto text-zinc-600 mb-2" size={30} />
                <p className="text-xs text-zinc-400 font-bold">No Blockchain Commission Blocks Yet</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-sm mx-auto">
                  When friends you referred make purchases, each 10% commission will be mined into a permanent block on this chain.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ledgerBlocks.map((block) => (
                  <div
                    key={block.id || block.blockIndex}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all font-mono text-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                          BLOCK #{block.blockIndex}
                        </span>
                        <span className="text-zinc-400 text-[11px]">
                          {block.orderId ? `Order #${block.orderId}` : 'Genesis Block'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-black text-xs">
                          +GH₵{Math.round(block.rewardAmount || 0)} Credit
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase font-black">
                          Mined
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400">
                      <div>
                        <span className="text-zinc-600">Product Amount: </span>
                        <span className="text-zinc-200 font-bold">GH₵{block.productAmount || 0}</span>
                        <span className="text-zinc-500 text-[9px] ml-1">(10% rounded)</span>
                      </div>
                      <div>
                        <span className="text-zinc-600">Proof Nonce: </span>
                        <span className="text-zinc-200">{block.nonce}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[9px] text-zinc-500 pt-1">
                      <div className="truncate">
                        <span className="text-zinc-600">HASH: </span>
                        <span className="text-blue-300 select-all">{block.hash}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-zinc-600">PREV: </span>
                        <span className="text-zinc-400 select-all">{block.previousHash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REFERRAL LOGS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Referred Friends List</h3>
            {referrals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                <Users className="mx-auto text-zinc-600 mb-2" size={32} />
                <p className="text-xs text-zinc-400 font-bold">No referrals recorded yet</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Share your link to begin earning 10% lifetime store credit!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <th className="pb-3">Friend Handle</th>
                      <th className="pb-3">Date Linked</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Lifetime Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 font-mono">
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="text-zinc-300">
                        <td className="py-3 font-bold text-white">@{ref.refereeId || 'Anonymous'}</td>
                        <td className="py-3 text-zinc-500">{new Date(ref.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            ref.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-white">GH₵{Math.round(ref.rewardAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: DEDICATED SOCIAL AREA & FRIDAY FITS PANEL             */}
      {/* ------------------------------------------------------------- */}
      {currentPanel === 'social' && (
        <motion.div
          key="social-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-6"
        >
          {/* Top Panel Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <button
              onClick={() => setCurrentPanel('hub')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Back to KFam Hub</span>
            </button>

            {/* Quick Switch to Referrals Panel */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline uppercase">Switch Portal:</span>
              <button
                onClick={() => setCurrentPanel('referrals')}
                className="px-3.5 py-2 rounded-xl bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Gift size={13} className="text-blue-400" />
                <span>Referral Alliance →</span>
              </button>
            </div>
          </div>

          {/* TOP FRIDAY RESET BANNER */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/70 via-zinc-900/90 to-indigo-950/70 border border-blue-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <Calendar className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-[9px] font-black tracking-widest uppercase text-blue-300">
                      Weekly Cycle
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Wiped & Reset Every Friday
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white mt-0.5">
                    Friday Community Cleanse Protocol
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Next Friday Reset In</p>
                  <p className="text-xs sm:text-sm font-mono font-black text-blue-300 tracking-wider">
                    {countdownString || 'Calculating...'}
                  </p>
                </div>

                <button
                  onClick={() => setShowResetInfoModal(true)}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors cursor-pointer"
                  title="How Friday Reset Works"
                >
                  <Info size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN SOCIAL AREA GRID (SHOWCASE FEED + GROUP LOUNGE CHAT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* LEFT COLUMN: FASHION STYLE SHOWCASE FEED (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="text-blue-400" size={22} /> Friday Fits Showcase
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Show off your outfits & style inspiration. All fits reset every Friday at 00:00 UTC.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Post Fit</span>
                </button>
              </div>

              {/* EXPANDABLE NEW FIT POST FORM */}
              <AnimatePresence>
                {showNewPostForm && (
                  <motion.form
                    onSubmit={handleCreatePost}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-zinc-900 border border-blue-500/30 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Camera className="text-blue-400" size={18} />
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Showcase Your Style</h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">Live for this Friday edition</span>
                    </div>

                    {/* IMAGE SOURCE TABS */}
                    <div className="space-y-3">
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => setImageUploadSource('upload')}
                          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            imageUploadSource === 'upload' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Upload size={12} /> Upload Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadSource('preset')}
                          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            imageUploadSource === 'preset' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Sparkles size={12} /> Ghana Presets
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadSource('url')}
                          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            imageUploadSource === 'url' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Image size={12} /> Image URL
                        </button>
                      </div>

                      {/* UPLOAD FROM DEVICE */}
                      {imageUploadSource === 'upload' && (
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            {isUploadingImage ? (
                              <div className="flex flex-col items-center gap-2 py-4">
                                <RefreshCw className="animate-spin text-blue-400" size={28} />
                                <p className="text-xs font-bold text-zinc-300">Processing & optimizing photo...</p>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload size={20} />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase text-white tracking-wide">Click to Upload Fit Photo</p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">Supports PNG, JPG, WEBP (Max 10MB)</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* PRESET STYLES */}
                      {imageUploadSource === 'preset' && (
                        <div className="grid grid-cols-2 gap-2.5">
                          {GHANA_STYLE_PRESETS.map((preset) => (
                            <button
                              type="button"
                              key={preset.name}
                              onClick={() => setNewPostImage(preset.url)}
                              className={`relative text-left rounded-xl overflow-hidden border-2 h-24 group transition-all cursor-pointer ${
                                newPostImage === preset.url
                                  ? 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/50'
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
                      )}

                      {/* URL INPUT */}
                      {imageUploadSource === 'url' && (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                            <Image size={16} />
                          </div>
                          <input
                            type="url"
                            value={newPostImage}
                            onChange={(e) => setNewPostImage(e.target.value)}
                            placeholder="Paste direct fashion image URL (e.g. https://...)"
                            className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* PREVIEW SELECTED IMAGE */}
                    {newPostImage && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3.5">
                        <img src={newPostImage} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-zinc-800" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase text-emerald-400">Photo Attached</p>
                          <p className="text-[10px] text-zinc-500 truncate">{newPostImage}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPostImage('')}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* FIT TITLE & CAPTION */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                          Fit / Styling Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          placeholder="e.g. Accra Streetwear Evening Layering"
                          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                          Style Notes / Caption
                        </label>
                        <textarea
                          value={newPostCaption}
                          onChange={(e) => setNewPostCaption(e.target.value)}
                          rows={2}
                          placeholder="Tell the K-Fam about this silhouette, colors, and accessories..."
                          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>

                      {/* TAGS SELECTOR */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                          Style Category Tags
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {STYLE_TAG_OPTIONS.map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                selectedTags.includes(tag)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewPostForm(false)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPosting || !newPostImage}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25"
                      >
                        {isPosting ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        <span>{isPosting ? 'Publishing...' : 'Publish Fit'}</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* POSTS LIST */}
              {isFeedLoading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="animate-spin text-blue-400 mx-auto" size={32} />
                  <p className="text-xs text-zinc-400 uppercase font-mono">Loading Friday fashion feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                    <Camera size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-white">No Fits Posted Yet This Week</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                      Be the trendsetter! Post the very first outfit look for this Friday's edition of the K-Family Showcase.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewPostForm(true)}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <Plus size={16} /> Post First Fit
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700/80 rounded-3xl overflow-hidden shadow-xl transition-all"
                    >
                      {/* POST HEADER */}
                      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-sm text-white">
                            {post.userHandle?.substring(0, 2).toUpperCase() || 'KF'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white">@{post.userHandle || 'Member'}</span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                K-Fam Stylist
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(post.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Active Cycle
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReportPost(post.id)}
                          className="text-zinc-600 hover:text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Report content"
                        >
                          <Flag size={14} />
                        </button>
                      </div>

                      {/* POST IMAGE */}
                      <div className="relative aspect-[4/5] sm:aspect-square bg-zinc-950 overflow-hidden group">
                        <img
                          src={post.image}
                          alt={post.styleTitle || 'KFam Fashion Inspiration'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        {post.styleTitle && (
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black uppercase text-white">
                            {post.styleTitle}
                          </div>
                        )}
                      </div>

                      {/* POST FOOTER */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {/* TAGS */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] font-black uppercase text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-500/20">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CAPTION */}
                        {post.caption && (
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                            {post.caption}
                          </p>
                        )}

                        {/* ACTION BAR: FIRE / COLD / COMMENTS */}
                        <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePostInteraction(post.id, 'LIKE')}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer"
                            >
                              <Flame size={15} className="text-orange-400" />
                              <span>Fire ({post.likes || 0})</span>
                            </button>

                            <button
                              onClick={() => handlePostInteraction(post.id, 'DISLIKE')}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer"
                            >
                              <Snowflake size={15} className="text-blue-400" />
                              <span>Cold ({post.dislikes || 0})</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleComments(post.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <MessageSquare size={14} />
                            <span>Comments</span>
                          </button>
                        </div>

                        {/* EXPANDED COMMENTS SECTION */}
                        {expandedCommentsPostId === post.id && (
                          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {(!postComments[post.id] || postComments[post.id].length === 0) ? (
                                <p className="text-[11px] text-zinc-500 italic py-2 text-center">No comments yet. Drop your feedback!</p>
                              ) : (
                                postComments[post.id].map((c) => (
                                  <div key={c.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-blue-400">@{c.userHandle}</span>
                                      <span className="text-[9px] text-zinc-500 font-mono">{new Date(c.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-zinc-300 text-xs">{c.text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* ADD COMMENT INPUT */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                                placeholder="Drop fit feedback..."
                                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={isSubmittingComment || !newCommentText.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: KFAM GROUP LOUNGE (PROFESSIONAL CHAT & IMAGE PANEL) (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20 bg-zinc-950 border border-zinc-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col h-[700px] overflow-hidden">
                
                {/* Hidden File Input for Chat Attachments */}
                <input
                  type="file"
                  ref={chatFileInputRef}
                  onChange={handleChatImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* CHAT HEADER */}
                <div className="pb-3 border-b border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black uppercase tracking-tight text-white">KFam Group Lounge</h3>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[8px] font-mono font-bold text-blue-400">
                            PRO CHAT
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <p className="text-[10px] font-mono text-emerald-400 font-bold">Live Uplink • {messages.length} messages</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowResetInfoModal(true)}
                      className="text-[9px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Friday Reset Info"
                    >
                      Friday Reset ℹ️
                    </button>
                  </div>

                  {/* CHAT SEARCH & FILTER TABS BAR */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Live Search in Chat */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        placeholder="Search chat or @handles..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                      />
                      {chatSearchQuery && (
                        <button 
                          onClick={() => setChatSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Chat Filter Tabs: All vs Photos */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shrink-0">
                      <button
                        onClick={() => setChatFilterMode('all')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          chatFilterMode === 'all'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setChatFilterMode('images')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          chatFilterMode === 'images'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Image size={10} />
                        <span>Photos</span>
                        <span className="px-1 py-0.2 bg-white/20 rounded-full text-[8px]">
                          {messages.filter(m => m.imageUrl).length}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* MESSAGES SCROLL AREA */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 font-sans">
                  {filteredMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                      <MessageCircle size={32} className="mb-2 opacity-40 text-blue-400" />
                      <p className="text-xs font-bold text-zinc-300">
                        {chatSearchQuery ? 'No matching messages found' : chatFilterMode === 'images' ? 'No photo attachments shared yet' : 'Group Lounge is quiet'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">
                        {chatFilterMode === 'images' ? 'Click the photo icon below to share your first outfit picture!' : 'Be the first to share outfit ideas, ask questions, or post style photos!'}
                      </p>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isMe = msg.userId === userId;
                      const reactions = messageReactions[msg.id] || {};

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                        >
                          {/* User Avatar Circle */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isMe 
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm ring-1 ring-blue-400/40' 
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}>
                            {(msg.userHandle || 'M').charAt(0).toUpperCase()}
                          </div>

                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            {/* Message Meta Info */}
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-black text-zinc-300">
                                @{msg.userHandle || 'Member'}
                              </span>
                              {isMe && (
                                <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded-md font-mono">
                                  YOU
                                </span>
                              )}
                              <span className="text-[8px] text-zinc-500 font-mono">
                                {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {/* Hover Actions Bar */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity ml-1">
                                {['🔥', '❤️', '👍'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReactToMessage(msg.id, emoji)}
                                    className="text-[10px] hover:scale-125 transition-transform p-0.5 cursor-pointer"
                                    title={`React ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                {!isMe && (
                                  <button
                                    onClick={() => handleReportMessage(msg.id)}
                                    className="text-zinc-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer ml-1"
                                    title="Report message"
                                  >
                                    <Flag size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Message Bubble Content */}
                            <div
                              className={`rounded-2xl p-3 text-xs leading-relaxed space-y-2 border shadow-sm ${
                                isMe
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-500/40 rounded-tr-xs'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-200 rounded-tl-xs'
                              }`}
                            >
                              {/* Attached Image Card inside Message */}
                              {msg.imageUrl && (
                                <div className="relative group/img overflow-hidden rounded-xl border border-white/10 bg-black/40 max-w-xs">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Chat Attachment"
                                    className="w-full max-h-56 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                                    onClick={() => setChatSelectedLightboxImage(msg.imageUrl)}
                                  />
                                  <button
                                    onClick={() => setChatSelectedLightboxImage(msg.imageUrl)}
                                    className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-[2px]"
                                  >
                                    <span className="px-3 py-1.5 bg-black/70 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                                      <Search size={12} /> Click to Expand
                                    </span>
                                  </button>
                                </div>
                              )}

                              {/* Text Portion */}
                              {msg.text && (
                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              )}
                            </div>

                            {/* Reaction Counter Badges */}
                            {Object.keys(reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(reactions).map(([emoji, count]) => (
                                  <span 
                                    key={emoji}
                                    className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full text-[9px] text-zinc-300 flex items-center gap-1 font-mono"
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-bold text-blue-400">{count}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* STYLE PRESETS SELECTOR POPOVER */}
                <AnimatePresence>
                  {showPresetPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="p-3 bg-zinc-900 border border-blue-500/30 rounded-2xl space-y-2 mb-2 shadow-2xl"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-800">
                        <span className="flex items-center gap-1 text-blue-400">
                          <Sparkles size={12} /> Select Style Preset Photo
                        </span>
                        <button onClick={() => setShowPresetPicker(false)} className="text-zinc-500 hover:text-white">✕</button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {GHANA_STYLE_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setChatAttachedImage(preset.url);
                              setShowPresetPicker(false);
                              toast.success(`Attached "${preset.name}" preset!`);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
                          >
                            <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">{preset.name}</p>
                              <p className="text-[8px] text-zinc-500 truncate">Tap to attach</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ATTACHED IMAGE PREVIEW TRAY */}
                {chatAttachedImage && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={chatAttachedImage} alt="Attachment" className="w-10 h-10 object-cover rounded-xl border border-blue-400/40 shrink-0" />
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[8px] font-mono font-bold uppercase block w-fit mb-0.5">
                          Photo Attached
                        </span>
                        <p className="text-[10px] text-zinc-300 font-medium truncate">Ready to share in group chat</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatAttachedImage(null)}
                      className="p-1.5 rounded-full bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* UPLOADING LOADER INDICATOR */}
                {isUploadingChatImage && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center gap-2 text-xs text-blue-400 font-bold mb-2 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Uploading style photo to chat...</span>
                  </div>
                )}

                {/* QUICK CHAT PROMPTS CAROUSEL */}
                <div className="flex gap-1.5 overflow-x-auto py-2 border-t border-zinc-800/80 no-scrollbar">
                  {[
                    "What's everyone styling this Friday? 🔥",
                    "Which shoe goes best with cargo pants?",
                    "Virtual Try-On check! ✨",
                    "Accra Streetwear drop discussion 🇬🇭"
                  ].map((quick, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(undefined, quick)}
                      className="text-[9px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer truncate max-w-[200px]"
                    >
                      {quick}
                    </button>
                  ))}
                </div>

                {/* SEND MESSAGE INPUT & COMPOSER TOOLBAR */}
                <form onSubmit={(e) => handleSendMessage(e)} className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    {/* Media Action Buttons */}
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={isUploadingChatImage}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 text-zinc-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Upload Style Photo"
                    >
                      <Camera size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPresetPicker(!showPresetPicker)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 text-zinc-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Attach Ghana Style Preset"
                    >
                      <Sparkles size={16} />
                    </button>

                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={chatAttachedImage ? "Add a caption for your photo..." : "Type a message or share style ideas..."}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                    />

                    <button
                      type="submit"
                      disabled={(!newMessageText.trim() && !chatAttachedImage) || isUploadingChatImage}
                      className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>

              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* FRIDAY RESET PROTOCOL EXPLAINER MODAL */}
      {showResetInfoModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-blue-500/30 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white">Friday Reset Protocol</h3>
                  <p className="text-[10px] font-mono text-zinc-400">How the weekly cycle works</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetInfoModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-400" />
                  Fresh Slate Every Friday
                </p>
                <p className="text-[11px] text-zinc-400">
                  Every Friday at 00:00 UTC, the community fashion style showcase posts, feedback, and group lounge messages are cleanly wiped and reset.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-black uppercase tracking-wider text-[10px] text-zinc-400">Why does it reset?</p>
                <ul className="space-y-1.5 text-[11px] text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Keep inspiration current:</strong> Promotes fresh weekend styling and trending silhouettes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Active conversations:</strong> Group lounge stays vibrant without outdated chat history.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Weekly style spotlight:</strong> Everyone gets a clean weekly chance to be voted top fit!</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowResetInfoModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* CHAT IMAGE LIGHTBOX MODAL */}
      {chatSelectedLightboxImage && (
        <div 
          onClick={() => setChatSelectedLightboxImage(null)}
          className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center gap-4"
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <a 
                href={chatSelectedLightboxImage} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={12} /> Open Original
              </a>
              <button
                onClick={() => setChatSelectedLightboxImage(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            <img 
              src={chatSelectedLightboxImage} 
              alt="Full Resolution View" 
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl border border-zinc-800 shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default KFamView;
