import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save, X, Flower2 } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurohitStore from '../../../../features/purohit/usePurohitStore';
import { usePurohitCatalog, ritualImage } from '../../../../features/purohit/selectors';
import { ritualArt } from '../../../../features/purohit/purohitArt';
import { POSTER_ASSETS } from '../../../../features/purohit/purohitSeed';
import { TemplateHelp } from './ui';
import { RitualCard } from '../../../user/components/purohit/PurohitCards';
import { inputCls, Field, StatusBadge, Pill, Toggle, CheckboxRow, SearchBox, EmptyState, ImagePicker, btnPrimary, btnGhost, iconBtn } from './ui';

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

const emptyRitual = () => ({ id: null, name: '', image: '', description: '', order: '', active: true, featured: false, posterTemplateImage: '' });

const RitualForm = ({ initial, onClose }) => {
  const { rituals } = usePurohitCatalog();
  const saveRitual = usePurohitStore((st) => st.saveRitual);
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    const name = form.name.trim();
    if (!name) { toast.error('Enter the ritual name'); return; }
    if (rituals.some((x) => x.id !== form.id && x.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error('A ritual with this name already exists'); return;
    }
    let { id } = form;
    if (!id) {
      const base = slugify(name) || 'ritual';
      id = base;
      let n = 2;
      while (rituals.some((x) => x.id === id)) { id = `${base}-${n}`; n += 1; }
    }
    const order = form.order === '' ? undefined : Math.max(1, Number(form.order) || 1);
    saveRitual({ ...form, id, name, description: form.description.trim(), ...(order ? { order } : {}) });
    toast.success(form.id ? 'Ritual updated' : 'Ritual added');
    onClose();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-5" data-testid="ritual-form">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{form.id ? 'Edit ritual' : 'New ritual'}</h3>
        <button type="button" aria-label="Close" onClick={onClose} className={iconBtn}><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ritual name" className="md:col-span-2">
            <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Satyanarayan Puja" aria-label="Ritual name" />
          </Field>
          <Field label="Short description" className="md:col-span-2">
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Shown on the ritual page" aria-label="Short description" />
          </Field>
          <div className="md:col-span-2">
            <ImagePicker label="Ritual image" aspect="aspect-[4/5]" value={form.image} onChange={(image) => set({ image })} fallback={ritualArt(form.name || 'Puja', form.artPalette)} testId="ritual-image-input" />
          </div>
          <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <ImagePicker
              label="Pandit card template for this ritual (optional)"
              aspect="aspect-[555/647]"
              maxSize={1000}
              value={form.posterTemplateImage || ''}
              onChange={(posterTemplateImage) => set({ posterTemplateImage })}
              fallback={POSTER_ASSETS.template}
              testId="ritual-template-input"
            />
            <p className="text-[11px] text-slate-500 mt-2">E.g. a Shiva–Parvati version for Vivah. Blank = the section&apos;s default template. <TemplateHelp /></p>
          </div>
          <Field label="Display order" hint="1 = first. Leave blank to add at the end.">
            <input type="number" min="1" className={inputCls} value={form.order} onChange={(e) => set({ order: e.target.value })} aria-label="Display order" />
          </Field>
          <div className="flex flex-col justify-center gap-3">
            <CheckboxRow checked={form.active} onChange={(active) => set({ active })}>Active (visible to customers)</CheckboxRow>
            <CheckboxRow checked={form.featured} onChange={(featured) => set({ featured })}>Featured (shows a “Popular” badge)</CheckboxRow>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Card preview</p>
          <div className="w-[150px] pointer-events-none" style={{ '--ml-primary': '#207C8A' }}>
            <RitualCard ritual={{ ...form, name: form.name || 'Ritual name' }} onClick={() => {}} className="w-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="button" onClick={save} className={btnPrimary} data-testid="ritual-save"><Save size={15} /> Save ritual</button>
      </div>
    </div>
  );
};

const RitualsPanel = () => {
  const { rituals, services } = usePurohitCatalog();
  const saveRitual = usePurohitStore((st) => st.saveRitual);
  const deleteRitual = usePurohitStore((st) => st.deleteRitual);
  const moveRitual = usePurohitStore((st) => st.moveRitual);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const sorted = useMemo(() => [...rituals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [rituals]);
  const filtered = sorted.filter((r) => (status === 'all' || (status === 'active' ? r.active : !r.active))
    && r.name.toLowerCase().includes(query.trim().toLowerCase()));
  const countFor = (id) => services.filter((s) => s.ritualId === id).length;

  const remove = (r) => {
    const n = countFor(r.id);
    if (!window.confirm(`Delete "${r.name}"?${n ? ` Its ${n} pandit listing${n > 1 ? 's' : ''} will also be removed (pandit profiles are kept).` : ''}`)) return;
    deleteRitual(r.id);
    toast.success('Ritual deleted');
  };

  if (editing) return <RitualForm key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search rituals" />
        <select className={`${inputCls} w-auto bg-white`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={() => setEditing(emptyRitual())} className={btnPrimary} data-testid="add-ritual"><Plus size={16} /> Add ritual</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Flower2} title={rituals.length ? 'No rituals match your filters' : 'No rituals yet'}>
          {!rituals.length && 'Add your first ritual category to show it on the Mithilak homepage.'}
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((r) => {
            const idx = sorted.findIndex((x) => x.id === r.id);
            const n = countFor(r.id);
            return (
              <li key={r.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-ritual-${r.id}`}>
                <img src={ritualImage(r)} alt="" className="w-12 h-[60px] rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">#{r.order}</span>
                    <p className="font-bold text-slate-900 truncate">{r.name}</p>
                    <StatusBadge active={r.active} />
                    {r.featured && <Pill tone="amber">Featured</Pill>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{n} pandit listing{n === 1 ? '' : 's'}{r.description ? ` · ${r.description}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" className={iconBtn} disabled={idx <= 0} onClick={() => moveRitual(r.id, -1)} aria-label={`Move ${r.name} up`}><ArrowUp size={16} /></button>
                  <button type="button" className={iconBtn} disabled={idx >= sorted.length - 1} onClick={() => moveRitual(r.id, 1)} aria-label={`Move ${r.name} down`}><ArrowDown size={16} /></button>
                  <span className="hidden sm:inline-flex mx-1"><Toggle checked={r.active} onChange={(active) => saveRitual({ id: r.id, active })} label={`${r.name} active`} testId={`ritual-toggle-${r.id}`} /></span>
                  <button type="button" className={`${iconBtn} text-blue-600`} onClick={() => setEditing({ ...r, order: r.order ?? '' })} aria-label={`Edit ${r.name}`}><Pencil size={16} /></button>
                  <button type="button" className={`${iconBtn} text-rose-500`} onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RitualsPanel;
