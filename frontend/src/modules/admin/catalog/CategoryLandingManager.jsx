import { useState, useEffect, useCallback, useMemo } from 'react';
import { categoriesApi, bannersApi, categoryLandingApi, productsApi } from '../services/api';
import { extractList } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, Loader2, Upload, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const idOf = (o) => String(o?._id || o?.id || '');
const toLocalInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const SECTION_TYPES = [
  { id: 'manual', label: 'Hand-picked products' },
  { id: 'best_sellers', label: 'Best sellers (auto)' },
  { id: 'new_arrivals', label: 'New arrivals (auto)' },
  { id: 'top_deals', label: 'Top discounted (auto)' },
  { id: 'category_products', label: 'All category products (auto)' },
];

const EMPTY_BANNER = {
  title: '', subtitle: '', ctaText: '', linkUrl: '', imageUrl: '', mobileImageUrl: '',
  sortOrder: 0, isActive: true, startDate: '', endDate: '',
};
const EMPTY_SECTION = {
  title: '', subtitle: '', sectionType: 'manual', productLimit: 8, productIds: [],
  imageUrl: '', ctaText: '', ctaLink: '', isActive: true, startDate: '', endDate: '',
};

const inputCls = 'w-full border rounded-xl px-4 py-2.5 text-sm font-bold outline-none';
const labelCls = 'text-[10px] font-black uppercase tracking-widest text-slate-400';

const ImageField = ({ label, value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadCmsImage(file));
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-1">
      <span className={labelCls}>{label}</span>
      <div className="flex gap-2">
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className={`${inputCls} flex-1`} />
        <label className="flex items-center px-4 bg-slate-100 rounded-xl cursor-pointer">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
        </label>
      </div>
      {value && <img src={value} alt="" className="h-20 w-full object-cover rounded-xl" />}
    </div>
  );
};

const ScheduleFields = ({ form, setForm }) => (
  <div className="grid grid-cols-2 gap-3">
    <label className="space-y-1">
      <span className={labelCls}>Starts (optional)</span>
      <input type="datetime-local" value={toLocalInput(form.startDate)} onChange={(e) => setForm((p) => ({ ...p, startDate: fromLocalInput(e.target.value) }))} className={inputCls} />
    </label>
    <label className="space-y-1">
      <span className={labelCls}>Ends (optional)</span>
      <input type="datetime-local" value={toLocalInput(form.endDate)} onChange={(e) => setForm((p) => ({ ...p, endDate: fromLocalInput(e.target.value) }))} className={inputCls} />
    </label>
  </div>
);

