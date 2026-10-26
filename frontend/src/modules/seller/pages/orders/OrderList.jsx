import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Bell, Volume2, VolumeX } from 'lucide-react';
import { PageHeader, StatusBadge, SearchFilter, DataTable } from '../../components/common';
import { getOrders } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';
import useSellerOrderStream from '../../hooks/useSellerOrderStream';
import toast from 'react-hot-toast';
import DispatchDelayTimer from '../../../../shared/components/DispatchDelayTimer';
import FulfillmentOffers from '../../components/common/FulfillmentOffers';
import { getDispatchSlaInfo } from '../../../../shared/utils/dispatchDelayUtils';
import { soundEffects } from '../../../../shared/utils/soundEffects';

const tabs = [
  { key: 'all', label: 'All Orders' },
  { key: 'placed', label: 'New Orders' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'delayed', label: 'Delayed Dispatch' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const OrderList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const debouncedSearch = useDebounce(searchQuery);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data?.orders || []);
    } catch (err) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useSellerOrderStream((payload) => {
    if (payload?.type === 'new_order') {
      toast.success(`New order received${payload.orderNumber ? `: ${payload.orderNumber}` : ''}`);
      if (!soundMuted) soundEffects.startOrderAlertSiren();
    }
    fetchOrders(true);
  });

  const pendingNewOrdersCount = useMemo(() => orders.filter((o) => o.status === 'placed').length, [orders]);

  useEffect(() => {
    if (pendingNewOrdersCount > 0 && !soundMuted) {
      soundEffects.startOrderAlertSiren();
    } else {
      soundEffects.stopOrderAlertSiren();
    }
    return () => {
      soundEffects.stopOrderAlertSiren();
    };
  }, [pendingNewOrdersCount, soundMuted]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab !== 'all') {
      if (activeTab === 'delayed') {
        result = result.filter((o) => {
          const sla = getDispatchSlaInfo(o);
          return sla.isPending && (sla.dispatchState === 'delayed' || sla.dispatchState === 'escalated');
        });
      } else {
        result = result.filter((o) => o.status === activeTab);
      }
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id || '').toLowerCase().includes(q) ||
          String(o.orderNumber || '').toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, debouncedSearch]);

  const getTabCount = (tab) => {
    if (tab === 'all') return orders.length;
    if (tab === 'delayed') {
      return orders.filter((o) => {
        const sla = getDispatchSlaInfo(o);
        return sla.isPending && (sla.dispatchState === 'delayed' || sla.dispatchState === 'escalated');
      }).length;
    }
    return orders.filter((o) => o.status === tab).length;
  };

  const columns = [
    { key: 'id', label: 'Order ID', render: (_, row) => (
      <span className="text-xs font-bold text-blue-600 truncate">#{row.orderNumber || row.id}</span>
    )},
    { key: 'customer', label: 'Customer', render: (val) => (
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 truncate">{val?.name || '—'}</p>
        <p className="text-[10.5px] text-slate-400 truncate">{val?.phone || ''}</p>
      </div>
    )},
    { key: 'products', label: 'Items', render: (val) => (
      <div className="min-w-0 max-w-[200px]">
        <p className="text-xs font-medium text-slate-700 truncate">{val?.[0]?.title?.substring(0, 30) || '—'}</p>
        {val?.length > 1 && <p className="text-[10.5px] text-slate-400">+{val.length - 1} more</p>}
      </div>
    )},
    { key: 'finalAmount', label: 'Total', render: (val, row) => (
      <span className="text-xs font-bold text-slate-900">{formatCurrency(val || row.totalAmount || 0)}</span>
    )},
    { key: 'payment', label: 'Payment', render: (val) => (
      <div className="flex flex-col gap-0.5">
        <p className="text-[10.5px] font-semibold text-slate-600 uppercase">{val?.method || '—'}</p>
        <StatusBadge status={val?.status || 'pending'} size="sm" />
      </div>
    )},
    { key: 'status', label: 'Status', align: 'center', render: (val, row) => {
      const sla = getDispatchSlaInfo(row);
      const isDelayed = sla.isPending && (sla.dispatchState === 'delayed' || sla.dispatchState === 'escalated');
      return (
        <div className="flex flex-col items-center gap-0.5">
          <StatusBadge status={isDelayed ? 'dispatch_delayed' : val} />
          <DispatchDelayTimer order={row} size="sm" />
        </div>
      );
    }},
    { key: 'placedAt', label: 'Date', render: (val) => <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(val)}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/seller/orders/${row.id}`); }}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
        title="View Details"
      >
        <Eye size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-4 pb-6">
      <PageHeader title="Orders" subtitle={`${filteredOrders.length} orders found`} />

      {pendingNewOrdersCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-500/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                Action Required: {pendingNewOrdersCount} New Order{pendingNewOrdersCount > 1 ? 's' : ''} Received!
              </p>
              <p className="text-[11px] text-white/90">
                Please review and accept to prepare items for delivery dispatch.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('placed');
                soundEffects.stopOrderAlertSiren();
              }}
              className="px-3.5 py-1.5 bg-white text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-50 shadow-sm cursor-pointer"
            >
              Review ({pendingNewOrdersCount})
            </button>
            <button
              onClick={() => {
                soundEffects.stopOrderAlertSiren();
                setSoundMuted((m) => !m);
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white cursor-pointer"
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* CR-002 — offers awaiting this seller's response. */}
      <FulfillmentOffers onAccepted={() => fetchOrders(true)} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">{error}</div>
      )}

      <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-slate-100 p-1 seller-no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {getTabCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by order ID or customer..." />

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading orders...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          onRowClick={(row) => navigate(`/seller/orders/${row.id}`)}
          emptyIcon="orders"
          emptyTitle="No orders found"
          emptyDescription="Orders will appear here once customers make purchases."
        />
      )}
    </div>
  );
};

export default OrderList;
