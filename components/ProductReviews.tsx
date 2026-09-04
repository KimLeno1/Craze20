import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, Image as ImageIcon, MessageSquare, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userHandle: string;
  userName?: string;
  userAvatar?: string | null;
  rating: number;
  title?: string;
  body: string;
  comment?: string;
  images?: string[];
  verifiedPurchase: boolean;
  createdAt: string;
  timestamp?: string;
  helpfulCount: number;
  userVoted?: boolean;
}

interface RatingSummary {
  averageRating: number;
  totalCount: number;
  distribution: Record<number, { count: number; percentage: number }>;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  userId?: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
  userId
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 5.0,
    totalCount: 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 }
    }
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'newest' | 'helpful' | 'highest' | 'lowest'>('newest');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [canReview, setCanReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form Modal State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox Image View State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await databaseService.getProductReviews(productId, {
        page,
        limit: 10,
        sort,
        rating: ratingFilter
      });

      if (res && res.status === 'success') {
        setReviews(res.reviews || []);
        if (res.ratingSummary) setSummary(res.ratingSummary);
        if (res.pagination) setTotalPages(res.pagination.totalPages || 1);
        setCanReview(!!res.canReview);
        setUserHasReviewed(!!res.userHasReviewed);
      } else if (Array.isArray(res)) {
        setReviews(res);
      }
    } catch (e) {
      console.error('Failed to fetch product reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, page, sort, ratingFilter]);

  const handleHelpfulToggle = async (reviewId: string) => {
    if (!userId || userId === 'guest') {
      toast.error('Please log in to vote on reviews.');
      return;
    }

    try {
      const res = await databaseService.toggleReviewHelpful(reviewId);
      if (res && res.status === 'success') {
        setReviews(prev =>
          prev.map(r => {
            if (r.id === reviewId) {
              return {
                ...r,
                helpfulCount: res.helpfulCount,
                userVoted: res.userVoted
              };
            }
            return r;
          })
        );
        toast.success(res.userVoted ? 'Marked review as helpful!' : 'Removed helpful vote');
      }
    } catch (e) {
      toast.error('Could not submit vote.');
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (newImages.length >= 4) {
      toast.error('Maximum 4 image attachments allowed.');
      return;
    }
    setNewImages([...newImages, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (newImages.length + files.length > 4) {
      toast.error('Maximum 4 image attachments allowed.');
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setNewImages(prev => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) {
      toast.error('Please write a review before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await databaseService.addProductReview(productId, {
        rating: newRating,
        title: newTitle.trim(),
        body: newBody.trim(),
        images: newImages
      });

      if (res && res.status === 'error') {
        toast.error(res.message || 'Failed to submit review.');
      } else {
        toast.success('Thank you! Your review has been published.');
        setShowReviewForm(false);
        setNewRating(5);
        setNewTitle('');
        setNewBody('');
        setNewImages([]);
        fetchReviews();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          <img src={lightboxImage} alt="Review attachment" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Header & Rating Breakdown */}
      <div className="bg-zinc-50 border border-zinc-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-1">Authentic Community Feedback</span>
            <h3 className="text-2xl font-serif italic text-zinc-950">Ratings & Reviews</h3>
          </div>

          {canReview && !userHasReviewed && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Write a Review
            </button>
          )}

          {userHasReviewed && (
            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle size={14} /> You reviewed this item
            </span>
          )}
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4 border-t border-zinc-200/60">
          {/* Average Rating Score */}
          <div className="md:col-span-4 text-center md:text-left flex flex-col justify-center">
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-5xl sm:text-6xl font-mono font-black text-zinc-950 tracking-tighter">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-zinc-400 text-lg font-bold">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={18}
                  className={star <= Math.round(summary.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Based on {summary.totalCount} {summary.totalCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Star Distribution Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const dist = summary.distribution[star] || { count: 0, percentage: 0 };
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-bold">
                  <span className="w-8 text-zinc-500 font-mono text-right">{star}★</span>
                  <div className="flex-1 h-2.5 bg-zinc-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-950 rounded-full transition-all duration-700"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-zinc-400 font-mono text-right text-[11px]">{dist.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Submission Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 sm:p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Verified Purchase Review</span>
              <h3 className="text-2xl font-serif italic text-zinc-950">Review {productName}</h3>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Rating Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        size={32}
                        className={star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono font-bold text-sm text-zinc-950">{newRating} of 5 Stars</span>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Review Headline (Optional)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Premium quality & exact fit!"
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-xs font-medium text-zinc-950 outline-none focus:border-blue-600 transition-all"
                />
              </div>

              {/* Body Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Your Detailed Review</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  placeholder="Describe the fabric, sizing, comfort, and how it looks in person..."
                  rows={4}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs font-medium text-zinc-950 outline-none focus:border-blue-600 transition-all resize-none"
                />
              </div>

              {/* Photos Attachment */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Attach Photos (Optional)</label>
                
                {/* Upload or Link Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 transition-all"
                  >
                    Add
                  </button>
                  <label className="px-4 py-2.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center gap-1 transition-all">
                    <Upload size={14} /> Browse
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Previews */}
                {newImages.length > 0 && (
                  <div className="flex gap-3 pt-2">
                    {newImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 group">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Sorting Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        {/* Star Rating Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-zinc-400 mr-2 flex items-center gap-1">
            <Filter size={14} /> Filter:
          </span>
          {['all', '5', '4', '3', '2', '1'].map(star => {
            const isActive = ratingFilter === star;
            return (
              <button
                key={star}
                onClick={() => {
                  setRatingFilter(star);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {star === 'all' ? 'All Reviews' : `${star}★`}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown size={14} className="text-zinc-400" />
          <select
            value={sort}
            onChange={e => {
              setSort(e.target.value as any);
              setPage(1);
            }}
            className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-950 outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Fetching reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-[2rem] space-y-2">
          <MessageSquare size={32} className="mx-auto text-zinc-300 mb-2" />
          <p className="text-sm font-bold text-zinc-950">No reviews found</p>
          <p className="text-xs text-zinc-400">
            {ratingFilter !== 'all'
              ? `No ${ratingFilter}★ reviews match your filter. Try changing the filter.`
              : 'Be the first to review this drop after receiving your delivery!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="p-6 sm:p-8 bg-white border border-zinc-100 rounded-[2rem] space-y-4 shadow-sm hover:border-zinc-200 transition-all"
            >
              {/* Reviewer Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-sm uppercase overflow-hidden">
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      review.userHandle.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-950">@{review.userHandle}</span>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">
                          <CheckCircle size={10} /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {new Date(review.createdAt || review.timestamp || Date.now()).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Star Rating Display */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}
                    />
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                {review.title && (
                  <h4 className="text-sm font-black text-zinc-950">{review.title}</h4>
                )}
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
                  {review.body || review.comment}
                </p>
              </div>

              {/* Image Gallery attachments */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2.5 pt-1 overflow-x-auto">
                  {review.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxImage(img)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 group flex-shrink-0"
                    >
                      <img src={img} alt="review attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <ImageIcon size={16} className="text-white opacity-80" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Helpful Vote Button */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                <button
                  onClick={() => handleHelpfulToggle(review.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    review.userVoted
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <ThumbsUp size={13} className={review.userVoted ? 'fill-white' : ''} />
                  <span>Helpful ({review.helpfulCount || 0})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono font-bold text-zinc-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
