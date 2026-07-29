/**
 * Inventory Manager Page
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, Archive, ArrowUpDown } from 'lucide-react';
import { PageHeader, StatCard, SearchFilter, DataTable, StatusBadge } from '../../components/common';
import { Card, Button } from '../../components/ui';
import { getInventory, updateStock } from '../../services/sellerApi';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const InventoryManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventory();
      setProducts(data?.products || []);
      setInventoryAlerts(data?.alerts || []);
      setStockHistory(data?.history || []);
    } catch (err) {
      setError(err?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const inStock = products.filter((p) => (p.stock || 0) > 10).length;
  const lowStock = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStock = products.filter((p) => (p.stock || 0) === 0).length;

  const filtered = searchQuery
    ? products.filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const handleRestock = async (row) => {
    try {
      const newQty = (row.stock || 0) + 10;
      await updateStock(row.id, newQty);
      toast.success(`Stock updated for ${row.title}`);
      fetchInventory();
    } catch (err) {
      toast.error(err?.message || 'Failed to update stock');
    }
  };

  const columns = [
    { key: 'title', label: 'Product', render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center"><Package size={18} className="text-gray-300" /></div>
        <div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{row.title}</p>
          <p className="text-[10px] text-gray-400">SKU: {row.sku}</p>
        </div>
      </div>
    )},
    { key: 'stock', label: 'Stock', render: (val) => (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${val === 0 ? 'text-red-500' : val < 10 ? 'text-amber-500' : 'text-green-600'}`}>{val || 0}</span>
        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${val === 0 ? 'bg-red-500' : val < 10 ? 'bg-amber-400' : 'bg-green-500'}`}
               style={{ width: `${Math.min(((val || 0) / 200) * 100, 100)}%` }} />
        </div>
      </div>
    )},
    { key: 'status', label: 'Status', align: 'center', render: (val, row) => {
      if ((row.stock || 0) === 0) return <StatusBadge status="out_of_stock" size="sm" />;
      if ((row.stock || 0) < 10) return <StatusBadge status="warning" size="sm" />;
      return <StatusBadge status="active" size="sm" />;
    }},
    { key: 'sales', label: 'Sold', render: (val) => <span className="text-sm text-gray-600">{val || 0}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <Button size="xs" variant="outline" onClick={() => handleRestock(row)}>Restock</Button>
    )},
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Inventory" subtitle="Manage your product stock levels" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="In Stock" value={inStock} icon={Package} iconBg="bg-green-50" iconColor="text-green-600" delay={0} />
        <StatCard title="Low Stock" value={lowStock} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-500" delay={1} />
        <StatCard title="Out of Stock" value={outOfStock} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500" delay={2} />
      </div>

      {/* Inventory Alerts */}
      {inventoryAlerts.length > 0 && (
        <Card title="⚠️ Inventory Alerts" subtitle={`${inventoryAlerts.length} items need attention`}>
          <div className="space-y-2 mt-4">
            {inventoryAlerts.map((alert) => (
              <div key={alert.productId || alert.id} className={`flex items-center justify-between p-3 rounded-xl ${alert.status === 'out' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.title || alert.name}</p>
                  <p className="text-xs text-gray-500">{alert.stock === 0 ? 'Out of stock' : `${alert.stock} units left (threshold: ${alert.threshold || 10})`}</p>
                </div>
                <Button size="xs" variant={alert.status === 'out' ? 'danger' : 'primary'} onClick={() => handleRestock({ id: alert.productId, title: alert.title, stock: alert.stock || 0 })}>Restock</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search products..." />
      <DataTable columns={columns} data={filtered} emptyIcon="products" emptyTitle="No products in inventory" />

      {/* Stock History */}
      <Card title="Stock History" subtitle="Recent stock changes">
        <div className="space-y-2 mt-4">
          {stockHistory.map((entry, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${entry.type === 'restock' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <ArrowUpDown size={14} className={entry.type === 'restock' ? 'text-green-500' : 'text-red-500'} />
                </div>
                <div>
                  <p className="text-sm text-gray-700">{entry.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.date)}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${entry.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {entry.change > 0 ? '+' : ''}{entry.change}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default InventoryManager;
