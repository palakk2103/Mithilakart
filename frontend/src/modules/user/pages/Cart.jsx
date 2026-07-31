import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, ChevronRight, CheckCircle, Info, Trash2,
  ArrowLeft, ShieldCheck, MapPin, Truck, Star, Heart, Zap, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import { fetchCartItems, updateCartItemQuantity, removeCartItemById } from '../utils/cartUtils';
import { isAuthenticated as checkAuth } from '../../../shared/api/tokenStorage';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { getDisplayAddress, useHydrateAddresses } from '../../../shared/hooks/useDeliverToAddress';
import useAccountStore from '../../../store/useAccountStore';
import { getUser } from '../../../shared/api/tokenStorage';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { getWishlist, addToWishlist as addToWishlistApi, removeFromWishlist as removeFromWishlistApi } from '../services/userApi';
import { extractList, mapWishlistItem } from '../utils/mappers';
import { addProductToCart } from '../utils/cartUtils';

const Cart = () => {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  const { savedAddresses, selectedAddressId, wishlist, addToWishlist: addToWishlistStore, removeFromWishlist: removeFromWishlistStore } = useAccountStore();
  useHydrateAddresses();
  const deliverTo = getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation });

  const theme = useTabTheme();
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const primaryBg = `${theme.primaryBg} ${theme.primaryBgHover}`;
  const primaryText = theme.primaryText;
  const shopNowLink = isMithilakFlow ? '/mithilak' : (isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/vendor/home'));

  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth('customer'));
  const [address, setAddress] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrDetails, setAddrDetails] = useState('');

  // Remove confirmation modal state
  const [itemToRemove, setItemToRemove] = useState(null);

  // Local Wishlist state for real-time rendering on Cart page
  const [localWishlist, setLocalWishlist] = useState([]);

  // Load cart items from API
  const loadCart = async () => {
    try {
      const { items } = await fetchCartItems();
      setCartItems(items);
    } catch (e) {
      console.error('Failed to load cart', e);
    }
  };

  // Load Wishlist items
  const loadWishlistItems = async () => {
    try {
      const data = await getWishlist();
      const items = extractList(data).map((p) => mapWishlistItem(p));
      setLocalWishlist(items.length > 0 ? items : wishlist);
    } catch {
      setLocalWishlist(wishlist);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadCart();
    loadWishlistItems();

    const onCartUpdated = () => loadCart();
    window.addEventListener('cartUpdated', onCartUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('cartUpdated', onCartUpdated);
    };
  }, []);

  // Sync delivery address from live GPS / saved profile
  useEffect(() => {
    const user = getUser('customer');
    if (deliverTo.source === 'live' || deliverTo.source === 'saved') {
      setAddress({
        name: user?.name || 'Delivery',
        phone: user?.phone || '',
        address: deliverTo.label,
      });
    }
  }, [deliverTo.label, deliverTo.source]);

  // Re-sync auth when returning from login
  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(checkAuth('customer'));
    };

    window.addEventListener('customer-auth-changed', syncAuthState);
    window.addEventListener('popstate', syncAuthState);
    window.addEventListener('focus', syncAuthState);
    syncAuthState();

    return () => {
      window.removeEventListener('customer-auth-changed', syncAuthState);
      window.removeEventListener('popstate', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
    };
  }, []);

  const handleConfirmRemove = async (moveToWishlist) => {
    if (!itemToRemove) return;
    const targetItem = itemToRemove;
    setItemToRemove(null);

    try {
      if (moveToWishlist) {
        const prod = {
          id: targetItem.productId || targetItem.id,
          name: targetItem.name,
          price: targetItem.price,
          image: targetItem.image,
          brand: targetItem.brand,
        };
        try {
          await addToWishlistApi(prod.id);
        } catch {
          // ignore offline/demo error
        }
        addToWishlistStore(prod);
        setLocalWishlist((prev) => {
          if (prev.some((w) => w.id === prod.id)) return prev;
          return [prod, ...prev];
        });
      }

      await removeCartItemById(targetItem.cartId);
      setCartItems((prev) => prev.filter((item) => item.cartId !== targetItem.cartId));
    } catch (e) {
      console.error('Failed to remove item', e);
    }
  };

  const handleAddWishlistItemToCart = async (product) => {
    try {
      await addProductToCart(product);
      try {
        await removeFromWishlistApi(product.id);
      } catch {
        // ignore API error in offline/demo mode
      }
      removeFromWishlistStore(product.id);
      setLocalWishlist((prev) => prev.filter((item) => item.id !== product.id));
      await loadCart();
    } catch (e) {
      console.error('Failed to add wishlist item to cart', e);
    }
  };

  const updateQuantity = async (cartId, delta) => {
    const item = cartItems.find((i) => i.cartId === cartId);
    if (!item) return;

    try {
      const newQty = await updateCartItemQuantity(item, delta);
      setCartItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cartId === cartId ? { ...cartItem, qty: newQty, quantity: newQty } : cartItem
        )
      );
    } catch (e) {
      console.error('Failed to update quantity', e);
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    return acc + parsePrice(item.price) * parsePrice(item.qty || 1);
  }, 0);

  const totalOldPrice = cartItems.reduce((acc, item) => {
    return acc + parsePrice(item.oldPrice) * parsePrice(item.qty || 1);
  }, 0);

  const savings = totalOldPrice - totalPrice;
  const shippingCost = totalPrice > 500 ? 0 : 39;

  return (
    <div className={`min-h-screen pb-32 font-sans text-slate-800 flex flex-col transition-colors duration-300 relative ${
      isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]' : isQuickShopFlow ? 'bg-[#FFF5EE]' : 'bg-bg-cream'
    }`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      {(isFreshGroceryFlow || !(isMithilakFlow || isQuickShopFlow)) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-[100] px-4 py-3 flex items-center justify-between border-b transition-colors duration-300 relative ${
        isFreshGroceryFlow 
          ? 'bg-[#D9A21B] border-transparent text-white' 
          : isMithilakFlow
            ? 'bg-[#207C8A] border-transparent text-white'
            : isQuickShopFlow
              ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00] border-transparent text-white'
              : 'bg-[#FCF7EE] border-[#F3E3CD]/60'
      }`}>
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform border border-slate-100/50"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className={`text-[17px] font-black tracking-tight ${isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow ? 'text-white' : 'text-slate-800'}`}>{t('nav.cart')}</h1>
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100/50 font-bold select-none cursor-pointer">
          •••
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 ${cartItems.length === 0 ? "flex-1 flex flex-col justify-center px-4 mt-2" : "px-4 mt-2"}`}>
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-[28px] text-center py-20 px-6 flex flex-col items-center justify-center shadow-sm border border-slate-100/50 animate-in fade-in duration-300">
            {/* Custom Empty Cart Illustration */}
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
              {/* Floating Sparkles */}
              <path d="M40 85h6v-6h2v6h6v2h-6v6h-2v-6h-6v-2z" fill="#9ca3af" />
              <path d="M80 35h4v-4h2v4h4v2h-4v4h-2v-4h-4v-2z" fill="#9ca3af" />
              <path d="M150 100h4v-4h2v4h4v2h-4v4h-2v-4h-4v-2z" fill="#9ca3af" />
              <path d="M60 145h4v-4h2v4h4v2h-4v4h-2v-4h-4v-2z" fill="#9ca3af" />

              {/* Speed Lines */}
              <line x1="45" y1="90" x2="65" y2="90" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="55" y1="102" x2="70" y2="102" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="114" x2="62" y2="114" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />

              {/* Cart Frame */}
              <path d="M57 90h15l15 45h35l14-30H79" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Cart Grid */}
              <line x1="88" y1="95" x2="88" y2="135" stroke="#f3f4f6" strokeWidth="2" />
              <line x1="102" y1="95" x2="102" y2="135" stroke="#f3f4f6" strokeWidth="2" />
              <line x1="116" y1="95" x2="116" y2="135" stroke="#f3f4f6" strokeWidth="2" />
              <line x1="82" y1="105" x2="124" y2="105" stroke="#f3f4f6" strokeWidth="2" />
              <line x1="85" y1="120" x2="128" y2="120" stroke="#f3f4f6" strokeWidth="2" />

              {/* Wheels */}
              <circle cx="86" cy="144" r="9" fill="#fecaca" stroke="#374151" strokeWidth="2" />
              <circle cx="86" cy="144" r="3" fill="#374151" />
              <circle cx="120" cy="144" r="9" fill="#fecaca" stroke="#374151" strokeWidth="2" />
              <circle cx="120" cy="144" r="3" fill="#374151" />

              {/* Plus Badge */}
              <circle cx="132" cy="94" r="13" fill="#bfdbfe" />
              <path d="M129 94h6M132 91v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h2 className="text-[16px] font-black text-slate-800 tracking-tight">
              {t('cart.empty')}
            </h2>
            <p className="text-[13px] text-slate-400 font-bold mt-1.5 mb-8">
              {t('cart.emptySubtitle')}
            </p>
            
            {/* Action Button */}
            <Link to={shopNowLink} className={`inline-block ${primaryBg} text-white px-12 py-3 rounded-full font-black uppercase text-[12px] shadow-md tracking-wider active:scale-95 transition-transform`}>
              {t('cart.shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-3 md:gap-8 md:space-y-0 md:max-w-6xl md:mx-auto md:px-4 md:py-6">
            {/* Left Column (Items & Address) */}
            <div className="md:col-span-2 space-y-4">
              {/* Delivery Address Card */}
              <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border border-slate-100/50 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    {address ? 'Deliver to Home' : 'Delivery Address'}
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium mt-1 leading-normal">
                    {address ? `${address.name} | ${address.address} | Phone: ${address.phone}` : 'Please login and add an address to proceed.'}
                  </p>
                </div>
                {address ? (
                  <button 
                    onClick={() => {
                      setAddrName(address.name || '');
                      setAddrPhone(address.phone || '');
                      setAddrDetails(address.address || '');
                      setShowAddressModal(true);
                    }}
                    className={`${primaryText} text-[11px] font-black uppercase tracking-wider border border-slate-100 hover:bg-slate-50 px-4 py-2 rounded-full active:scale-95 transition-transform`}
                  >
                    Change
                  </button>
                ) : (
                  isAuthenticated && (
                    <button 
                      onClick={() => setShowAddressModal(true)}
                      className={`${primaryText} text-[11px] font-black uppercase tracking-wider border border-slate-150 hover:bg-slate-50 px-4 py-2 rounded-full active:scale-95 transition-transform`}
                    >
                      Add Address
                    </button>
                  )
                )}
              </div>

              {/* Populated Items Card */}
              <div className="bg-white rounded-[28px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-5">
                {cartItems.map((item, idx) => (
                  <div key={item.cartId} className="flex flex-col">
                    {idx > 0 && <div className="h-[1px] bg-slate-100 mb-5" />}
                    <div className="flex gap-4 items-center relative">
                      {/* Item Image Box */}
                      <div className="w-[84px] h-[84px] rounded-[18px] bg-slate-50 border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-[13.5px] font-black text-slate-800 truncate leading-snug">{item.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{item.brand || 'Premium Brand'}</p>
                        <p className="text-[15px] font-black text-slate-900 mt-1">{formatPrice(item.price)}</p>
                        
                        {/* Quantity Pill Capsule */}
                        <div className="flex items-center gap-3 border border-slate-150 rounded-full px-2.5 py-1 w-fit mt-2 bg-white select-none">
                          <button 
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="text-slate-400 hover:text-slate-700 active:scale-90 transition-transform font-bold text-[14px] px-1"
                          >
                            —
                          </button>
                          <span className="text-[11px] font-black text-slate-800 min-w-[12px] text-center">
                            {item.qty || 1}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className={`${primaryBg} text-white rounded-full w-5 h-5 flex items-center justify-center active:scale-90 transition-transform font-black text-[12px] leading-none`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button 
                        onClick={() => setItemToRemove(item)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-600 hover:text-rose-800 p-2 rounded-full hover:bg-rose-50/50 active:scale-90 transition-transform"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wishlist Items Section on Cart Page */}
              {localWishlist && localWishlist.length > 0 && (
                <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart size={18} className="text-rose-500 fill-rose-500" />
                      <h3 className="text-[14px] font-black text-slate-800 tracking-tight">
                        Items in Your Wishlist ({localWishlist.length})
                      </h3>
                    </div>
                    <Link to="/wishlist" className={`text-[11px] font-black uppercase tracking-wider ${primaryText}`}>
                      View All
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {localWishlist.slice(0, 6).map((item) => (
                      <div key={item.id} className="border border-slate-100 rounded-2xl p-3 flex flex-col justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center mb-2 border border-slate-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <h4 className="text-[12px] font-bold text-slate-800 text-center truncate w-full">{item.name}</h4>
                        <p className="text-[12px] font-black text-slate-900 mt-0.5">{formatPrice(item.price)}</p>
                        <button
                          onClick={() => handleAddWishlistItemToCart(item)}
                          className={`mt-2.5 w-full py-1.5 ${primaryBg} text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1`}
                        >
                          <ShoppingCart size={12} />
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Summary & Desktop Action) */}
            <div className="md:col-span-1 space-y-4">
              {/* Pricing Summary Card */}
              <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5">
                <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
                  <span>{t('cart.subtotal')}</span>
                  <span className="text-slate-800 font-black">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
                  <span>{t('cart.shippingAndTax')}</span>
                  <span className="text-slate-800 font-black">
                    {shippingCost === 0 ? t('cart.free') : formatPrice(shippingCost)}
                  </span>
                </div>
                
                <div className="border-t border-dashed border-slate-200 my-2" />

                <div className="flex justify-between items-center text-[15px] font-black text-slate-800">
                  <span>{t('cart.total')}</span>
                  <span className="text-[18px] text-slate-900">{formatPrice(totalPrice + shippingCost)}</span>
                </div>
              </div>

              {/* Desktop Checkout button */}
              {!isAuthenticated ? (
                <button 
                  onClick={() => navigate('/login', { state: { from: '/cart' } })}
                  className={`hidden md:flex w-full ${primaryBg} text-white font-black py-4 rounded-full active:scale-[0.98] transition-all items-center justify-center text-[14px] shadow-md cursor-pointer`}
                >
                  Login to Proceed
                </button>
              ) : !address ? (
                <button 
                  onClick={() => setShowAddressModal(true)}
                  className={`hidden md:flex w-full ${primaryBg} text-white font-black py-4 rounded-full active:scale-[0.98] transition-all items-center justify-center text-[14px] shadow-md cursor-pointer`}
                >
                  Add Address
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/vendor/checkout', { state: { product: cartItems[0] } })}
                  className={`hidden md:flex w-full ${primaryBg} text-white font-black py-4 rounded-full active:scale-[0.98] transition-all items-center justify-center text-[14px] shadow-md cursor-pointer`}
                >
                  Proceed to Checkout
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar (Mobile Only) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-3.5 flex items-center justify-between z-50 shadow-[0_10px_30px_rgba(8,66,36,0.08)] rounded-[24px] md:hidden">
          <div className="flex flex-col pr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('cart.totalAmount')}</span>
            <span className="text-[18px] font-black text-slate-905 leading-none mt-1">{formatPrice(totalPrice + shippingCost)}</span>
          </div>
          {!isAuthenticated ? (
            <button 
              onClick={() => navigate('/login', { state: { from: '/cart' } })}
              className={`${primaryBg} text-white rounded-full px-6 py-3.5 font-black uppercase text-[11px] tracking-wider shadow-[0_4px_16px_rgba(8,66,36,0.22)] active:scale-95 transition-transform`}
            >
              Login to Proceed
            </button>
          ) : !address ? (
            <button 
              onClick={() => setShowAddressModal(true)}
              className={`${primaryBg} text-white rounded-full px-6 py-3.5 font-black uppercase text-[11px] tracking-wider shadow-[0_4px_16px_rgba(8,66,36,0.22)] active:scale-95 transition-transform`}
            >
              Add Address
            </button>
          ) : (
            <button 
              onClick={() => navigate('/vendor/checkout', { state: { product: cartItems[0] } })}
              className={`${primaryBg} text-white rounded-full px-6 py-3.5 font-black uppercase text-[11px] tracking-wider shadow-[0_4px_16px_rgba(8,66,36,0.22)] active:scale-95 transition-transform`}
            >
              Proceed to Checkout
            </button>
          )}
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-[400px] p-6 shadow-2xl border border-slate-100/50 relative transform animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddressModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-[20px] font-black text-slate-800 tracking-tight mb-5">
              Add Delivery Address
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const newAddress = { name: addrName, phone: addrPhone, address: addrDetails };
              setAddress(newAddress);
              setShowAddressModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receiver's Name</label>
                <input 
                  type="text" 
                  value={addrName} 
                  onChange={(e) => setAddrName(e.target.value)} 
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={addrPhone} 
                  onChange={(e) => setAddrPhone(e.target.value)} 
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Address</label>
                <textarea 
                  value={addrDetails} 
                  onChange={(e) => setAddrDetails(e.target.value)} 
                  placeholder="Street, Landmark, City, Pincode"
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all resize-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className={`w-full py-4 mt-2 ${primaryBg} text-white font-black rounded-2xl text-[13px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer`}
              >
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Remove / Move to Wishlist Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-[380px] p-6 shadow-2xl border border-slate-100/50 relative transform animate-in zoom-in-95 duration-200 text-center">
            <button 
              onClick={() => setItemToRemove(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Product Image preview */}
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 mx-auto p-2 flex items-center justify-center mb-4">
              <img src={itemToRemove.image} alt={itemToRemove.name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>

            <h3 className="text-[18px] font-black text-slate-800 tracking-tight leading-snug">
              Remove Item from Cart?
            </h3>
            <p className="text-[12.5px] text-slate-500 font-medium mt-1 mb-6 px-2">
              "{itemToRemove.name}" can be saved to your Wishlist for later or deleted.
            </p>

            <div className="space-y-2.5">
              <button 
                onClick={() => handleConfirmRemove(true)}
                className={`w-full py-3.5 ${primaryBg} text-white font-black rounded-2xl text-[12px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Heart size={16} className="fill-white text-white" />
                Move to Wishlist
              </button>

              <button 
                onClick={() => handleConfirmRemove(false)}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl text-[12px] uppercase tracking-wider border border-rose-100 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                Remove from Cart
              </button>

              <button 
                onClick={() => setItemToRemove(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-[12px] active:scale-[0.98] transition-transform cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Payments Footer */}
      <div className="mt-8 px-6 py-6 flex flex-col items-center gap-3 text-slate-400/80">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className={`${primaryText}/70`} />
          <span className="text-[11px] font-black uppercase tracking-wider">{t('cart.safePayments')}</span>
        </div>
        <p className="text-[10px] text-center leading-relaxed font-bold">
          {t('cart.paymentsSubtitle')}
        </p>
      </div>
    </div>
  );
};

export default Cart;
