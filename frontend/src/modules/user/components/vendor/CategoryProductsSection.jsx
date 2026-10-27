import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Heart, Star, ShoppingBag, Tag, X, SlidersHorizontal, Layers, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, getCategoryProducts } from '../../services/catalogApi';
import { findCategoryByName, extractList, mapProductForCard } from '../../utils/mappers';
import { addProductToCart } from '../../utils/cartUtils';
import useTabTheme from '../../../../shared/hooks/useTabTheme';
import { getCurrentMarketplaceTab } from '../../../../shared/utils/marketplaceHelpers';
import { allCategoryProducts } from '../../../../data/categoryData';
import { getImageUrl, handleImageError } from '../../../../shared/utils/imageUtils';
import toast from 'react-hot-toast';

// Fallback images for subcategories when admin hasn't set an image yet
import FashionHero from '../../../../assets/products/product06.jpg';
import ClothesImg from '../../../../assets/products/product15.webp';
import Tshirt from '../../../../assets/products/product05.jpg';
import FlipFlops from '../../../../assets/products/product07.jpg';
import Mascara from '../../../../assets/products/product01.jpg';
import LipstickDeal from '../../../../assets/products/product02.jpg';
import MakeupHero from '../../../../assets/products/product08.jpg';
import PlumShampoo from '../../../../assets/products/product05.jpg';
import SamsungS24 from '../../../../assets/products/product01.jpg';
import AsusLaptop from '../../../../assets/products/product02.jpg';
import EarbudsDeal from '../../../../assets/products/product03.jpg';
import JewelleryImg from '../../../../assets/products/product12.jpg';
import ToysImg from '../../../../assets/products/product14.jpg';

