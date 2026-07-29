import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit3, Trash2, 
  Eye, Package, MoreVertical, ExternalLink, 
  TrendingUp, Layers, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../../../shared/components/SearchInput';
import { productsApi, categoriesApi } from '../../admin/services/api';
import { extractList, mapProduct } from '../../admin/utils/mappers';

const InventoryList = () => {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', price: '', stock: '' });
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll({ limit: 100 }),
        categoriesApi.getAll().catch(() => ({ data: [], error: null }))
      ]);
      if (cancelled) return;
      if (!prodRes.error) {
        setMyProducts(extractList(prodRes.data).map(mapProduct));
      } else {
        setMyProducts([]);
      }
      if (catRes && !catRes.error) {
        setCategories(extractList(catRes.data).map(c => c.name || c.title));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = myProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const { error } = await productsApi.update(editingProduct.id, {
      name: editForm.name,
      category: editForm.category,
      price: Number(editForm.price),
      stock: Number(editForm.stock)
    });
    if (!error) {
      setMyProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...editForm, price: Number(editForm.price), stock: Number(editForm.stock) } : p));
      setEditingProduct(null);
    } else {
      alert(error || 'Failed to update product');
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      const { error } = await productsApi.delete(product.id);
      if (!error) {
        setMyProducts(prev => prev.filter(p => p.id !== product.id));
      } else {
        alert(error || 'Failed to delete product');
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      Approved: 'bg-green-50 text-green-600',
      Pending: 'bg-amber-50 text-amber-600',
      Rejected: 'bg-red-50 text-red-600',
      Draft: 'bg-slate-100 text-slate-500'
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status] || colors.Draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-montserrat uppercase">Inventory Manager</h2>
          <p className="text-slate-400 font-medium text-sm mt-1 font-raleway">Monitor and manage all B2B stock across the platform.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex-1 md:w-80">
            <SearchInput 
              type="text" 
              placeholder="Search products, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
          <button 
            onClick={() => navigate('/admin/inventory/add')}
            className="px-8 py-3.5 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Live Products', value: myProducts.filter(p => p.status === 'Approved').length, icon: Layers, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Low Stock Alert', value: myProducts.filter(p => p.stock < 10 && p.stock > 0).length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Platform Sales', value: myProducts.length, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
             <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 font-roboto leading-none">{stat.value}</h3>
             </div>
          </div>
        ))}
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm font-bold">Loading inventory...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm font-bold">No products found</td>
                  </tr>
                ) : filteredProducts.map((product, index) => (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-7" onClick={() => setViewingProduct(product)}>
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-sm group-hover:border-blue-100 transition-all">
                          <Package size={24} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[15px] line-clamp-1 group-hover:text-blue-500 transition-colors font-nunito">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-raleway">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7" onClick={() => setViewingProduct(product)}>
                      <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest font-roboto">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-center" onClick={() => setViewingProduct(product)}>
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-8 py-7" onClick={() => setViewingProduct(product)}>
                      <p className="font-black text-slate-900 text-base font-roboto">₹{Number(product.price || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-7" onClick={() => setViewingProduct(product)}>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center w-24">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Available</span>
                           <span className={`text-[10px] font-black ${product.stock < 10 ? 'text-red-500' : 'text-slate-900'}`}>{product.stock}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${product.stock < 10 ? 'bg-red-500' : 'bg-blue-500'}`} 
                             style={{ width: `${Math.min((product.stock / 200) * 100, 100)}%` }}
                           />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-2.5 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                          className="p-3 bg-white border border-blue-100 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          className="p-3 bg-white border border-blue-100 rounded-2xl text-red-500 hover:bg-red-50 transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingProduct(product); }}
                          className="p-3 bg-white border border-blue-100 rounded-2xl text-blue-900 hover:bg-blue-50 transition-all shadow-sm"
                          title="View Details"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full border border-slate-100 shadow-2xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-montserrat uppercase">Edit Product</h3>
              <p className="text-slate-400 font-medium text-xs mt-1">Modify inventory details for ID: {editingProduct.id}</p>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                <select 
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900"
                >
                  {categories.length > 0 ? (
                    categories.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="General">General</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Stock</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full border border-slate-100 shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-montserrat uppercase">Product Details</h3>
                <p className="text-slate-400 font-medium text-xs mt-1">Full specification sheet</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                viewingProduct.status === 'Approved' ? 'bg-green-50 text-green-600' :
                viewingProduct.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                viewingProduct.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {viewingProduct.status}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Product ID</span>
                  <span className="font-bold text-slate-900">{viewingProduct.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Product Name</span>
                  <span className="font-bold text-slate-900">{viewingProduct.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Category</span>
                  <span className="font-bold text-slate-900">{viewingProduct.category}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Price</span>
                    <span className="font-bold text-slate-900">₹{Number(viewingProduct.price || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Stock</span>
                    <span className="font-bold text-slate-900">{viewingProduct.stock} units</span>
                  </div>
                </div>
                {viewingProduct.vendorId && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Vendor ID</span>
                    <span className="font-bold text-slate-900">{viewingProduct.vendorId}</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setViewingProduct(null)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
