import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, Save, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi, productsApi, sellersApi } from '../services/api';
import { extractList } from '../utils/mappers';
import { uploadProductMedia } from '../../../shared/services/uploadService';
import { getImageUrl } from '../../../shared/utils/imageUtils';

// Tab → legacy commerce flow the API stores on the product.
const TABS = [
  { tab: 'mithilakart', flow: 'standard', label: 'Mithilakart', quick: false },
  { tab: 'mithilak', flow: 'mithilak', label: 'Mithilak', quick: false },
  { tab: 'quick_shop', flow: 'quick_shop', label: 'Quick Shop', quick: true },
  { tab: 'groceries_fresh', flow: 'fresh_grocery', label: 'Groceries & Fresh', quick: true },
];
const PROMISES = [15, 20, 25, 30];

const EMPTY = {
  sellerId: '', title: '', sku: '', brand: '', description: '', categoryId: '',
  tabs: [], deliveryPromiseMinutes: 30, price: '', mrp: '', stock: '', tags: '',
  weightKg: '', length: '', width: '', height: '',
};

const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white';
const labelCls = 'text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5';

const skuFrom = (title) => `${String(title).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'SKU'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

/**
 * Admin "Add Product". Creates a real product for a chosen seller; it appears
 * in the category straight away when the seller is approved and enabled for
 * the selected tabs (the API explains what to fix otherwise).
 */
const AddProduct = () => {
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sellersRes, categoriesRes] = await Promise.all([
        sellersApi.getAll({ kycStatus: 'approved', status: 'active', limit: 100 }),
        categoriesApi.getAll(),
      ]);
      if (cancelled) return;
      if (sellersRes.error) toast.error(`Could not load sellers: ${sellersRes.error}`);
      if (categoriesRes.error) toast.error(`Could not load categories: ${categoriesRes.error}`);
      setSellers(extractList(sellersRes.data));
      setCategories(extractList(categoriesRes.data).filter((c) => c.isActive !== false));
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // "Parent › Child" labels so similarly named categories can be told apart.
  const categoryOptions = useMemo(() => {
    const byId = new Map(categories.map((c) => [String(c._id || c.id), c]));
    const pathOf = (c, depth = 0) => {
      const pid = c.parentIds?.[0] || c.parentId;
      const parent = pid ? byId.get(String(pid?._id || pid)) : null;
      return parent && depth < 4 ? `${pathOf(parent, depth + 1)} › ${c.name}` : c.name;
    };
    return categories.map((c) => ({ id: String(c._id || c.id), label: pathOf(c), tabs: c.visibleTabs || [] }));
  }, [categories]);

  const selectedCategory = categoryOptions.find((c) => c.id === form.categoryId) || null;
  const matches = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return [];
    return categoryOptions.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 30);
  }, [categoryOptions, categorySearch]);

  const chooseCategory = (option) => {
    // Start with the tabs the category is shown in.
    set({ categoryId: option.id, tabs: TABS.filter((t) => option.tabs.includes(t.tab)).map((t) => t.tab) });
    setCategorySearch('');
  };

  const toggleTab = (tab) => set({ tabs: form.tabs.includes(tab) ? form.tabs.filter((t) => t !== tab) : [...form.tabs, tab] });
  const anyQuick = TABS.some((t) => t.quick && form.tabs.includes(t.tab));

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadProductMedia(file);
        setImages((prev) => [...prev, url]);
      }
    } catch (err) {
      toast.error(err?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!form.sellerId) return 'Choose the seller';
    if (form.title.trim().length < 2) return 'Enter the product name';
    if (!form.categoryId) return 'Choose a category';
    if (!form.tabs.length) return 'Choose at least one tab to show the product in';
    const price = Number(form.price);
    const mrp = Number(form.mrp || form.price);
    if (!(price > 0)) return 'Enter a selling price';
    if (mrp < price) return 'MRP cannot be lower than the selling price';
    if (form.stock === '' || Number(form.stock) < 0) return 'Enter the stock quantity';
    if (!images.length) return 'Add at least one product image';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) { toast.error(problem); return; }
    setSaving(true);
    const dims = [form.length, form.width, form.height].map(Number);
    const attributes = {};
    if (Number(form.weightKg) > 0) attributes.weight = Number(form.weightKg);
    if (dims.every((d) => d > 0)) attributes.dimensions = { length: dims[0], width: dims[1], height: dims[2] };
    const payload = {
      sellerId: form.sellerId,
      title: form.title.trim(),
      sku: form.sku.trim() || skuFrom(form.title),
      brand: form.brand.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      commerceFlows: TABS.filter((t) => form.tabs.includes(t.tab)).map((t) => t.flow),
      price: Number(form.price),
      mrp: Number(form.mrp || form.price),
      stock: Number(form.stock),
      images: images.map((url, i) => ({ url, alt: form.title.trim(), sortOrder: i })),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      attributes,
      ...(anyQuick ? { deliveryPromiseMinutes: Number(form.deliveryPromiseMinutes) } : {}),
    };
    const { data, error } = await productsApi.create(payload);
    setSaving(false);
    if (error) { toast.error(error); return; }
    setCreated({ id: data?._id || data?.id, title: payload.title, status: data?.status, category: selectedCategory?.label });
    toast.success('Product saved');
    setForm({ ...EMPTY, sellerId: form.sellerId });
    setImages([]);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Add Product</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Creates the product for a seller. It shows in its category as soon as it is saved.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-500 text-white shadow-lg shadow-blue-100 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Publish to Catalog'}
        </button>
      </div>

      {created && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <span className="flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>
              <strong>{created.title}</strong> saved in <strong>{created.category}</strong>
              {created.status === 'approved' ? ' and is live for customers.' : ` with status "${created.status}".`}
              {created.id && <> <a className="font-bold underline" href={`/vendor/product-detail/${created.id}`} target="_blank" rel="noopener noreferrer">View in app</a></>}
            </span>
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setCreated(null)} className="p-1 text-emerald-700"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className={labelCls} htmlFor="ap-seller">Seller *</label>
              <select id="ap-seller" className={input} value={form.sellerId} onChange={(e) => set({ sellerId: e.target.value })}>
                <option value="">Select seller</option>
                {sellers.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.storeName || s.name} — {s.city || ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-title">Product name *</label>
              <input id="ap-title" className={input} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Raw Pumpkin (1 kg)" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="ap-sku">SKU</label>
                <input id="ap-sku" className={input} value={form.sku} onChange={(e) => set({ sku: e.target.value })} placeholder="Auto-generated if empty" />
              </div>
              <div>
                <label className={labelCls} htmlFor="ap-brand">Brand</label>
                <input id="ap-brand" className={input} value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-desc">Description</label>
              <textarea id="ap-desc" rows={4} className={input} value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className={labelCls} htmlFor="ap-cat">Category *</label>
              {selectedCategory ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">
                  <span>{selectedCategory.label}</span>
                  <button type="button" onClick={() => set({ categoryId: '', tabs: [] })} className="text-xs font-black text-blue-600">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="ap-cat" className={`${input} pl-9`} value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Type to search, e.g. Kadima" />
                  {matches.length > 0 && (
                    <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {matches.map((m) => (
                        <li key={m.id}>
                          <button type="button" onClick={() => chooseCategory(m)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">{m.label}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div>
              <span className={labelCls}>Show in tabs *</span>
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <label key={t.tab} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold cursor-pointer ${form.tabs.includes(t.tab) ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" checked={form.tabs.includes(t.tab)} onChange={() => toggleTab(t.tab)} />
                    {t.label}
                  </label>
                ))}
              </div>
              {selectedCategory && <p className="mt-1.5 text-xs text-slate-500">This category is shown in: {selectedCategory.tabs.map((tab) => TABS.find((t) => t.tab === tab)?.label || tab).join(', ') || 'no tab'}.</p>}
            </div>
            {anyQuick && (
              <div className="max-w-xs">
                <label className={labelCls} htmlFor="ap-promise">Quick delivery promise</label>
                <select id="ap-promise" className={input} value={form.deliveryPromiseMinutes} onChange={(e) => set({ deliveryPromiseMinutes: e.target.value })}>
                  {PROMISES.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls} htmlFor="ap-price">Selling price (₹) *</label>
              <input id="ap-price" type="number" min="0" className={input} value={form.price} onChange={(e) => set({ price: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-mrp">MRP (₹)</label>
              <input id="ap-mrp" type="number" min="0" className={input} value={form.mrp} onChange={(e) => set({ mrp: e.target.value })} placeholder="Same as price" />
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-stock">Stock *</label>
              <input id="ap-stock" type="number" min="0" className={input} value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[['weightKg', 'Weight (kg)'], ['length', 'Length (cm)'], ['width', 'Width (cm)'], ['height', 'Height (cm)']].map(([key, label]) => (
              <div key={key}>
                <label className={labelCls} htmlFor={`ap-${key}`}>{label}</label>
                <input id={`ap-${key}`} type="number" min="0" className={input} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} />
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
            <span className={labelCls}>Images *</span>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <img src={getImageUrl(url)} alt={`Product ${i + 1}`} className="h-full w-full object-contain" />
                  <button type="button" aria-label="Remove image" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-1 text-red-500 shadow"><Trash2 size={12} /></button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-[11px] font-bold text-slate-500 hover:border-blue-300">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                {uploading ? 'Uploading' : 'Add'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ''; }} />
              </label>
            </div>
          </section>
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <label className={labelCls} htmlFor="ap-tags">Tags (comma separated)</label>
            <input id="ap-tags" className={input} value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="organic, seasonal" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
