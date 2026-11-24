import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, UserRound, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurohitStore from '../../../../features/purohit/usePurohitStore';
import { usePurohitCatalog, panditImage, formatINR, qualificationList } from '../../../../features/purohit/selectors';
import { panditArt } from '../../../../features/purohit/purohitArt';
import { PanditPosterCard } from '../../../user/components/purohit/PanditPoster';
import { inputCls, Field, StatusBadge, Pill, Toggle, CheckboxRow, SearchBox, EmptyState, ImagePicker, GalleryAdd, btnPrimary, btnGhost, iconBtn } from './ui';
import { WEEKDAYS } from '../../../../features/purohit/purohitSeed';

const emptyPandit = () => ({
  id: null, name: '', image: '', designation: '', institution: '', available: true, qualifications: '', experienceYears: '', specializationsText: '', description: '', verified: false, active: true,
  languagesText: 'Hindi, Maithili, Sanskrit', location: '', serviceAreasText: '', onlineAvailable: false, workingDays: [0, 1, 2, 3, 4, 5, 6], gallery: [], phone: '',
});

const splitList = (t) => String(t || '').split(',').map((x) => x.trim()).filter(Boolean);

const PanditForm = ({ initial, initialAssignments, onClose }) => {
  const { rituals, settings, services } = usePurohitCatalog();
  const savePandit = usePurohitStore((st) => st.savePandit);
  const [form, setForm] = useState(initial);
  // ritualId -> { price, mrp, duration } for every ticked ritual
  const [assign, setAssign] = useState(initialAssignments);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const sortedRituals = useMemo(() => [...rituals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [rituals]);

  const toggleRitual = (ritualId, on) => setAssign((a) => {
    const next = { ...a };
    if (on) next[ritualId] = next[ritualId] || { price: '', mrp: '', duration: '' };
    else delete next[ritualId];
    return next;
  });
  const setAssignField = (ritualId, patch) => setAssign((a) => ({ ...a, [ritualId]: { ...a[ritualId], ...patch } }));

  const save = () => {
    const name = form.name.trim();
    if (!name) { toast.error('Enter the pandit name'); return; }
    if (!form.workingDays.length) { toast.error('Choose at least one working day'); return; }
    if (!splitList(form.languagesText).length) { toast.error('Add at least one language'); return; }
    const entries = Object.entries(assign);
    const missing = entries.find(([, v]) => v.price === '' || !(Number(v.price) >= 0));
    if (missing) {
      const r = rituals.find((x) => x.id === missing[0]);
      toast.error(`Enter a price for ${r?.name || 'each assigned ritual'}`); return;
    }
    const badMrp = entries.find(([, v]) => v.mrp !== '' && Number(v.mrp) < Number(v.price));
    if (badMrp) { toast.error('Original price (MRP) should not be lower than the service price'); return; }

    savePandit({
      id: form.id || undefined,
      name,
      image: form.image,
      designation: form.designation.trim(),
      institution: form.institution.trim(),
      available: form.available,
      languages: splitList(form.languagesText),
      location: form.location.trim(),
      serviceAreas: splitList(form.serviceAreasText),
      onlineAvailable: form.onlineAvailable,
      workingDays: form.workingDays,
      gallery: form.gallery,
      phone: form.phone.trim(),
      qualifications: qualificationList(form.qualifications).join('\n'),
      experienceYears: form.experienceYears === '' ? 0 : Number(form.experienceYears),
      specializations: form.specializationsText.split(',').map((x) => x.trim()).filter(Boolean),
      description: form.description.trim(),
      verified: form.verified,
      active: form.active,
    }, entries.map(([ritualId, v]) => ({ ritualId, price: Number(v.price), mrp: v.mrp === '' ? null : Number(v.mrp), duration: v.duration.trim() })));
    toast.success(form.id ? 'Pandit profile updated' : 'Pandit profile added');
    onClose();
  };

  const previewRitualId = Object.keys(assign)[0];
  const previewRitual = rituals.find((x) => x.id === previewRitualId) || { id: 'preview', name: 'Ritual name' };
  const existingCard = services.find((x) => x.panditId === form.id && x.ritualId === previewRitualId);
  const previewListing = {
    ritual: previewRitual,
    pandit: {
      ...form,
      id: form.id || 'preview',
      name: form.name || 'Pandit name',
      experienceYears: Number(form.experienceYears) || 0,
    },
    service: { ...(existingCard || {}), id: 'preview', price: Number(assign[previewRitualId]?.price) || 0, mrp: Number(assign[previewRitualId]?.mrp) || null },
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-6" data-testid="pandit-form">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{form.id ? 'Edit pandit profile' : 'New pandit profile'}</h3>
        <button type="button" aria-label="Close" onClick={onClose} className={iconBtn}><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pandit name" className="md:col-span-2">
            <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Acharya Vikash Parashar" aria-label="Pandit name" />
          </Field>
          <div className="md:col-span-2">
            <ImagePicker label="Profile image" value={form.image} onChange={(image) => set({ image })} fallback={panditArt(form.name || 'Pandit')} testId="pandit-image-input" />
          </div>
          <Field label="Title line (under the name)" hint="e.g. Vedic Acharya | Mithila">
            <input className={inputCls} value={form.designation} onChange={(e) => set({ designation: e.target.value })} aria-label="Title line" />
          </Field>
          <Field label="From (institution)" hint="Shown as “From: …”">
            <input className={inputCls} value={form.institution} onChange={(e) => set({ institution: e.target.value })} placeholder="Banaras Hindu University (BHU)" aria-label="Institution" />
          </Field>
          <Field label="Qualifications (one per line)" className="md:col-span-2" hint="The first 3 lines are shown on the card.">
            <textarea className={inputCls} rows={3} value={form.qualifications} onChange={(e) => set({ qualifications: e.target.value })} placeholder={'Acharya in Vedic Studies\nSanskrit and Vedic Ritual Studies\nSpecialisation in Hindu Puja Vidhi'} aria-label="Qualifications" />
          </Field>
          <Field label="Experience (years)">
            <input type="number" min="0" className={inputCls} value={form.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} aria-label="Experience in years" />
          </Field>
          <Field label="Specializations" className="md:col-span-2" hint="Comma separated, e.g. Vivah, Griha Pravesh, Katha">
            <input className={inputCls} value={form.specializationsText} onChange={(e) => set({ specializationsText: e.target.value })} aria-label="Specializations" />
          </Field>
          <Field label="Short description" className="md:col-span-2">
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} aria-label="Pandit description" />
          </Field>
          <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="md:col-span-2 text-xs font-bold text-slate-700">Booking &amp; profile details</p>
            <Field label="Languages" hint="Comma separated. Shown on the card and offered in the booking form.">
              <input className={inputCls} value={form.languagesText} onChange={(e) => set({ languagesText: e.target.value })} aria-label="Languages" />
            </Field>
            <Field label="Location (base city)">
              <input className={inputCls} value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="Darbhanga" aria-label="Location" />
            </Field>
            <Field label="Service coverage" className="md:col-span-2" hint="Cities / districts this purohit travels to (comma separated).">
              <input className={inputCls} value={form.serviceAreasText} onChange={(e) => set({ serviceAreasText: e.target.value })} placeholder="Darbhanga, Madhubani, Patna" aria-label="Service coverage" />
            </Field>
            <div className="md:col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">Working days</label>
              <div className="flex flex-wrap gap-1.5" data-testid="working-days">
                {WEEKDAYS.map((d, i) => {
                  const on = form.workingDays.includes(i);
                  return (
                    <button key={d} type="button" aria-pressed={on} onClick={() => set({ workingDays: on ? form.workingDays.filter((x) => x !== i) : [...form.workingDays, i].sort() })} data-testid={`workday-${i}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>{d}</button>
                  );
                })}
              </div>
            </div>
            <Field label="Phone (shown to customer after confirmation)">
              <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" aria-label="Pandit phone" />
            </Field>
            <div className="flex items-end pb-2">
              <CheckboxRow checked={form.onlineAvailable} onChange={(onlineAvailable) => set({ onlineAvailable })}>Can perform online (video) puja</CheckboxRow>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">Profile photos (gallery)</label>
              <div className="flex flex-wrap gap-2 items-center">
                {form.gallery.map((g, i) => (
                  <div key={`${i}-${g.slice(-10)}`} className="relative w-16 h-16">
                    <img src={g} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set({ gallery: form.gallery.filter((_, j) => j !== i) })} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-xs leading-none cursor-pointer">×</button>
                  </div>
                ))}
                <GalleryAdd onAdd={(url) => set({ gallery: [...form.gallery, url].slice(0, 8) })} disabled={form.gallery.length >= 8} />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-6">
            <CheckboxRow checked={form.verified} onChange={(verified) => set({ verified })}>Verified pandit</CheckboxRow>
            <CheckboxRow checked={form.available} onChange={(available) => set({ available })}>Available for puja services</CheckboxRow>
            <CheckboxRow checked={form.active} onChange={(active) => set({ active })}>Profile active</CheckboxRow>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Card preview{previewRitualId ? '' : ' (tick a ritual below)'}</p>
          <div className="w-full max-w-[300px] pointer-events-none" aria-hidden="true">
            <PanditPosterCard listing={previewListing} settings={settings} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Badge text, deity and altar images are set per card in “Pandit Cards”.</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900">Rituals &amp; pricing</h4>
        <p className="text-xs text-slate-500 mb-3">Tick every ritual this pandit performs and set the price for each. The pandit then appears on those ritual pages automatically.</p>
        {sortedRituals.length === 0 ? (
          <p className="text-xs text-slate-400">Add rituals first in the Rituals tab.</p>
        ) : (
          <div className="space-y-2" data-testid="ritual-assignments">
            {sortedRituals.map((r) => {
              const on = Boolean(assign[r.id]);
              return (
                <div key={r.id} className={`grid grid-cols-12 gap-2 items-center rounded-xl border p-2.5 ${on ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-slate-50'}`}>
                  <label className="col-span-12 sm:col-span-4 flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={on} onChange={(e) => toggleRitual(r.id, e.target.checked)} aria-label={`Assign ${r.name}`} />
                    <span className="truncate">{r.name}</span>
                    {!r.active && <Pill>Inactive</Pill>}
                  </label>
                  {on && (
                    <>
                      <input type="number" min="0" className={`${inputCls} bg-white col-span-4 sm:col-span-3`} value={assign[r.id].price} onChange={(e) => setAssignField(r.id, { price: e.target.value })} placeholder="Price ₹" aria-label={`${r.name} price`} />
                      <input type="number" min="0" className={`${inputCls} bg-white col-span-4 sm:col-span-2`} value={assign[r.id].mrp} onChange={(e) => setAssignField(r.id, { mrp: e.target.value })} placeholder="MRP ₹ (opt.)" aria-label={`${r.name} original price`} />
                      <input className={`${inputCls} bg-white col-span-4 sm:col-span-3`} value={assign[r.id].duration} onChange={(e) => setAssignField(r.id, { duration: e.target.value })} placeholder="Duration (opt.)" aria-label={`${r.name} duration`} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="button" onClick={save} className={btnPrimary} data-testid="pandit-save"><Save size={15} /> Save pandit</button>
      </div>
    </div>
  );
};

const PanditsPanel = () => {
  const { pandits, services, rituals } = usePurohitCatalog();
  const updatePandit = usePurohitStore((st) => st.updatePandit);
  const deletePandit = usePurohitStore((st) => st.deletePandit);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [ritualFilter, setRitualFilter] = useState('');

  const ritualName = useMemo(() => new Map(rituals.map((r) => [r.id, r.name])), [rituals]);
  const servicesFor = (id) => services.filter((s) => s.panditId === id);

  const filtered = pandits.filter((p) => {
    if (filter === 'active' && !p.active) return false;
    if (filter === 'inactive' && p.active) return false;
    if (filter === 'verified' && !p.verified) return false;
    if (ritualFilter && !services.some((s) => s.panditId === p.id && s.ritualId === ritualFilter)) return false;
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.specializations || []).some((x) => x.toLowerCase().includes(q));
  });

  const openEdit = (p) => {
    const assignments = {};
    servicesFor(p.id).forEach((s) => {
      assignments[s.ritualId] = { price: String(s.price ?? ''), mrp: s.mrp ? String(s.mrp) : '', duration: s.duration || '' };
    });
    setEditing({
      form: { ...emptyPandit(), ...p,
        languagesText: (p.languages || []).join(', '), serviceAreasText: (p.serviceAreas || []).join(', '), location: p.location || '', phone: p.phone || '',
        onlineAvailable: Boolean(p.onlineAvailable), workingDays: p.workingDays?.length ? p.workingDays : [0, 1, 2, 3, 4, 5, 6], gallery: p.gallery || [],
        experienceYears: p.experienceYears ? String(p.experienceYears) : '', specializationsText: (p.specializations || []).join(', '), qualifications: qualificationList(p.qualifications).join('\n'), designation: p.designation || '', institution: p.institution || '', available: p.available !== false },
      assignments,
    });
  };

  const remove = (p) => {
    const n = servicesFor(p.id).length;
    if (!window.confirm(`Delete ${p.name}?${n ? ` This also removes their ${n} ritual listing${n > 1 ? 's' : ''}.` : ''}`)) return;
    deletePandit(p.id);
    toast.success('Pandit deleted');
  };

  if (editing) {
    return <PanditForm key={editing.form.id || 'new'} initial={editing.form} initialAssignments={editing.assignments} onClose={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search pandits or specializations" />
        <select className={`${inputCls} w-auto bg-white`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter pandits">
          <option value="all">All pandits</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
        </select>
        <select className={`${inputCls} w-auto bg-white`} value={ritualFilter} onChange={(e) => setRitualFilter(e.target.value)} aria-label="Filter by ritual">
          <option value="">Any ritual</option>
          {rituals.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button type="button" onClick={() => setEditing({ form: emptyPandit(), assignments: {} })} className={btnPrimary} data-testid="add-pandit"><Plus size={16} /> Add pandit</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserRound} title={pandits.length ? 'No pandits match your filters' : 'No pandit profiles yet'} />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((p) => {
            const list = servicesFor(p.id);
            return (
              <li key={p.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-start sm:items-center gap-3" data-testid={`admin-pandit-${p.id}`}>
                <img src={panditImage(p)} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    {p.verified && <BadgeCheck size={15} className="text-blue-600" aria-label="Verified" />}
                    <StatusBadge active={p.active} />
                    {p.isSample && <Pill tone="violet">Sample</Pill>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[p.experienceYears ? `${p.experienceYears} yrs` : '', (p.specializations || []).join(', ')].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {list.length === 0
                      ? <span className="text-[11px] text-amber-600 font-semibold">Not assigned to any ritual</span>
                      : list.map((s) => (
                        <span key={s.id} className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${s.active ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400 line-through'}`}>
                          {ritualName.get(s.ritualId)} · {formatINR(s.price)}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="mx-1"><Toggle checked={p.active} onChange={(active) => updatePandit(p.id, { active })} label={`${p.name} active`} /></span>
                  <button type="button" className={`${iconBtn} text-blue-600`} onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}><Pencil size={16} /></button>
                  <button type="button" className={`${iconBtn} text-rose-500`} onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PanditsPanel;
