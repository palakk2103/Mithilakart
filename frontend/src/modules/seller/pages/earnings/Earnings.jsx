/**
 * Earnings Page
 * Wallets, Payouts, Transaction history, Settlements.
 */
import React, { useState, useEffect } from 'react';
import { Wallet, Landmark, RefreshCw, DollarSign, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader, StatCard, DataTable, StatusBadge } from '../../components/common';
import { Card, Button } from '../../components/ui';
import { getEarnings, getTransactions, getSettlements, requestPayout } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Earnings = () => {
  const [requesting, setRequesting] = useState(false);
  const [earningsData, setEarningsData] = useState({
    availableBalance: 0,
    totalWithdrawn: 0,
    bankDetails: { bankName: '', accountNumber: '', ifsc: '', holderName: '' },
  });
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [earnings, txRes, settlementsRes] = await Promise.all([
        getEarnings(),
        getTransactions(),
        getSettlements(),
      ]);

      const bank = earnings?.bankDetails || {};
      setEarningsData({
        availableBalance: earnings?.availableBalance ?? earnings?.walletBalance ?? 0,
        totalWithdrawn: earnings?.totalWithdrawn ?? earnings?.totalPayouts ?? 0,
        bankDetails: {
          bankName: bank.bankName || '',
          accountNumber: bank.accountNumber || '',
          ifsc: bank.ifsc || '',
          holderName: bank.holderName || bank.accountHolder || '',
        },
      });
      setTransactions(txRes?.transactions || []);
      setSettlements(settlementsRes?.settlements || []);
    } catch (err) {
      setError(err?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handlePayoutRequest = async () => {
    setRequesting(true);
    try {
      await requestPayout(earningsData.availableBalance);
      toast.success('Payout request submitted successfully!');
      fetchEarnings();
    } catch (err) {
      toast.error(err?.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Transaction ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'type', label: 'Type', render: (val) => (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
        val === 'payout' || val === 'debit' ? 'text-red-600' : 'text-green-600'
      }`}>
        {val === 'payout' || val === 'debit' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
        {val === 'payout' || val === 'debit' ? 'Withdrawal' : 'Sale'}
      </span>
    )},
    { key: 'amount', label: 'Amount', render: (val, row) => (
      <span className={`text-sm font-semibold ${row.type === 'payout' || row.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
        {row.type === 'payout' || row.type === 'debit' ? '-' : '+'}{formatCurrency(val || 0)}
      </span>
    )},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} size="sm" /> },
    { key: 'createdAt', label: 'Date & Time', render: (val, row) => <span className="text-xs text-gray-500">{formatDate(val || row.date, 'short')}</span> }
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Earnings & Payouts" subtitle="Track your wallet balance, recent settlements, and withdrawal transactions" />

      {/* Main Balance Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-2">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Wallet size={32} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Balance</p>
                <h2 className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(earningsData.availableBalance)}</h2>
              </div>
            </div>
            <Button
              onClick={handlePayoutRequest}
              loading={requesting}
              icon={RefreshCw}
              disabled={earningsData.availableBalance <= 0}
            >
              Withdraw to Bank
            </Button>
          </div>
        </Card>

        <StatCard
          title="Total Withdrawn"
          value={formatCurrency(earningsData.totalWithdrawn)}
          subtitle="Lifetime payouts transferred"
          icon={Landmark}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Settlements Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card title="Transaction History" subtitle="Detailed credit and debit transactions list">
            <DataTable
              columns={columns}
              data={transactions}
              pageSize={5}
              emptyIcon="default"
              emptyTitle="No transactions found"
            />
          </Card>
        </div>

        {/* Bank Account Info & Payouts */}
        <div className="space-y-6">
          <Card title="Settlement Bank Account">
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <Landmark size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{earningsData.bankDetails.bankName || '—'}</p>
                  <p className="text-xs text-gray-400">Account: *******{(earningsData.bankDetails.accountNumber || '').slice(-4)}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between"><span>IFSC Code:</span><span className="font-semibold text-gray-700">{earningsData.bankDetails.ifsc || '—'}</span></div>
                <div className="flex justify-between"><span>Beneficiary:</span><span className="font-semibold text-gray-700">{earningsData.bankDetails.holderName || '—'}</span></div>
              </div>
            </div>
          </Card>

          <Card title="Settlements Log" subtitle="Recent batch bank transfers">
            <div className="space-y-3 mt-4">
              {settlements.map((s) => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{s.id}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(s.date || s.paidAt || s.period)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(s.amount || s.netAmount || 0)}</p>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
