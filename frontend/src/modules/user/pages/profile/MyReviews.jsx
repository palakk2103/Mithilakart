import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star, MessageSquare, ThumbsUp, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyReviews } from '../../services/userApi';
import { extractList, mapReview } from '../../utils/mappers';

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyReviews();
        if (!cancelled) {
          setReviews(extractList(data).map(mapReview));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load reviews');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${pageBg} min-h-screen text-slate-800 relative transition-colors duration-300`}
    >
      {/* Global Repeating Mithila Art Page Background Texture */}
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-50 p-4 flex items-center gap-4 shadow-sm relative z-10 transition-colors duration-300 ${headerBg}`}>
        <button onClick={() => navigate(-1)} className={`hover:opacity-80 transition-colors ${headerTextColor}`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-lg font-black uppercase tracking-widest ${headerTextColor}`}>My Reviews</h1>
      </div>

      <div className="container mx-auto px-4 py-8 w-full space-y-6 relative z-10">
        {loading && <p className="text-sm text-gray-500">Loading reviews...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="bg-white border border-[#EADCC9]/65 rounded-2xl p-6 flex items-center justify-between shadow-xs">
           <div className="text-center flex-1 border-r border-[var(--card-border)]">
              <h3 className="text-3xl font-black text-[var(--color-gold)]">4.5</h3>
              <div className="flex justify-center gap-0.5 my-1">
                 {[1,2,3,4].map(i => <Star key={i} size={10} className="text-[var(--color-gold)] fill-[var(--color-gold)]" />)}
                 <Star size={10} className="text-gray-600" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--card-sub)]">Overall Rating</p>
           </div>
           <div className="text-center flex-1">
              <h3 className="text-3xl font-black text-[var(--card-text)]">{reviews.length}</h3>
              <div className="flex justify-center gap-0.5 my-1">
                 <MessageSquare size={10} className="text-primary-dark fill-blue-500" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--card-sub)]">Total Reviews</p>
           </div>
        </div>

        <div className="space-y-4">
           {reviews.map((rev) => (
             <div key={rev.id} className="bg-black/20 border border-[var(--card-border)] rounded-2xl p-5 space-y-3 group hover:border-[var(--color-gold)]/30 transition-all">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="text-xs font-black group-hover:text-[var(--color-gold)] transition-colors">{rev.product}</h3>
                      <div className="flex gap-0.5">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} size={12} className={i < rev.rating ? "text-[var(--color-gold)] fill-[var(--color-gold)]" : "text-gray-700"} />
                         ))}
                      </div>
                   </div>
                   <button className="text-[var(--card-sub)]">
                      <MoreVertical size={16} />
                   </button>
                </div>
                
                <p className="text-xs text-[var(--card-sub)] font-bold italic">"{rev.comment}"</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]/50">
                   <span className="text-[10px] font-black text-[var(--card-sub)] uppercase tracking-widest">{rev.date}</span>
                   <div className="flex items-center gap-1.5 text-primary-dark">
                      <ThumbsUp size={12} />
                      <span className="text-[10px] font-black">{rev.likes}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MyReviews;

