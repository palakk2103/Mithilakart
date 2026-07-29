import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { supportApi } from '../../services/api';
import { extractList, mapTicket } from '../../utils/mappers';
import { 
  HelpCircle, Search, Filter, MoreVertical, 
  CheckCircle2, Clock, AlertCircle, MessageSquare,
  User, Send, Paperclip, ChevronRight, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await supportApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setTickets([]);
      } else {
        setError(null);
        setTickets(extractList(data).map(mapTicket));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const tabs = ['All', 'Open', 'In-Progress', 'Closed'];

  const StatusBadge = ({ status }) => {
    const styles = {
      'Open': 'bg-red-50 text-red-600 border-red-100',
      'In-Progress': 'bg-blue-50 text-blue-600 border-blue-100',
      'Closed': 'bg-green-50 text-green-600 border-green-100',
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
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Support Helpdesk</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Manage customer inquiries, disputes and platform support tickets.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Unassigned', value: '08', icon: Inbox, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'In Progress', value: '14', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Resolved Today', value: '32', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Avg Response', value: '45m', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
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

      {/* Main Inbox View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
           <div className="p-4 border-b border-slate-50 space-y-3">
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <SearchInput type="text" placeholder="Search tickets..." />
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-5 hover:bg-blue-50/30 cursor-pointer transition-all border-l-4 border-transparent hover:border-blue-500">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black text-blue-600 font-roboto">{ticket.id}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">{ticket.date}</span>
                   </div>
                   <h4 className="text-sm font-black text-slate-900 font-montserrat truncate">{ticket.subject}</h4>
                   <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{ticket.user} • {ticket.category}</p>
                   <div className="mt-3 flex justify-between items-center">
                      <StatusBadge status={ticket.status} />
                      <div className={`w-2 h-2 rounded-full ${ticket.priority === 'High' ? 'bg-red-500' : ticket.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px] relative overflow-hidden">
           <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg">
                    R
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 font-montserrat uppercase tracking-tight">Rahul Sharma</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Customer ID: #USR001 • active 5m ago</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-500 transition-all">
                    <CheckCircle2 size={18} />
                 </button>
                 <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all">
                    <MoreVertical size={18} />
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6 bg-slate-50/30">
              <div className="flex justify-center">
                 <span className="px-4 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-widest shadow-sm">May 10, 2026</span>
              </div>

              {/* Message Items */}
              <div className="flex gap-4 max-w-[80%]">
                 <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" />
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                       Hi, I tried to make a payment for order #OD87459 but the amount was deducted twice from my account. Please check.
                    </p>
                    <p className="text-[9px] text-slate-300 font-bold mt-2 text-right">10:30 AM</p>
                 </div>
              </div>

              <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                 <div className="w-8 h-8 rounded-lg bg-blue-500 flex-shrink-0" />
                 <div className="bg-blue-500 p-4 rounded-2xl rounded-tr-none text-white shadow-lg shadow-blue-100">
                    <p className="text-sm font-medium leading-relaxed">
                       Hello Rahul, we are looking into this. Please share the transaction ID if possible.
                    </p>
                    <p className="text-[9px] text-white/50 font-bold mt-2 text-right">10:35 AM</p>
                 </div>
              </div>
           </div>

           {/* Input Area */}
           <div className="p-6 border-t border-slate-50 bg-white">
              <div className="flex gap-4 items-end">
                 <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                    <Paperclip size={20} />
                 </button>
                 <div className="flex-1 relative">
                    <textarea 
                      placeholder="Type your response..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 resize-none no-scrollbar"
                      rows={1}
                    />
                 </div>
                 <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
                    <Send size={20} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
