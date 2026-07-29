/**
 * Customer List Page
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag } from 'lucide-react';
import { PageHeader, SearchFilter, DataTable } from '../../components/common';
import { getCustomers } from '../../services/sellerApi';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';

const CustomerList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(searchQuery);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCustomers();
        setCustomers(data?.customers || []);
      } catch (err) {
        setError(err?.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase();
    return customers.filter((c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [customers, debouncedSearch]);

  const columns = [
    { key: 'name', label: 'Customer', render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-blue-600">{getInitials(row.name || '')}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (val) => <span className="text-sm text-gray-600">{val || '—'}</span> },
    { key: 'orders', label: 'Orders', render: (val) => <span className="text-sm font-semibold text-gray-900">{val || 0}</span> },
    { key: 'totalSpend', label: 'Lifetime Spend', render: (val) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(val || 0)}</span> },
    { key: 'avgOrderValue', label: 'Avg. Order', render: (val) => <span className="text-sm text-gray-600">{formatCurrency(val || 0)}</span> },
    { key: 'lastOrder', label: 'Last Order', render: (val) => <span className="text-xs text-gray-500">{val ? formatDate(val) : '—'}</span> },
    { key: 'notes', label: 'Notes', render: (val) => val ? <span className="text-xs text-gray-500 italic">{val}</span> : <span className="text-xs text-gray-300">—</span> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Customers" subtitle={`${customers.length} customers have ordered from your store`} />
      <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by name or email..." />
      <DataTable columns={columns} data={filtered} emptyIcon="search" emptyTitle="No customers found" />
    </div>
  );
};

export default CustomerList;
