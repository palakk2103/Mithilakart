import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { getAdminYouPopup, saveAdminYouPopup } from '../../../config/youPopup';

const LABEL_MAX = 24;
const DEFAULT_LABELS = { orders: 'Orders', buy_again: 'Buy Again', account: 'Account', wishlist: 'Wishlist' };
const DEFAULT_ORDER = ['orders', 'buy_again', 'account', 'wishlist'];

const normalize = (items) => items.map((it, i) => ({ id: it.id, label: it.label, enabled: it.enabled, order: i + 1 }));
const snapshot = (items) => JSON.stringify(normalize(items));

const YouPopupManager = () => {
  const [items, setItems] = useState([]);
  const [saved, setSaved] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = normalize(await getAdminYouPopup());
      setItems(data);
      setSaved(snapshot(data));
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => snapshot(items) !== saved, [items, saved]);

  // Warn before losing unsaved changes (tab close / refresh).
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const update = (id, patch) => { setMessage(null); setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))); };
  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    setMessage(null);
    setItems((prev) => { const n = [...prev]; [n[index], n[j]] = [n[j], n[index]]; return normalize(n); });
  };
  const resetDefaults = () => {
    setMessage(null);
    setItems(normalize(DEFAULT_ORDER.map((id) => ({ id, label: DEFAULT_LABELS[id], enabled: true }))));
  };

  const invalid = items.some((it) => !it.label.trim() || it.label.trim().length > LABEL_MAX);

  const save = async () => {
    if (saving || invalid) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = normalize(await saveAdminYouPopup(normalize(items).map((it) => ({ ...it, label: it.label.trim() }))));
      setItems(data);
      setSaved(snapshot(data));
      setMessage({ type: 'success', text: 'Saved. Customers will see the changes shortly.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="you-popup-manager">
      <h1 className="text-xl font-black text-slate-900">You Popup Menu</h1>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Controls the popup customers see when they tap “You” in the mobile bottom navigation.
        You can show/hide items, rename them and change their order. Destinations are fixed.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500" data-testid="you-popup-loading">Loading…</p>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={it.id} data-testid={`you-row-${it.id}`} className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex flex-col">
                  <button type="button" aria-label={`Move ${it.id} up`} data-testid={`you-up-${it.id}`} disabled={i === 0 || saving} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button type="button" aria-label={`Move ${it.id} down`} data-testid={`you-down-${it.id}`} disabled={i === items.length - 1 || saving} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={16} /></button>
                </div>
                <span className="text-xs font-mono text-slate-400 w-20 shrink-0">{it.id}</span>
                <input
                  type="text"
                  value={it.label}
                  maxLength={LABEL_MAX}
                  disabled={saving}
                  aria-label={`Display name for ${it.id}`}
                  data-testid={`you-label-${it.id}`}
                  onChange={(e) => update(it.id, { label: e.target.value })}
                  className="flex-1 min-w-[140px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={it.enabled}
                  disabled={saving}
                  data-testid={`you-toggle-${it.id}`}
                  onClick={() => update(it.id, { enabled: !it.enabled })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border ${it.enabled ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}
                >
                  {it.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  {it.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </li>
            ))}
          </ul>

          {invalid && <p className="text-xs text-red-600 mt-3">Each display name must be 1–{LABEL_MAX} characters.</p>}
          {message && (
            <p role="status" data-testid="you-popup-message" className={`text-sm mt-4 font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              type="button"
              data-testid="you-popup-save"
              onClick={save}
              disabled={!dirty || saving || invalid}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              data-testid="you-popup-reset"
              onClick={resetDefaults}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold"
            >
              <RotateCcw size={16} /> Restore defaults
            </button>
            {dirty && <span className="text-xs text-amber-600 font-semibold">Unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  );
};

export default YouPopupManager;
