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
import { getProducts, deleteProduct, duplicateProduct } from '../../services/sellerApi';
import { formatCurrency } from '../../utils/formatters';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

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
    { key: 'title', label: 'Product', render: (_, row) => (
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
          <Package size={20} className="text-gray-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{row.title}</p>
          <p className="text-[11px] text-gray-400">SKU: {row.sku}</p>
        </div>
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => (
      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">{val}</span>
    )},
    { key: 'price', label: 'Price', render: (_, row) => (
      <div>
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(row.discountPrice || row.price)}</p>
        {row.discountPrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(row.price)}</p>}
      </div>
    )},
    { key: 'stock', label: 'Stock', render: (val) => (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${val === 0 ? 'text-red-500' : val < 10 ? 'text-amber-500' : 'text-gray-900'}`}>{val}</span>
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${val === 0 ? 'bg-red-500' : val < 10 ? 'bg-amber-500' : 'bg-blue-500'}`}
               style={{ width: `${Math.min((val / 200) * 100, 100)}%` }} />
        </div>
      </div>
    )},
    { key: 'status', label: 'Status', align: 'center', render: (val) => <StatusBadge status={val} size="sm" /> },
    { key: 'sales', label: 'Sales', render: (val) => <span className="text-sm font-medium text-gray-600">{val || 0}</span> },
    { key: 'actions', label: 'Actions', sortable: false, align: 'center', render: (_, row) => (
      <div className="flex items-center gap-1 justify-center">
        <button onClick={(e) => { e.stopPropagation(); navigate(`/seller/products/edit/${row.id}`); }}
                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
          <Edit3 size={16} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(row); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Duplicate">
          <Copy size={16} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Products" subtitle={`${filteredProducts.length} products in your store`}>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
              <Grid3X3 size={16} />
            </button>
          </div>
          <Button icon={Plus} onClick={() => navigate('/seller/products/add')}>Add Product</Button>
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
                    <span className={`text-xs font-medium ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                    </span>
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
