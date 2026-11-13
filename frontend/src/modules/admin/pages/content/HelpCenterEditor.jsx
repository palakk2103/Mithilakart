import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, HelpCircle, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cmsApi } from '../../services/api';
import { DEFAULT_HELP_CENTER, HELP_CENTER_SLUG, parseHelpCenter } from '../../../../shared/content/helpCenter';

const field = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#3E5A44] focus:bg-white';

/**
 * Admin editor for the customer Help & Support page: FAQs, contact notes,
 * office address and hours. Phone and email come from Settings → General.
 */
const HelpCenterEditor = () => {
  const [content, setContent] = useState(DEFAULT_HELP_CENTER);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cmsApi.getPage(HELP_CENTER_SLUG).then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data?.content) {
        setContent(parseHelpCenter(data.content));
        setPublished(true);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const setFaq = (index, patch) => setContent((prev) => ({
    ...prev,
    faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)),
  }));
  const moveFaq = (index, delta) => setContent((prev) => {
    const faqs = [...prev.faqs];
    const target = index + delta;
    if (target < 0 || target >= faqs.length) return prev;
    [faqs[index], faqs[target]] = [faqs[target], faqs[index]];
    return { ...prev, faqs };
  });
  const removeFaq = (index) => setContent((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  const addFaq = () => setContent((prev) => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));

  const handleSave = async () => {
    const faqs = content.faqs
      .map((faq) => ({ q: faq.q.trim(), a: faq.a.trim() }))
      .filter((faq) => faq.q || faq.a);
    if (faqs.some((faq) => !faq.q || !faq.a)) {
      toast.error('Every FAQ needs both a question and an answer');
      return;
    }
    setSaving(true);
    const { error } = await cmsApi.updatePage(HELP_CENTER_SLUG, {
      title: 'Help & Support',
      content: JSON.stringify({ ...content, faqs }),
      isPublished: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setContent((prev) => ({ ...prev, faqs }));
    setPublished(true);
    toast.success('Help & Support updated in the customer app');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="animate-spin" size={18} /> Loading Help Center…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Help & Support Page</h1>
          <p className="text-sm text-slate-500 mt-1">
            Questions and contact details customers see in the app. Phone and email come from Settings → General.
            {!published && <span className="ml-1 font-semibold text-amber-700">Not published yet — the app shows the built-in text below.</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/profile/help-center" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ExternalLink size={15} /> View in app
          </a>
          <button type="button" onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3E5A44] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save & publish
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Frequently asked questions</h2>
          <button type="button" onClick={addFaq}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
            <Plus size={14} /> Add question
          </button>
        </div>
        {content.faqs.length === 0 && <p className="text-sm text-slate-500">No questions yet.</p>}
        {content.faqs.map((faq, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-[#3E5A44] shrink-0" />
              <input
                aria-label={`Question ${index + 1}`}
                value={faq.q}
                onChange={(e) => setFaq(index, { q: e.target.value })}
                placeholder="Question"
                className={`${field} font-bold`}
              />
              <button type="button" aria-label="Move up" onClick={() => moveFaq(index, -1)} disabled={index === 0}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={15} /></button>
              <button type="button" aria-label="Move down" onClick={() => moveFaq(index, 1)} disabled={index === content.faqs.length - 1}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={15} /></button>
              <button type="button" aria-label="Delete question" onClick={() => removeFaq(index)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
            <textarea
              aria-label={`Answer ${index + 1}`}
              value={faq.a}
              onChange={(e) => setFaq(index, { a: e.target.value })}
              placeholder="Answer"
              rows={3}
              className={field}
            />
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-black text-slate-900">Contact details</h2>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Call timings (under phone number)</span>
          <input value={content.phoneHours} onChange={(e) => setContent((p) => ({ ...p, phoneHours: e.target.value }))} className={field} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Email note (under email)</span>
          <input value={content.emailNote} onChange={(e) => setContent((p) => ({ ...p, emailNote: e.target.value }))} className={field} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Office address</span>
          <textarea rows={4} value={content.address} onChange={(e) => setContent((p) => ({ ...p, address: e.target.value }))} className={field} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Business hours</span>
          <textarea rows={4} value={content.hours} onChange={(e) => setContent((p) => ({ ...p, hours: e.target.value }))} className={field} />
        </label>
        <button type="button" onClick={() => setContent(DEFAULT_HELP_CENTER)}
          className="md:col-span-2 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
          <RotateCcw size={13} /> Reset form to the built-in text (not saved until you publish)
        </button>
      </section>
    </div>
  );
};

export default HelpCenterEditor;
