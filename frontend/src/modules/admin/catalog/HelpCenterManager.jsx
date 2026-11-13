import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Save, RotateCcw, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { getAdminHelpCenter, saveAdminHelpCenter } from '../../../config/helpCenter';

const METHOD_LABELS = { call: 'Call card', email: 'Email card', chat: 'Live chat card' };

const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm';
const label = 'block text-xs font-bold text-slate-500 mb-1';

const Toggle = ({ enabled, onClick, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border ${enabled ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}
  >
    {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
    {enabled ? 'Visible' : 'Hidden'}
  </button>
);

const HelpCenterManager = () => {
  const [content, setContent] = useState(null);
  const [saved, setSaved] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const apply = (res) => {
    setContent(res.content);
    setSaved(JSON.stringify(res.content));
    setIsCustom(!!res.isCustom);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      apply(await getAdminHelpCenter());
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to load content' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => content && JSON.stringify(content) !== saved, [content, saved]);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const edit = (fn) => { setMessage(null); setContent((prev) => fn(prev)); };
  const setMethod = (id, patch) => edit((c) => ({ ...c, contactMethods: c.contactMethods.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const setFaq = (id, patch) => edit((c) => ({ ...c, faqs: c.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const setSection = (patch) => edit((c) => ({ ...c, contactSection: { ...c.contactSection, ...patch } }));
  const moveFaq = (i, dir) => edit((c) => {
    const j = i + dir;
    if (j < 0 || j >= c.faqs.length) return c;
    const faqs = [...c.faqs];
    [faqs[i], faqs[j]] = [faqs[j], faqs[i]];
    return { ...c, faqs };
  });
  const addFaq = () => edit((c) => ({ ...c, faqs: [...c.faqs, { id: `faq-${Date.now()}`, question: '', answer: '', enabled: true }] }));
  const removeFaq = (id) => edit((c) => ({ ...c, faqs: c.faqs.filter((f) => f.id !== id) }));

  const invalid = content && (
    content.contactMethods.some((m) => !m.title.trim())
    || content.faqs.some((f) => !f.question.trim() || !f.answer.trim())
  );

  const save = async () => {
    if (saving || invalid) return;
    setSaving(true);
    setMessage(null);
    try {
      apply(await saveAdminHelpCenter(content));
      setMessage({ type: 'success', text: 'Saved. Customers will see the changes shortly.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (saving || !window.confirm('Reset the Help & Support page to the original built-in content? Your edits will be lost.')) return;
    setSaving(true);
    setMessage(null);
    try {
      apply(await saveAdminHelpCenter(null));
      setMessage({ type: 'success', text: 'Restored the default content.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to reset.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if (!content) return <div className="p-6 text-sm text-red-600">{message?.text || 'Unable to load.'}</div>;

  const sec = content.contactSection;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8" data-testid="help-center-manager">
      <div>
        <h1 className="text-xl font-black text-slate-900">Help &amp; Support Page</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit everything customers see on their Help &amp; Support page: contact cards, FAQs and the contact details block.
          {!isCustom && ' (Currently showing the built-in default content — save to start customising it.)'}
        </p>
      </div>

      {/* Contact cards */}
      <section>
        <h2 className="text-base font-black text-slate-900 mb-3">Top contact cards</h2>
        <ul className="space-y-3">
          {content.contactMethods.map((m) => (
            <li key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">{METHOD_LABELS[m.id]}</span>
                <Toggle enabled={m.enabled} disabled={saving} onClick={() => setMethod(m.id, { enabled: !m.enabled })} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className={label}>Title</label><input className={input} maxLength={120} value={m.title} onChange={(e) => setMethod(m.id, { title: e.target.value })} /></div>
                <div><label className={label}>Sub text</label><input className={input} maxLength={120} value={m.subtitle} onChange={(e) => setMethod(m.id, { subtitle: e.target.value })} /></div>
                <div><label className={label}>Main detail</label><input className={input} maxLength={120} value={m.detail} onChange={(e) => setMethod(m.id, { detail: e.target.value })} /></div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-900">Frequently Asked Questions</h2>
          <button type="button" onClick={addFaq} disabled={saving || content.faqs.length >= 50} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-40">
            <Plus size={14} /> Add FAQ
          </button>
        </div>
        {content.faqs.length === 0 && <p className="text-sm text-slate-500">No FAQs. Customers will see an empty FAQ section.</p>}
        <ul className="space-y-3">
          {content.faqs.map((f, i) => (
            <li key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Move up" disabled={i === 0 || saving} onClick={() => moveFaq(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={16} /></button>
                <button type="button" aria-label="Move down" disabled={i === content.faqs.length - 1 || saving} onClick={() => moveFaq(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={16} /></button>
                <span className="text-xs font-bold text-slate-400 flex-1">#{i + 1}</span>
                <Toggle enabled={f.enabled} disabled={saving} onClick={() => setFaq(f.id, { enabled: !f.enabled })} />
                <button type="button" aria-label="Delete FAQ" disabled={saving} onClick={() => removeFaq(f.id)} className="p-2 text-red-600 border border-red-200 rounded-lg"><Trash2 size={14} /></button>
              </div>
              <div><label className={label}>Question</label><input className={input} maxLength={300} value={f.question} onChange={(e) => setFaq(f.id, { question: e.target.value })} /></div>
              <div><label className={label}>Answer</label><textarea className={input} rows={3} maxLength={2000} value={f.answer} onChange={(e) => setFaq(f.id, { answer: e.target.value })} /></div>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact Us block */}
      <section>
        <h2 className="text-base font-black text-slate-900 mb-3">“Contact Us” block</h2>
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
          <div><label className={label}>Intro text</label><textarea className={input} rows={2} maxLength={300} value={sec.intro} onChange={(e) => setSection({ intro: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Phone</label><input className={input} maxLength={120} value={sec.phone} onChange={(e) => setSection({ phone: e.target.value })} /></div>
            <div><label className={label}>Phone note</label><input className={input} maxLength={120} value={sec.phoneNote} onChange={(e) => setSection({ phoneNote: e.target.value })} /></div>
            <div><label className={label}>Email</label><input className={input} maxLength={120} value={sec.email} onChange={(e) => setSection({ email: e.target.value })} /></div>
            <div><label className={label}>Email note</label><input className={input} maxLength={120} value={sec.emailNote} onChange={(e) => setSection({ emailNote: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Office address (one line per row)</label><textarea className={input} rows={4} maxLength={300} value={sec.address} onChange={(e) => setSection({ address: e.target.value })} /></div>
            <div><label className={label}>Business hours (one line per row)</label><textarea className={input} rows={4} maxLength={300} value={sec.hours} onChange={(e) => setSection({ hours: e.target.value })} /></div>
          </div>
        </div>
      </section>

      {invalid && <p className="text-xs text-red-600">Every card needs a title, and every FAQ needs a question and an answer.</p>}
      {message && (
        <p role="status" className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
      )}

      <div className="flex items-center gap-3 sticky bottom-0 bg-white/90 backdrop-blur py-3">
        <button type="button" onClick={save} disabled={!dirty || saving || invalid} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-40">
          <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={reset} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold">
          <RotateCcw size={16} /> Restore defaults
        </button>
        {dirty && <span className="text-xs text-amber-600 font-semibold">Unsaved changes</span>}
      </div>
    </div>
  );
};

export default HelpCenterManager;
