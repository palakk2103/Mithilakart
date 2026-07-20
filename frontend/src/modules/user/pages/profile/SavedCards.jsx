import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard, ShieldCheck, Trash2, X, Lock, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSavedCards, createCard, deleteCard } from '../../services/userApi';
import { extractList } from '../../utils/mappers';
import toast from 'react-hot-toast';

const cardColorForType = (type) => (
  type === 'MASTERCARD' ? 'from-gray-800 to-gray-900' : 'from-blue-600 to-indigo-700'
);

const mapCardFromApi = (card) => ({
  id: card.id || card._id,
  number: card.number || `•••• •••• •••• ${card.last4 || '0000'}`,
  expiry: card.expiry || (card.expiryMonth && card.expiryYear
    ? `${card.expiryMonth}/${String(card.expiryYear).slice(-2)}`
    : ''),
  holder: card.holder || card.holderName || '',
  type: card.type || 'VISA',
  color: card.color || cardColorForType(card.type || 'VISA'),
});

const toCardPayload = (formData) => {
  const digits = formData.number.replace(/\s/g, '');
  const [month, year] = formData.expiry.split('/');
  return {
    type: formData.type,
    last4: digits.slice(-4),
    expiryMonth: month,
    expiryYear: year?.length === 2 ? `20${year}` : year,
    holderName: formData.holder.trim(),
  };
};

