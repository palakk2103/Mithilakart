import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus, Save, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurohitStore from '../../../../features/purohit/usePurohitStore';
import { usePurohitCatalog, buildListings, ritualImage, panditImage, formatINR } from '../../../../features/purohit/selectors';
import PurohitSection from '../../../user/components/purohit/PurohitSection';
import { inputCls, Field, Pill, Toggle, EmptyState, ImagePicker, TemplateHelp, btnPrimary, iconBtn } from './ui';
import { POSTER_ASSETS } from '../../../../features/purohit/purohitSeed';

const SettingsForm = () => {
  const { settings } = usePurohitCatalog();
  const updateSettings = usePurohitStore((st) => st.updateSettings);
  const [form, setForm] = useState(settings);
  const [prev, setPrev] = useState(settings);
  if (prev !== settings) { setPrev(settings); setForm(settings); }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const save = () => {
    if (!String(form.heading || '').trim()) { toast.error('The section heading cannot be empty'); return; }
    const { timeSlotsText, ...rest } = form;
    const slots = timeSlotsText === undefined ? form.timeSlots : String(timeSlotsText).split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean);
    if (!slots.length) { toast.error('Add at least one time slot'); return; }
    const lead = Math.max(0, Number(form.minLeadDays) || 0);
    const advance = Math.max(1, Number(form.maxAdvanceDays) || 90);
    if (advance <= lead) { toast.error('The bookable range must end after it starts'); return; }
    updateSettings({
      ...rest,
      timeSlots: slots,
      minLeadDays: lead,
      maxAdvanceDays: advance,
      slotHoldMinutes: Math.min(60, Math.max(1, Number(form.slotHoldMinutes) || 10)),
      heading: form.heading.trim(),
      maxHomeRituals: Math.max(1, Number(form.maxHomeRituals) || 12),
      maxHomeServices: Math.max(1, Number(form.maxHomeServices) || 12),
    });
    toast.success('Section settings saved');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Show section on Mithilak homepage</h3>
          <p className="text-xs text-slate-500">Turns the whole Purohit section on or off (takes effect immediately).</p>
        </div>
        <Toggle
          checked={settings.sectionVisible}
          onChange={(sectionVisible) => { updateSettings({ sectionVisible }); toast.success(sectionVisible ? 'Section is now visible' : 'Section hidden'); }}
          label="Show Purohit section"
          testId="section-visible-toggle"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Section heading" className="md:col-span-2">
          <input className={inputCls} value={form.heading} onChange={(e) => set({ heading: e.target.value })} aria-label="Section heading" />
        </Field>
        <Field label="Sub-heading (optional)" className="md:col-span-2">
          <input className={inputCls} value={form.subheading} onChange={(e) => set({ subheading: e.target.value })} aria-label="Sub-heading" />
        </Field>
        <Field label="Ritual row title (optional)">
          <input className={inputCls} value={form.ritualsTitle} onChange={(e) => set({ ritualsTitle: e.target.value })} aria-label="Ritual row title" />
        </Field>
        <Field label="Pandit row title (optional)">
          <input className={inputCls} value={form.panditsTitle} onChange={(e) => set({ panditsTitle: e.target.value })} aria-label="Pandit row title" />
        </Field>
        <p className="md:col-span-2 text-xs font-bold text-slate-700 pt-1">Pandit card texts (same on every card)</p>
        <Field label="Verified badge text">
          <input className={inputCls} value={form.posterVerifiedText || ''} onChange={(e) => set({ posterVerifiedText: e.target.value })} aria-label="Verified badge text" />
        </Field>
        <Field label="Qualifications heading">
          <input className={inputCls} value={form.posterQualificationsTitle || ''} onChange={(e) => set({ posterQualificationsTitle: e.target.value })} aria-label="Qualifications heading" />
        </Field>
        <Field label="Available text">
          <input className={inputCls} value={form.posterAvailableText || ''} onChange={(e) => set({ posterAvailableText: e.target.value })} aria-label="Available text" />
        </Field>
        <Field label="Not-available text">
          <input className={inputCls} value={form.posterUnavailableText || ''} onChange={(e) => set({ posterUnavailableText: e.target.value })} aria-label="Not available text" />
        </Field>
        <Field label="Footer line" className="md:col-span-2">
          <input className={inputCls} value={form.posterFooterText || ''} onChange={(e) => set({ posterFooterText: e.target.value })} aria-label="Card footer line" />
        </Field>
        <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <ImagePicker
            label="Default pandit card template (all rituals)"
            aspect="aspect-[555/647]"
            maxSize={1000}
            value={form.posterTemplateImage || ''}
            onChange={(posterTemplateImage) => set({ posterTemplateImage })}
            fallback={POSTER_ASSETS.template}
            testId="settings-template-input"
          />
          <p className="text-[11px] text-slate-500 mt-2">Blank = built-in template. Rituals and individual cards can override it. Click “Save settings” to apply. <TemplateHelp /></p>
        </div>
        <Field label="Price label">
          <input className={inputCls} value={form.posterPriceLabel || ''} onChange={(e) => set({ posterPriceLabel: e.target.value })} placeholder="Dakshina" aria-label="Price label" />
        </Field>
        <div />
        <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="booking-settings">
          <p className="md:col-span-3 text-xs font-bold text-slate-700">Puja booking settings</p>
          <Field label="Time slots (one per line)" className="md:col-span-3" hint="Customers pick from these when booking; a slot can only be booked once per purohit and date.">
            <textarea className={inputCls} rows={4} value={form.timeSlotsText ?? (form.timeSlots || []).join(String.fromCharCode(10))} onChange={(e) => set({ timeSlotsText: e.target.value })} aria-label="Time slots" data-testid="settings-slots" />
          </Field>
          <Field label="Earliest booking (days from today)">
            <input type="number" min="0" className={inputCls} value={form.minLeadDays ?? 1} onChange={(e) => set({ minLeadDays: e.target.value })} aria-label="Earliest booking days" />
          </Field>
          <Field label="Latest booking (days from today)">
            <input type="number" min="1" className={inputCls} value={form.maxAdvanceDays ?? 90} onChange={(e) => set({ maxAdvanceDays: e.target.value })} aria-label="Latest booking days" />
          </Field>
          <Field label="Slot hold at checkout (minutes)">
            <input type="number" min="1" max="60" className={inputCls} value={form.slotHoldMinutes ?? 10} onChange={(e) => set({ slotHoldMinutes: e.target.value })} aria-label="Slot hold minutes" data-testid="settings-hold" />
          </Field>
        </div>
        <Field label="Max rituals on homepage">
          <input type="number" min="1" className={inputCls} value={form.maxHomeRituals} onChange={(e) => set({ maxHomeRituals: e.target.value })} aria-label="Max rituals on homepage" />
        </Field>
        <Field label="Max pandit cards on homepage">
          <input type="number" min="1" className={inputCls} value={form.maxHomeServices} onChange={(e) => set({ maxHomeServices: e.target.value })} aria-label="Max pandit cards on homepage" />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={!dirty} className={btnPrimary} data-testid="settings-save"><Save size={15} /> Save settings</button>
      </div>
    </div>
  );
};

