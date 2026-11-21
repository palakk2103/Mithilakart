import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, IndianRupee, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurohitStore from '../../../../features/purohit/usePurohitStore';
import { usePurohitCatalog, buildListings, panditImage, formatINR, badgeLines } from '../../../../features/purohit/selectors';
import { POSTER_ASSETS } from '../../../../features/purohit/purohitSeed';
import { PanditPosterCard } from '../../../user/components/purohit/PanditPoster';
import { inputCls, Field, Pill, Toggle, SearchBox, EmptyState, ImagePicker, CheckboxRow, TemplateHelp, btnPrimary, btnGhost, iconBtn } from './ui';

/** Price input that commits on blur / Enter, so typing doesn't spam the store. */
const PriceInput = ({ value, onCommit, label, allowEmpty = false }) => {
  const [draft, setDraft] = useState(value ?? '');
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); setDraft(value ?? ''); }
  const commit = () => {
    if (draft === '' && allowEmpty) { if (value !== null) onCommit(null); return; }
    const n = Number(draft);
    if (draft === '' || !(n >= 0)) { setDraft(value ?? ''); toast.error('Enter a valid price'); return; }
    if (n !== value) onCommit(n);
  };
  return (
    <div className="relative">
      <IndianRupee size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="number"
        min="0"
        className={`${inputCls} bg-white py-1.5 pl-6 pr-2 w-[96px]`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder={allowEmpty ? '—' : ''}
        aria-label={label}
      />
    </div>
  );
};

const emptyCard = () => ({
  id: null, panditId: '', ritualId: '', price: '', mrp: '', duration: '',
  badgeLine1: '', badgeLine2: '', templateImage: '',
  inPerson: true, online: false, travelCharge: '', samagriPrice: '',
  active: true, featured: false, showOnHome: false,
});

