import React from 'react';
import { ArrowLeft, ShoppingCart, Lock, Share2, Edit2, MoreVertical, Star, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAccountStore from '../../../../store/useAccountStore';
import { getProductImage, handleImageError } from '../../../../shared/utils/imageUtils';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useAccountStore();
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
      setCartCount(cart.length);
    };
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const addToCart = (product, e) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
    if (!cart.some(item => item.id === product.id)) {
      cart.push({ ...product, cartId: Date.now() });
      localStorage.setItem('userCart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    removeFromWishlist(product.id);
    navigate('/cart');
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  const primaryBg = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c08f16]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d64f19]' 
        : 'bg-[#6FAE4A] hover:bg-[#5b953d]';

  const primaryText = isMithilakFlow 
    ? 'text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'text-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const primaryBorder = isMithilakFlow 
    ? 'border-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'border-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'border-[#F26522]' 
        : 'border-[#6FAE4A]';

  const primaryTextActive = isMithilakFlow 
    ? 'text-[#207C8A] active:bg-[#207C8A]/10' 
    : isFreshGroceryFlow 
      ? 'text-[#D9A21B] active:bg-[#D9A21B]/10' 
      : isQuickShopFlow 
        ? 'text-[#F26522] active:bg-[#F26522]/10' 
        : 'text-[#6FAE4A] active:bg-[#6FAE4A]/10';

  return (
    <div className={`min-h-screen pb-24 relative transition-colors duration-300 ${pageBg}`}>
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
      <div className={`sticky top-0 z-50 p-4 flex items-center justify-between shadow-sm relative z-10 transition-colors duration-300 border-b ${headerBg}`}>
        <button onClick={() => navigate(-1)} className={`active:scale-95 transition-transform ${headerTextColor}`}>
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={() => navigate('/cart')}
          className={`relative active:scale-95 transition-transform ${headerTextColor}`}
        >
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#FCF7EE]">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Title Section */}
      <div className="px-4 py-5 bg-transparent relative z-10">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Wishlist</h1>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500">
          <Lock size={14} />
          <span className="text-[13px] font-medium">Private • {wishlist.length} items</span>
        </div>

        {/* Share & Edit Buttons */}
        <div className="flex gap-3 mt-5">
          <button className={`flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-sm text-[14px] font-bold ${primaryText} active:bg-gray-50 transition-colors`}>
            <Share2 size={16} /> Share
          </button>
          <button className={`flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-sm text-[14px] font-bold ${primaryText} active:bg-gray-50 transition-colors`}>
            <Edit2 size={16} /> Edit
          </button>
          <button className="w-10 flex items-center justify-center text-gray-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="border-t border-[#F3E3CD]/60 relative z-10">
        <div className="grid grid-cols-2">
          <AnimatePresence mode="popLayout">
            {wishlist.map((item, idx) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col border-b border-gray-100 ${idx % 2 === 0 ? 'border-r' : ''}`}
                onClick={() => navigate('/product-detail', { state: { product: item } })}
              >
                {/* Product Image Area */}
                <div className="relative aspect-square p-4 bg-white group">
                  <img src={getProductImage(item.image || item.img)} alt={item.name} onError={handleImageError} className="w-full h-full object-contain" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-400 shadow-sm"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="px-3 pb-3 flex-1 flex flex-col">
                  <p className="text-[12px] text-gray-400 font-medium truncate uppercase">{item.brand || 'Premium'}</p>
                  <h4 className="text-[13px] text-gray-600 line-clamp-1 mt-0.5">{item.name}</h4>
                  
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[13px] font-bold text-green-600 flex items-center gap-0.5">
                      <span className="text-[10px]">↓</span>{item.discount || '10%'}
                    </span>
                    <span className="text-[13px] text-gray-400 line-through">
                      ₹{item.oldPrice || (item.price ? (parseFloat(String(item.price).replace(/[^0-9.]/g, '')) + 200) : '0')}
                    </span>
                    <span className="text-[15px] font-bold text-slate-900">₹{item.price || '0'}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4].map(s => <Star key={s} size={12} fill="#16a34a" className="text-green-600" />)}
                      <Star size={12} className="text-gray-200" />
                    </div>
                    <div className={`${isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]'} px-1 rounded-sm flex items-center gap-0.5`}>
                      <span className="text-[9px] text-white font-black italic">f</span>
                      <span className="text-[8px] text-white font-bold">Assured</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => addToCart(item, e)}
                    className={`w-full mt-4 py-2 border border-gray-200 ${primaryText} text-[14px] font-bold rounded-sm active:bg-primary-light transition-colors`}
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {wishlist.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-[18px] font-bold text-slate-800">Your Wishlist is Empty</h3>
            <p className="text-[14px] text-gray-400 mt-1">Add items that you like to your wishlist.</p>
            <button 
              onClick={() => navigate('/home')}
              className={`mt-6 ${isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]'} text-white px-8 py-2.5 rounded-sm font-bold text-[14px] shadow-lg active:scale-95 transition-all`}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;


