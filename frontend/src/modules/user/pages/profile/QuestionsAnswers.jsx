import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ChevronRight, HelpCircle, User, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyQuestions } from '../../services/userApi';
import { extractList, mapQuestion } from '../../utils/mappers';

const QuestionsAnswers = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [qaData, setQaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyQuestions();
        if (!cancelled) {
          setQaData(extractList(data).map(mapQuestion));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQA = qaData.filter(item => {
    if (activeTab === 'All') return true;
    return item.status === activeTab;
  });

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#f3e8ff]/60 via-[#faf5ff] to-[#f5f3ff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-[#6FAE4A]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
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
      <div className={`sticky top-0 z-50 p-4 flex items-center gap-4 shadow-sm relative z-10 transition-colors duration-300 border-b ${headerBg}`}>
        <button onClick={() => navigate(-1)} className={`hover:opacity-80 transition-colors ${headerTextColor}`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-lg font-black uppercase tracking-widest ${headerTextColor}`}>Q & A</h1>
      </div>

      <div className="container mx-auto px-4 py-8 w-full space-y-6 relative z-10">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
           {['All', 'Answered', 'Pending'].map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${activeTab === tab ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_20px_rgba(226,167,80,0.3)]' : 'bg-black/20 text-[var(--card-sub)] border-[var(--card-border)] hover:border-[var(--color-gold)]/30'}`}
             >
                {tab}
             </button>
           ))}
        </div>

        <div className="space-y-4">
          {loading && <p className="text-sm text-gray-500">Loading questions...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
           <AnimatePresence mode="popLayout">
             {filteredQA.map((item) => (
               <motion.div 
                 key={item.id}
                 layout
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-black/20 border border-[var(--card-border)] rounded-2xl p-5 space-y-4 group hover:border-[var(--color-gold)]/30 transition-all"
               >
                  <div className="flex justify-between items-start">
                     <h3 className="text-[10px] font-black text-[var(--card-sub)] uppercase tracking-widest leading-relaxed max-w-[70%]">{item.product}</h3>
                     <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.status === 'Answered' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {item.status}
                     </span>
                  </div>

                  <div className="space-y-3">
                     <div className="flex gap-3">
                        <div className="p-1.5 bg-primary-light0/10 rounded-lg text-primary-dark flex-shrink-0 self-start">
                           <HelpCircle size={16} />
                        </div>
                        <p className="text-xs font-black tracking-tight leading-relaxed">{item.question}</p>
                     </div>

                     {item.answer ? (
                       <div className="flex gap-3 pl-4 border-l-2 border-[var(--color-gold)]/20 ml-3">
                          <div className="p-1.5 bg-[var(--color-gold)]/10 rounded-lg text-[var(--color-gold)] flex-shrink-0 self-start">
                             <MessageCircle size={16} />
                          </div>
                          <p className="text-xs text-[var(--card-sub)] font-bold italic">{item.answer}</p>
                       </div>
                     ) : (
                       <p className="text-[10px] text-[var(--card-sub)] italic ml-10 font-bold">Waiting for seller's response...</p>
                     )}
                  </div>

                  <div className="pt-3 border-t border-[var(--card-border)]/50 flex justify-between items-center">
                     <span className="text-[10px] font-black text-[var(--card-sub)] uppercase tracking-widest">{item.date}</span>
                     <button className="text-[var(--color-gold)] hover:opacity-80 transition-opacity">
                        <ChevronRight size={18} />
                     </button>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {filteredQA.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-20 bg-black/10 rounded-3xl border border-dashed border-[var(--card-border)]"
             >
                <MessageSquare size={40} className="mx-auto text-[var(--card-sub)] mb-4 opacity-20" />
                <p className="text-sm text-[var(--card-sub)] font-bold uppercase tracking-widest">No {activeTab.toLowerCase()} questions found</p>
             </motion.div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionsAnswers;

