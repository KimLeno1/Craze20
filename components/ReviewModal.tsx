
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { ProductReview } from '../types';

interface ReviewModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
  existingReview?: ProductReview | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ productId, productName, onClose, onSuccess, existingReview }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('cc-user-id');
    const userHandle = localStorage.getItem('cc-user-handle') || 'Archiver';

    if (!userId) {
      toast.error("User identification failed. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databaseService.addProductReview(productId, {
        userId,
        userHandle,
        rating,
        comment
      });
      toast.success("Review submitted successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Review submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />
      <div className="relative glass-grey w-full max-w-lg p-8 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
        <header className="space-y-4 mb-8">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Product Review</span>
           </div>
           <h2 className="text-2xl font-serif italic text-white leading-tight">Review:<br/>{productName}</h2>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Rating</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all hover:scale-125 ${star <= rating ? 'grayscale-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'grayscale opacity-30 blur-[1px]'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your thoughts about this product..."
              className="w-full h-32 glass-light border border-white/10 rounded-2xl p-6 text-sm font-medium text-white outline-none focus:border-emerald-500/50 transition-all resize-none"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
