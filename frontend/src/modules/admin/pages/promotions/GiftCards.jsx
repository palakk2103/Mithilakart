import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Gift, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftCardsApi } from '../../services/api';

const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-blue-500';
const label = 'block text-[11px] font-bold text-slate-500 mb-1';
const STATUS = { active: 'bg-emerald-50 text-emerald-700', used: 'bg-slate-100 text-slate-600', expired: 'bg-amber-50 text-amber-700', frozen: 'bg-rose-50 text-rose-700' };
const EMPTY = { amount: '', quantity: 1, expiresAt: '', phone: '', note: '' };

/** Create gift cards (code shown once), see balances and freeze a card. */
const GiftCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState([]); // codes just created; gone after leaving the page

  const load = useCallback(async () => {
    const { data, error } = await giftCardsApi.list();
    if (error) toast.error(error);
    setCards(Array.isArray(data) ? data : data?.items || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await giftCardsApi.create({
      amount: Math.round(Number(form.amount)),
      quantity: Math.round(Number(form.quantity) || 1),
      ...(form.expiresAt ? { expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString() } : {}),
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.note ? { note: form.note.trim() } : {}),
    });
    setSaving(false);
    if (error) { toast.error(error); return; }
    setFresh(data);
    setForm(EMPTY);
    load();
  };

  const freeze = async (card) => {
    const { error } = await giftCardsApi.setActive(card.id, !card.isActive);
    if (error) toast.error(error); else load();
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Gift Cards</h1>
        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-600" /> Codes are stored encrypted (hashed). You see a code only once, right after creating it.</p>
      </div>

      {fresh.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5" data-testid="fresh-codes">
          <h2 className="text-sm font-bold text-amber-900">Copy these now. They cannot be shown again.</h2>
          <ul className="mt-3 space-y-2">{fresh.map((c) => (
            <li key={c.id} className="flex items-center gap-3 font-mono text-base font-bold text-slate-900">{c.code}<span className="font-sans text-sm text-slate-500">₹{c.initialAmount}</span></li>
          ))}</ul>
          <button type="button" onClick={() => navigator.clipboard.writeText(fresh.map((c) => c.code).join('\n')).then(() => toast.success('Copied')).catch(() => toast.error('Could not copy'))} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white"><Copy size={14} /> Copy all</button>
        </section>
      )}

      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className={label} htmlFor="gc-amount">Amount (₹)</label><input id="gc-amount" required type="number" min="1" max="50000" value={form.amount} onChange={set('amount')} className={input} /></div>
        <div><label className={label} htmlFor="gc-qty">How many</label><input id="gc-qty" type="number" min="1" max="50" value={form.quantity} onChange={set('quantity')} className={input} /></div>
        <div><label className={label} htmlFor="gc-exp">Valid till (optional)</label><input id="gc-exp" type="date" value={form.expiresAt} onChange={set('expiresAt')} className={input} /></div>
        <div><label className={label} htmlFor="gc-phone">Only for this mobile number (optional, safest)</label><input id="gc-phone" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} value={form.phone} onChange={set('phone')} className={input} /></div>
        <div><label className={label} htmlFor="gc-note">Note (optional)</label><input id="gc-note" maxLength={200} value={form.note} onChange={set('note')} className={input} /></div>
        <div className="flex items-end"><button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />} Create</button></div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{['Card', 'Amount', 'Balance', 'For', 'Valid till', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cards.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">{c.code}{c.note && <span className="block font-sans text-xs text-slate-400">{c.note}</span>}</td>
                <td className="px-4 py-3">₹{c.initialAmount}</td><td className="px-4 py-3 font-bold">₹{c.balance}</td>
                <td className="px-4 py-3">{c.phone || 'Anyone'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'No expiry'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS[c.status]}`}>{c.status}</span></td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => freeze(c)} className="text-xs font-bold text-blue-700">{c.isActive ? 'Freeze' : 'Unfreeze'}</button></td>
              </tr>
            ))}
            {!cards.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{loading ? 'Loading…' : 'No gift cards yet'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GiftCards;
