/**
 * Review List Page
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Star, MessageSquare, Flag, EyeOff, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader, SearchFilter } from '../../components/common';
import { Card, Button, Badge } from '../../components/ui';
import { getReviews, replyToReview } from '../../services/sellerApi';
import { getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ReviewList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyBoxId, setReplyBoxId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviews();
      setReviews(data?.reviews || []);
    } catch (err) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = useMemo(() => {
    let result = [...reviews];
    if (ratingFilter !== 'all') result = result.filter((r) => r.rating === parseInt(ratingFilter));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        (r.customer || r.customerName || '').toLowerCase().includes(q) ||
        r.productTitle?.toLowerCase().includes(q) ||
        r.text?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [reviews, searchQuery, ratingFilter]);

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: reviews.filter((rv) => rv.rating === r).length }));

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await replyToReview(id, replyText.trim());
      toast.success('Reply posted successfully');
      setReplyBoxId(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      toast.error(err?.message || 'Failed to post reply');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Reviews" subtitle={`${reviews.length} reviews across your products`} />

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-6 p-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}
            </div>
            <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingDist.map((d) => (
              <div key={d.rating} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">{d.rating}</span>
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-4">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="md:col-span-2">
          <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search reviews..." />
          <div className="flex gap-2 mt-3">
            {['all', '5', '4', '3', '2', '1'].map((r) => (
              <button key={r} onClick={() => setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ratingFilter === r ? 'bg-[#2563EB] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {r === 'all' ? 'All' : `${r} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map((review, i) => (
          <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-gray-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}</div>
                    <span className="text-xs text-gray-400">{getRelativeTime(new Date(review.createdAt))}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-semibold text-gray-900">{review.customer || review.customerName}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{review.productTitle}</span>
                  </div>

                  {/* Existing Reply */}
                  {review.reply && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Your Reply</p>
                      <p className="text-xs text-blue-600">{review.reply}</p>
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyBoxId === review.id && (
                    <div className="mt-3 flex gap-2">
                      <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" />
                      <Button size="sm" icon={Send} onClick={() => handleReply(review.id)}>Send</Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!review.reply && (
                    <button onClick={() => setReplyBoxId(replyBoxId === review.id ? null : review.id)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Reply">
                      <MessageSquare size={16} />
                    </button>
                  )}
                  <button onClick={() => toast.success('Review hidden')}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Hide">
                    <EyeOff size={16} />
                  </button>
                  <button onClick={() => toast.success('Review reported')}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Report">
                    <Flag size={16} />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
