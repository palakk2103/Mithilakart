import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../services/api';
import { extractList, mapNotification } from '../../utils/mappers';
import { 
  Bell, Send, Search, Filter, 
  MoreVertical, CheckCircle2, Clock, 
  Users, Smartphone, Mail, MessageSquare,
  AlertCircle, X, Plus, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await notificationsApi.getTemplates();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setHistory([]);
      } else {
        setError(null);
        setHistory(extractList(data).map(mapNotification));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Notification Hub</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Broadcast messages and alerts to users via push, email and in-app channels.</p>
        </div>
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} />
          Compose Message
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Sent', value: '4.2k', icon: Send, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Avg Read Rate', value: '64%', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
           { label: 'Active Users', value: '1.8k', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
           { label: 'Scheduled', value: '03', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                 <stat.icon size={22} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                 <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
           <h3 className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-widest">Broadcast History</h3>
           <div className="flex gap-3">
              <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all border border-slate-100">
                 <Filter size={18} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Notification Details</th>
                <th className="px-6 py-4">Target Audience</th>
                <th className="px-6 py-4">Sent At</th>
                <th className="px-6 py-4">Read Rate</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {history.map((item, i) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <MessageSquare size={18} />
                       </div>
                       <div className="max-w-xs">
                          <p className="font-black text-slate-900 font-montserrat uppercase tracking-tight leading-tight truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{item.body}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                      {item.target}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-500 font-roboto text-xs uppercase">{item.sent}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{item.read}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                       <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Notification Slide-over */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-lg bg-white h-full rounded-[32px] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-slate-900 font-montserrat uppercase">Compose Notification</h2>
                <button onClick={() => setIsComposeOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Notification Title</label>
                  <input type="text" placeholder="e.g. Exclusive Weekend Sale!" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Body</label>
                  <textarea 
                    rows={4}
                    placeholder="Write your message content here..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Target Audience</label>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                       { label: 'All Users', icon: Users },
                       { label: 'VIP Members', icon: Star },
                       { label: 'New Signups', icon: Plus },
                       { label: 'Specific User', icon: Smartphone },
                     ].map((target, i) => (
                       <div key={i} className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${i === 0 ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                          <target.icon size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{target.label}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Send Via</label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className="w-5 h-5 border-2 border-blue-500 rounded flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-[1px]" />
                         </div>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Push</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className="w-5 h-5 border-2 border-slate-200 rounded flex items-center justify-center" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className="w-5 h-5 border-2 border-slate-200 rounded flex items-center justify-center" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMS</span>
                      </label>
                   </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Scheduling</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                     <Calendar size={18} className="text-slate-400" />
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Send Immediately</span>
                     <button className="ml-auto text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Change</button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button onClick={() => setIsComposeOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                <button className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                   <Send size={16} />
                   Send Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
