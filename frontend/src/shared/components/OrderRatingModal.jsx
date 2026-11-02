import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import customerApi from '../api/client';
import { useTranslation } from 'react-i18next';

const QUICK_TAGS = [
  '⚡ Superfast Delivery',
  '🌟 Top Authentic Quality',
  '📦 Fresh & Well Packed',
  '😊 Polite & Helpful Rider',
  '💯 Highly Recommended',
];

export default function OrderRatingModal({ isOpen, onClose, order, onReviewSubmitted }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const firstProductId = order.products?.[0]?.id || order.items?.[0]?.productId;
      const reviewPayload = {
        orderId: order.id || order._id,
        rating,
        title: selectedTags.length > 0 ? selectedTags.join(', ') : 'Customer Review',
        body: feedback.trim() || selectedTags.join('. ') || 'Great delivery experience!',
      };

      if (firstProductId) {
        await customerApi.post(`/products/${firstProductId}/reviews`, reviewPayload).catch(() => {
          // If already reviewed or endpoint unavailable, fall through gracefully
        });
      }

      setSubmitted(true);
      toast.success(t('auto.thankYouYourFeedbackHelps'));
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1800);
    } catch {
      toast.success(t('auto.thankYouForRating'));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-500 fill-rose-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              {t('auto.rateYourExperience')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900">{t('auto.feedbackSubmitted')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('auto.your5StarRatingDirectly')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Stars Picker */}
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                How was your order #{order.orderNumber || order.id}?
              </p>
              <div className="flex justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      size={32}
                      className={`${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200 fill-slate-100'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-black text-amber-600">
                {rating === 5 ? t('auto.exceptional') : rating === 4 ? t('auto.veryGood') : rating === 3 ? t('auto.good') : t('auto.couldBeBetter')}
              </p>
            </div>

            {/* Quick Experience Chips */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('auto.whatDidYouLike')}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare size={13} />
                <span>{t('auto.commentsNoteForDeliveryBoy')}</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('auto.shareAnySpecialComplimentsOr')}
                rows={3}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:border-slate-800 focus:outline-none resize-none bg-slate-50/50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#3E5A44] hover:bg-[#2d4232] text-white font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? t('auto.submitting') : t('auto.submitFeedback')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
