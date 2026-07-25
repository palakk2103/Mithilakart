import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Heart, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allCategoryProducts } from '../../../../data/categoryData';
import { getCurrentMarketplaceTab, productBelongsToTab } from '../../../../shared/utils/marketplaceHelpers';

const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[14px] md:h-[14px] opacity-85 select-none pointer-events-none">
    {/* Green leaves/petals */}
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#6FAE4A" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#6FAE4A" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#6FAE4A" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#6FAE4A" />
    {/* Orange petals */}
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    {/* Center core */}
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-0.5 md:my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      {/* Left branch */}
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#6FAE4A" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      {/* Right branch */}
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#6FAE4A" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      {/* Central Flower */}
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

const ProductCard = React.memo(({ product, onProductClick, onAddToCart }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Use a stable pseudo-random number based on the product ID for the rating count
  const ratingCount = useMemo(() => {
    const idNum = typeof product.id === 'string' ? product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : product.id;
    return (idNum % 450) + 50;
  }, [product.id]);

  return (
    <div
      className="flex flex-col cursor-pointer group w-full md:w-[240px] md:flex-shrink-0 relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-1.5 md:p-2.5 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#6FAE4A]/35 transition-all duration-300 transform select-none"
      onClick={() => onProductClick(product)}
    >
      {/* Inner Decorative Dashed Border */}
      <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#D35400]/20 rounded-[15px] md:rounded-[20px]" />

      {/* Corner Ornaments */}
      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><CornerFlower /></div>

      {/* Product Image Section */}
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-0.5 md:p-1">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
          width="200"
          height="200"
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 md:w-7.5 md:h-7.5 rounded-full bg-white/90 backdrop-blur-xs shadow-[0_2px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
        >
          <Heart 
            size={11} 
            className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`} 
          />
        </button>

        {/* Rating Badge on Image */}
        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 md:gap-1 bg-white/95 backdrop-blur-xs px-1 py-0.2 md:px-1.5 md:py-0.5 rounded-[4px] md:rounded-[6px] shadow-xs border border-[#EADCC9]/30">
          <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{product.rating || '4.8'}</span>
          <Star size={7} fill="currentColor" className="text-[#6FAE4A] stroke-none" />
          <div className="w-[1px] h-2 bg-gray-300 mx-0.5" />
          <span className="text-[7.5px] md:text-[8.5px] font-semibold text-gray-500">({ratingCount})</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="pt-1.5 pb-0.5 px-0.5 md:pt-2.5 md:pb-1 md:px-1.5 relative z-10 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-[10px] md:text-[12px] font-black text-[#3F2A20] line-clamp-1 leading-tight tracking-tight">
            <span className="font-extrabold text-[#3F2A20]">{product.brand || 'Drasert'}</span> {product.name}
          </h3>

          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
              <span className="text-[11px] md:text-[13.5px] font-black text-slate-900">₹{product.price}</span>
              <span className="text-[8.5px] md:text-[10px] text-gray-400 line-through font-semibold">MRP ₹{product.oldPrice || '1,999'}</span>
              <span className="border border-[#F26522]/45 text-[#F26522] bg-[#F26522]/5 text-[7px] md:text-[8px] px-1 py-0.2 rounded-full font-black uppercase tracking-tight">
                {Math.round(((parseInt((product.oldPrice || '1999').toString().replace(/,/g, '')) - parseInt(product.price?.toString().replace(/,/g, ''))) / parseInt((product.oldPrice || '1999').toString().replace(/,/g, ''))) * 100)}% OFF
              </span>
            </div>
            <p className="text-[8.5px] md:text-[9.5px] font-extrabold text-[#6FAE4A] tracking-tight mt-0.5">
              ₹{Math.round(product.price * 0.9)} with UPI offer + more
            </p>
          </div>
        </div>

        {/* Bottom floral divider motif */}
        <CardBottomDivider />
      </div>
    </div>
  );
});

const CategoryProductsSection = ({ selectedCategory }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [displayCount, setDisplayCount] = useState(6);
  const navigate = useNavigate();
  const loaderRef = React.useRef(null);

  const currentTab = useMemo(() => getCurrentMarketplaceTab(), []);

  const allProducts = useMemo(() => {
    const raw = allCategoryProducts[selectedCategory] || [];
    return raw.filter(p => productBelongsToTab(p, currentTab));
  }, [selectedCategory, currentTab]);
  const products = useMemo(() => allProducts.slice(0, displayCount), [allProducts, displayCount]);

  const handleAddToCart = useCallback((product, e) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
    const existing = cart.find(item => item.id === product.id || item.name === product.name);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1, image: product.image, price: product.price });
    }
    localStorage.setItem('userCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setToastMessage('Item added to cart');
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const handleProductClick = useCallback((product) => {
    navigate('/product-detail', {
      state: {
        product: {
          ...product,
          off: product.discount,
          label: 'Limited time deal',
          brand: 'Brand',
          reviews: '1,200',
          delivery: 'Tomorrow'
        }
      }
    });
  }, [navigate]);

  useEffect(() => {
    setIsVisible(false);
    setDisplayCount(6);
    if (selectedCategory) {
      const timer = setTimeout(() => setIsVisible(true), 30);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory]);

  // Observer for batch rendering - increased rootMargin for smoother slow scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayCount < allProducts.length) {
          setDisplayCount(prev => prev + 6);
        }
      },
      { threshold: 0.01, rootMargin: '400px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, allProducts.length]);

  if (!selectedCategory) return null;

  return (
    <div id="category-products-section" className="py-2 px-3 bg-white mt-0 transition-all duration-300 relative md:max-w-[1600px] md:mx-auto md:py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-bold text-sm tracking-wide whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

      {allProducts.length === 0 ? (
        <div className="py-10 text-center text-gray-400 font-bold italic">
          More products coming soon...
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-2 md:flex md:flex-wrap md:justify-center xl:justify-between md:gap-x-8 md:gap-y-10 md:max-w-[1600px] md:mx-auto gap-x-3 gap-y-6 transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
          {/* Intersection Trigger */}
          <div ref={loaderRef} className="h-20 w-full" />
        </>
      )}
    </div>
  );
};

export default React.memo(CategoryProductsSection);

