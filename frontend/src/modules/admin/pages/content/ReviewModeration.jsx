import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { contentApi } from '../../services/api';
import { extractList, mapAdminReview } from '../../utils/mappers';
import { Star, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const ReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = activeTab !== 'all' ? { status: activeTab } : {};
    const { data, error } = await contentApi.getReviews(params);
    if (error) {
      toast.error(error);
      setReviews([]);
    } else {
      setReviews(extractList(data).map(mapAdminReview));
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = useMemo(() => {
    if (!searchQuery) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) => r.product.toLowerCase().includes(q) || r.user.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const handleModerate = async (id, action) => {
    setActionId(id);
    const { error } = await contentApi.moderateReview(id, action);
    if (error) toast.error(error);
    else toast.success(`Review ${action}d`);
    await fetchReviews();
    setActionId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 uppercase">Review Moderation</h1>
        <p className="text-slate-500 mt-1">Approve customer reviews before they appear on product pages.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product or review..."
          />
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold">No reviews found</div>
          ) : (
            filtered.map((review) => (
              <div key={review.id} className="p-6 flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black text-blue-600">{review.product}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{review.status}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={12} className={n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-2">{review.user} · {review.date}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                  
                  {/* Render review images/videos for admin */}
                  {(review.images?.length > 0 || review.videos?.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.images?.map((url, idx) => (
                        <a 
                          key={`admin-img-${idx}`} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 active:scale-95 transition-all block flex-shrink-0"
                        >
                          <img src={url} className="w-full h-full object-cover" alt="review" />
                        </a>
                      ))}
                      {review.videos?.map((url, idx) => (
                        <a 
                          key={`admin-vid-${idx}`} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 active:scale-95 transition-all block flex-shrink-0 flex items-center justify-center"
                        >
                          <video src={url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">▶</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {review.rawStatus === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleModerate(review.id, 'approve')}
                      disabled={actionId === review.id}
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleModerate(review.id, 'reject')}
                      disabled={actionId === review.id}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleModerate(review.id, 'hide')}
                      disabled={actionId === review.id}
                      className="px-3 py-2 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Hide
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModeration;
