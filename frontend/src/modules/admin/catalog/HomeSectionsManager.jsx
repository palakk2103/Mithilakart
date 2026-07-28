import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { sectionsApi, productsApi } from '../services/api';
import { extractList } from '../utils/mappers';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SECTION_TITLES = {
  'still-looking': 'Still Looking For These?',
  'top-selection': 'Top Selection',
  'spotlight': 'Brands in Spotlight',
  'best-quality': 'Best Quality',
  'keep-shopping': 'Keep Shopping',
};

const COMMERCE_FLOWS = [
  { id: 'standard', label: 'Standard' },
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'fresh_grocery', label: 'Fresh Grocery' },
  { id: 'mithilak', label: 'Mithilak' },
];

const HomeSectionsManager = () => {
  const { section: sectionKey = 'still-looking' } = useParams();
  const [commerceFlow, setCommerceFlow] = useState('standard');
  const [sectionData, setSectionData] = useState({ title: '', productIds: [], isActive: true });
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [sectionsRes, productsRes] = await Promise.all([
      sectionsApi.getAll(),
      productsApi.getAll({ limit: 100, status: 'approved' }),
    ]);

    const sections = extractList(sectionsRes.data);
    const match = sections.find(
      (s) => s.sectionKey === sectionKey && (s.commerceFlow || 'standard') === commerceFlow
    );

    setSectionData({
      title: match?.title || SECTION_TITLES[sectionKey] || sectionKey,
      productIds: (match?.productIds || []).map((id) => String(id._id || id)),
      isActive: match?.isActive !== false,
    });

    const catalog = extractList(productsRes.data);
    setAllProducts(catalog);

    const ids = (match?.productIds || []).map((id) => String(id._id || id));
    setProducts(catalog.filter((p) => ids.includes(String(p._id || p.id))));

    setLoading(false);
  }, [sectionKey, commerceFlow]);

  useEffect(() => { load(); }, [load]);

  const addProduct = () => {
    if (!selectedProductId) return;
    if (sectionData.productIds.includes(selectedProductId)) {
      toast.error('Product already in section');
      return;
    }
    const nextIds = [...sectionData.productIds, selectedProductId];
    setSectionData((p) => ({ ...p, productIds: nextIds }));
    setProducts(allProducts.filter((p) => nextIds.includes(String(p._id || p.id))));
    setSelectedProductId('');
  };

  const removeProduct = (productId) => {
    const nextIds = sectionData.productIds.filter((id) => id !== productId);
    setSectionData((p) => ({ ...p, productIds: nextIds }));
    setProducts(allProducts.filter((p) => nextIds.includes(String(p._id || p.id))));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await sectionsApi.update(sectionKey, {
      title: sectionData.title,
      productIds: sectionData.productIds,
      isActive: sectionData.isActive,
    }, { commerceFlow });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Home section published — visible on user app');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 uppercase">{SECTION_TITLES[sectionKey] || sectionKey}</h1>
          <p className="text-slate-500 text-sm mt-1">Section key: <code className="bg-slate-100 px-1 rounded">{sectionKey}</code></p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {COMMERCE_FLOWS.map((flow) => (
          <button
            key={flow.id}
            onClick={() => setCommerceFlow(flow.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${commerceFlow === flow.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {flow.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Section Title</label>
            <input
              value={sectionData.title}
              onChange={(e) => setSectionData((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={sectionData.isActive}
              onChange={(e) => setSectionData((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Section active on home page
          </label>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Add Product</label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="">Select approved product...</option>
                {allProducts.map((p) => (
                  <option key={p._id || p.id} value={String(p._id || p.id)}>
                    {p.title || p.name} — ₹{p.price}
                  </option>
                ))}
              </select>
              <button onClick={addProduct} className="px-4 py-3 bg-blue-500 text-white rounded-xl"><Plus size={16} /></button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{products.length} products in section</p>
            {products.map((product) => (
              <div key={product._id || product.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl">
                <img
                  src={product.images?.[0]?.url || product.image || 'https://via.placeholder.com/64'}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm">{product.title || product.name}</p>
                  <p className="text-xs text-slate-400">₹{product.price}</p>
                </div>
                <button onClick={() => removeProduct(String(product._id || product.id))} className="p-2 text-red-500 bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSectionsManager;
