/**
 * Product List Page
 * Grid/Table view with search, filter, sort, pagination.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3X3, List, Edit3, Trash2, Copy, Eye, Package, MoreVertical, Star } from 'lucide-react';
import { PageHeader, StatusBadge, SearchFilter, ConfirmModal, DataTable } from '../../components/common';
import { Button, EmptyState } from '../../components/ui';
import { getProducts, deleteProduct, duplicateProduct, updateProduct } from '../../services/sellerApi';
import { formatCurrency } from '../../utils/formatters';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { getProductImage } from '../../../../shared/utils/imageUtils';

const ProductList = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(searchQuery);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data?.products || []);
    } catch (err) {
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStock = async (product) => {
    const isCurrentlyInStock = product.status === 'active' && (product.stock > 0 || product.inStock !== false);
    const newStatus = isCurrentlyInStock ? 'out_of_stock' : 'active';
    const newStock = isCurrentlyInStock ? 0 : 25;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: newStatus, stock: newStock } : p))
    );

    try {
      await updateProduct(product.id, {
        status: newStatus,
        stock: newStock,
        inStock: !isCurrentlyInStock,
      });
      toast.success(`"${product.title}" marked as ${newStatus === 'active' ? 'In Stock' : 'Out of Stock'}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update stock status');
      fetchProducts();
    }
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }
    return result;
  }, [products, debouncedSearch, filters]);

  const { paginatedData, currentPage, totalPages, pageSize, goToPage, changePageSize } = usePagination(filteredProducts, 10);

  const handleDelete = (product) => {
    setDeleteModal({ open: true, product });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteModal.product?.id);
      toast.success(`"${deleteModal.product?.title}" deleted successfully`);
      setDeleteModal({ open: false, product: null });
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete product');
    }
  };

  const handleDuplicate = async (product) => {
    try {
      await duplicateProduct(product.id);
      toast.success(`"${product.title}" duplicated`);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to duplicate product');
    }
  };

  const filterConfig = [
    { key: 'status', label: 'Status', options: [
      { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
      { value: 'out_of_stock', label: 'Out of Stock' }, { value: 'draft', label: 'Draft' },
    ]},
    { key: 'category', label: 'Category', options: [
      { value: 'Handicraft', label: 'Handicraft' }, { value: 'Food & Grocery', label: 'Food & Grocery' },
      { value: 'Clothing', label: 'Clothing' }, { value: 'Home & Living', label: 'Home & Living' },
    ]},
  ];

  // Table columns
  const columns = [
    { key: 'title', label: 'Product', render: (_, row) => {
      const imgUrl = getProductImage(row.images?.[0]?.url || row.image || row.gallery?.[0]?.url || row.gallery?.[0]);
      return (
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200/60 overflow-hidden">
            {imgUrl ? (
              <img src={imgUrl} alt={row.title || 'Product'} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Package size={16} className="text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 line-clamp-1 truncate">{row.title}</p>
            <p className="text-[10px] text-slate-400 truncate">SKU: {row.sku}</p>
          </div>
        </div>
      );
    }},
    { key: 'category', label: 'Category', render: (val, row) => (
      <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
        {row.category?.name || row.category || row.categoryId?.name || val || 'General'}
      </span>
    )},
    { key: 'price', label: 'Price', render: (_, row) => (
      <div>
        <p className="text-xs font-bold text-slate-900">{formatCurrency(row.discountPrice || row.price)}</p>
        {row.discountPrice && <p className="text-[10px] text-slate-400 line-through">{formatCurrency(row.price)}</p>}
      </div>
    )},
    { key: 'stock', label: 'Stock & Availability', render: (val, row) => {
      const isAvailable = row.status === 'active' && val > 0;
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStock(row);
            }}
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
            title="Click to toggle In Stock / Out of Stock instantly"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-400">({val})</span>
        </div>
      );
    }},
    { key: 'status', label: 'Status', align: 'center', render: (val) => <StatusBadge status={val} size="sm" /> },
    { key: 'sales', label: 'Sales', align: 'center', render: (val) => (
      <span className="text-xs font-semibold text-slate-600">{val || 0}</span>
    )},
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/seller/products/edit/${row.id}`); }}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDuplicate(row); }}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4 pb-6">
      <PageHeader title="Products" subtitle={`${filteredProducts.length} products in your store`}>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400'}`} title="Table view">
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400'}`} title="Grid view">
              <Grid3X3 size={15} />
            </button>
          </div>
          <button
            onClick={() => navigate('/seller/products/add')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg
                       shadow-2xs hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Add Product
          </button>
        </div>
      </PageHeader>

      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search products, SKU, category..."
        filters={filterConfig}
        activeFilters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      />

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          columns={columns}
          data={filteredProducts}
          onRowClick={(row) => navigate(`/seller/products/edit/${row.id}`)}
          emptyIcon="products"
          emptyTitle="No products found"
          emptyDescription="Add your first product to start selling."
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/seller/products/edit/${product.id}`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group"
              >
                <div className="h-40 bg-gray-50 flex items-center justify-center relative">
                  <Package size={40} className="text-gray-200" />
                  <div className="absolute top-3 right-3"><StatusBadge status={product.status} size="sm" /></div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{product.category} • SKU: {product.sku}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(product.discountPrice || product.price)}</p>
                      {product.discountPrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span>{product.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStock(product);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                        product.stock === 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : product.stock < 10
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title="Click to toggle In-Stock / Out-of-Stock status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${product.stock === 0 ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                    </button>
                    <span className="text-xs text-gray-400">{product.sales || 0} sold</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <EmptyState icon="products" title="No products found" description="Try adjusting your search or filters." actionLabel="Add Product" onAction={() => navigate('/seller/products/add')} />
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={confirmDelete}
        type="delete"
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.product?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
      />
    </div>
  );
};

export default ProductList;
