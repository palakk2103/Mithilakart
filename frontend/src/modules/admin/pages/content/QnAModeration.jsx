import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageCircle, Search, Filter, 
  MoreVertical, CheckCircle2, XCircle, Trash2, 
  User, Calendar, Send, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsApi } from '../../services/api';
import { extractList, mapProductQnaPlaceholder } from '../../utils/mappers';

const QnAModeration = () => {
  const [qna, setQna] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await productsApi.getAll({ limit: 20 });
      if (cancelled) return;
      if (!error) {
        setQna(extractList(data).map(mapProductQnaPlaceholder));
      } else {
        setQna([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const tabs = ['Pending', 'Answered', 'All'];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Q&A Moderation</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Manage product inquiries and ensure vendors provide accurate answers.</p>
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
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading Q&A items...</div>
          ) : qna.filter(q => activeTab === 'All' || q.status === activeTab).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-bold">No Q&A items to moderate yet</div>
          ) : qna.filter(q => activeTab === 'All' || q.status === activeTab).map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                   <HelpCircle size={24} />
                </div>
                <div className="flex-1 space-y-4">
                   <div>
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-tight">{item.product}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Asked by {item.user} • {item.date}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.status === 'Answered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {item.status}
                         </span>
                      </div>
                      <p className="text-base font-bold text-slate-700 mt-4 leading-relaxed">
                         {item.question}
                      </p>
                   </div>

                   {item.answer ? (
                     <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                           <MessageCircle size={16} />
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Official Answer</p>
                              <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Delete</button>
                           </div>
                           <p className="text-sm text-slate-600 font-medium leading-relaxed">
                              {item.answer}
                           </p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Provide Admin Answer</label>
                        <div className="relative">
                           <textarea 
                             placeholder="Write your answer here..."
                             className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 resize-none"
                             rows={3}
                           />
                           <button className="absolute bottom-4 right-4 p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-110 active:scale-95 transition-all">
                              <Send size={18} />
                           </button>
                        </div>
                     </div>
                   )}

                   <div className="flex justify-end gap-3 pt-2">
                      <button className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                         Reject Question
                      </button>
                      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                         <ShieldCheck size={14} />
                         Verify & Lock
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

export default QnAModeration;
