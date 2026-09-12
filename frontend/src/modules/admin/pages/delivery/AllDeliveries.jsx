import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../services/api';
import { extractList, mapDeliveryPartner } from '../../utils/mappers';
import { 
  Truck, User, Star, MapPin, 
  Phone, Mail, CheckCircle2, XCircle,
  Clock, Search, Filter, MoreVertical,
  Plus, Calendar, IndianRupee, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeliveryPartners = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settlePartner, setSettlePartner] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data, error: apiError } = await deliveryApi.getAll();
    if (apiError) {
      setError(apiError);
      setPartners([]);
    } else {
      setError(null);
      setPartners(extractList(data).map(mapDeliveryPartner));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleOpenSettle = (partner) => {
    setSettlePartner(partner);
    setSettleAmount(String(partner.codDuesBalance || ''));
    setSettleNotes('');
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!settlePartner) return;
    const amount = Number(settleAmount);
    if (!amount || amount <= 0) return;

    setSettling(true);
    try {
      await deliveryApi.settleDues(settlePartner.id, {
        amount,
        notes: settleNotes || 'Admin manual settlement',
      });
      setSettlePartner(null);
      await fetchPartners();
    } catch (err) {
      alert(err?.message || 'Failed to settle dues');
    } finally {
      setSettling(false);
    }
  };

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFleet = partners.length;
  const activeNow = partners.filter((p) => p.isOnline || p.status === 'Active' || p.status === 'Busy').length;
  const totalOrders = partners.reduce((sum, p) => sum + (p.orders || 0), 0);
  const totalCodDues = partners.reduce((sum, p) => sum + (p.codDuesBalance || 0), 0);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Logistics Partners</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Manage platform delivery fleet, active zones, COD dues, and agent performance.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
          <Plus size={16} />
          Onboard Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet', value: String(totalFleet), icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Now', value: String(activeNow), icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Total Deliveries', value: String(totalOrders), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'COD Dues Balance', value: `₹${totalCodDues.toLocaleString()}`, icon: MapPin, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              {stat.icon && React.createElement(stat.icon, { size: 22 })}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by Agent Name, Phone or Zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Agent Details</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Zone / Area</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">COD Dues</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 border border-slate-100">
                          {partner.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 font-montserrat leading-tight">{partner.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{partner.vehicle}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-600">
                     <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {partner.phone}</p>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">
                        <MapPin size={10} className="text-blue-500" />
                        {partner.zone}
                     </div>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{partner.orders.toLocaleString()}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">
                    <span className={partner.codDuesBalance > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      ₹{(partner.codDuesBalance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg w-fit text-xs font-black">
                        <Star size={12} fill="currentColor" />
                        {partner.rating}
                     </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       partner.status === 'Active' ? 'bg-green-50 text-green-600' : 
                       partner.status === 'Busy' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                     }`}>
                        {partner.status}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    {partner.codDuesBalance > 0 && (
                      <button
                        onClick={() => handleOpenSettle(partner)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-all"
                      >
                        Settle Dues
                      </button>
                    )}
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all inline-flex items-center">
                       <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Dues Modal */}
      <AnimatePresence>
        {settlePartner && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-black text-slate-900">Settle COD Dues</h3>
                <button
                  onClick={() => setSettlePartner(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p className="text-xs text-slate-500 font-bold">Partner: <span className="text-slate-800 font-black">{settlePartner.name}</span></p>
                <p className="text-xs text-slate-500 font-bold">Current Dues Balance: <span className="text-amber-600 font-black">₹{settlePartner.codDuesBalance?.toLocaleString()}</span></p>
              </div>

              <form onSubmit={handleConfirmSettle} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Settlement Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={settlePartner.codDuesBalance || undefined}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Notes / Transaction Reference</label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="e.g. Bank transfer / Cash collected at hub"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSettlePartner(null)}
                    className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settling}
                    className="px-5 py-2 text-xs font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {settling ? 'Settling...' : 'Confirm Settlement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Activity = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;

export default DeliveryPartners;
