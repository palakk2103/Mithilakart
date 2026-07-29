import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { contentApi } from '../../services/api';
import { extractList, mapAdminQna } from '../../utils/mappers';
import { HelpCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'answered', label: 'Answered' },
];

const QnAModeration = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = activeTab !== 'all' ? { status: activeTab } : {};
    const { data, error } = await contentApi.getQuestions(params);
    if (error) {
      toast.error(error);
      setItems([]);
    } else {
      setItems(extractList(data).map(mapAdminQna));
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filtered = useMemo(() => {
    if (activeTab === 'answered') {
      return items.filter((q) => q.answer);
    }
    return items;
  }, [items, activeTab]);

  const handleHide = async (id) => {
    setActionId(id);
    const { error } = await contentApi.moderateQuestion(id, 'hide');
    if (error) toast.error(error);
    else toast.success('Question hidden');
    await fetchQuestions();
    setActionId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 uppercase">Q&A Moderation</h1>
        <p className="text-slate-500 mt-1">Monitor product questions and hide inappropriate content.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
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
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Loading questions...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold">No questions found</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-6 flex gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <HelpCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{item.product}</p>
                  <p className="text-sm font-bold text-slate-900">{item.question}</p>
                  {item.answer && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl">{item.answer}</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{item.status} · {item.date}</p>
                </div>
                {item.rawStatus !== 'hidden' && (
                  <button
                    onClick={() => handleHide(item.id)}
                    disabled={actionId === item.id}
                    className="px-3 py-2 h-fit bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Hide
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QnAModeration;