const SavedCards = () => {
  const navigate = useNavigate();
  const [savedCards, setSavedCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    expiry: '',
    holder: '',
    cvv: '',
    type: 'VISA',
    color: 'from-blue-600 to-indigo-700'
  });

  const loadCards = async () => {
    try {
      const data = await getSavedCards();
      setSavedCards(extractList(data).map(mapCardFromApi));
    } catch (err) {
      toast.error(err?.message || 'Failed to load cards');
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return value;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, number: formatted.substring(0, 19) });

    if (formatted.startsWith('4')) setFormData(prev => ({ ...prev, type: 'VISA', color: 'from-blue-600 to-indigo-700' }));
    else if (formatted.startsWith('5')) setFormData(prev => ({ ...prev, type: 'MASTERCARD', color: 'from-gray-800 to-gray-900' }));
  };

  const formatExpiry = (value) => {
    return value.replace(/[^0-9]/g, '').replace(/^([2-9])/, '0$1').replace(/^(0[1-9]|1[0-2])([0-9])/, '$1/$2').substring(0, 5);
  };

  const handleSave = async () => {
    if (formData.number.length < 19 || formData.expiry.length < 5 || !formData.holder || formData.cvv.length < 3) {
      toast.error('Invalid card details');
      return;
    }

    try {
      await createCard(toCardPayload(formData));
      toast.success('Card added successfully');
      setIsModalOpen(false);
      setFormData({ number: '', expiry: '', holder: '', cvv: '', type: 'VISA', color: 'from-blue-600 to-indigo-700' });
      await loadCards();
    } catch (err) {
      toast.error(err?.message || 'Failed to save card');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCard(id);
      toast.success('Card removed');
      await loadCards();
    } catch (err) {
      toast.error(err?.message || 'Failed to remove card');
    }
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${pageBg} min-h-screen text-slate-800 relative transition-colors duration-300`}
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

      {/* Header */}
      <div className={`sticky top-0 z-50 p-4 flex items-center justify-between relative z-10 transition-colors duration-300 border-b ${headerBg}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className={`hover:opacity-80 transition-colors ${headerTextColor}`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-lg font-black uppercase tracking-widest ${headerTextColor}`}>Saved Cards</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={`text-current ${isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]'}`}>
          <Plus size={24} />
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 w-full space-y-8 relative z-10">
        <div className="space-y-6">
          <AnimatePresence>
            {savedCards.map((card) => (
              <motion.div 
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`relative rounded-3xl p-6 h-52 bg-gradient-to-br ${card.color} shadow-2xl overflow-hidden group mb-4`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/10 rounded-xl">
                          <CreditCard size={28} className="text-white" />
                      </div>
                      <div className="flex gap-4">
                          <span className="text-white font-black italic tracking-tighter text-xl">{card.type}</span>
                          <button 
                            onClick={() => handleDelete(card.id)}
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-white text-xl font-black tracking-[4px]">{card.number}</div>
                      <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[8px] text-white/60 uppercase tracking-widest mb-1 font-black">Card Holder</p>
                            <p className="text-sm text-white font-black uppercase tracking-widest">{card.holder}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] text-white/60 uppercase tracking-widest mb-1 font-black">Expires</p>
                            <p className="text-sm text-white font-black">{card.expiry}</p>
                          </div>
                      </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {savedCards.length === 0 && (
             <div className="text-center py-20 bg-black/10 rounded-3xl border border-dashed border-[var(--card-border)]">
                <CreditCard size={40} className="mx-auto text-[var(--card-sub)] mb-4 opacity-20" />
                <p className="text-sm text-[var(--card-sub)] font-bold uppercase tracking-widest">No saved cards found</p>
             </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-black/20 border border-[var(--card-border)] rounded-2xl p-6 flex gap-4 items-start">
           <div className="p-2 bg-green-500/10 rounded-full text-green-500">
              <ShieldCheck size={24} />
           </div>
           <div>
              <h3 className="text-sm font-black text-[var(--card-text)] mb-1 uppercase tracking-widest italic">Mithilakart SECURE</h3>
              <p className="text-[10px] text-[var(--card-sub)] font-bold leading-relaxed uppercase tracking-widest">Your card details are stored securely using industry-standard encryption. We never share your data.</p>
           </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[var(--color-gold)] text-black py-4 rounded-2xl font-black uppercase tracking-[3px] shadow-[0_10px_20px_rgba(226,167,80,0.2)] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all active:scale-95"
        >
          <Plus size={20} /> Add New Card
        </button>
      </div>

      {/* Slide-up Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--card-border)] rounded-t-[32px] z-[70] p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest">Add New Card</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Real-time Card Preview */}
              <div className={`rounded-2xl p-5 h-44 bg-gradient-to-br ${formData.color} shadow-xl mb-8 relative overflow-hidden transition-all duration-500`}>
                 <div className="relative z-10 h-full flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                       <CreditCard size={24} />
                       <span className="font-black italic">{formData.type}</span>
                    </div>
                    <div className="text-lg font-black tracking-[4px]">{formData.number || '•••• •••• •••• ••••'}</div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <div>
                          <p className="opacity-60 mb-1">Holder</p>
                          <p>{formData.holder || 'YOUR NAME'}</p>
                       </div>
                       <div className="text-right">
                          <p className="opacity-60 mb-1">Expires</p>
                          <p>{formData.expiry || 'MM/YY'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                {/* Card Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[3px] ml-1">Card Number</label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--card-sub)]" />
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000"
                      value={formData.number}
                      onChange={handleCardNumberChange}
                      className="w-full bg-black/20 border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-[var(--color-gold)]/50 transition-all"
                    />
                  </div>
                </div>

                {/* Holder Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[3px] ml-1">Card Holder</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--card-sub)]" />
                    <input 
                      type="text" 
                      placeholder="Full name as on card"
                      value={formData.holder}
                      onChange={(e) => setFormData({...formData, holder: e.target.value.toUpperCase()})}
                      className="w-full bg-black/20 border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-[var(--color-gold)]/50 transition-all"
                    />
                  </div>
                </div>

                {/* Expiry & CVV Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[3px] ml-1">Expiry Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--card-sub)]" />
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={(e) => setFormData({...formData, expiry: formatExpiry(e.target.value)})}
                        className="w-full bg-black/20 border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-[var(--color-gold)]/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[3px] ml-1">CVV</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--card-sub)]" />
                      <input 
                        type="password" 
                        placeholder="***"
                        maxLength="3"
                        value={formData.cvv}
                        onChange={(e) => setFormData({...formData, cvv: e.target.value.replace(/[^0-9]/g, '')})}
                        className="w-full bg-black/20 border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-[var(--color-gold)]/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-8">
                  <button 
                    onClick={handleSave}
                    className="w-full bg-[var(--color-gold)] text-black py-4 rounded-2xl font-black uppercase tracking-[3px] shadow-[0_10px_20px_rgba(226,167,80,0.2)] hover:scale-[1.02] transition-all active:scale-95"
                  >
                    Save Card
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

export default SavedCards;