const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[14px] md:h-[14px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#65B842" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#65B842" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#65B842" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#65B842" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-0.5 md:my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#65B842" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#65B842" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
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
  const { primaryText } = useTabTheme();

  return (
    <div
      className="flex flex-col cursor-pointer group w-full relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-2 md:p-3 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#3E5A44]/35 transition-all duration-300 transform select-none justify-between"
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
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-1">
        <img
          src={product.image || product.img}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
        >
          <Heart 
            size={11} 
            className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`} 
          />
        </button>

        {/* Discount Badge */}
        {product.off && (
          <div className="absolute top-1.5 left-1.5 bg-[#3E5A44] text-white text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
            {product.off}
          </div>
        )}

        {/* Rating Badge */}
        {product.rating > 0 && (
          <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs px-1 py-0.5 rounded-[4px] shadow-xs border border-[#EADCC9]/30">
            <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{product.rating}</span>
            <Star size={7} fill="currentColor" className="text-amber-500 stroke-none" />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="pt-2 pb-0.5 px-0.5 relative z-10 flex flex-col justify-between flex-1">
        <div>
          <span className="text-slate-400 text-[8.5px] font-bold block uppercase tracking-wider">{product.brand || 'Mithilakart'}</span>
          <h3 className="text-[11px] md:text-[12.5px] font-black text-[#3F2A20] line-clamp-1 leading-tight mt-0.5">
            {product.name}
          </h3>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{product.price}</span>
            {product.oldPrice && (
              <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{product.oldPrice}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-2.5 flex items-center justify-between gap-1 pt-1 border-t border-[#EADCC9]/40">
          <button
            onClick={(e) => onAddToCart(product, e)}
            className="w-full py-1.5 px-2 bg-[#FFF8EE] hover:bg-[#3E5A44] text-[#3E5A44] hover:text-white border border-[#3E5A44]/30 rounded-xl text-[10px] md:text-[11px] font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs"
          >
            <ShoppingBag size={12} strokeWidth={2.2} />
            <span>Add to Cart</span>
          </button>
        </div>

        <CardBottomDivider />
      </div>
    </div>
  );
});

const CategoryProductsSection = ({ selectedCategory, onResetToAll }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSubcategory = searchParams.get('subcategory');

  const [allProducts, setAllProducts] = useState([]);
  const [adminSubcategories, setAdminSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(urlSubcategory || null);
  const [subProducts, setSubProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [activeSort, setActiveSort] = useState('Popularity');
  const [displayCount, setDisplayCount] = useState(8);
  const navigate = useNavigate();

  // Keep selectedSubcategory in sync when URL changes or category changes
  useEffect(() => {
    const currentSub = searchParams.get('subcategory');
    setSelectedSubcategory(currentSub || null);
  }, [selectedCategory, searchParams]);

  // Load category and products from Backend API (Created by Admin & Sellers)
  useEffect(() => {
    if (!selectedCategory) return;

    let cancelled = false;

    const loadCategoryData = async () => {
      setLoading(true);
      try {
        const tab = getCurrentMarketplaceTab();
        const categories = await getCategories({ marketplaceTab: tab });
        const match = findCategoryByName(categories, selectedCategory);

        if (match) {
          // Dynamic subcategories created by Admin in CategoryManager
          const rawChildren = Array.isArray(match.children) ? match.children : [];
          const dynamicSubs = rawChildren.map((sub) => ({
            id: String(sub.id || sub._id),
            name: sub.name,
            img: sub.imageUrl ? getImageUrl(sub.imageUrl) : (sub.iconUrl ? getImageUrl(sub.iconUrl) : ''),
            slug: sub.slug,
          }));

          if (!cancelled) {
            setAdminSubcategories(dynamicSubs);
          }

          // Fetch products created in Database under this category
          const queryParams = { limit: 50, marketplaceTab: tab };
          let apiProducts = [];
          try {
            const data = await getCategoryProducts(match.id, queryParams);
            apiProducts = extractList(data).map((p) => mapProductForCard(p));
          } catch {
            apiProducts = [];
          }

          if (!cancelled) {
            if (apiProducts.length > 0) {
              setAllProducts(apiProducts);
            } else {
              // Graceful fallback if database has 0 products initially
              const fallback = allCategoryProducts[selectedCategory] || allCategoryProducts['Fashion'] || [];
              setAllProducts(fallback.map((p) => mapProductForCard(p)));
            }
          }
        } else {
          if (!cancelled) {
            setAdminSubcategories([]);
            const fallback = allCategoryProducts[selectedCategory] || allCategoryProducts['Fashion'] || [];
            setAllProducts(fallback.map((p) => mapProductForCard(p)));
          }
        }
      } catch {
        if (!cancelled) {
          const fallback = allCategoryProducts[selectedCategory] || allCategoryProducts['Fashion'] || [];
          setAllProducts(fallback.map((p) => mapProductForCard(p)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCategoryData();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  // Fallback curated subcategories if Admin hasn't added subcategories to DB for this category yet
  const fallbackSubcategories = useMemo(() => {
    const map = {
      Fashion: [
        { id: 'Sweaters', name: 'Sweaters', offer: 'Min. 70% Off', img: FashionHero },
        { id: 'Jackets', name: 'Jackets', offer: 'Min. 60% Off', img: ClothesImg },
        { id: 'Boots', name: "Men's boots", offer: 'Min. 70% Off', img: FlipFlops },
        { id: 'T-Shirt', name: 'T-Shirts & Tops', offer: 'From ₹249', img: Tshirt },
        { id: 'Blazer', name: 'Blazers', offer: 'Min. 45% Off', img: ClothesImg },
      ],
      Beauty: [
        { id: 'Lipstick', name: 'Lipsticks', offer: 'Min. 50% Off', img: LipstickDeal },
        { id: 'Serum', name: 'Face Serums', offer: 'Min. 38% Off', img: MakeupHero },
        { id: 'Mascara', name: 'Mascaras', offer: 'Under ₹299', img: Mascara },
        { id: 'Shampoo', name: 'Shampoos', offer: 'Min. 33% Off', img: PlumShampoo },
      ],
      Electronics: [
        { id: 'Earbuds', name: 'Earbuds', offer: 'Min. 58% Off', img: EarbudsDeal },
        { id: 'Phone', name: 'Smartphones', offer: 'From ₹54,999', img: SamsungS24 },
        { id: 'Laptop', name: 'Laptops', offer: 'Min. 23% Off', img: AsusLaptop },
      ],
      Jewellery: [
        { id: 'Pendant', name: 'Pendants', offer: 'Min. 18% Off', img: JewelleryImg },
        { id: 'Earrings', name: 'Earrings', offer: 'Min. 40% Off', img: JewelleryImg },
        { id: 'Pearl', name: 'Pearls', offer: 'Min. 50% Off', img: JewelleryImg },
      ],
      Toys: [
        { id: 'Blocks', name: 'Blocks', offer: 'Min. 40% Off', img: ToysImg },
        { id: 'Car', name: 'RC Cars', offer: 'Min. 48% Off', img: ToysImg },
        { id: 'Teddy', name: 'Plush Toys', offer: 'Min. 46% Off', img: ToysImg },
      ]
    };
    return map[selectedCategory] || [];
  }, [selectedCategory]);

  const subcategoriesToDisplay = adminSubcategories.length > 0 ? adminSubcategories : fallbackSubcategories;

  // Active Subcategory Object
  const currentSubcategoryObj = useMemo(() => {
    if (!selectedSubcategory) return null;
    return subcategoriesToDisplay.find(
      (s) => s.id === selectedSubcategory || s.name === selectedSubcategory || s.slug === selectedSubcategory
    ) || { name: selectedSubcategory, id: selectedSubcategory };
  }, [selectedSubcategory, subcategoriesToDisplay]);

  // Real-time backend fetching when a dynamic subcategory from Admin is selected
  useEffect(() => {
    if (!selectedSubcategory) {
      setSubProducts(null);
      return;
    }

    const activeSub = subcategoriesToDisplay.find(
      (s) => s.id === selectedSubcategory || s.name === selectedSubcategory || s.slug === selectedSubcategory
    );

    const subId = activeSub?.id;
    const isMongoId = subId && /^[0-9a-fA-F]{24}$/.test(subId);

    if (isMongoId) {
      let cancelled = false;
      setSubLoading(true);

      const fetchSubProducts = async () => {
        try {
          const tab = getCurrentMarketplaceTab();
          const data = await getCategoryProducts(subId, { limit: 50, marketplaceTab: tab });
          const items = extractList(data).map((p) => mapProductForCard(p));
          if (!cancelled) {
            setSubProducts(items);
          }
        } catch {
          if (!cancelled) setSubProducts(null);
        } finally {
          if (!cancelled) setSubLoading(false);
        }
      };

      fetchSubProducts();
      return () => {
        cancelled = true;
      };
    } else {
      setSubProducts(null);
    }
  }, [selectedSubcategory, subcategoriesToDisplay]);

  // Click handler for subcategory card - fully responsive and updates URL & state
  const handleSubcategoryClick = useCallback((sub) => {
    const isAlreadySelected =
      selectedSubcategory === sub.id ||
      selectedSubcategory === sub.name ||
      selectedSubcategory === sub.slug;

    const nextVal = isAlreadySelected ? null : (sub.slug || sub.name || sub.id);

    setSelectedSubcategory(nextVal);

    // Keep URL parameter synchronized
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);
      if (nextVal) {
        next.set('subcategory', nextVal);
      } else {
        next.delete('subcategory');
      }
      return next;
    }, { replace: true });

    // Smoothly scroll down to products view so user immediately sees results
    setTimeout(() => {
      const el = document.getElementById('category-products-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }, [selectedSubcategory, setSearchParams]);

  const handleClearSubcategory = useCallback(() => {
    setSelectedSubcategory(null);
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);
      next.delete('subcategory');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Filtered & Sorted Products when Subcategory or Sort is active
  const filteredAndSortedProducts = useMemo(() => {
    // If dedicated backend products were returned for this subcategory, use them
    let list = (subProducts !== null && subProducts.length > 0)
      ? [...subProducts]
      : [...allProducts];

    // Otherwise, filter in-memory products against selected subcategory
    if (selectedSubcategory && (subProducts === null || subProducts.length === 0)) {
      const activeSub = subcategoriesToDisplay.find(
        (s) => s.id === selectedSubcategory || s.name === selectedSubcategory || s.slug === selectedSubcategory
      );
      const subName = (activeSub?.name || selectedSubcategory || '').toLowerCase().trim();
      const subSlug = (activeSub?.slug || '').toLowerCase().trim();
      const subId = String(activeSub?.id || selectedSubcategory).toLowerCase().trim();

      // Normalize search keywords (including singular and plural variants)
      const rawKeywords = [
        subName,
        subSlug,
        ...subName.split(/[\s,&/()\-]+/).filter((w) => w.length > 1)
      ].filter(Boolean);

      const keywords = Array.from(new Set([
        ...rawKeywords,
        ...rawKeywords.map((k) => k.replace(/s$/, '')),
        ...rawKeywords.map((k) => k.replace(/es$/, ''))
      ])).filter((k) => k.length > 1);

      const matched = list.filter((p) => {
        // Direct category / subcategory ID match
        const pCatId = typeof p.categoryId === 'object' && p.categoryId !== null
          ? String(p.categoryId._id || p.categoryId.id || '').toLowerCase()
          : String(p.categoryId || '').toLowerCase();
        const pSubCatId = typeof p.subcategoryId === 'object' && p.subcategoryId !== null
          ? String(p.subcategoryId._id || p.subcategoryId.id || '').toLowerCase()
          : String(p.subcategoryId || '').toLowerCase();

        if (subId && (pCatId === subId || pSubCatId === subId)) return true;

        // Name, category, tag, brand, or description match
        const pName = (p.name || p.title || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pDesc = (p.description || p.shortDescription || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        const pTags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];

        return keywords.some((kw) => {
          if (!kw) return false;
          return (
            pName.includes(kw) ||
            pCat.includes(kw) ||
            pDesc.includes(kw) ||
            pBrand.includes(kw) ||
            pTags.some((t) => t.includes(kw))
          );
        });
      });

      list = matched;
    }

    // Sort
    if (activeSort === 'Price: Low to High') {
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (activeSort === 'Price: High to Low') {
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    if (activeSort === 'Customer Rating') {
      return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    return list;
  }, [allProducts, subProducts, selectedSubcategory, subcategoriesToDisplay, activeSort]);

  const displayedProducts = useMemo(
    () => filteredAndSortedProducts.slice(0, displayCount),
    [filteredAndSortedProducts, displayCount]
  );

  const handleAddToCart = useCallback(async (product, e) => {
    e.stopPropagation();
    try {
      await addProductToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.img,
      });
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Could not add to cart');
    }
  }, []);

  const handleProductClick = useCallback((product) => {
    navigate('/product-detail', {
      state: {
        product: {
          ...product,
          off: product.discount || product.off,
          label: 'Special deal',
          brand: product.brand || 'Mithilakart Seller',
          reviews: '1,200',
          delivery: 'Tomorrow'
        }
      }
    });
  }, [navigate]);

  if (!selectedCategory) return null;

  return (
    <div id="category-products-section" className="py-2 px-3 w-full max-w-[1600px] mx-auto transition-all duration-300">
      
      {/* ── Active Category Control Bar ── */}
      <div className="flex items-center justify-between mb-4 bg-white border border-[#EADCC9]/70 rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF8EE] border border-[#3E5A44]/30 flex items-center justify-center text-[#3E5A44]">
            <Tag size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15.5px] font-black text-[#3F2A20] leading-tight">
                {selectedCategory}
              </h2>
              <span className="text-[9.5px] font-bold bg-[#3E5A44]/10 text-[#3E5A44] px-2 py-0.5 rounded-full">
                {filteredAndSortedProducts.length} items
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">
              {adminSubcategories.length > 0 
                ? `${adminSubcategories.length} subcategories from Admin`
                : 'Showing curated collections & products'}
            </p>
          </div>
        </div>

        {onResetToAll && (
          <button
            onClick={onResetToAll}
            className="flex items-center gap-1 text-[11px] font-bold text-[#3E5A44] hover:text-[#2d4232] bg-[#FFF8EE] border border-[#3E5A44]/30 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <X size={13} />
            <span>Show All</span>
          </button>
        )}
      </div>

      {/* ── SECTION 1: Subcategories Horizontal Row (100% Dynamic & Clickable) ── */}
      {subcategoriesToDisplay.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-black text-[#3F2A20] tracking-tight flex items-center gap-1.5">
                <span>{selectedCategory} Subcategories</span>
              </h3>
              <span className="text-[9px] font-semibold text-slate-500 bg-[#EADCC9]/40 px-2 py-0.5 rounded-md">
                Click to filter products
              </span>
            </div>
            {selectedSubcategory && (
              <button
                onClick={handleClearSubcategory}
                className="text-[11px] font-bold text-[#3E5A44] hover:underline flex items-center gap-1 cursor-pointer bg-[#FFF8EE] px-2.5 py-1 rounded-full border border-[#3E5A44]/20 active:scale-95 transition-transform"
              >
                <X size={12} /> Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-1 px-1">
            {/* "All" Subcategory Pill Card */}
            <button
              type="button"
              onClick={handleClearSubcategory}
              className={`flex-shrink-0 w-[115px] sm:w-[130px] rounded-[18px] p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                !selectedSubcategory
                  ? 'bg-[#3E5A44] text-white border-[#3E5A44] shadow-md ring-2 ring-[#3E5A44]/30'
                  : 'bg-white text-[#3F2A20] border-[#EADCC9] hover:bg-[#FFF8EE]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                !selectedSubcategory ? 'bg-white/20 text-white' : 'bg-[#FFF8EE] text-[#3E5A44]'
              }`}>
                <Layers size={17} />
              </div>
              <span className="text-[11px] font-black leading-tight text-center">All {selectedCategory}</span>
              <span className={`text-[9px] mt-0.5 ${!selectedSubcategory ? 'text-[#FDE68A]' : 'text-slate-400'}`}>
                {allProducts.length} items
              </span>
            </button>

            {/* Subcategories (Clickable to Filter in-place) */}
            {subcategoriesToDisplay.map((sub) => {
              const isSelected =
                selectedSubcategory === sub.id ||
                selectedSubcategory === sub.name ||
                selectedSubcategory === sub.slug;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubcategoryClick(sub);
                  }}
                  className={`flex-shrink-0 w-[125px] sm:w-[140px] md:w-[155px] cursor-pointer transition-all duration-200 active:scale-95 rounded-[18px] p-2.5 flex flex-col justify-between text-left ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#283E2D] via-[#3E5A44] to-[#1E2E22] text-white border-2 border-[#3E5A44] shadow-md ring-2 ring-[#3E5A44]/30'
                      : 'bg-[#FFF8EE] text-[#3F2A20] border border-[#EADCC9] hover:border-[#3E5A44]/60 hover:shadow-xs'
                  }`}
                >
                  <div className="w-full aspect-square bg-white rounded-[14px] border border-[#EADCC9]/70 overflow-hidden p-1 flex items-center justify-center relative shadow-xs">
                    <img
                      src={sub.img || FashionHero}
                      alt={sub.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover rounded-[10px] group-hover:scale-105 transition-transform duration-500"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-[#3E5A44] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center w-full">
                    <h4 className={`text-[11px] font-black leading-tight truncate px-0.5 ${isSelected ? 'text-white' : 'text-[#3F2A20]'}`}>
                      {sub.name}
                    </h4>
                    {sub.offer ? (
                      <span className={`text-[9.5px] font-extrabold block mt-0.5 ${isSelected ? 'text-[#FDE68A]' : 'text-[#E26D22]'}`}>
                        {sub.offer}
                      </span>
                    ) : (
                      <span className={`text-[8.5px] font-semibold block mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {isSelected ? 'Selected' : 'Filter by this'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 2: Dynamic Products Grid & Real-time Sorting ── */}
      <div id="category-products-grid" className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pt-2 border-t border-[#EADCC9]/50">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-black text-[#3F2A20] tracking-tight">
              {currentSubcategoryObj
                ? `${currentSubcategoryObj.name}`
                : `All ${selectedCategory} Products`}
            </h3>
            {currentSubcategoryObj && (
              <div className="flex items-center gap-1 bg-[#FFF8EE] border border-[#3E5A44]/30 text-[#3E5A44] px-2 py-0.5 rounded-full text-[9.5px] font-bold">
                <span>Filter active</span>
                <button
                  type="button"
                  onClick={handleClearSubcategory}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                  title="Remove filter"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Showing {displayedProducts.length} of {filteredAndSortedProducts.length} items
          </p>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5 flex-shrink-0">
            <SlidersHorizontal size={11} /> Sort:
          </span>
          {['Popularity', 'Price: Low to High', 'Price: High to Low', 'Customer Rating'].map((sortKey) => (
            <button
              key={sortKey}
              onClick={() => setActiveSort(sortKey)}
              className={`text-[9.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors cursor-pointer ${
                activeSort === sortKey
                  ? 'bg-[#3E5A44] text-white shadow-xs'
                  : 'bg-white border border-[#EADCC9] text-slate-700 hover:bg-slate-50'
              }`}
            >
              {sortKey}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {(loading || subLoading) ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#3E5A44] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500">
            {subLoading
              ? `Filtering ${currentSubcategoryObj?.name || 'subcategory'}...`
              : `Loading ${selectedCategory} products...`}
          </span>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="py-10 px-4 text-center bg-white rounded-2xl border border-[#EADCC9]/70 shadow-xs max-w-md mx-auto my-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF8EE] border border-[#3E5A44]/30 flex items-center justify-center mx-auto mb-2.5 text-[#3E5A44]">
            <Layers size={22} />
          </div>
          <h4 className="text-[14px] font-black text-[#3F2A20]">
            No products found in "{currentSubcategoryObj?.name || selectedSubcategory}"
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
            There are currently no products under this subcategory. You can explore all {selectedCategory} products below.
          </p>
          <button
            type="button"
            onClick={handleClearSubcategory}
            className="mt-3.5 px-4 py-1.5 bg-[#3E5A44] hover:bg-[#2e4433] text-white text-[11px] font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            View All {selectedCategory} ({allProducts.length} items)
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Load More Button */}
          {displayCount < filteredAndSortedProducts.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 8)}
                className="px-6 py-2 bg-white border border-[#3E5A44]/40 text-[#3E5A44] hover:bg-[#3E5A44] hover:text-white rounded-2xl text-[12px] font-black transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Load More Products ({filteredAndSortedProducts.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(CategoryProductsSection);
