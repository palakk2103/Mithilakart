import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, MapPin, Edit2, Trash2,
  Home, Building2, MoreVertical, X, Phone, User, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../../services/userApi';
import { extractList } from '../../utils/mappers';
import toast from 'react-hot-toast';

const mapAddressFromApi = (addr) => ({
  id: addr.id || addr._id,
  name: addr.name || '',
  phone: addr.phone || '',
  address: addr.address || addr.addressLine || '',
  type: addr.type || 'HOME',
  pincode: addr.pincode || '',
  isDefault: Boolean(addr.isDefault),
});

const toAddressPayload = (formData) => ({
  type: formData.type || 'HOME',
  name: formData.name.trim(),
  phone: formData.phone.trim(),
  addressLine: formData.address.trim(),
  pincode: formData.pincode || '000000',
});

const SavedAddresses = () => {
  const navigate = useNavigate();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', type: 'HOME', pincode: '' });

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      const items = extractList(data).map(mapAddressFromApi);
      setSavedAddresses(items);
      const defaultAddr = items.find((a) => a.isDefault);
      setSelectedAddressId((prev) => prev || defaultAddr?.id || items[0]?.id || null);
    } catch (err) {
      toast.error(err?.message || 'Failed to load addresses');
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenModal = (addr = null) => {
    if (addr) {
      setEditingAddress(addr);
      setFormData({
        name: addr.name,
        phone: addr.phone,
        address: addr.address,
        type: addr.type,
        pincode: addr.pincode || '',
      });
    } else {
      setEditingAddress(null);
      setFormData({ name: '', phone: '', address: '', type: 'HOME', pincode: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('All fields are required');
      return;
    }

    try {
      const payload = toAddressPayload(formData);
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
        toast.success('Address updated');
      } else {
        const created = await createAddress(payload);
        const mapped = mapAddressFromApi(created);
        setSelectedAddressId(mapped.id);
        toast.success('Address added & selected');
      }
      setIsModalOpen(false);
      await loadAddresses();
    } catch (err) {
      toast.error(err?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteAddress(id);
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success('Address removed');
      await loadAddresses();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete address');
    }
  };

  const handleSelectAddress = async (addr) => {
    try {
      await setDefaultAddress(addr.id);
      setSelectedAddressId(addr.id);
      toast.success(`Deliver to ${addr.type} selected`);
      await loadAddresses();
    } catch (err) {
      toast.error(err?.message || 'Failed to set default address');
    }
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  const primaryBg = isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]');
  const primaryText = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]');
  const primaryBorder = isMithilakFlow ? 'border-[#207C8A]' : isFreshGroceryFlow ? 'border-[#D9A21B]' : (isQuickShopFlow ? 'border-[#F26522]' : 'border-[#6FAE4A]');
  const primaryLightBg = isMithilakFlow ? 'bg-[#e0f2f1]/40' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : (isQuickShopFlow ? 'bg-[#FFF5EE]' : 'bg-primary-light');
  const focusBorder = isMithilakFlow ? 'focus:border-[#207C8A]' : isFreshGroceryFlow ? 'focus:border-[#D9A21B]' : (isQuickShopFlow ? 'focus:border-[#F26522]' : 'focus:border-[#6FAE4A]');
  const shadowAccent = isMithilakFlow ? 'shadow-[0_4px_16px_rgba(32,124,138,0.22)]' : isFreshGroceryFlow ? 'shadow-[0_4px_16px_rgba(217,162,27,0.15)]' : (isQuickShopFlow ? 'shadow-[0_4px_16px_rgba(242,101,34,0.22)]' : 'shadow-md shadow-emerald-100');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${pageBg} min-h-screen relative pb-20 transition-colors duration-300`}
    >
      {/* Global Repeating Mithila Art Page Background Texture */}
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.018] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* ── Header ── */}
      <div className={`sticky top-0 z-50 p-4 flex items-center justify-between relative z-10 transition-colors duration-300 border-b ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={2.5} className={headerTextColor} />
          </button>
          <h1 className={`text-[15px] font-black uppercase tracking-widest ${headerTextColor}`}>Saved Addresses</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="p-1.5 rounded-full hover:bg-primary-light transition-colors"
          aria-label="Add address"
        >
          <Plus size={22} strokeWidth={2} className={primaryText} />
        </button>
      </div>

      <div className="px-4 py-5 w-full mx-auto space-y-5 relative z-10">

        {/* ── Add Button ── */}
        <button
          onClick={() => handleOpenModal()}
          className={`w-full ${primaryBg} text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[13px] ${shadowAccent} flex items-center justify-center gap-2 active:scale-95 transition-transform`}
        >
          <Plus size={18} strokeWidth={2.5} /> Add New Address
        </button>

        {/* ── Section label ── */}
        <div className="flex items-center justify-between px-1">
          <span className={`text-[10px] font-black ${primaryText} uppercase tracking-[3px]`}>Your Addresses</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tap to select primary</span>
        </div>

        {/* ── Address Cards ── */}
        <AnimatePresence>
          {savedAddresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <motion.div
                key={addr.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleSelectAddress(addr)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `${primaryBorder} shadow-md scale-[1.01]`
                    : 'border-gray-100 shadow-sm hover:border-blue-200'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? `${primaryBg} text-white` : `${primaryLightBg} ${primaryText}`}`}>
                      {addr.type === 'HOME' ? <Home size={13} strokeWidth={2} /> : <Building2 size={13} strokeWidth={2} />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? primaryText : 'text-gray-600'}`}>
                      {addr.type}
                    </span>
                    {isSelected && (
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <CheckCircle2 size={10} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Active</span>
                      </div>
                    )}
                  </div>
                  <button className="text-gray-300 hover:text-gray-500 transition-colors">
                    <MoreVertical size={17} />
                  </button>
                </div>

                {/* Address info */}
                <h3 className={`text-[13px] font-black mb-1 ${isSelected ? primaryText : 'text-gray-800'}`}>
                  {addr.name}
                </h3>
                <p className="text-[12px] text-gray-500 font-medium leading-relaxed">{addr.address}</p>
                <p className="text-[12px] font-bold text-gray-700 mt-1.5">{addr.phone}</p>

                {/* Actions */}
                <div className="flex gap-4 pt-3 mt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(addr); }}
                    className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${primaryText} hover:opacity-70 transition-opacity`}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(addr.id, e)}
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-red-500 hover:opacity-70 transition-opacity"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {savedAddresses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <MapPin size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-[13px] text-gray-400 font-bold uppercase tracking-widest">No saved addresses</p>
          </div>
        )}
      </div>

      {/* ── Slide-up Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[70] p-5 max-h-[92vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[16px] font-black text-gray-800">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black ${primaryText} uppercase tracking-[2px] ml-1`}>Receiver Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium focus:outline-none ${focusBorder} transition-colors`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black ${primaryText} uppercase tracking-[2px] ml-1`}>Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium focus:outline-none ${focusBorder} transition-colors`}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black ${primaryText} uppercase tracking-[2px] ml-1`}>Complete Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <textarea
                      placeholder="House No, Building, Street, Area..."
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium focus:outline-none ${focusBorder} transition-colors resize-none`}
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black ${primaryText} uppercase tracking-[2px] ml-1`}>Address Type</label>
                  <div className="flex gap-3">
                    {['HOME', 'WORK'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-2.5 rounded-xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          formData.type === type
                            ? `${primaryBg} text-white ${primaryBorder} ${shadowAccent}`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                        }`}
                      >
                        {type === 'HOME' ? <Home size={13} /> : <Building2 size={13} />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-2 pb-6">
                  <button
                    onClick={handleSave}
                    className={`w-full ${primaryBg} text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[13px] ${shadowAccent} active:scale-95 transition-transform`}
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SavedAddresses;
