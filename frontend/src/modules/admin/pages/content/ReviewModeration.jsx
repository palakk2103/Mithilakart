import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, AlertCircle, Trash2, 
  User, ShoppingBag, Calendar, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsApi } from '../../services/api';
import { extractList, mapProductReviewPlaceholder } from '../../utils/mappers';

const ReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await productsApi.getAll({ limit: 20 });
      if (cancelled) return;
      if (!error) {
        setReviews(extractList(data).map(mapProductReviewPlaceholder));
      } else {
        setReviews([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const tabs = ['Pending', 'Approved', 'Flagged', 'All'];

  const StatusBadge = ({ status }) => {
    const styles = {
      'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'Approved': 'bg-green-50 text-green-600 border-green-100',
      'Flagged': 'bg-red-50 text-red-600 border-red-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Review Moderation</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Monitor and approve customer feedback to maintain platform quality.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
           <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <SearchInput 
            type="text" 
            placeholder="Search by product or user..."
          />
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading reviews...</div>
          ) : reviews.filter(r => activeTab === 'All' || r.status === activeTab).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-bold">No reviews to moderate yet</div>
          ) : reviews.filter(r => activeTab === 'All' || r.status === activeTab).map((review) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-slate-50/50 transition-colors flex gap-6"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 flex-shrink-0">
                 <User size={24} />
              </div>
              <div className="flex-1 space-y-3">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 font-montserrat uppercase tracking-tight">{review.user}</h4>
                          <StatusBadge status={review.status} />
                       </div>
                       <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          <ShoppingBag size={12} />
                          {review.product}
                          <span className="mx-1">•</span>
                          <Calendar size={12} />
                          {review.date}
                       </div>
                    </div>
                    <div className="flex gap-1">
                       {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                       ))}
                    </div>
                 </div>
                 <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    "{review.comment}"
                 </p>
                 <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-4">
                       <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-all">
                          <ThumbsUp size={14} />
                          Helpful (0)
                       </button>
                    </div>
                    <div className="flex gap-2">
                       {review.status !== 'Approved' && (
                         <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                            <CheckCircle2 size={14} />
                            Approve
                         </button>
                       )}
                       {review.status !== 'Flagged' && (
                         <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            <AlertCircle size={14} />
                            Flag
                         </button>
                       )}
                       <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-200 transition-all">
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewModeration;
