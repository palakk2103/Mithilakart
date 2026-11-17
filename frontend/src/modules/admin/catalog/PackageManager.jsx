import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Save, Pencil, X, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApiClient } from '../../../shared/api/client';
import { productsApi } from '../services/api';

const TABS = [
  { value: 'mithilak', label: 'Mithilak' },
  { value: 'mithilakart', label: 'Mithilakart' },
  { value: 'quick_shop', label: 'Quick Shop' },
  { value: 'groceries_fresh', label: 'Fresh & Groceries' },
];

const emptyForm = () => ({
  id: null,
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  productId: '',
  productTitle: '',
  marketplaceTab: 'mithilak',
  fullPrice: '',
  minPriceAmount: '',
  minPricePercent: '',
  isActive: true,
  items: [],
});

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-semibold outline-none focus:border-blue-500';
const labelCls = 'text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1';

/**
 * Admin: customisable packages (e.g. Mithila Dwirangman — ₹3500, 24 items).
 * Everything a customer sees — items, item shares, full price, minimum value — is edited here.
 * The package is sold through a normal product (stock, seller, orders), picked below.
 */
const PackageManager = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [bulkText, setBulkText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApiClient.get('/packages');
      setPackages(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      toast.error(err?.message || 'Could not load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form || productQuery.trim().length < 2) { setProductResults([]); return undefined; }
    const timer = setTimeout(async () => {
      const { data } = await productsApi.getAll({ search: productQuery.trim(), limit: 8 });
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setProductResults(list);
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery, form]);

  const edit = (pkg) => setForm({
    ...emptyForm(),
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description || '',
    imageUrl: pkg.imageUrl || '',
    productId: pkg.productId,
    productTitle: '',
    marketplaceTab: pkg.marketplaceTab || 'mithilak',
    fullPrice: pkg.fullPrice,
    minPriceAmount: pkg.minPriceAmount ?? '',
    minPricePercent: pkg.minPricePercent ?? '',
    isActive: pkg.isActive !== false,
    items: pkg.items.map((it) => ({ ...it })),
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setItem = (i, patch) => setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));

  // "Name | price" per line — the quickest way to enter 24 items.
  const addBulk = () => {
    const rows = bulkText.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [name, price] = line.split('|').map((x) => x.trim());
      return { name, price: price === undefined || price === '' ? 0 : Number(price) || 0, description: '', imageUrl: '', isMandatory: false };
    });
    if (!rows.length) return;
    setForm((f) => ({ ...f, items: [...f.items, ...rows] }));
    setBulkText('');
  };

  const itemSum = form ? form.items.reduce((s, it) => s + (Number(it.price) || 0), 0) : 0;

  const save = async () => {
    if (!form.name.trim()) return toast.error('Give the package a name');
    if (!form.productId) return toast.error('Pick the product this package is sold as');
    if (!(Number(form.fullPrice) >= 0) || form.fullPrice === '') return toast.error('Enter the full package price');
    if (!form.items.length || form.items.some((it) => !String(it.name || '').trim())) return toast.error('Every item needs a name');

    const body = {
      name: form.name.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      productId: form.productId,
      marketplaceTab: form.marketplaceTab,
      fullPrice: Number(form.fullPrice),
      minPriceAmount: numOrNull(form.minPriceAmount),
      minPricePercent: numOrNull(form.minPricePercent),
      isActive: form.isActive,
      items: form.items.map((it, i) => ({
        ...(it.id ? { id: it.id } : {}),
        name: String(it.name).trim(),
        description: it.description || '',
        imageUrl: it.imageUrl || '',
        price: Number(it.price) || 0,
        isMandatory: Boolean(it.isMandatory),
        sortOrder: i,
      })),
    };

    setSaving(true);
    try {
      if (form.id) await adminApiClient.put(`/packages/${form.id}`, body);
      else await adminApiClient.post('/packages', body);
      toast.success('Package saved');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not save the package');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pkg) => {
    if (!window.confirm(`Delete "${pkg.name}"? Customers will no longer see it.`)) return;
    try {
      await adminApiClient.delete(`/packages/${pkg.id}`);
      toast.success('Package deleted');
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not delete');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6" data-testid="package-manager">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customisable Packages</h1>
          <p className="text-sm text-slate-500 mt-1">Packages customers can tick / untick item by item. Price and minimum value are enforced on the server.</p>
        </div>
        {!form && (
          <button type="button" onClick={() => setForm(emptyForm())} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
            <Plus size={16} /> New package
          </button>
        )}
      </div>

      {!form && (loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl text-slate-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold">No packages yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {packages.map((pkg) => (
            <li key={pkg.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{pkg.name} {pkg.isActive === false && <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">Hidden</span>}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ₹{pkg.fullPrice} · {pkg.items.length} items · minimum ₹{pkg.minPrice} · /package/{pkg.slug}
                </p>
              </div>
              <button type="button" aria-label={`Edit ${pkg.name}`} onClick={() => edit(pkg)} className="p-2.5 rounded-lg text-blue-600 hover:bg-blue-50"><Pencil size={17} /></button>
              <button type="button" aria-label={`Delete ${pkg.name}`} onClick={() => remove(pkg)} className="p-2.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={17} /></button>
            </li>
          ))}
        </ul>
      ))}

      {form && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{form.id ? 'Edit package' : 'New package'}</h2>
            <button type="button" aria-label="Close" onClick={() => setForm(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={labelCls}>Package name</label><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Mithila Dwirangman" /></div>
            <div><label className={labelCls}>URL slug (optional)</label><input className={inputCls} value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="mithila-dwirangman" /></div>
            <div className="md:col-span-2"><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Cover image URL</label><input className={inputCls} value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://… or /uploads/…" /></div>

            <div className="md:col-span-2">
              <label className={labelCls}>Sold as product</label>
              {form.productId ? (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <span className="flex-1 text-sm font-semibold truncate">{form.productTitle || `Product ${form.productId}`}</span>
                  <button type="button" onClick={() => set({ productId: '', productTitle: '' })} className="text-xs font-bold text-rose-500">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3.5 text-slate-400" />
                  <input className={`${inputCls} pl-9`} value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search the product that carries this package's stock & price…" />
                  {productResults.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                      {productResults.map((p) => (
                        <li key={p.id || p._id}>
                          <button type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50" onClick={() => { set({ productId: p.id || p._id, productTitle: p.title || p.name }); setProductQuery(''); setProductResults([]); }}>
                            {p.title || p.name} <span className="text-slate-400">· ₹{p.price}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Create the product first (approved, in stock, listed on the tab below). The customer pays the customised price, not the product&apos;s own price.</p>
            </div>

            <div>
              <label className={labelCls}>Shown on tab</label>
              <select className={inputCls} value={form.marketplaceTab} onChange={(e) => set({ marketplaceTab: e.target.value })}>
                {TABS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Full price — all items (₹)</label><input type="number" min="0" className={inputCls} value={form.fullPrice} onChange={(e) => set({ fullPrice: e.target.value })} placeholder="3500" /></div>
            <div><label className={labelCls}>Minimum package value (₹) — optional</label><input type="number" min="0" className={inputCls} value={form.minPriceAmount} onChange={(e) => set({ minPriceAmount: e.target.value })} placeholder="e.g. 1200 – 1500" /></div>
            <div><label className={labelCls}>…or minimum as % of full price</label><input type="number" min="0" max="100" className={inputCls} value={form.minPricePercent} onChange={(e) => set({ minPricePercent: e.target.value })} placeholder="blank = platform default (40%)" /></div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="w-4 h-4" /> Visible to customers
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Items ({form.items.length})</h3>
              <p className={`text-xs font-semibold ${Math.round(itemSum) === Math.round(Number(form.fullPrice) || 0) ? 'text-emerald-600' : 'text-amber-600'}`}>
                Item shares total ₹{itemSum}{Math.round(itemSum) !== Math.round(Number(form.fullPrice) || 0) && itemSum > 0 ? ' — differs from full price, prices will be scaled proportionally' : ''}
              </p>
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={it.id || `new-${i}`} className="grid grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <input aria-label={`Item ${i + 1} name`} className={`${inputCls} col-span-12 sm:col-span-4 bg-white`} value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Item name" />
                  <input aria-label={`Item ${i + 1} price`} type="number" min="0" className={`${inputCls} col-span-5 sm:col-span-2 bg-white`} value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} placeholder="₹ share" />
                  <input aria-label={`Item ${i + 1} image URL`} className={`${inputCls} col-span-7 sm:col-span-3 bg-white`} value={it.imageUrl || ''} onChange={(e) => setItem(i, { imageUrl: e.target.value })} placeholder="Image URL" />
                  <label className="col-span-8 sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input type="checkbox" checked={Boolean(it.isMandatory)} onChange={(e) => setItem(i, { isMandatory: e.target.checked })} /> Always included
                  </label>
                  <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => set({ items: form.items.filter((_, j) => j !== i) })} className="col-span-4 sm:col-span-1 justify-self-end p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
              <textarea className={inputCls} rows={3} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'Add many at once — one per line:\nItem name | price share\nAnother item | 150'} />
              <div className="flex md:flex-col gap-2">
                <button type="button" onClick={addBulk} className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">Add lines</button>
                <button type="button" onClick={() => set({ items: [...form.items, { name: '', price: 0, imageUrl: '', isMandatory: false }] })} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider">+ One item</button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">
              <Save size={15} /> {saving ? 'Saving…' : 'Save package'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManager;