/** Add / edit one pandit card (poster) with live preview. */
const CardEditor = ({ initial, onClose }) => {
  const { pandits, rituals, settings } = usePurohitCatalog();
  const saveService = usePurohitStore((st) => st.saveService);
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const pandit = pandits.find((p) => p.id === form.panditId);
  const ritual = rituals.find((r) => r.id === form.ritualId);
  const [autoB1, autoB2] = badgeLines({}, ritual);

  const save = () => {
    if (!form.panditId) { toast.error('Choose the pandit for this card'); return; }
    if (!form.ritualId) { toast.error('Choose the puja category for this card'); return; }
    if (form.price === '' || !(Number(form.price) >= 0)) { toast.error('Enter a valid price'); return; }
    if (form.mrp !== '' && form.mrp !== null && Number(form.mrp) < Number(form.price)) { toast.error('Original price (MRP) should not be lower than the price'); return; }
    if (!form.inPerson && !form.online) { toast.error('Offer at least one service type (in-person or online)'); return; }
    if (form.online && pandit && !pandit.onlineAvailable) { toast.error(`${pandit.name} is not marked as able to perform online pujas — enable it in the Pandits tab first`); return; }
    if ((form.travelCharge !== '' && !(Number(form.travelCharge) >= 0)) || (form.samagriPrice !== '' && !(Number(form.samagriPrice) >= 0))) { toast.error('Travel charge and samagri price must be valid amounts'); return; }
    const res = saveService({
      ...form,
      id: form.id || undefined,
      price: Number(form.price),
      mrp: form.mrp === '' || form.mrp === null ? null : Number(form.mrp),
      duration: String(form.duration || '').trim(),
      badgeLine1: form.badgeLine1.trim(),
      badgeLine2: form.badgeLine2.trim(),
      travelCharge: form.travelCharge === '' ? null : Number(form.travelCharge),
      samagriPrice: form.samagriPrice === '' ? null : Number(form.samagriPrice),
    });
    if (!res.ok) { toast.error(`${pandit?.name} already has a card for ${ritual?.name} — edit that card instead`); return; }
    toast.success(form.id ? 'Card updated' : 'Card created');
    onClose();
  };

  const preview = pandit && ritual ? {
    pandit,
    ritual,
    service: { ...form, id: 'preview', price: Number(form.price) || 0, mrp: Number(form.mrp) || null },
  } : null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-5" data-testid="card-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{form.id ? 'Edit pandit card' : 'New pandit card'}</h3>
        <button type="button" aria-label="Close" onClick={onClose} className={iconBtn}><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pandit" hint="Photo, name, title, qualifications come from the pandit profile.">
              <select className={inputCls} value={form.panditId} onChange={(e) => set({ panditId: e.target.value })} aria-label="Card pandit">
                <option value="">Choose pandit…</option>
                {pandits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Puja category" hint="The card shows on this ritual's page.">
              <select className={inputCls} value={form.ritualId} onChange={(e) => set({ ritualId: e.target.value })} aria-label="Card puja category">
                <option value="">Choose ritual…</option>
                {rituals.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Price (₹)">
              <input type="number" min="0" className={inputCls} value={form.price} onChange={(e) => set({ price: e.target.value })} aria-label="Card price" />
            </Field>
            <Field label="Original price / MRP (₹, optional)">
              <input type="number" min="0" className={inputCls} value={form.mrp ?? ''} onChange={(e) => set({ mrp: e.target.value })} aria-label="Card MRP" />
            </Field>
            <Field label="Badge line 1 (white)" hint={`Blank = “${autoB1}”`}>
              <input className={inputCls} value={form.badgeLine1} onChange={(e) => set({ badgeLine1: e.target.value })} placeholder={autoB1 || 'Satyanarayan'} aria-label="Badge line 1" />
            </Field>
            <Field label="Badge line 2 (gold)" hint={autoB2 ? `Blank = “${autoB2}”` : 'Optional'}>
              <input className={inputCls} value={form.badgeLine2} onChange={(e) => set({ badgeLine2: e.target.value })} placeholder={autoB2 || 'Puja & Katha'} aria-label="Badge line 2" />
            </Field>
            <Field label="Duration (optional)">
              <input className={inputCls} value={form.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="2–3 hrs" aria-label="Card duration" />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="booking-options">
            <p className="md:col-span-2 text-xs font-bold text-slate-700">Booking options</p>
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <CheckboxRow checked={form.inPerson} onChange={(inPerson) => set({ inPerson })}>In-person puja</CheckboxRow>
              <CheckboxRow checked={form.online} onChange={(online) => set({ online })}>Online (video) puja</CheckboxRow>
            </div>
            <Field label="Travel charge (₹, in-person)" hint="Blank = “calculated separately” at checkout.">
              <input type="number" min="0" className={inputCls} value={form.travelCharge ?? ''} onChange={(e) => set({ travelCharge: e.target.value })} aria-label="Travel charge" data-testid="card-travel" />
            </Field>
            <Field label="Puja samagri add-on (₹)" hint="Blank = samagri add-on not offered.">
              <input type="number" min="0" className={inputCls} value={form.samagriPrice ?? ''} onChange={(e) => set({ samagriPrice: e.target.value })} aria-label="Samagri price" data-testid="card-samagri" />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <ImagePicker
              label="Card template image (optional)"
              aspect="aspect-[555/647]"
              maxSize={1000}
              value={form.templateImage}
              onChange={(templateImage) => set({ templateImage })}
              fallback={ritual?.posterTemplateImage || settings.posterTemplateImage || POSTER_ASSETS.template}
              testId="card-template-input"
            />
            <p className="text-[11px] text-slate-500 mt-2">Blank = the ritual&apos;s template, else the section default. <TemplateHelp /></p>
          </div>

          <div className="flex flex-wrap gap-6">
            <CheckboxRow checked={form.active} onChange={(active) => set({ active })}>Card enabled</CheckboxRow>
            <CheckboxRow checked={form.featured} onChange={(featured) => set({ featured })}>Featured</CheckboxRow>
            <CheckboxRow checked={form.showOnHome} onChange={(showOnHome) => set({ showOnHome })}>Show on homepage row</CheckboxRow>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Live card preview</p>
          {preview ? (
            <div className="w-full max-w-[320px] pointer-events-none" aria-hidden="true" data-testid="card-preview">
              <PanditPosterCard listing={preview} settings={settings} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 py-16 px-4">Choose a pandit and a puja category to see the card.</div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="button" onClick={save} className={btnPrimary} data-testid="card-save"><Save size={15} /> Save card</button>
      </div>
    </div>
  );
};

const ServicesPanel = () => {
  const catalog = usePurohitCatalog();
  const updateService = usePurohitStore((st) => st.updateService);
  const deleteService = usePurohitStore((st) => st.deleteService);
  const [query, setQuery] = useState('');
  const [ritualFilter, setRitualFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState(null);

  const all = useMemo(() => buildListings(catalog, { liveOnly: false })
    .sort((a, b) => (a.ritual.order ?? 0) - (b.ritual.order ?? 0) || a.pandit.name.localeCompare(b.pandit.name)), [catalog]);

  const filtered = all.filter(({ service, pandit, ritual }) => {
    if (ritualFilter && ritual.id !== ritualFilter) return false;
    if (status === 'active' && !service.active) return false;
    if (status === 'inactive' && service.active) return false;
    if (status === 'home' && !service.showOnHome) return false;
    if (status === 'featured' && !service.featured) return false;
    const q = query.trim().toLowerCase();
    return !q || pandit.name.toLowerCase().includes(q) || ritual.name.toLowerCase().includes(q);
  });

  const remove = ({ service, pandit, ritual }) => {
    if (!window.confirm(`Delete the card for ${pandit.name} – ${ritual.name}? The pandit profile is kept.`)) return;
    deleteService(service.id);
    toast.success('Card deleted');
  };

  const openEdit = (service) => setEditing({
    ...emptyCard(),
    ...service,
    price: String(service.price ?? ''),
    mrp: service.mrp ? String(service.mrp) : '',
    badgeLine1: service.badgeLine1 || '',
    badgeLine2: service.badgeLine2 || '',
    templateImage: service.templateImage || '',
    duration: service.duration || '',
    inPerson: service.inPerson !== false,
    online: Boolean(service.online),
    travelCharge: service.travelCharge == null ? '' : String(service.travelCharge),
    samagriPrice: service.samagriPrice == null ? '' : String(service.samagriPrice),
  });

  if (editing) return <CardEditor key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Each card is one pandit for one puja, with its own price, badge and images. Prices in the table save when you leave the field; use ✎ to edit everything on a card.</p>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search pandit or ritual" />
        <select className={`${inputCls} w-auto bg-white`} value={ritualFilter} onChange={(e) => setRitualFilter(e.target.value)} aria-label="Filter listings by ritual">
          <option value="">All rituals</option>
          {catalog.rituals.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className={`${inputCls} w-auto bg-white`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter listings by status">
          <option value="all">All cards</option>
          <option value="active">Enabled</option>
          <option value="inactive">Disabled</option>
          <option value="home">On homepage</option>
          <option value="featured">Featured</option>
        </select>
        <button type="button" onClick={() => setEditing(emptyCard())} className={btnPrimary} data-testid="add-card"><Plus size={16} /> New card</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IndianRupee} title={all.length ? 'No cards match your filters' : 'No pandit cards yet'}>
          {!all.length && 'Create a card, or assign rituals to a pandit in the Pandits tab.'}
        </EmptyState>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-100">
                <th className="px-3 py-2.5 font-semibold">Pandit</th>
                <th className="px-3 py-2.5 font-semibold">Puja category</th>
                <th className="px-3 py-2.5 font-semibold">Price</th>
                <th className="px-3 py-2.5 font-semibold">MRP</th>
                <th className="px-3 py-2.5 font-semibold text-center">Enabled</th>
                <th className="px-3 py-2.5 font-semibold text-center">Featured</th>
                <th className="px-3 py-2.5 font-semibold text-center">Homepage</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const { service, pandit, ritual } = row;
                const hiddenReason = !pandit.active ? 'Pandit inactive' : !ritual.active ? 'Ritual inactive' : '';
                return (
                  <tr key={service.id} className="border-b border-slate-50 last:border-0" data-testid={`admin-service-${service.id}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img src={panditImage(pandit)} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-semibold text-slate-800">{pandit.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-slate-700">{ritual.name}</span>
                      {hiddenReason && <div><Pill tone="amber">{hiddenReason}</Pill></div>}
                    </td>
                    <td className="px-3 py-2"><PriceInput value={service.price} onCommit={(price) => { updateService(service.id, { price }); toast.success(`Price set to ${formatINR(price)}`); }} label={`Price for ${pandit.name} – ${ritual.name}`} /></td>
                    <td className="px-3 py-2"><PriceInput value={service.mrp} allowEmpty onCommit={(mrp) => updateService(service.id, { mrp })} label={`MRP for ${pandit.name} – ${ritual.name}`} /></td>
                    <td className="px-3 py-2 text-center"><Toggle checked={service.active} onChange={(active) => updateService(service.id, { active })} label={`Enable ${pandit.name} – ${ritual.name}`} testId={`service-active-${service.id}`} /></td>
                    <td className="px-3 py-2 text-center"><Toggle checked={service.featured} onChange={(featured) => updateService(service.id, { featured })} label={`Feature ${pandit.name} – ${ritual.name}`} /></td>
                    <td className="px-3 py-2 text-center"><Toggle checked={service.showOnHome} onChange={(showOnHome) => updateService(service.id, { showOnHome })} label={`Show ${pandit.name} – ${ritual.name} on homepage`} testId={`service-home-${service.id}`} /></td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={`${iconBtn} text-blue-600`} onClick={() => openEdit(service)} aria-label={`Edit card ${pandit.name} – ${ritual.name}`}><Pencil size={16} /></button>
                        <button type="button" className={`${iconBtn} text-rose-500`} onClick={() => remove(row)} aria-label={`Remove ${pandit.name} – ${ritual.name}`}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServicesPanel;
