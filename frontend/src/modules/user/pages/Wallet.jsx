import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, ChevronRight } from 'lucide-react';
import { getWallet, getWalletTransactions } from '../services/userApi';
import { extractList, mapWalletTransaction } from '../utils/mappers';
import { formatPrice } from '../../../shared/utils/priceFormatter';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [walletData, txData] = await Promise.all([
          getWallet(),
          getWalletTransactions({ limit: 20 }),
        ]);
        if (!cancelled) {
          setBalance(walletData?.balance ?? 0);
          setTransactions(extractList(txData).map(mapWalletTransaction));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load wallet');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#eaeded] min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                   <WalletIcon size={24} className="text-slate-900" />
                </div>
                <h1 className="text-xl font-bold">Cocio Pay Balance</h1>
             </div>
             <ChevronRight size={20} className="text-slate-400" />
          </div>
          
          <div className="flex items-baseline gap-1 mb-8">
             <span className="text-sm font-medium text-slate-500">Available Balance:</span>
             <span className="text-3xl font-black text-slate-900">
               {loading ? '...' : formatPrice(balance)}
             </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Plus size={24} className="text-primary-dark" />
                <span className="text-xs font-bold">Add Money</span>
             </button>
             <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <CreditCard size={24} className="text-orange-600" />
                <span className="text-xs font-bold">Manage Cards</span>
             </button>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4 px-2">Recent Transactions</h2>
        {error && <p className="text-sm text-red-600 px-2 mb-3">{error}</p>}
        <div className="space-y-3">
           {loading ? (
             <p className="text-sm text-slate-500 px-2">Loading transactions...</p>
           ) : transactions.length === 0 ? (
             <p className="text-sm text-slate-500 px-2">No transactions yet.</p>
           ) : (
             transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                       {t.type === 'credit' ? <ArrowDownLeft size={20} className="text-green-600" /> : <ArrowUpRight size={20} className="text-red-600" />}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">{t.title || t.name}</p>
                       <p className="text-[10px] text-slate-500">{t.date}</p>
                    </div>
                 </div>
                 <span className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>{t.amount}</span>
              </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
