import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Search, ShoppingCart, Star, Heart, Send,
  Share2, ChevronRight, X, MapPin, Truck, RotateCcw, IndianRupee, AlertCircle
} from 'lucide-react';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useAccountStore from '../../../store/useAccountStore';
import { useTranslation } from 'react-i18next';
import ProductNotFound from '../components/common/ProductNotFound';
import ShippingUnavailable from '../components/common/ShippingUnavailable';
import { getProductImage, handleImageError } from '../../../shared/utils/imageUtils';



// Import Assets
import PlumShampoo from '../../../assets/products/product05.jpg';
import FashionHero from '../../../assets/products/product06.jpg';
import LorealShampoo from '../../../assets/products/product07.jpg';
import EarbudsDeal from '../../../assets/products/product03.jpg';
import Tshirt from '../../../assets/products/product05.jpg';
import FlipFlops from '../../../assets/products/product07.jpg';
import Suitcase from '../../../assets/products/product09.jpg';
import TopSection1 from '../../../assets/TopSection/TopSection1.jpg';
import Balloons from '../../../assets/products/product10.jpg';
import SplitAC from '../../../assets/products/product08.jpg';
import TowerFan from '../../../assets/products/product09.jpg';

const ProductDetail = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const primaryText = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]');
  const primaryBg = isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]');
  const primaryBgHover = isMithilakFlow ? 'hover:bg-[#1a6874]' : isFreshGroceryFlow ? 'hover:bg-[#c49218]' : (isQuickShopFlow ? 'hover:bg-[#d45014]' : 'hover:bg-[#5b953d]');
  const primaryBorder = isMithilakFlow ? 'border-[#207C8A]' : isFreshGroceryFlow ? 'border-[#D9A21B]' : (isQuickShopFlow ? 'border-[#F26522]' : 'border-[#6FAE4A]');
  const primaryLightBg = isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : (isQuickShopFlow ? 'bg-[#FFF5EE]' : 'bg-primary-light');
  const shadowColor = isMithilakFlow ? 'shadow-[0_4px_16px_rgba(32,124,138,0.22)]' : isFreshGroceryFlow ? 'shadow-[0_4px_16px_rgba(217,162,27,0.15)]' : (isQuickShopFlow ? 'shadow-[0_4px_16px_rgba(242,101,34,0.22)]' : 'shadow-[0_4px_16px_rgba(8,66,36,0.22)]');
  const shadowColorLight = isMithilakFlow ? 'shadow-[0_10px_30px_rgba(32,124,138,0.08)]' : isFreshGroceryFlow ? 'shadow-[0_10px_30px_rgba(217,162,27,0.06)]' : (isQuickShopFlow ? 'shadow-[0_10px_30px_rgba(242,101,34,0.08)]' : 'shadow-[0_10px_30px_rgba(8,66,36,0.08)]');
  
  const accentBg = isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-orange-500' : 'bg-green-500');
  const accentText = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : (isQuickShopFlow ? 'text-orange-500' : 'text-green-500');
  const accentBorder = isMithilakFlow ? 'border-[#207C8A]' : isFreshGroceryFlow ? 'border-[#D9A21B]' : (isQuickShopFlow ? 'border-orange-500' : 'border-green-500');

  const [selectedSize, setSelectedSize] = useState('S');
  const { wishlist, addToWishlist, removeFromWishlist } = useAccountStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showReturnPolicy, setShowReturnPolicy] = useState(false);
  const [isReturnExpanded, setIsReturnExpanded] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [isSupportExpanded, setIsSupportExpanded] = useState(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(true);
  const [isAllDetailsOpen, setIsAllDetailsOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('Specifications');
  const [activePaymentTab, setActivePaymentTab] = useState('COD');
  const [touchStart, setTouchStart] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeliveryUnavailable, setIsDeliveryUnavailable] = useState(false);
  const [pincode, setPincode] = useState('');
  const [isPincodeChecked, setIsPincodeChecked] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  const handlePincodeCheck = () => {
    if (pincode.length < 6) {
      setPincodeError('Please enter a valid 6-digit pincode');
      setIsPincodeChecked(false);
      return;
    }
    setPincodeError('');
    setIsPincodeChecked(true);
    if (pincode === '999999' || pincode.startsWith('9')) {
      setIsDeliveryUnavailable(true);
    } else {
      setIsDeliveryUnavailable(false);
    }
  };



  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const handleTouchMove = (e, setExpanded, isExpanded) => {
    const touchDown = e.targetTouches[0].clientY;
    if (touchStart - touchDown > 50 && !isExpanded) {
      setExpanded(true);
    }
    if (touchDown - touchStart > 100 && isExpanded) {
      setExpanded(false);
    }
  };

  const product = useMemo(() => location.state?.product || {
    id: '1',
    brand: 'Lounge Dreams',
    name: 'Women Boxy Fit Checked Casual Shirt',
    price: 1559,
    oldPrice: 2999,
    discount: '48% off',
    rating: 4.2,
    ratingCount: 4,
    image: PlumShampoo,
    category: 'Fashion'
  }, [location.state]);

  const isOutOfStock = useMemo(() => {
    return product.stock === 0 || product.isOutOfStock === true || product.status === 'Out of Stock' || product.outOfStock === true;
  }, [product]);

  const detailsData = useMemo(() => ({
    highlights: [
      { label: 'Pack of', value: product.pack || '1' },
      { label: 'Fabric', value: product.fabric || 'Wool Blend' },
      { label: 'Sleeve', value: product.sleeve || 'Full Sleeve' },
      { label: 'Pattern', value: product.pattern || 'Checkered' },
      { label: 'Collar', value: product.collar || 'Spread' },
      { label: 'Color', value: product.color || 'Pink' }
    ],
    specs: [
      { label: 'Brand', value: product.brand },
      { label: 'Size', value: product.size || 'M' },
      { label: 'Fit', value: product.fit || 'Regular' },
      { label: 'Fabric Care', value: 'Machine wash as per tag' },
      { label: 'Suitable For', value: 'Western Wear' },
      { label: 'Hem', value: 'Curved' }
    ]
  }), [product]);

  const images = useMemo(() => {
    const mainImg = getProductImage(product.image || product.img || (product.images && product.images[0]));
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map(img => getProductImage(img));
    }
    return [mainImg, mainImg];
  }, [product]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsWishlisted(wishlist.some(item => item.id === product.id));

    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
      const total = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
      setCartCount(total);
    };
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, [product, wishlist]);

  const toggleWishlist = useCallback(() => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      setToastMessage('Removed from Wishlist');
    } else {
      addToWishlist(product);
      setToastMessage('Added to Wishlist');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [product, isWishlisted, addToWishlist, removeFromWishlist]);

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${product.price} (${product.discount})`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setToastMessage('Shared successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage('Link copied to clipboard!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(window.location.href);
          setToastMessage('Link copied to clipboard!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        } catch (clipboardError) {
          setToastMessage('Unable to share');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        }
      }
    }
  };

  const handleAddToCart = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
    cart.push({ ...product, cartId: Date.now(), qty: 1 });
    localStorage.setItem('userCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setToastMessage('Added to cart');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [product]);

  const handleBuyNow = useCallback(() => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      navigate('/login', { state: { from: '/checkout', checkoutProduct: product } });
    } else {
      navigate('/checkout', { state: { product } });
    }
  }, [product, navigate]);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isNotFound = useMemo(() => queryParams.get('notFound') === 'true' || location.state?.notFound, [queryParams, location.state]);

  if (isNotFound) {
    return (
      <div className={`min-h-screen pb-28 font-sans text-slate-800 transition-colors duration-300 relative flex items-center justify-center ${
        isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isQuickShopFlow ? 'bg-[#FFF9F5]' : 'bg-[#F6F8F3]'
      }`}>
        <ProductNotFound />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-28 font-sans text-slate-800 transition-colors duration-300 relative ${
      isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isQuickShopFlow ? 'bg-[#FFF9F5]' : 'bg-[#F6F8F3]'
    }`}>

      {/* Premium Boutique Header */}
      <div className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b transition-colors duration-300 relative z-10 ${
        isMithilakFlow
          ? 'bg-[#207C8A] border-transparent text-white shadow-sm'
          : isFreshGroceryFlow
            ? 'bg-[#D9A21B] border-transparent text-white shadow-sm'
            : isQuickShopFlow
              ? 'bg-[#F26522] border-transparent text-white shadow-sm'
              : 'bg-[#FCF7EE]/90 border-[#F3E3CD]/60 backdrop-blur-md text-[#6FAE4A]'
      }`}>
        <button onClick={() => navigate(-1)} className={`p-1.5 rounded-full transition-colors active:scale-90 ${
          (isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-gray-50'
        }`}>
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className={`text-[12px] font-black tracking-[0.25em] uppercase pl-4 ${
          (isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white' : primaryText
        }`}>
          Mithilakart
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/search')} 
            className={`p-1.5 rounded-full transition-colors active:scale-90 ${
              (isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Search size={20} />
          </button>
          <div 
            onClick={() => navigate('/cart')} 
            className={`relative p-1.5 rounded-full transition-colors active:scale-95 cursor-pointer ${
              (isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart size={20} className="text-current" />
            {cartCount > 0 && (
              <span className={`absolute top-0 right-0 ${primaryBg} text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs`}>
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-10 md:max-w-6xl md:mx-auto md:px-4 md:py-6">
        {/* Left Column: Images */}
        <div className="flex flex-col">
          {/* Boutique Lookbook Image Frame */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative w-full aspect-[4/5] bg-white rounded-[28px] overflow-hidden shadow-[0_12px_32px_rgba(8,66,36,0.06)] border border-slate-100">
              <img 
                src={images[currentSlide]} 
                alt={product.name} 
                onError={handleImageError}
                className="w-full h-full object-cover transition-all duration-500 ease-out" 
              />

              {/* Floating Luxury Widgets */}
              <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-10">
                <button 
                  onClick={toggleWishlist}
                  className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all border border-white/50 hover:bg-white"
                >
                  <Heart size={16} className={isWishlisted ? "text-red-500 fill-red-500" : "text-slate-700"} />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all border border-white/50 hover:bg-white"
                >
                  <Share2 size={15} className="text-slate-700" />
                </button>
              </div>

              {/* Rating Badge */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-1 shadow-sm z-10">
                <span className="text-[11px] font-black text-slate-800">{product.rating}</span>
                <Star size={9} fill="#e2a750" className="text-[var(--color-gold)]" />
                <div className="w-[1px] h-2.5 bg-gray-200 mx-0.5" />
                <span className="text-[9.5px] font-bold text-slate-400">{product.ratingCount || 12} reviews</span>
              </div>
            </div>

            {/* Thumbnail Preview Slider */}
            <div className="flex justify-center gap-2 mt-4 pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-12 h-15 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    currentSlide === idx 
                      ? `${primaryBorder} scale-105 shadow-sm` 
                      : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} onError={handleImageError} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="flex flex-col">
          {/* Brand & Title */}
      <div className="px-4 py-2 mt-1">
        <span className={`text-[10px] font-black tracking-[0.25em] ${primaryText} uppercase block mb-1`}>
          {product.brand || 'Mithilakart Brand'}
        </span>
        <h1 className="text-[19px] font-black text-slate-800 leading-tight mb-2 tracking-tight">
          {product.name}
        </h1>
        
        {/* Strike Prices / Coupon Layout */}
        <div className="mt-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-[#FFD633] text-slate-900 text-[20px] font-black px-5 py-0.5 rounded-[4px] relative flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] select-none">
              {/* Coupon style side cutouts */}
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-r border-slate-100"></div>
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-l border-slate-100"></div>
              {formatPrice(product.price)}
            </div>
            <span className="text-[14px] text-gray-400 font-semibold line-through">
              MRP {formatPrice(product.oldPrice)}
            </span>
            {isOutOfStock && (
              <span className="bg-red-100 text-red-600 border border-red-200 text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={12} /> Out of Stock
              </span>
            )}
          </div>
          <div className="text-[12px] font-extrabold text-[#2b6cb0] mt-1.5 pl-0.5">
            {product.discount || 'Special Offer'}
          </div>
        </div>

        {/* Out of Stock Banner */}
        {isOutOfStock && (
          <div className="mt-3 p-3 bg-red-50/90 border border-red-200/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">Currently Out of Stock</p>
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">We will restock this item soon!</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setToastMessage('We will notify you when back in stock!');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
              }}
              className="text-[10px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex-shrink-0"
            >
              Notify Me
            </button>
          </div>
        )}
      </div>

      {/* Variant Selector (Premium Circles) */}
      <div className="px-4 py-3 mt-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
          {t('product.selectSize') || 'Select Size'}
        </span>
        <div className="flex gap-2.5">
          {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-10 h-10 rounded-full text-[11px] font-black transition-all flex items-center justify-center border ${
                selectedSize === size
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-slate-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex gap-4 mt-5 mb-3 px-4">
          <button 
            onClick={handleAddToCart}
            className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold py-3.5 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[13px] hover:bg-slate-50 cursor-pointer"
          >
            {t('cart.addToCart')}
          </button>
          <button 
            onClick={handleBuyNow}
            className={`flex-1 ${primaryBg} text-white font-black py-3.5 rounded-full active:scale-[0.98] transition-all flex items-center justify-center text-[13px] ${shadowColor} ${primaryBgHover} cursor-pointer`}
          >
            {t('cart.buyNow')} • {formatPrice(product.price)}
          </button>
        </div>

        {/* Glassmorphic Services & Policies Panel */}
      <div className="px-4 py-3 mt-2 grid grid-cols-3 gap-2.5">
        <div 
          onClick={() => setShowReturnPolicy(true)}
          className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] cursor-pointer hover:bg-slate-50/50 transition-colors active:scale-95 duration-200"
        >
          <div className="w-8 h-8 bg-sky-50 rounded-full flex items-center justify-center">
            <RotateCcw size={16} className="text-sky-700" />
          </div>
          <span className="text-[9.5px] font-black text-slate-700 text-center uppercase tracking-tighter leading-tight">
            10-Day Return
          </span>
        </div>
        <div 
          onClick={() => setShowPaymentOptions(true)}
          className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] cursor-pointer hover:bg-slate-50/50 transition-colors active:scale-95 duration-200"
        >
          <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
            <IndianRupee size={16} className="text-amber-700" />
          </div>
          <span className="text-[9.5px] font-black text-slate-700 text-center uppercase tracking-tighter leading-tight">
            COD Available
          </span>
        </div>
        <div 
          onClick={() => setShowSupportInfo(true)}
          className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] cursor-pointer hover:bg-slate-50/50 transition-colors active:scale-95 duration-200"
        >
          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
            <span className="text-emerald-700 font-black text-[9px] uppercase tracking-tighter">24x7</span>
          </div>
          <span className="text-[9.5px] font-black text-slate-700 text-center uppercase tracking-tighter leading-tight">
            Live Support
          </span>
        </div>
      </div>

      {/* Delivery / Shipping details */}
      <div className="px-4 py-3 mt-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
          Delivery Details
        </span>
        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input 
                type="text" 
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincode(val);
                  setIsPincodeChecked(false);
                  setPincodeError('');
                }}
                placeholder="Enter Pincode (e.g. 999999)" 
                className={`border rounded-lg px-3 py-2 text-xs font-bold flex-1 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-colors ${
                  pincodeError ? 'border-red-500 focus:ring-red-500' : `${primaryBorder} focus:ring-slate-500`
                }`}
              />
              <button
                type="button"
                onClick={handlePincodeCheck}
                className={`px-5 py-2 ${primaryBg} ${primaryBgHover} text-white font-black uppercase tracking-widest text-[10px] rounded-lg active:scale-95 transition-all shadow-xs`}
              >
                Check
              </button>
            </div>
            {pincodeError && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">{pincodeError}</p>
            )}
          </div>

          {isPincodeChecked && (
            isDeliveryUnavailable ? (
              <ShippingUnavailable onChangeLocation={() => {
                setIsDeliveryUnavailable(false);
                setIsPincodeChecked(false);
                setPincode('');
              }} />
            ) : (
              <>
                <div className="flex items-center gap-3 bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50 animate-in fade-in duration-200">
                  <MapPin size={18} className="text-emerald-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider leading-none">Deliverable to {pincode}</p>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">Standard Delivery Available</p>
                  </div>
                </div>
                <div className="h-[1px] bg-slate-100" />
                <div className="flex items-center gap-3">
                  <Truck size={18} className={primaryText} />
                  <div>
                    <p className="text-[12px] font-black text-slate-850">Delivery by Sat, 16 May</p>
                    <p className="text-[10px] text-orange-600 font-bold mt-0.5">Order in 00h 00m 14s</p>
                  </div>
                </div>
              </>
            )
          )}

          {!isPincodeChecked && (
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider leading-none">Deliver to Home</p>
                <p className="text-[12px] text-slate-450 font-medium truncate mt-1">Please enter pincode to verify delivery availability</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Highlights Expandable Accordion */}
      <div className="px-4 py-1.5 mt-2">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
          <div 
            onClick={() => setIsHighlightsOpen(!isHighlightsOpen)}
            className="flex justify-between items-center cursor-pointer"
          >
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Product Highlights</h3>
            <ChevronRight 
              size={16} 
              className={`text-gray-400 transition-transform duration-300 ${isHighlightsOpen ? '-rotate-90' : 'rotate-90'}`} 
            />
          </div>
          {isHighlightsOpen && (
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 mt-4 pt-3 border-t border-slate-50 animate-in fade-in duration-300">
              {detailsData.highlights.map((item, idx) => (
                <div key={idx} className="pb-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-[12.5px] font-black text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Specs Accordion */}
      <div className="px-4 py-1.5 mt-1">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
          <div 
            onClick={() => setIsAllDetailsOpen(!isAllDetailsOpen)}
            className="flex justify-between items-center cursor-pointer"
          >
            <div>
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Specifications & Info</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Specifications, Description and Manufacturer</p>
            </div>
            <ChevronRight 
              size={16} 
              className={`text-gray-400 transition-transform duration-300 ${isAllDetailsOpen ? '-rotate-90' : 'rotate-90'}`} 
            />
          </div>
          {isAllDetailsOpen && (
            <div className="mt-4 pt-4 border-t border-slate-50 animate-in fade-in duration-350">
              {/* Tab Selector */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                {['Specifications', 'Description', 'Manufacturer Info'].map(tab => (
                  <button
                    key={tab}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDetailTab(tab);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10.5px] font-black border whitespace-nowrap transition-all ${
                      activeDetailTab === tab 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-white text-slate-600 border-slate-100 active:scale-95'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeDetailTab === 'Specifications' && (
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  {detailsData.specs.map((item, idx) => (
                    <div key={idx} className="pb-0.5 border-b border-slate-50">
                      <p className="text-[9.5px] font-bold text-gray-400 mb-0.5">{item.label}</p>
                      <p className="text-[12px] font-black text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeDetailTab === 'Description' && (
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                  Premium quality materials with a modern, elegant drape. Features a premium finish and detailed stitching. Ideal for casual, lounge, and semi-formal wear.
                </p>
              )}

              {activeDetailTab === 'Manufacturer Info' && (
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                  Manufactured by Lounge Dreams Clothing Pvt Ltd. Designed and tailored in India.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

      {/* Similar Products */}
      <div className="mt-4 py-4 bg-white border-y border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] md:max-w-6xl md:mx-auto md:w-full md:rounded-2xl md:border md:my-6 md:p-6">
        <div className="flex justify-between items-center px-4 mb-3 md:px-0">
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-900">Similar Products</h3>
          <span className={`text-[10px] font-black ${primaryText} tracking-widest uppercase`}>View All</span>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2 md:justify-center md:gap-6 md:px-0 md:overflow-x-visible">
          {[
            { img: TopSection1, name: 'Checked Cotton Shirt', brand: 'Fashion Hub', price: 899, oldPrice: 1999 },
            { img: FlipFlops, name: 'Casual Flip Flops', brand: 'Drasert', price: 1299, oldPrice: 2499 },
            { img: Suitcase, name: 'Premium Suitcase', brand: 'Lounge Dreams', price: 1599, oldPrice: 2999 }
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate('/product-detail', { state: { product: { ...item, image: item.img, rating: 4.1, discount: '55% OFF' } } })}
              className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer hover:shadow-sm"
            >
              <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/55 flex items-center justify-center">
                <img src={item.img} className="w-full h-full object-cover" alt="similar" />
                <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-gray-100 shadow-2xs">
                  <span className="text-[9px] font-black text-slate-800">4.1</span>
                  <Star size={7} fill="#e2a750" className="text-[#e2a750]" />
                </div>
              </div>
              <div className="px-2.5 pb-2.5 pt-0.5">
                <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{item.name}</h4>
                <div className="text-[9px] font-black text-[#e47911] border border-[#e47911] px-1.5 py-0.5 rounded-full w-fit mt-1 uppercase">
                  55% OFF
                </div>
                <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                  <span className="text-[13px] font-black text-slate-900">{formatPrice(item.price)}</span>
                  <span className="text-[9.5px] text-gray-400 line-through">MRP {formatPrice(item.oldPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bought Together */}
      <div className="mt-4 py-4 bg-white border-y border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] md:max-w-6xl md:mx-auto md:w-full md:rounded-2xl md:border md:my-6 md:p-6">
        <div className="flex justify-between items-center px-4 mb-3 md:px-0">
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-900">Bought Together</h3>
          <span className={`text-[10px] font-black ${primaryText} tracking-widest uppercase`}>Explore</span>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2 md:justify-center md:gap-6 md:px-0 md:overflow-x-visible">
          {[
            { img: Balloons, name: 'Party Pack', price: 299, oldPrice: 599 },
            { img: SplitAC, name: 'Samsung AC', price: 34999, oldPrice: 45999 },
            { img: TowerFan, name: 'Tower Fan', price: 2499, oldPrice: 4999 }
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate('/product-detail', { state: { product: { ...item, image: item.img, rating: 4.3, discount: '60% off' } } })}
              className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer hover:shadow-sm"
            >
              <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/55 flex items-center justify-center">
                <img src={item.img} className="w-full h-full object-cover" alt="bought" />
              </div>
              <div className="px-2.5 pb-2.5 pt-0.5">
                <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{item.name}</h4>
                <div className="text-[9px] font-black text-[#e47911] border border-[#e47911] px-1.5 py-0.5 rounded-full w-fit mt-1 uppercase">
                  60% OFF
                </div>
                <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                  <span className="text-[13px] font-black text-slate-900">{formatPrice(item.price)}</span>
                  <span className="text-[9.5px] text-gray-400 line-through">MRP {formatPrice(item.oldPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Easy Returns Policy Bottom Sheet */}
      {showReturnPolicy && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => {
              setShowReturnPolicy(false);
              setIsReturnExpanded(false);
            }}
          />
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, setIsReturnExpanded, isReturnExpanded)}
            className={`relative w-full max-w-md bg-white transition-all duration-500 ease-out flex flex-col ${
              isReturnExpanded ? 'h-[95vh] rounded-t-3xl shadow-2xl' : 'max-h-[85vh] rounded-t-2xl'
            } overflow-hidden animate-in slide-in-from-bottom`}
          >
            <div className="w-full flex justify-center pt-2 pb-1 bg-white">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="sticky top-0 bg-[#e0f2fe] px-4 py-3 flex items-center gap-4 border-b border-primary-green/30 z-10">
              <button onClick={() => {
                setShowReturnPolicy(false);
                setIsReturnExpanded(false);
              }} className="text-slate-800">
                <X size={24} />
              </button>
              <h2 className="text-[18px] font-bold text-slate-800">Easy Returns Policy</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-10">
              <div className="flex justify-between items-center mb-10 px-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center relative">
                    <div className={`w-10 h-10 border-2 ${primaryBorder} rounded-sm flex items-center justify-center`}>
                      <RotateCcw size={20} className={primaryText} />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 ${accentBg} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Replacement</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center relative">
                    <div className={`w-10 h-10 border-2 ${primaryBorder} rounded-sm flex items-center justify-center`}>
                      <IndianRupee size={20} className={primaryText} />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 ${accentBg} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Refund</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center relative">
                    <div className={`w-10 h-10 border-2 ${primaryBorder} rounded-sm flex items-center justify-center`}>
                      <Share2 size={20} className={`${primaryText} rotate-90`} />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 ${accentBg} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Exchange</span>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-[17px] font-black text-slate-900 mb-6">What are the conditions for return?</h3>
                <div className="space-y-5">
                  {[
                    'Received damaged product',
                    'Received defective product',
                    'Received wrong product',
                    'Did not like the product'
                  ].map(text => (
                    <div key={text} className="flex items-center gap-4">
                      <div className={`w-5 h-5 border ${accentBorder} rounded-sm flex items-center justify-center`}>
                        <span className={`${accentText} text-[12px] font-bold`}>✓</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[17px] font-black text-slate-900 mb-8">How to place a return?</h3>
                
                <div className="space-y-12 pl-4 border-l-2 border-dashed border-gray-200 ml-2">
                  <div className="relative">
                    <div className={`absolute -left-[26px] top-0 w-4 h-4 bg-white border-2 ${accentBorder} rounded-full flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 ${accentBg} rounded-full`} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[15px] font-black text-slate-800 mb-2">Select issue</h4>
                        <p className="text-[14px] font-medium text-gray-500 mb-1">• Go to My Orders &gt; Order Details</p>
                        <p className="text-[14px] font-medium text-gray-500">• Return &gt; Select Issue</p>
                      </div>
                      <div className="w-20 h-16 bg-gray-50 rounded-sm flex flex-col items-center justify-center relative border border-gray-100">
                        <div className="w-10 h-10 border border-gray-300 rounded-sm flex items-center justify-center">
                          <span className="text-[8px] font-bold text-gray-400 absolute top-1 right-1">Return</span>
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${accentBg} rounded-full border-2 border-white`} />
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[26px] top-0 w-4 h-4 bg-white border-2 ${accentBorder} rounded-full flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 ${accentBg} rounded-full`} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[15px] font-black text-slate-800 mb-2">Get an approval</h4>
                        <p className="text-[14px] font-medium text-gray-500 leading-relaxed">• Seller will approve based on<br/>condition</p>
                      </div>
                      <div className="w-20 h-16 bg-gray-50 rounded-sm flex items-center justify-center relative border border-gray-100">
                         <div className="w-10 h-10 bg-slate-200 rounded-full" />
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${accentBg} rounded-full border-2 border-white`} />
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[26px] top-0 w-4 h-4 bg-white border-2 ${accentBorder} rounded-full flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 ${accentBg} rounded-full`} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[15px] font-black text-slate-800 mb-2">Product will be picked up</h4>
                        <p className="text-[14px] font-medium text-gray-500 leading-relaxed">• Product must be in original<br/>condition with tags and packaging</p>
                      </div>
                      <div className="w-20 h-16 bg-gray-50 rounded-sm flex items-center justify-center relative border border-gray-100">
                        <Truck size={30} className="text-gray-300" />
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${accentBg} rounded-full border-2 border-white`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Options Bottom Sheet */}
      {showPaymentOptions && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => {
              setShowPaymentOptions(false);
              setIsPaymentExpanded(false);
            }}
          />
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, setIsPaymentExpanded, isPaymentExpanded)}
            className={`relative w-full max-w-md bg-white transition-all duration-500 ease-out flex flex-col ${
              isPaymentExpanded ? 'h-[95vh] rounded-t-3xl shadow-2xl' : 'max-h-[85vh] rounded-t-2xl'
            } overflow-hidden animate-in slide-in-from-bottom`}
          >
            <div className="w-full flex justify-center pt-2 pb-1 bg-white cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="sticky top-0 bg-white px-4 py-2.5 flex items-center gap-4 border-b border-gray-100 z-10">
              <button onClick={() => {
                setShowPaymentOptions(false);
                setIsPaymentExpanded(false);
              }} className="text-slate-800">
                <X size={24} />
              </button>
              <h2 className="text-[18px] font-bold text-slate-800">Payments Options</h2>
            </div>

            <div className="sticky top-[53px] bg-white flex border-b border-gray-100 z-10">
              <button 
                onClick={() => setActivePaymentTab('COD')}
                className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activePaymentTab === 'COD' ? primaryText : 'text-gray-400'}`}
              >
                <IndianRupee size={22} className={activePaymentTab === 'COD' ? primaryText : 'text-gray-400'} />
                <span className="text-[13px] font-bold">COD</span>
                {activePaymentTab === 'COD' && <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${primaryBg}`} />}
              </button>
              <button 
                onClick={() => setActivePaymentTab('UPI')}
                className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activePaymentTab === 'UPI' ? primaryText : 'text-gray-400'}`}
              >
                <div className="w-5 h-7 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[13px] font-bold">UPI</span>
                {activePaymentTab === 'UPI' && <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${primaryBg}`} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activePaymentTab === 'COD' ? (
                <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                  Available. Select Cash on Delivery (CoD) payment option while placing the order and later, pay in cash at the time of actual delivery of product. No advance payment needed.
                </p>
              ) : (
                <div className="space-y-6">
                  <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                    Provide your UPI ID to process the payment. No extra charges on this transaction.
                  </p>
                  {isPaymentExpanded && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="bg-primary-light p-4 rounded-sm border border-primary-green/30">
                        <p className="text-[13px] text-blue-800 font-bold mb-1">Instant Refund Policy</p>
                        <p className="text-[12px] text-primary-dark">UPI payments are eligible for instant refunds upon cancellation.</p>
                      </div>
                      <div className="border border-gray-100 rounded-sm p-4">
                        <p className="text-[13px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Secure Payment</p>
                        <div className="flex gap-4">
                          <div className="w-12 h-8 bg-gray-50 rounded-sm border border-gray-200" />
                          <div className="w-12 h-8 bg-gray-50 rounded-sm border border-gray-200" />
                          <div className="w-12 h-8 bg-gray-50 rounded-sm border border-gray-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Support Bottom Sheet */}
      {showSupportInfo && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => {
              setShowSupportInfo(false);
              setIsSupportExpanded(false);
            }}
          />
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, setIsSupportExpanded, isSupportExpanded)}
            className={`relative w-full max-w-md bg-white transition-all duration-500 ease-out flex flex-col ${
              isSupportExpanded ? 'h-[95vh] rounded-t-3xl shadow-2xl' : 'max-h-[85vh] rounded-t-2xl'
            } overflow-hidden animate-in slide-in-from-bottom`}
          >
            <div className="w-full flex justify-center pt-2 pb-1 bg-white">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="sticky top-0 bg-white px-4 py-3.5 flex items-center justify-between border-b border-gray-100 z-10">
              <h2 className="text-[18px] font-bold text-slate-800">24x7 Customer Support</h2>
              <button onClick={() => {
                setShowSupportInfo(false);
                setIsSupportExpanded(false);
              }} className="text-slate-800">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <p className="text-[15px] text-slate-700 font-medium leading-relaxed mb-6">
                Mithilakart Help Centre offers quick support for order tracking, returns, refunds, and delivery updates. Find Help Centre in "My Account" on mobile app or in the main menu on the desktop app.
              </p>
              
              {isSupportExpanded && (
                <div className="space-y-6 animate-in fade-in duration-700">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-sm active:bg-gray-50 transition-colors">
                      <div className={`w-12 h-12 ${primaryLightBg} rounded-full flex items-center justify-center`}>
                        <Send size={22} className={primaryText} />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700">Chat with us</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-sm active:bg-gray-50 transition-colors">
                      <div className={`w-12 h-12 ${primaryLightBg} rounded-full flex items-center justify-center`}>
                        <Star size={22} className={primaryText} />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700">Help Center</span>
                    </button>
                  </div>
                  
                  <div className={`bg-gray-50 p-4 border-l-4 ${primaryBorder} rounded-r-sm`}>
                    <p className="text-[12px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Common Topics</p>
                    <ul className="space-y-4">
                      {['Track Order', 'Refund Status', 'Cancel Items'].map(item => (
                        <li key={item} className="flex items-center justify-between text-[15px] font-bold text-slate-700">
                          {item} <ChevronRight size={18} className="text-gray-400" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
        {/* Left Side: Unit and Price Details */}
        <div className="flex flex-col justify-center select-none">
          <span className="text-[10px] font-extrabold text-slate-500 leading-none mb-1">
            {product.pack || '1 unit'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="bg-[#FFD633] text-slate-900 text-[14px] font-black px-3.5 py-0 rounded-[3px] relative flex items-center shadow-3xs">
              <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              {formatPrice(product.price)}
            </div>
            <span className="text-[11px] text-slate-400 font-semibold line-through leading-none">
              MRP {formatPrice(product.oldPrice)}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">
            Inclusive of all taxes
          </span>
        </div>

        {/* Right Side: Add to Cart / Out of Stock Button */}
        {isOutOfStock ? (
          <button 
            disabled
            className="bg-slate-200 text-slate-400 font-extrabold px-6 py-2.5 rounded-[6px] text-[13px] flex items-center justify-center cursor-not-allowed border border-slate-300 select-none opacity-80"
          >
            Out of Stock
          </button>
        ) : (
          <button 
            onClick={handleAddToCart}
            className={`${primaryBg} ${primaryBgHover} text-white font-extrabold px-6 py-2.5 rounded-[6px] active:scale-95 transition-all text-[13px] flex items-center justify-center cursor-pointer shadow-xs`}
          >
            {t('cart.addToCart') || 'Add to cart'}
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full text-[13px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
