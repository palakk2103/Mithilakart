import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, AlertCircle, CheckCircle2, Edit3, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cmsApi } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'shipping', label: 'Shipping Policy' },
  { id: 'cancellation', label: 'Cancellation & Returns' },
];

const LegalPolicies = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pages, setPages] = useState({});
  const [draft, setDraft] = useState({ title: '', content: '' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const results = await Promise.all(
        TABS.map(async (tab) => {
          const { data, error } = await cmsApi.getLegal(tab.id);
          return { id: tab.id, data, error };
        })
      );

      if (cancelled) return;

      const next = {};
      results.forEach(({ id, data, error }) => {
        if (!error && data) {
          next[id] = { title: data.title || TABS.find((t) => t.id === id)?.label, content: data.content || '' };
        }
      });
      setPages(next);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const page = pages[activeTab];
    if (page) {
      setDraft({ title: page.title, content: page.content });
    }
  }, [activeTab, pages]);

  const handleSave = async () => {
    if (!draft.content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    const { error } = await cmsApi.updateLegal(activeTab, {
      title: draft.title || TABS.find((t) => t.id === activeTab)?.label,
      content: draft.content,
    });
    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    setPages((prev) => ({ ...prev, [activeTab]: { ...draft } }));
    setIsEditing(false);
    toast.success('Legal page published — live on user app');
  };

  const handleDiscard = () => {
    const page = pages[activeTab];
    if (page) setDraft({ title: page.title, content: page.content });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Legal & Policies</h1>
          <p className="text-slate-500 text-sm mt-1">Manage Privacy, Terms, Shipping and Returns — saved to backend CMS</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-100 text-sm font-semibold disabled:opacity-50"
            >
              <Edit3 size={18} />
              <span>Edit Content</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleDiscard}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-sm font-semibold"
              >
                <XCircle size={18} />
                <span>Discard</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-green-100 text-sm font-semibold disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isSaving ? 'Saving...' : 'Publish Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-50 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              disabled={isEditing}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-5 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} />
              Loading legal pages...
            </div>
          ) : (
            <>
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Editor Mode Active</p>
                        <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                          Editing <strong>{TABS.find((t) => t.id === activeTab)?.label}</strong>. HTML is supported in content.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Page Title</label>
                  <input
                    readOnly={!isEditing}
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    className={`w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none ${isEditing ? 'bg-slate-50 border-blue-200' : 'bg-slate-50/30 border-slate-100 cursor-not-allowed'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Content</label>
                  <textarea
                    readOnly={!isEditing}
                    value={draft.content}
                    onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
                    className={`w-full h-[500px] border rounded-2xl p-8 text-slate-700 font-medium leading-relaxed transition-all resize-none outline-none ${isEditing
                      ? 'bg-slate-50 border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400'
                      : 'bg-slate-50/30 border-slate-100 cursor-not-allowed'}`}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPolicies;
