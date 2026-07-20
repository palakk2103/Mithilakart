/**
 * Order List Page
 * Tabbed order management with search, filters, and status actions.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { PageHeader, StatusBadge, SearchFilter, DataTable } from '../../components/common';
import { getOrders } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';

const tabs = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned' },
];

const OrderList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(searchQuery);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data?.orders || []);
    } catch (err) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab !== 'all') result = result.filter((o) => o.status === activeTab);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((o) => o.id?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeTab, debouncedSearch]);

  const getTabCount = (tab) => tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;

  const columns = [
    { key: 'id', label: 'Order ID', render: (val) => <span className="text-sm font-semibold text-blue-600">#{val}</span> },
    { key: 'customer', label: 'Customer', render: (val) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{val?.name || '—'}</p>
        <p className="text-xs text-gray-400">{val?.phone || ''}</p>
      </div>
    )},
    { key: 'products', label: 'Items', render: (val) => (
      <div>
        <p className="text-sm text-gray-700">{val?.[0]?.title?.substring(0, 30)}...</p>
        {val?.length > 1 && <p className="text-xs text-gray-400">+{val.length - 1} more</p>}
      </div>
    )},
    { key: 'finalAmount', label: 'Total', render: (val, row) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(val || row.totalAmount || 0)}</span> },
    { key: 'payment', label: 'Payment', render: (val) => (
      <div>
        <p className="text-xs font-medium text-gray-600">{val?.method || '—'}</p>
        <StatusBadge status={val?.status || 'pending'} size="sm" />
      </div>
    )},
    { key: 'status', label: 'Status', align: 'center', render: (val) => <StatusBadge status={val} /> },
    { key: 'placedAt', label: 'Date', render: (val) => <span className="text-xs text-gray-500">{formatDate(val)}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/seller/orders/${row.id}`); }}
              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View Details">
        <Eye size={16} />
      </button>
    )},
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Orders" subtitle={`${filteredOrders.length} orders found`} />

      {/* Status Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-gray-100 p-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {getTabCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by order ID or customer..." />

      <DataTable
        columns={columns}
        data={filteredOrders}
        onRowClick={(row) => navigate(`/seller/orders/${row.id}`)}
        emptyIcon="orders"
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here once customers make purchases."
      />
    </div>
  );
};

export default OrderList;