const CategoryLandingManager = () => {
  const [tab, setTab] = useState('mithilakart');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(false);

  const [bannerModal, setBannerModal] = useState(false);
  const [bannerEditing, setBannerEditing] = useState(null);
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER);

  const [sectionModal, setSectionModal] = useState(false);
  const [sectionEditing, setSectionEditing] = useState(null);
  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [pickedProducts, setPickedProducts] = useState({});

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind, item }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The public tree already applies tab visibility + active rules, so the
      // admin sees exactly the main categories customers see in that tab.
      const { data, error } = await categoriesApi.publicTree(tab);
      if (cancelled) return;
      if (error) return toast.error(error);
      const mains = extractList(data);
      setCategories(mains);
      setCategoryId(mains.length ? idOf(mains[0]) : '');
      if (!mains.length) setLanding(null);
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await categoryLandingApi.get(id);
    if (error) {
      toast.error(error);
      setLanding(null);
    } else {
      setLanding(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(categoryId); }, [categoryId, load]);

  // ── Layout order ─────────────────────────────────────────────
  const orderedBlocks = useMemo(() => {
    if (!landing) return [];
    const labels = { banner: 'Banner slider', subcategories: 'Subcategory slider' };
    (landing.sections || []).forEach((s) => { labels[`section:${idOf(s)}`] = `Section: ${s.title}`; });
    const natural = ['banner', 'subcategories', ...(landing.sections || []).map((s) => `section:${idOf(s)}`)];
    const seen = new Set();
    return [...(landing.blockOrder || []), ...natural]
      .filter((k) => labels[k] && !seen.has(k) && seen.add(k))
      .map((key) => ({ key, label: labels[key] }));
  }, [landing]);

  const saveOrder = async (keys) => {
    const { error } = await categoryLandingApi.updateConfig(categoryId, { blockOrder: keys });
    if (error) return toast.error(error);
    toast.success('Layout order saved');
    load(categoryId);
  };

  const moveBlock = (index, delta) => {
    const keys = orderedBlocks.map((b) => b.key);
    const target = index + delta;
    if (target < 0 || target >= keys.length) return;
    [keys[index], keys[target]] = [keys[target], keys[index]];
    saveOrder(keys);
  };

  const toggleEnabled = async () => {
    const { error } = await categoryLandingApi.updateConfig(categoryId, { enabled: !landing.enabled });
    if (error) return toast.error(error);
    toast.success(landing.enabled ? 'Landing page disabled' : 'Landing page enabled');
    load(categoryId);
  };

  // ── Banners ──────────────────────────────────────────────────
  const openBanner = (banner = null) => {
    setBannerEditing(banner);
    setBannerForm(banner ? {
      title: banner.title || '', subtitle: banner.subtitle || '', ctaText: banner.ctaText || '',
      linkUrl: banner.linkUrl || '', imageUrl: banner.imageUrl || '', mobileImageUrl: banner.mobileImageUrl || '',
      sortOrder: banner.sortOrder ?? 0, isActive: banner.isActive !== false,
      startDate: banner.startDate || '', endDate: banner.endDate || '',
    } : { ...EMPTY_BANNER, sortOrder: landing?.banners?.length || 0 });
    setBannerModal(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) return toast.error('Title and image are required');
    setSaving(true);
    const payload = {
      ...bannerForm,
      categoryId,
      sortOrder: Number(bannerForm.sortOrder) || 0,
      linkUrl: bannerForm.linkUrl || null,
      mobileImageUrl: bannerForm.mobileImageUrl || null,
      startDate: bannerForm.startDate || null,
      endDate: bannerForm.endDate || null,
    };
    const result = bannerEditing
      ? await bannersApi.update(idOf(bannerEditing), payload)
      : await bannersApi.create(payload);
    setSaving(false);
    if (result.error) return toast.error(result.error);
    toast.success(bannerEditing ? 'Banner updated' : 'Banner added');
    setBannerModal(false);
    load(categoryId);
  };

  const toggleBanner = async (banner) => {
    const { error } = await bannersApi.update(idOf(banner), { isActive: banner.isActive === false });
    if (error) toast.error(error); else load(categoryId);
  };

  // ── Sections ─────────────────────────────────────────────────
  const openSection = async (section = null) => {
    setSectionEditing(section);
    setProductSearch('');
    setProductResults([]);
    setPickedProducts({});
    setSectionForm(section ? {
      title: section.title || '', subtitle: section.subtitle || '', sectionType: section.sectionType || 'manual',
      productLimit: section.productLimit || 8, productIds: (section.productIds || []).map(String),
      imageUrl: section.imageUrl || '', ctaText: section.ctaText || '', ctaLink: section.ctaLink || '',
      isActive: section.isActive !== false, startDate: section.startDate || '', endDate: section.endDate || '',
    } : EMPTY_SECTION);
    setSectionModal(true);
    if (section?.productIds?.length) {
      const entries = await Promise.all(section.productIds.map(async (pid) => {
        const { data } = await productsApi.getById(String(pid));
        return [String(pid), data];
      }));
      setPickedProducts(Object.fromEntries(entries.filter(([, d]) => d)));
    }
  };

  useEffect(() => {
    if (!sectionModal || sectionForm.sectionType !== 'manual' || productSearch.trim().length < 2) {
      setProductResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      // Admin product search matches a category exactly, so search broadly and keep
      // only products inside this main category's tree (the server enforces it too).
      const subtree = new Set();
      const walk = (n) => { subtree.add(idOf(n)); (n.children || []).forEach(walk); };
      const root = categories.find((c) => idOf(c) === categoryId);
      if (root) walk(root);
      const { data } = await productsApi.getAll({ search: productSearch.trim(), limit: 40, status: 'approved' });
      setProductResults(extractList(data).filter((p) => (
        [p.categoryId, ...(p.categoryIds || [])].some((c) => subtree.has(String(c?._id || c)))
      )).slice(0, 12));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, sectionModal, sectionForm.sectionType, categoryId, categories]);

  const addProduct = (p) => {
    const pid = idOf(p);
    setPickedProducts((m) => ({ ...m, [pid]: p }));
    setSectionForm((f) => (f.productIds.includes(pid) ? f : { ...f, productIds: [...f.productIds, pid] }));
  };
  const removeProduct = (pid) => setSectionForm((f) => ({ ...f, productIds: f.productIds.filter((x) => x !== pid) }));

  const saveSection = async () => {
    if (sectionForm.title.trim().length < 2) return toast.error('Section title is required');
    if (sectionForm.sectionType === 'manual' && sectionForm.productIds.length === 0) {
      return toast.error('Pick at least one product for a hand-picked section');
    }
    setSaving(true);
    const payload = {
      ...sectionForm,
      productLimit: Math.min(24, Math.max(1, Number(sectionForm.productLimit) || 8)),
      productIds: sectionForm.sectionType === 'manual' ? sectionForm.productIds : [],
      imageUrl: sectionForm.imageUrl || null,
      ctaLink: sectionForm.ctaLink || null,
      startDate: sectionForm.startDate || null,
      endDate: sectionForm.endDate || null,
    };
    const result = sectionEditing
      ? await categoryLandingApi.updateSection(idOf(sectionEditing), payload)
      : await categoryLandingApi.createSection(categoryId, payload);
    setSaving(false);
    if (result.error) return toast.error(result.error);
    toast.success(sectionEditing ? 'Section updated' : 'Section created');
    setSectionModal(false);
    load(categoryId);
  };

  const toggleSection = async (section) => {
    const { error } = await categoryLandingApi.updateSection(idOf(section), { isActive: section.isActive === false });
    if (error) toast.error(error); else load(categoryId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, item } = deleteTarget;
    const { error } = kind === 'banner'
      ? await bannersApi.delete(idOf(item))
      : await categoryLandingApi.deleteSection(idOf(item));
    if (error) return toast.error(error);
    toast.success(kind === 'banner' ? 'Banner deleted' : 'Section deleted');
    setDeleteTarget(null);
    load(categoryId);
  };

  const selectedCategory = categories.find((c) => idOf(c) === categoryId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Category Landing Pages</h1>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          MithilaKart main categories — banners, sections and layout order. Live after save.
        </p>
      </div>

      <div className="flex gap-2" data-testid="landing-tab-switch">
        {[['mithilakart', 'MithilaKart tab'], ['mithilak', 'Mithilak tab']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
              tab === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap" data-testid="landing-category-tabs">
        {categories.map((c) => (
          <button
            key={idOf(c)}
            onClick={() => setCategoryId(idOf(c))}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              categoryId === idOf(c) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
        {categories.length === 0 && <span className="text-sm text-slate-400 font-bold">No main categories yet — create one in Categories first.</span>}
      </div>

      {loading && <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>}

      {!loading && landing && (
        <>
          <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4">
            <div>
              <p className="font-black text-slate-900">{selectedCategory?.name} landing page</p>
              <p className="text-[11px] text-slate-400 font-bold">
                {landing.enabled ? 'Customers see this configured page.' : 'Disabled — customers see the normal product listing.'}
              </p>
            </div>
            <button onClick={toggleEnabled} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${landing.enabled ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
              {landing.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Layout order */}
          <section className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            <h2 className="font-black text-sm uppercase tracking-widest text-slate-700">Layout order (top → bottom)</h2>
            {orderedBlocks.map((b, i) => (
              <div key={b.key} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                <span className="text-xs font-black text-slate-400 w-5">{i + 1}</span>
                <span className="flex-1 text-sm font-bold text-slate-800">{b.label}</span>
                <button aria-label="Move up" disabled={i === 0} onClick={() => moveBlock(i, -1)} className="p-1.5 rounded-lg bg-white border disabled:opacity-30"><ArrowUp size={14} /></button>
                <button aria-label="Move down" disabled={i === orderedBlocks.length - 1} onClick={() => moveBlock(i, 1)} className="p-1.5 rounded-lg bg-white border disabled:opacity-30"><ArrowDown size={14} /></button>
              </div>
            ))}
          </section>

          {/* Banners */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-700">Banners ({landing.banners.length})</h2>
              <button onClick={() => openBanner()} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"><Plus size={14} /> Add Banner</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {landing.banners.map((banner) => (
                <div key={idOf(banner)} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative h-28 bg-slate-100">
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    <button onClick={() => toggleBanner(banner)} aria-label="Toggle banner" className={`absolute top-2 right-2 p-1.5 rounded-lg ${banner.isActive !== false ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {banner.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-black text-sm text-slate-900">{banner.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => openBanner(banner)} className="flex-1 py-2 bg-slate-50 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => setDeleteTarget({ kind: 'banner', item: banner })} aria-label="Delete banner" className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {landing.banners.length === 0 && <div className="col-span-full py-8 text-center text-slate-400 text-sm font-bold">No banners — the page simply skips the banner area.</div>}
            </div>
          </section>

          {/* Sections */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-700">Promotional sections ({landing.sections.length})</h2>
              <button onClick={() => openSection()} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"><Plus size={14} /> Add Section</button>
            </div>
            <div className="space-y-2">
              {landing.sections.map((section) => (
                <div key={idOf(section)} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate">{section.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {SECTION_TYPES.find((t) => t.id === section.sectionType)?.label}
                      {section.sectionType === 'manual' ? ` · ${section.productIds?.length || 0} products` : ` · up to ${section.productLimit}`}
                    </p>
                  </div>
                  <button onClick={() => toggleSection(section)} aria-label="Toggle section" className={`p-2 rounded-lg ${section.isActive !== false ? 'bg-green-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {section.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openSection(section)} aria-label="Edit section" className="p-2 bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget({ kind: 'section', item: section })} aria-label="Delete section" className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
              {landing.sections.length === 0 && <div className="py-8 text-center text-slate-400 text-sm font-bold">No sections yet.</div>}
            </div>
          </section>

          <p className="text-[11px] text-slate-400 font-bold">
            Subcategories come from Categories (children of {selectedCategory?.name}) — manage them, their images, order and status there.
          </p>
        </>
      )}

      {/* Banner modal */}
      <Modal isOpen={bannerModal} onClose={() => setBannerModal(false)} title={bannerEditing ? 'Edit Banner' : 'Add Banner'} size="lg">
        <div className="space-y-3">
          <input value={bannerForm.title} onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className={inputCls} />
          <input value={bannerForm.subtitle} onChange={(e) => setBannerForm((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle (optional)" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input value={bannerForm.ctaText} onChange={(e) => setBannerForm((p) => ({ ...p, ctaText: e.target.value }))} placeholder="Button text (optional)" className={inputCls} />
            <input value={bannerForm.linkUrl} onChange={(e) => setBannerForm((p) => ({ ...p, linkUrl: e.target.value }))} placeholder="Link e.g. /vendor/product-detail/…" className={inputCls} />
          </div>
          <ImageField label="Desktop / default image" value={bannerForm.imageUrl} onChange={(v) => setBannerForm((p) => ({ ...p, imageUrl: v }))} />
          <ImageField label="Mobile image (optional)" value={bannerForm.mobileImageUrl} onChange={(v) => setBannerForm((p) => ({ ...p, mobileImageUrl: v }))} />
          <ScheduleFields form={bannerForm} setForm={setBannerForm} />
          <input type="number" value={bannerForm.sortOrder} onChange={(e) => setBannerForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort order" className={inputCls} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={bannerForm.isActive} onChange={(e) => setBannerForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
          <button onClick={saveBanner} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Banner
          </button>
        </div>
      </Modal>

      {/* Section modal */}
      <Modal isOpen={sectionModal} onClose={() => setSectionModal(false)} title={sectionEditing ? 'Edit Section' : 'Add Section'} size="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <input value={sectionForm.title} onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))} placeholder="Section title e.g. Trending in Fashion" className={inputCls} />
          <input value={sectionForm.subtitle} onChange={(e) => setSectionForm((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle (optional)" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={sectionForm.sectionType} onChange={(e) => setSectionForm((p) => ({ ...p, sectionType: e.target.value }))} className={inputCls}>
              {SECTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input type="number" min={1} max={24} value={sectionForm.productLimit} onChange={(e) => setSectionForm((p) => ({ ...p, productLimit: e.target.value }))} placeholder="Number of products" className={inputCls} />
          </div>

          {sectionForm.sectionType === 'manual' && (
            <div className="space-y-2">
              <span className={labelCls}>Products (only items from this category)</span>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products to add…" className={`${inputCls} pl-9`} />
              </div>
              {productResults.length > 0 && (
                <div className="border rounded-xl divide-y max-h-40 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={idOf(p)} onClick={() => addProduct(p)} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-slate-50 flex justify-between">
                      <span className="truncate">{p.title || p.name}</span><Plus size={14} />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {sectionForm.productIds.map((pid) => (
                  <span key={pid} className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold">
                    {pickedProducts[pid]?.title || pickedProducts[pid]?.name || pid.slice(-6)}
                    <button onClick={() => removeProduct(pid)} aria-label="Remove product"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <ImageField label="Promotional image (optional)" value={sectionForm.imageUrl} onChange={(v) => setSectionForm((p) => ({ ...p, imageUrl: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <input value={sectionForm.ctaText} onChange={(e) => setSectionForm((p) => ({ ...p, ctaText: e.target.value }))} placeholder="CTA text e.g. See all" className={inputCls} />
            <input value={sectionForm.ctaLink} onChange={(e) => setSectionForm((p) => ({ ...p, ctaLink: e.target.value }))} placeholder="CTA link (optional)" className={inputCls} />
          </div>
          <ScheduleFields form={sectionForm} setForm={setSectionForm} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={sectionForm.isActive} onChange={(e) => setSectionForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
          <button onClick={saveSection} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Section
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="delete"
        message={deleteTarget?.kind === 'banner' ? 'Delete this banner?' : 'Delete this section?'}
      />
    </div>
  );
};

export default CategoryLandingManager;