const HomepagePanel = () => {
  const catalog = usePurohitCatalog();
  const saveRitual = usePurohitStore((st) => st.saveRitual);
  const moveRitual = usePurohitStore((st) => st.moveRitual);
  const updateService = usePurohitStore((st) => st.updateService);
  const moveHomeService = usePurohitStore((st) => st.moveHomeService);
  const [toAdd, setToAdd] = useState('');

  const rituals = useMemo(() => [...catalog.rituals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [catalog.rituals]);
  const all = useMemo(() => buildListings(catalog, { liveOnly: false }), [catalog]);
  const homeRow = all.filter((x) => x.service.showOnHome).sort((a, b) => (a.service.homeOrder ?? 0) - (b.service.homeOrder ?? 0));
  const candidates = all.filter((x) => !x.service.showOnHome);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start [&>*]:min-w-0">
      <div className="space-y-5">
        <SettingsForm />

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900">Ritual cards — order &amp; visibility</h3>
          <p className="text-xs text-slate-500 mb-3">Use the arrows to reorder. Add/edit rituals in the Rituals tab.</p>
          {rituals.length === 0 ? <p className="text-xs text-slate-400">No rituals yet.</p> : (
            <ul className="space-y-1.5" data-testid="home-ritual-order">
              {rituals.map((r, i) => (
                <li key={r.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-1.5">
                  <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                  <img src={ritualImage(r)} alt="" className="w-7 h-9 rounded object-cover" />
                  <span className={`flex-1 min-w-0 truncate text-sm font-semibold ${r.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{r.name}</span>
                  <button type="button" className={iconBtn} disabled={i === 0} onClick={() => moveRitual(r.id, -1)} aria-label={`Move ${r.name} up`}><ArrowUp size={15} /></button>
                  <button type="button" className={iconBtn} disabled={i === rituals.length - 1} onClick={() => moveRitual(r.id, 1)} aria-label={`Move ${r.name} down`}><ArrowDown size={15} /></button>
                  <Toggle checked={r.active} onChange={(active) => saveRitual({ id: r.id, active })} label={`${r.name} visible`} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900">Homepage pandit row</h3>
          <p className="text-xs text-slate-500 mb-3">Choose which listings appear in the horizontal row and in what order.</p>
          {homeRow.length === 0 ? (
            <EmptyState icon={LayoutTemplate} title="No pandit cards on the homepage" />
          ) : (
            <ul className="space-y-1.5" data-testid="home-service-order">
              {homeRow.map(({ service, pandit, ritual }, i) => {
                const hidden = !service.active || !pandit.active || !ritual.active;
                return (
                  <li key={service.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-1.5" data-testid={`home-row-${service.id}`}>
                    <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                    <img src={panditImage(pandit)} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{pandit.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{ritual.name} · {formatINR(service.price)} {hidden && <Pill tone="amber">Hidden – disabled</Pill>}</p>
                    </div>
                    <button type="button" className={iconBtn} disabled={i === 0} onClick={() => moveHomeService(service.id, -1)} aria-label={`Move ${pandit.name} – ${ritual.name} up`}><ArrowUp size={15} /></button>
                    <button type="button" className={iconBtn} disabled={i === homeRow.length - 1} onClick={() => moveHomeService(service.id, 1)} aria-label={`Move ${pandit.name} – ${ritual.name} down`}><ArrowDown size={15} /></button>
                    <button type="button" className={`${iconBtn} text-rose-500`} onClick={() => updateService(service.id, { showOnHome: false })} aria-label={`Remove ${pandit.name} – ${ritual.name} from homepage`}><X size={15} /></button>
                  </li>
                );
              })}
            </ul>
          )}
          {candidates.length > 0 && (
            <div className="flex gap-2 mt-3">
              <select className={inputCls} value={toAdd} onChange={(e) => setToAdd(e.target.value)} aria-label="Listing to add to homepage">
                <option value="">Add a listing to the homepage row…</option>
                {candidates.map(({ service, pandit, ritual }) => (
                  <option key={service.id} value={service.id}>{pandit.name} — {ritual.name} ({formatINR(service.price)})</option>
                ))}
              </select>
              <button type="button" className={btnPrimary} disabled={!toAdd} onClick={() => { updateService(toAdd, { showOnHome: true }); setToAdd(''); toast.success('Added to homepage row'); }}>
                <Plus size={15} /> Add
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="xl:sticky xl:top-4">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Live preview (Mithilak homepage)</p>
        <div className="rounded-2xl border border-slate-200 bg-[#F5F9FA] p-3 max-w-[480px] pointer-events-none" aria-hidden="true" data-testid="home-preview" style={{ '--ml-primary': '#207C8A' }}>
          {catalog.settings.sectionVisible
            ? <PurohitSection />
            : <p className="text-sm font-semibold text-slate-400 text-center py-10">Section is hidden on the homepage</p>}
        </div>
      </div>
    </div>
  );
};

export default HomepagePanel;
