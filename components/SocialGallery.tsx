import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ThumbsDown, Share2, Camera, X, MessageSquare, Clock, 
  AlertTriangle, Send, Upload, Loader2, Sparkles, Award, Shield, 
  Activity, Flame, UserCheck, CheckCircle2, RefreshCw, Compass 
} from 'lucide-react';
import { UserPost, UserStats, SocialComment, SocialInteraction } from '../types';
import { databaseService } from '../services/databaseService';
import { getImageUrl } from '../lib/imageUtils';

interface SocialGalleryProps {
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onGainRep?: (amount: number) => void;
  onTrackAchievement?: (id: string, progress: number) => void;
}

const SocialGallery: React.FC<SocialGalleryProps> = ({ stats, onUpdateStats, onGainRep, onTrackAchievement }) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);
  const [newPostImage, setNewPostImage] = useState('');
  const [userInteractions, setUserInteractions] = useState<SocialInteraction[]>([]);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOT' | 'MINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Challenge and community simulated states for high-fidelity interactivity
  const [challengeApplied, setChallengeApplied] = useState(false);
  const [votedPosts, setVotedPosts] = useState<Record<string, number>>({}); // Simulated extra style scores
  const [styleRatings, setStyleRatings] = useState<Record<string, number>>({}); // User-submitted fits score (1-10)

  const currentUserId = stats.userId;

  useEffect(() => {
    const fetchData = async () => {
      const fetchedPosts = await databaseService.getSocialPosts();
      setPosts(fetchedPosts);
      if (currentUserId) {
        setUserInteractions(await databaseService.getUserInteractions(currentUserId));
      }
    };
    fetchData();
  }, [currentUserId]);

  const handleInteract = async (postId: string, type: 'LIKE' | 'DISLIKE') => {
    if (!currentUserId) return;
    try {
      const updatedPost = await databaseService.interactWithPost(postId, currentUserId, type);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
      setUserInteractions(await databaseService.getUserInteractions(currentUserId));
      
      // Update local reputation state / trigger callbacks
      onGainRep?.(5);
    } catch (error) {
      console.error('Interaction failed:', error);
    }
  };

  const handlePostClick = async (post: UserPost) => {
    setSelectedPost(post);
    const postComments = await databaseService.getPostComments(post.id);
    setComments(postComments);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim() || !currentUserId) return;
    const handle = localStorage.getItem('cc-user-handle') || 'Archiver';
    const success = await databaseService.addPostComment(selectedPost.id, currentUserId, handle, newComment);
    if (success) {
      setNewComment('');
      const updatedComments = await databaseService.getPostComments(selectedPost.id);
      setComments(updatedComments);
      onGainRep?.(10);
    }
  };

  const handleReport = async () => {
    if (!selectedPost || !reportReason.trim() || !currentUserId) return;
    const success = await databaseService.reportPost(selectedPost.id, currentUserId, reportReason);
    if (success) {
      setIsReporting(false);
      setReportReason('');
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    }
  };

  const getUserInteraction = (postId: string) => {
    return userInteractions.find(i => i.postId === postId)?.type;
  };

  const handleCreatePost = async () => {
    if (!newPostImage || !currentUserId) return;

    const weekId = databaseService.getWeekId();
    const hasPostedThisWeek = posts.some(p => p.userId === currentUserId && p.weekId === weekId);

    if (hasPostedThisWeek) {
      alert('You have already posted this week. Matrix protocol allows only one transmission per cycle.');
      return;
    }

    const customHandle = localStorage.getItem('cc-user-handle') || 'Archiver';
    const newPost: UserPost = {
      id: `post_${Date.now()}`,
      userId: currentUserId,
      userHandle: customHandle,
      image: newPostImage,
      likes: challengeApplied ? 3 : 1, // Start with a headstart if participating in daily challenge
      dislikes: 0,
      reports: 0,
      timestamp: new Date().toISOString(),
      weekId: weekId
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    try {
      await databaseService.createSocialPost(newPost);
      setNewPostImage('');
      setShowPostModal(false);
      onGainRep?.(100);
      onTrackAchievement?.('a1', 1);
      
      // Reset challenge state
      setChallengeApplied(false);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alert(error.message || 'Failed to create post. Please try again.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await databaseService.uploadFeedImage(file);
      if (result.url) {
        setNewPostImage(result.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const daysUntilReset = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = 5 - day; // Friday is 5
    return diff <= 0 ? 7 + diff : diff;
  };

  // Process filtering and sorting based on selected tab and search query
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.userHandle.toLowerCase().includes(query)
      );
    }

    // Tabs
    if (activeTab === 'HOT') {
      result = result.sort((a, b) => b.likes - a.likes);
    } else if (activeTab === 'MINE') {
      result = result.filter(post => post.userId === currentUserId);
    } else {
      // Default to timestamp sort
      result = result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return result;
  }, [posts, activeTab, searchQuery, currentUserId]);

  // Compute community metrics dynamically
  const communityProgressCount = useMemo(() => {
    const baseVotes = 8240;
    const userLikesCount = posts.reduce((acc, p) => acc + p.likes, 0) * 12;
    return Math.min(12000, baseVotes + userLikesCount);
  }, [posts]);

  const xpProgressPercent = useMemo(() => {
    const currentXp = stats.experience || 0;
    const nextLevelXp = stats.nextLevelExp || 1000;
    return Math.min(100, (currentXp / nextLevelXp) * 100);
  }, [stats.experience, stats.nextLevelExp]);

  const handleStyleScoreChange = (postId: string, score: number) => {
    setStyleRatings(prev => ({ ...prev, [postId]: score }));
    onGainRep?.(1); // Small rep gain for voting with detail
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-20 py-8 md:py-16 pb-40" id="kfam-community-panel">
      {/* HUD Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00D1FF]"></span>
            </span>
            <span className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.4em] font-mono">KFam Network Uplink</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif italic text-white tracking-tighter leading-none">
            KFam <span className="text-[#00D1FF] not-italic font-sans font-black uppercase">Hub</span>
          </h1>
          <p className="text-zinc-500 font-mono text-[10px] tracking-[0.3em] uppercase flex items-center gap-2">
            <Clock className="w-3 h-3 text-zinc-400" />
            Style Cycle Resets in {daysUntilReset()} Days
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-white hover:bg-[#00D1FF] hover:text-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
            id="kfam-post-btn"
          >
            <Camera className="w-4 h-4" />
            Transmit Fit Look
          </button>
        </div>
      </div>

      {/* Redesigned Bento Row: Interactive Community Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Card 1: User KFam Profile Dossier */}
        <div className="lg:col-span-4 bg-gradient-to-b from-zinc-900/90 to-black/95 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#00D1FF]/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D1FF]/5 rounded-bl-full blur-xl group-hover:bg-[#00D1FF]/10 transition-colors"></div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#00D1FF]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">KFam Security Member</span>
              </div>
              <span className="px-2.5 py-0.5 bg-zinc-800 rounded-full text-[8px] font-mono font-black text-[#00D1FF] border border-[#00D1FF]/20">
                Lvl {stats.level}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Alias</span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                @{localStorage.getItem('cc-user-handle') || 'Archiver'}
              </h3>
            </div>

            {/* Experience Meter */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-400">
                <span>Reputation Multiplier</span>
                <span className="text-[#00D1FF]">1.5x Active</span>
              </div>
              <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <motion.div 
                  className="bg-gradient-to-r from-[#00D1FF] to-blue-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                <span>{stats.experience} XP</span>
                <span>{stats.nextLevelExp} XP Required</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between text-[9px] font-mono text-zinc-400">
            <span className="uppercase">Rank: {stats.rank || 'Style Novice'}</span>
            <span className="text-zinc-600">ID // CC-829A</span>
          </div>
        </div>

        {/* Card 2: Interactive Daily Fit Directive */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900/90 to-black/95 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#00D1FF]/30 transition-all">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Daily Style Directive</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Directive #182: SYNTHETIC RETROGRADE</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Outfit requirement: Pair premium platform or retro trainers with structured outerwear and neon contrast accessories.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest rounded-lg">
                +150 REP MULTIPLIER
              </span>
              <span className="px-2.5 py-1 bg-[#00D1FF]/10 border border-[#00D1FF]/20 text-[8px] font-black text-[#00D1FF] uppercase tracking-widest rounded-lg">
                +25 COINS reward
              </span>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">
              Active Transmissions: <span className="text-emerald-400 font-bold">1,894 fit checks</span>
            </div>
            <button 
              onClick={() => {
                setChallengeApplied(true);
                setShowPostModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[9px] uppercase tracking-widest transition-all self-end sm:self-auto"
            >
              Submit Fit Check
            </button>
          </div>
        </div>

        {/* Card 3: Interactive Cooperative Goal Tracker */}
        <div className="lg:col-span-3 bg-gradient-to-b from-zinc-900/90 to-black/95 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#00D1FF]/30 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#00D1FF]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00D1FF]">KFam Cooperative Goal</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Hype Anomaly Level</h4>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Submit fits and cast Grail votes to hit the community objective.
              </p>
            </div>

            {/* Simulated Community Progress Gauge */}
            <div className="space-y-1.5">
              <div className="w-full bg-zinc-800/80 rounded-full h-3 overflow-hidden border border-white/5 relative">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 via-[#00D1FF] to-emerald-400 h-full rounded-full"
                  animate={{ width: `${(communityProgressCount / 12000) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 50 }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono font-bold">
                <span className="text-zinc-400">{communityProgressCount.toLocaleString()} / 12,000</span>
                <span className="text-[#00D1FF]">{Math.round((communityProgressCount / 12000) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 text-[9px] text-zinc-400 leading-snug">
            <span className="font-black text-white">REWARD AT 100%:</span> Unlocks community-wide Elite Warehouse drop (15% voucher).
          </div>
        </div>
      </div>

      {/* Filters and Search Uplink */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'ALL', label: 'All Transmissions', icon: Compass },
            { id: 'HOT', label: 'Hall of Fame Fits', icon: Award },
            { id: 'MINE', label: 'My Fit Archives', icon: UserCheck }
          ] as const).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#00D1FF] text-black shadow-lg shadow-[#00D1FF]/10' : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER BY @HANDLE..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[10px] font-mono tracking-widest uppercase text-white placeholder-zinc-600 focus:outline-none focus:border-[#00D1FF] transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Transmissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => {
            const isLiked = getUserInteraction(post.id) === 'LIKE';
            const isDisliked = getUserInteraction(post.id) === 'DISLIKE';
            const postScore = votedPosts[post.id] || 0;
            const finalLikes = post.likes + (isLiked ? 1 : 0) + postScore;

            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePostClick(post)}
                className="group relative bg-zinc-950/60 rounded-[2rem] overflow-hidden border border-white/10 hover:border-[#00D1FF]/50 transition-all cursor-pointer hover:scale-[1.02] shadow-2xl flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="aspect-[4/5] relative overflow-hidden bg-zinc-900">
                  <img
                    src={getImageUrl(post.image)}
                    alt={`Fit by ${post.userHandle}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[8px] font-mono font-black text-[#00D1FF] tracking-wider border border-[#00D1FF]/20">
                      SYS_SECURE_FIT
                    </span>
                    {finalLikes >= 10 && (
                      <span className="px-2.5 py-1 bg-amber-500 text-black rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Elite Grail
                      </span>
                    )}
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D1FF] to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg border border-white/20 uppercase">
                        {post.userHandle[0]}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                          @{post.userHandle}
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00D1FF] fill-current" />
                        </div>
                        <div className="text-[8px] text-zinc-400 font-mono uppercase tracking-widest">
                          Transmission Uplink #{post.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cyberpunk Interaction Bar */}
                <div className="p-4 flex items-center justify-between bg-black/60 border-t border-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleInteract(post.id, 'LIKE')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${isLiked ? 'bg-[#00D1FF]/10 border-[#00D1FF]/30 text-[#00D1FF]' : 'border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-[#00D1FF] hover:border-[#00D1FF]/20'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-[9px] font-black uppercase tracking-wider">Grail ({finalLikes})</span>
                    </button>
                    <button
                      onClick={() => handleInteract(post.id, 'DISLIKE')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${isDisliked ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-red-500 hover:border-red-500/20'}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Drip Check</span>
                    </button>
                  </div>
                  
                  {/* Visual Style Indicator */}
                  <div className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Critiques
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/10 mt-6">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Share2 className="w-6 h-6 text-zinc-600" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">No Uplinks Found</h3>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Transmit the first Look of the current cycle</p>
        </div>
      )}

      {/* Fit blueprint Dossier Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-[#090909] rounded-[40px] border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col md:flex-row h-[85vh] md:h-[750px]"
            >
              {/* Image Side with cyber HUD */}
              <div className="w-full md:w-3/5 h-1/2 md:h-full bg-black relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                <img 
                  src={getImageUrl(selectedPost.image)} 
                  alt="Fit Dossier Blueprint" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                
                {/* HUD graphics */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-white border border-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[8px] font-mono font-black tracking-widest text-[#00D1FF] border border-white/10 uppercase">
                    blueprint_v1.82 // live_uplink
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10 hidden sm:block">
                  <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Aesthetic Calibration</div>
                  <div className="text-[10px] font-black text-[#00D1FF] uppercase mt-1">Highly Demanded release</div>
                </div>
              </div>

              {/* Secure Briefing Side */}
              <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col bg-[#090909]">
                {/* User Info Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D1FF] to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-md border border-white/15">
                      {selectedPost.userHandle[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        @{selectedPost.userHandle}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00D1FF] fill-current" />
                      </div>
                      <div className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">
                        Uplinked: {new Date(selectedPost.timestamp).toLocaleString('en-GB', { timeZone: 'GMT' })} GMT
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsReporting(true)}
                    className="text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                </div>

                {/* Rating Calibrator Widget */}
                <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-mono font-black uppercase text-zinc-400">Rate this Fit styling</span>
                    <span className="text-xs font-black text-[#00D1FF]">{styleRatings[selectedPost.id] || 8}/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={styleRatings[selectedPost.id] || 8}
                    onChange={(e) => handleStyleScoreChange(selectedPost.id, parseInt(e.target.value))}
                    className="w-full accent-[#00D1FF] bg-zinc-800 h-1 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[7px] font-mono text-zinc-600 uppercase mt-1">
                    <span>Street Minimalist</span>
                    <span>Avant-Garde Deity</span>
                  </div>
                </div>

                {/* Comments / Critique Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Transmission Critiques</span>
                    <span className="text-[8px] font-mono text-zinc-600">{comments.length} Uplinks</span>
                  </div>

                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-700 py-12">
                      <MessageSquare className="w-6 h-6 mb-2 opacity-20 text-[#00D1FF]" />
                      <span className="text-[9px] font-mono uppercase tracking-widest">Secure Critique terminal empty</span>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="bg-zinc-900/30 border border-white/5 p-3.5 rounded-2xl space-y-1 hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#00D1FF] uppercase">@{comment.userHandle}</span>
                          <span className="text-[7px] text-zinc-500 font-mono">{new Date(comment.timestamp).toLocaleTimeString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input / Action Terminal */}
                <div className="p-6 border-t border-white/10 bg-[#090909] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleInteract(selectedPost.id, 'LIKE')}
                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${getUserInteraction(selectedPost.id) === 'LIKE' ? 'text-[#00D1FF]' : 'text-zinc-500 hover:text-[#00D1FF]'}`}
                      >
                        <Heart className={`w-4 h-4 ${getUserInteraction(selectedPost.id) === 'LIKE' ? 'fill-current' : ''}`} />
                        <span>GRAIL ({selectedPost.likes + (getUserInteraction(selectedPost.id) === 'LIKE' ? 1 : 0)})</span>
                      </button>
                    </div>
                  </div>

                  {/* Comment input field */}
                  <div className="relative">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="TRANSMIT CRITIQUE..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00D1FF] transition-colors pr-12 font-mono"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#00D1FF] flex items-center justify-center text-black disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-md active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReporting(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-[#111111] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Flag Fit Uplink</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-6 leading-relaxed">
                Report this transmission to the KFam moderation grid for assessment.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for flagging look..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-red-500 transition-colors h-32 mb-6"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsReporting(false)}
                  className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Abort
                </button>
                <button 
                  onClick={handleReport}
                  disabled={!reportReason.trim()}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Flag Transmission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Success Toast */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[130] bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl"
          >
            Transmission flagged for review.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Look Upload Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPostModal(false);
                setChallengeApplied(false);
              }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl m-4"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Transmit Your Style</h2>
                    <p className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase mt-1">kf_uplink_v1.02_active</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPostModal(false);
                      setChallengeApplied(false);
                    }} 
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Image source section */}
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                      Image file / source link
                      {isUploading && <Loader2 className="w-3 h-3 animate-spin text-[#00D1FF]" />}
                    </label>
                    
                    <div className="flex gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#00D1FF]/50 transition-all group shrink-0 overflow-hidden"
                      >
                        {newPostImage ? (
                          <img src={getImageUrl(newPostImage)} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-zinc-600 group-hover:text-[#00D1FF] mb-2" />
                            <span className="text-[8px] font-black text-zinc-600 group-hover:text-[#00D1FF] uppercase tracking-widest">File Upload</span>
                          </>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={newPostImage}
                          onChange={(e) => setNewPostImage(e.target.value)}
                          placeholder="PASTE FIT IMAGE URL..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#00D1FF] transition-colors font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Daily Directive Checkbox */}
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex gap-3 items-center">
                      <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Join daily directive challenge</h4>
                        <p className="text-[8px] text-zinc-500 uppercase">SYNTHETIC RETROGRADE (+150 REP)</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setChallengeApplied(!challengeApplied)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${challengeApplied ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`bg-black w-4 h-4 rounded-full shadow-md transition-transform ${challengeApplied ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Reset advisory */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Weekly Archive reset</h4>
                      <p className="text-[9px] text-zinc-400 leading-normal uppercase">
                        Fit transmissions are wiped on the Friday cycle. Top 10 validated looks enter the permanent Elite archive.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostImage}
                    className="w-full bg-white hover:bg-[#00D1FF] hover:text-black text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-20 active:scale-95"
                  >
                    Broadcast Fit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialGallery;
