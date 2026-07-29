import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { extractList, mapUser } from '../utils/mappers';
import { 
  Users as UsersIcon, Search, Filter, Mail, 
  Phone, MapPin, Calendar, MoreVertical,
  CheckCircle2, XCircle, Clock, ShieldCheck,
  Download, UserPlus, Star, Edit2, ShieldAlert, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Users = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error: apiError } = await usersApi.getAll();
    if (apiError) {
      setError(apiError);
      setUsersList([]);
    } else {
      setError(null);
      setUsersList(extractList(data).map(mapUser));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Active'
  });

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.email) return;

    const newUser = {
      id: `USR${String(usersList.length + 1).padStart(3, '0')}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '+91 00000 00000',
      joined: new Date().toISOString().split('T')[0],
      totalSpent: '₹0',
      orders: 0,
      status: formData.status
    };

    setUsersList([newUser, ...usersList]);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', phone: '', status: 'Active' });
  };

  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (e, userId) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === userId ? null : userId);
  };

  const handleAction = async (e, action, user) => {
    e.stopPropagation();
    if (action === 'view') navigate(`/admin/users/${user.id}`);
    if (action === 'suspend') {
      const { error: apiError } = await usersApi.suspend(user.id);
      if (!apiError) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: 'Inactive' } : u))
        );
      }
    }
    if (action === 'block') {
      const { error: apiError } = await usersApi.block(user.id);
      if (!apiError) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: 'Inactive' } : u))
        );
      }
    }
    if (action === 'unblock') {
      const { error: apiError } = await usersApi.unblock(user.id);
      if (!apiError) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: 'Active' } : u))
        );
      }
    }
    setActiveMenu(null);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Joined', 'Spent', 'Orders', 'Status'];
    const csvContent = [
      headers.join(','),
      ...usersList.map(u => `${u.id},"${u.name}",${u.email},${u.phone},${u.joined},"${u.totalSpent}",${u.orders},${u.status}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Customer Database</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Manage platform buyers, review their spending history and account status.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} />
            Export List
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Buyers', value: usersList.length.toLocaleString(), icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Now', value: '182', icon: Clock, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Avg LTV', value: '₹12,400', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'New This Week', value: '+45', icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by Name, Email or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full sm:w-auto px-6 h-[52px] border rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${isFilterOpen || filterStatus !== 'All' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900'}`}
              >
                <Filter size={18} />
                {filterStatus !== 'All' && <span className="text-[10px] font-black uppercase tracking-widest">{filterStatus}</span>}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-16 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 py-3 overflow-hidden"
                    >
                       <p className="px-4 pb-2 mb-2 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter by Status</p>
                       {['All', 'Active', 'VIP', 'Inactive'].map((status) => (
                         <button 
                            key={status}
                            onClick={() => {
                              setFilterStatus(status);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${filterStatus === status ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                         >
                            {status}
                            {filterStatus === status && <CheckCircle2 size={12} />}
                         </button>
                       ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Member Since</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                <tr 
                  key={user.id} 
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  className="group hover:bg-blue-50/30 cursor-pointer transition-all border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 border border-slate-100">
                          {user.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 font-montserrat leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">{user.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{user.totalSpent}</td>
                  <td className="px-6 py-5">
                     <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">
                        {user.orders} Orders
                     </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{user.joined}</td>
                  <td className="px-6 py-5">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       user.status === 'VIP' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                       user.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-400'
                     }`}>
                        {user.status}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => toggleMenu(e, user.id)}
                      className={`p-2 rounded-lg transition-all ${activeMenu === user.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                       <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                      {activeMenu === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-6 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 py-2 overflow-hidden"
                          >
                             <button onClick={(e) => handleAction(e, 'view', user)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 transition-colors">
                                <Eye size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">View Profile</span>
                             </button>
                             <button onClick={(e) => handleAction(e, 'edit', user)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 transition-colors">
                                <Edit2 size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Edit Information</span>
                             </button>
                             <button onClick={(e) => handleAction(e, 'email', user)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 transition-colors">
                                <Mail size={14} className="text-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Send Email</span>
                             </button>
                             <div className="h-px bg-slate-50 my-1" />
                             <button onClick={(e) => handleAction(e, 'suspend', user)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors">
                                <ShieldAlert size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Suspend Account</span>
                             </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <UsersIcon size={48} className="opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">No customers found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Slide-over */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-lg bg-white h-full rounded-[32px] shadow-2xl p-10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900 font-montserrat uppercase tracking-tight">Add New Customer</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 shadow-sm"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    placeholder="rahul@example.com" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    type="tel" 
                    placeholder="+91 00000 00000" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Initial Status</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 flex gap-4 items-start">
                   <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                      <ShieldCheck size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Platform Sync</p>
                      <p className="text-[11px] text-blue-400 font-bold mt-1 leading-relaxed uppercase">Adding a customer will automatically trigger a welcome email and sync profile across all storefronts.</p>
                   </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 flex gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                <button 
                  onClick={handleSaveCustomer}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   <CheckCircle2 size={16} />
                   Save Customer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
