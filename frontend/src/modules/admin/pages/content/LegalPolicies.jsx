import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Edit3,
  XCircle,
  Loader2,
  ExternalLink,
  Eye,
  Code,
  Sparkles,
  Heading,
  List,
  Bold,
  FileText,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw as ReturnIcon,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cmsApi } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    appPath: '/privacy',
    icon: ShieldCheck,
    description: 'Data collection, cookies, and customer privacy terms',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'terms',
    label: 'Terms of Service',
    appPath: '/terms',
    icon: FileText,
    description: 'Account eligibility, platform usage rules, and legal liabilities',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'cancellation',
    label: 'Cancellation & Returns',
    appPath: '/cancellation-returns',
    icon: ReturnIcon,
    description: '10-day return window, cancellation procedure, and refund methods',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'shipping',
    label: 'Shipping Policy',
    appPath: '/shipping',
    icon: Truck,
    description: 'Delivery timelines across 20,000+ pincodes, charges, and tracking',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

const LegalPolicies = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState('split'); // 'split' | 'edit-only' | 'preview-only'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pages, setPages] = useState({});
  const [draft, setDraft] = useState({ title: '', content: '' });

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

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
          next[id] = {
            title: data.title || TABS.find((t) => t.id === id)?.label,
            content: data.content || '',
            version: data.version || 1,
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        }
      });
      setPages(next);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const page = pages[activeTab];
    if (page) {
      setDraft({ title: page.title, content: page.content });
    }
  }, [activeTab, pages]);

  const handleSave = async () => {
    if (!draft.content.trim()) {
      toast.error('Policy content cannot be empty');
      return;
    }

    setIsSaving(true);
    const { data, error } = await cmsApi.updateLegal(activeTab, {
      title: draft.title || activeTabMeta.label,
      content: draft.content,
    });
    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    setPages((prev) => ({
      ...prev,
      [activeTab]: {
        ...draft,
        version: (prev[activeTab]?.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      },
    }));
    setIsEditing(false);
    toast.success(`${activeTabMeta.label} updated and live on customer app!`);
  };

  const handleDiscard = () => {
    const page = pages[activeTab];
    if (page) setDraft({ title: page.title, content: page.content });
    setIsEditing(false);
  };

  const insertSnippet = (snippet) => {
    setDraft((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet,
    }));
  };

  const currentPage = pages[activeTab] || {};
  const formattedDate = currentPage.updatedAt
    ? new Date(currentPage.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck size={22} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Policies & Information Manager
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700">
                LIVE CMS
              </span>
            </div>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Manage the 4 official customer policies displayed on the Profile page and throughout Mithilakart.
              Changes update instantly in real-time across web and mobile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Live on App button */}
            <a
              href={activeTabMeta.appPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              <ExternalLink size={15} />
              <span>View On User App</span>
            </a>

            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  if (previewMode === 'preview-only') setPreviewMode('split');
                }}
                disabled={loading}
                className="flex items-center gap-2 bg-[#3E5A44] hover:bg-[#2e4333] text-white px-6 py-2.5 rounded-xl transition-all shadow-md text-sm font-bold disabled:opacity-50"
              >
                <Edit3 size={17} />
                <span>Edit Policy Content</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold"
                >
                  <XCircle size={16} />
                  <span>Discard</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-md text-sm font-bold disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            const tabData = pages[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isEditing) {
                    if (window.confirm('You have unsaved edits. Discard changes and switch tab?')) {
                      setIsEditing(false);
                      setActiveTab(tab.id);
                    }
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#3E5A44] bg-[#3E5A44]/5 shadow-sm ring-1 ring-[#3E5A44]/20'
                    : 'border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#3E5A44] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={18} />
                  </div>
                  {tabData && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                      v{tabData.version || 1}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isSelected ? 'text-[#3E5A44]' : 'text-slate-800'}`}>
                    {tab.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Sub-bar with Metadata & View Toggles */}
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <CheckCircle2 size={15} className="text-emerald-500" />
              Live on /profile &amp; {activeTabMeta.appPath}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock size={13} />
              Updated: {formattedDate}
            </span>
          </div>

          {isEditing && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setPreviewMode('edit-only')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewMode === 'edit-only' ? 'bg-[#3E5A44] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code size={13} /> Editor Only
              </button>
              <button
                onClick={() => setPreviewMode('split')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewMode === 'split' ? 'bg-[#3E5A44] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={13} /> Split View
              </button>
              <button
                onClick={() => setPreviewMode('preview-only')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewMode === 'preview-only' ? 'bg-[#3E5A44] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye size={13} /> Live Preview
              </button>
            </div>
          )}
        </div>

        {/* Editor Body */}
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-[#3E5A44]" size={28} />
              <p className="text-sm font-bold">Loading {activeTabMeta.label}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Policy Title
                </label>
                <input
                  readOnly={!isEditing}
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Enter policy title..."
                  className={`w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                    isEditing
                      ? 'bg-white border-[#3E5A44]/30 focus:border-[#3E5A44] focus:ring-4 focus:ring-[#3E5A44]/10'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              {/* Quick Formatting Toolbar (when editing) */}
              {isEditing && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-2">
                    Quick Insert:
                  </span>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<h2>New Section Title</h2>\n<p>Add description here...</p>')}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Heading size={12} /> Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<h3>Subsection Title</h3>\n<p>Add details here...</p>')}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Heading size={12} /> Subheading
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<ul>\n  <li>Feature or item 1</li>\n  <li>Feature or item 2</li>\n</ul>')}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <List size={12} /> Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<p><strong>Notice:</strong> Please read carefully.</p>')}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Bold size={12} /> Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<h2>Contact Us</h2>\n<p><strong>Email:</strong> support@mithilakart.com<br/><strong>Phone:</strong> +91 1800-123-4567<br/><strong>Hours:</strong> Mon - Sat: 9:00 AM - 6:00 PM</p>')}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 ml-auto"
                  >
                    <HelpCircle size={12} /> Contact Block
                  </button>
                </div>
              )}

              {/* Editor + Live Preview Grid */}
              <div className={`grid gap-6 ${isEditing && previewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Textarea Editor */}
                {(!isEditing || previewMode !== 'preview-only') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
                        {isEditing ? 'HTML / Text Content Editor' : 'Current Published Content'}
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {draft.content.length} characters • {draft.content.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      readOnly={!isEditing}
                      value={draft.content}
                      onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
                      placeholder="Write your policy text or HTML here..."
                      rows={22}
                      className={`w-full border rounded-2xl p-5 font-mono text-xs text-slate-800 leading-relaxed transition-all resize-y outline-none ${
                        isEditing
                          ? 'bg-white border-[#3E5A44]/30 focus:border-[#3E5A44] focus:ring-4 focus:ring-[#3E5A44]/10'
                          : 'bg-slate-50/60 border-slate-200 cursor-default'
                      }`}
                    />
                  </div>
                )}

                {/* Live Preview Panel */}
                {(isEditing ? previewMode !== 'edit-only' : true) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Eye size={13} className="text-emerald-600" />
                        Customer App Live View
                      </label>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Live Rendering
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-6 bg-white max-h-[520px] overflow-y-auto shadow-inner">
                      <div className="border-b pb-3 mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-[17px] font-bold text-slate-900">{draft.title || activeTabMeta.label}</h2>
                          <p className="text-[11px] text-gray-400 mt-0.5">Last Updated: {formattedDate}</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                          User View
                        </span>
                      </div>

                      <div
                        className="legal-preview-content prose max-w-none text-slate-700 leading-relaxed
                          [&>h1]:text-[17px] [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mb-3
                          [&>h2]:text-[15px] [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-5 [&>h2]:mb-2 [&>h2:first-child]:mt-0
                          [&>h3]:text-[13px] [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-3.5 [&>h3]:mb-1.5
                          [&>p]:text-[12.5px] [&>p]:text-gray-600 [&>p]:leading-relaxed [&>p]:mb-2.5
                          [&>ul]:list-disc [&>ul]:list-inside [&>ul]:text-[12.5px] [&>ul]:text-gray-600 [&>ul]:space-y-1 [&>ul]:ml-2 [&>ul]:mb-3
                          [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:text-[12.5px] [&>ol]:text-gray-600 [&>ol]:space-y-1 [&>ol]:ml-2 [&>ol]:mb-3
                          [&>strong]:text-slate-900 [&>strong]:font-bold"
                        dangerouslySetInnerHTML={{ __html: draft.content || '<p class="text-gray-400 italic">No content written yet.</p>' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPolicies;
