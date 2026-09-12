import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Search, ShoppingCart, Star, Heart, Send,
  Share2, ChevronRight, X, MapPin, Truck, RotateCcw, IndianRupee,
  Check, Copy, ChevronDown, ChevronUp, Plus, Minus, Maximize2,
  ShieldCheck, HelpCircle, Flame, Award, Sparkles, Filter, ThumbsUp,
  Upload, Film, Loader2
} from 'lucide-react';
import { formatPrice, parsePrice } from '../../../shared/utils/priceFormatter';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../../shared/utils/imageUtils';
import { useLocation as useRouterLocation, useNavigate, useParams, Link } from 'react-router-dom';
import useAccountStore from '../../../store/useAccountStore';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { getDisplayAddress, useHydrateAddresses } from '../../../shared/hooks/useDeliverToAddress';
import { useTranslation } from 'react-i18next';
import { getProductById, getProductReviews, getProductQuestions, createProductReview, askProductQuestion, getCategoryProducts } from '../services/catalogApi';
import { uploadReviewMedia } from '../../../shared/services/uploadService';
import { getOrders } from '../services/ordersApi';
import { addToWishlist, removeFromWishlist as removeWishlistItem } from '../services/userApi';
import { mapProductForDetail, mapProductForCard, extractList, mapReview, mapQuestion } from '../utils/mappers';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import { customerApi } from '../../../shared/api/client';
import { toast } from 'react-hot-toast';
import { addProductToCart, fetchCartCount } from '../utils/cartUtils';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import SEO from '../../../shared/components/SEO';
import JsonLd from '../../../shared/components/JsonLd';
import { SITE_URL } from '../../../config/siteConfig';

// Import Assets
import PlumShampoo from '../../../assets/products/product05.jpg';
import FashionHero from '../../../assets/products/product06.jpg';
import LorealShampoo from '../../../assets/products/product07.jpg';
import EarbudsDeal from '../../../assets/products/product03.jpg';

const ProductDetail = () => {
  const { t } = useTranslation();
  const location = useRouterLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const { location: liveLocation } = useLiveLocation();
  const { savedAddresses, selectedAddressId } = useAccountStore();
  useHydrateAddresses();
  const deliverTo = getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation });

  const theme = useTabTheme();
  const {
    primaryText,
    primaryBg,
    primaryBgHover,
    primaryBorder,
    primaryLightBg,
    shadowColor,
    shadowColorLight,
    accentBg,
    accentText,
    accentBorder
  } = theme;
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';

  // Base state
  const [selectedSize, setSelectedSize] = useState('S');
  const { wishlist, addToWishlist: addToWishlistStore, removeFromWishlist } = useAccountStore();
  const [product, setProduct] = useState(null);
  const isQuickProduct = Boolean(
    product?.commerceFlows?.includes('quick_shop') ||
    product?.commerceFlows?.includes('fresh_grocery') ||
    product?.marketplaceTab === 'quick_shop' ||
    product?.marketplaceTab === 'groceries_fresh' ||
    isQuickShopFlow ||
    isFreshGroceryFlow
  );
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, body: '' });
  const [reviewFiles, setReviewFiles] = useState([]);
  const [previewReviewMedia, setPreviewReviewMedia] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Premium interactive states
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, isZooming: false });
  const [touchStartImg, setTouchStartImg] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'loading' | 'available' | 'unavailable' | 'invalid' | null
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [reviewSort, setReviewSort] = useState('recent');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [helpfulReviews, setHelpfulReviews] = useState({});
  const [likedQuestions, setLikedQuestions] = useState({});
  const [likedAnswers, setLikedAnswers] = useState({});

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

  // Image Zoom on Hover (Desktop)
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y, isZooming: true });
  };
  const handleMouseLeave = () => setZoomPos({ x: 0, y: 0, isZooming: false });

  // Swipe support for mobile images
  const handleTouchStartImg = (e) => {
    setTouchStartImg(e.changedTouches[0].clientX);
  };
  const handleTouchEndImg = (e) => {
    const touchEndImg = e.changedTouches[0].clientX;
    const diff = touchStartImg - touchEndImg;
    if (diff > 50) {
      setCurrentSlide((prev) => (prev + 1) % mediaList.length);
    } else if (diff < -50) {
      setCurrentSlide((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    }
  };

  const resolvedProductId = product?.id || location.state?.product?.id;

  const findDeliveredOrderId = async (pid) => {
    const data = await getOrders({ status: 'delivered', limit: 30 });
    const orders = extractList(data);
    for (const order of orders) {
      const subs = order.sellerSubOrders || [];
      const hasProduct = subs.some((sub) =>
        (sub.items || []).some((item) => String(item.productId) === String(pid))
      );
      if (hasProduct) return order.id || order._id;
    }
    return null;
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated('customer')) {
      navigate('/login');
      return;
    }
    if (!reviewForm.body.trim()) {
      toast.error('Please write a review');
      return;
    }
    setEngagementLoading(true);
    try {
      const orderId = await findDeliveredOrderId(resolvedProductId);
      if (!orderId) {
        toast.error('You need a delivered order for this product to review');
        return;
      }

      const uploadedImages = [];
      const uploadedVideos = [];

      for (const file of reviewFiles) {
        const url = await uploadReviewMedia(file);
        if (file.type.startsWith('video/')) {
          uploadedVideos.push(url);
        } else {
          uploadedImages.push(url);
        }
      }

      await createProductReview(resolvedProductId, {
        orderId,
        rating: Number(reviewForm.rating),
        body: reviewForm.body.trim(),
        images: uploadedImages,
        videos: uploadedVideos,
      });
      toast.success('Review submitted for moderation');
      setReviewForm({ rating: 5, body: '' });
      setReviewFiles([]);
      const reviewData = await getProductReviews(resolvedProductId).catch(() => []);
      setReviews(extractList(reviewData).map(mapReview));
    } catch (err) {
      toast.error(err?.message || 'Failed to submit review');
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!isAuthenticated('customer')) {
      navigate('/login');
      return;
    }
    if (!questionText.trim()) {
      toast.error('Enter your question');
      return;
    }
    setEngagementLoading(true);
    try {
      await askProductQuestion(resolvedProductId, { question: questionText.trim() });
      toast.success('Question submitted');
      setQuestionText('');
      const questionData = await getProductQuestions(resolvedProductId).catch(() => []);
      setQuestions(extractList(questionData?.items || questionData).map(mapQuestion));
    } catch (err) {
      toast.error(err?.message || 'Failed to submit question');
    } finally {
      setEngagementLoading(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : product?.rating || '4.2';

  // Rating distribution calculations
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviews.length) {
      // Default placeholder distribution
      return { 5: 75, 4: 15, 3: 5, 2: 3, 1: 2 };
    }
    reviews.forEach(r => {
      const rating = Math.round(r.rating || 5);
      if (dist[rating] !== undefined) dist[rating]++;
    });
    // Convert counts to percentages
    const total = reviews.length;
    Object.keys(dist).forEach(key => {
      dist[key] = Math.round((dist[key] / total) * 100);
    });
    return dist;
  }, [reviews]);

  useEffect(() => {
    let cancelled = false;
    const incomingProduct = location.state?.product;
    // `?id=` lets a direct link, a search-engine crawl, or a shared URL
    // resolve to the right product without navigation state — the state-only
    // path above still wins when present (no extra fetch on in-app navigation).
    const queryId = new URLSearchParams(location.search).get('id');
    const productId = paramId || location.state?.productId || incomingProduct?.id || incomingProduct?._id || incomingProduct?.productId || queryId;
    const isValidId = typeof productId === 'string' && productId.length >= 3;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isValidId) {
          const [detail, reviewData, questionData] = await Promise.all([
            getProductById(productId).catch(() => null),
            getProductReviews(productId).catch(() => []),
            getProductQuestions(productId).catch(() => []),
          ]);
          if (!cancelled) {
            if (detail) {
              setProduct(mapProductForDetail(detail, incomingProduct?.img || incomingProduct?.image || PlumShampoo));
            } else if (incomingProduct) {
              setProduct(mapProductForDetail(incomingProduct, PlumShampoo));
            }
            setReviews(extractList(reviewData).map(mapReview));
            setQuestions(extractList(questionData?.items || questionData).map(mapQuestion));
          }
        } else if (incomingProduct) {
          if (!cancelled) {
            setProduct(mapProductForDetail(incomingProduct, PlumShampoo));
          }
        } else if (!cancelled) {
          setError('Product not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load product');
          if (incomingProduct) {
            setProduct(mapProductForDetail(incomingProduct, PlumShampoo));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [paramId, location.state, location.search]);

  useEffect(() => {
    let cancelled = false;

    if (!product?.categoryId) {
      setSimilarProducts([]);
      return undefined;
    }

    getCategoryProducts(product.categoryId, { limit: 10 })
      .then((data) => {
        if (cancelled) return;
        const list = extractList(data)
          .map((p) => mapProductForCard(p))
          .filter((p) => p.id !== product.id);
        setSimilarProducts(list);
      })
      .catch(() => {
        if (!cancelled) setSimilarProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [product?.categoryId, product?.id]);

  useEffect(() => {
    let cancelled = false;
    customerApi.get('/coupons')
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        setAvailableCoupons(list.map((c) => ({
          code: c.code,
          description: c.description || `${c.discountType === 'percent' ? c.discountValue + '%' : '₹' + c.discountValue} off on orders above ₹${c.minOrderAmount || 0}`,
          minPurchase: c.minOrderAmount || 0,
        })));
      })
      .catch(() => {
        if (!cancelled) setAvailableCoupons([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSizes = useMemo(() => {
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) return product.sizes;
    if (Array.isArray(product?.variants) && product.variants.some((v) => v.size)) {
      return [...new Set(product.variants.map((v) => v.size).filter(Boolean))];
    }
    return [];
  }, [product]);

  const detailsData = useMemo(() => {
    if (!product) return { highlights: [], specs: [] };

    // Only real attributes the product actually carries — a product with no
    // fabric/sleeve/etc. shows fewer rows rather than fabricated defaults
    // (a bag being shown a fake "Sleeve: Full Sleeve" spec, for example).
    const highlightFields = [
      ['Pack of', product.pack],
      ['Fabric', product.fabric],
      ['Sleeve', product.sleeve],
      ['Pattern', product.pattern],
      ['Collar', product.collar],
      ['Color', product.color],
    ];
    const specFields = [
      ['Brand', product.brand],
      ['Size', product.size],
      ['Fit', product.fit],
    ];

    return {
      highlights: highlightFields
        .filter(([, value]) => value)
        .map(([label, value]) => ({ label, value })),
      specs: specFields
        .filter(([, value]) => value)
        .map(([label, value]) => ({ label, value })),
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    window.scrollTo(0, 0);
    setIsWishlisted(wishlist.some(item => item.id === product.id));

    const updateCount = async () => {
      const total = await fetchCartCount();
      setCartCount(total);
    };
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, [product, wishlist]);

  const toggleWishlist = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated('customer')) {
      navigate('/login', { state: { from: location.pathname, flow: theme.activeFlow, product } });
      return;
    }
    try {
      if (isWishlisted) {
        try {
          await removeWishlistItem(product.id);
        } catch {
          // ignore API error (e.g. 401 unauthenticated) and update local store
        }
        removeFromWishlist(product.id);
        setToastMessage('Removed from Wishlist');
      } else {
        try {
          await addToWishlist(product.id);
        } catch {
          // ignore API error (e.g. 401 unauthenticated) and update local store
        }
        addToWishlistStore(product);
        setToastMessage('Added to Wishlist');
      }
      setIsWishlisted(!isWishlisted);
    } catch {
      setToastMessage('Could not update wishlist');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [product, isWishlisted, addToWishlistStore, removeFromWishlist, navigate, theme.activeFlow, location.pathname]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated('customer')) {
      navigate('/login', { state: { from: location.pathname, flow: theme.activeFlow, product } });
      return;
    }
    try {
      await addProductToCart(product, quantity, theme.activeFlow);
      setToastMessage(`Added ${quantity} item(s) to cart`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      setToastMessage(err?.message || 'Could not add to cart');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, [product, quantity, navigate, theme.activeFlow, location.pathname]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    if (!isAuthenticated('customer')) {
      navigate('/login', { state: { from: '/checkout', flow: theme.activeFlow, checkoutProduct: { ...product, quantity }, product } });
    } else {
      navigate('/vendor/checkout', { state: { product: { ...product, quantity } } });
    }
  }, [product, quantity, navigate, theme.activeFlow]);

  const mediaList = useMemo(() => {
    if (!product) return [];
    const items = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url) items.push({ type: 'image', url: getImageUrl(url) });
      });
    } else if (product.image) {
      items.push({ type: 'image', url: getImageUrl(product.image) });
    } else if (product.img) {
      items.push({ type: 'image', url: getImageUrl(product.img) });
    } else if (product.imageUrl) {
      items.push({ type: 'image', url: getImageUrl(product.imageUrl) });
    }
    if (Array.isArray(product.videos) && product.videos.length > 0) {
      product.videos.forEach((vid) => {
        const url = typeof vid === 'string' ? vid : vid?.url;
        if (url) items.push({ type: 'video', url });
      });
    }
    if (!items.length) {
      items.push({ type: 'image', url: getImageUrl(product.image || product.img || product.imageUrl || PlumShampoo) });
    }
    return items;
  }, [product]);

  const activeMedia = mediaList[currentSlide] || mediaList[0] || { type: 'image', url: getImageUrl(product?.image || product?.img || PlumShampoo) };

  // Safe pricing derivations - handles string numbers with commas ('50,000') safely without NaN
  const unitPrice = useMemo(() => parsePrice(product?.price), [product?.price]);
  const unitOldPrice = useMemo(() => parsePrice(product?.oldPrice || product?.mrp), [product?.oldPrice, product?.mrp]);
  const effectiveOldPrice = useMemo(() => (unitOldPrice > unitPrice ? unitOldPrice : 0), [unitOldPrice, unitPrice]);
  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const totalOldPrice = useMemo(() => effectiveOldPrice * quantity, [effectiveOldPrice, quantity]);
  const unitSavings = useMemo(() => (effectiveOldPrice > unitPrice ? (effectiveOldPrice - unitPrice) : 0), [effectiveOldPrice, unitPrice]);
  const totalSavings = useMemo(() => unitSavings * quantity, [unitSavings, quantity]);

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

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast.success(`Coupon ${code} copied successfully!`);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  // Pincode availability checker using backend serviceability API
  const handlePincodeCheck = async () => {
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setPincodeStatus('loading');
      try {
        const res = await customerApi.get(`/shipping/serviceability?pincode=${pincode}`);
        const data = res?.data?.data || res?.data;
        if (data?.serviceable !== false) {
          setPincodeStatus('available');
        } else {
          setPincodeStatus('unavailable');
        }
      } catch {
        setPincodeStatus('available');
      }
    } else {
      setPincodeStatus('invalid');
    }
  };

  // Specs filtering
  const filteredSpecs = detailsData?.specs ? detailsData.specs.filter(item => 
    item.label.toLowerCase().includes(specSearchQuery.toLowerCase()) || 
    item.value.toLowerCase().includes(specSearchQuery.toLowerCase())
  ) : [];

  // Review interactions
  const handleHelpfulReview = (id) => {
    setHelpfulReviews(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    toast.success('Thank you for your feedback!');
  };

  // Q&A interactions
  const handleLikeQuestion = (id) => {
    setLikedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered & Sorted Reviews
  const processedReviews = useMemo(() => {
    // Production readiness audit Pass 2 (2026-08-25): this previously
    // fabricated three fake reviews (fake names, fake dates, fake "Verified"
    // badges, fake photo claims) whenever a product had zero real reviews —
    // real customers were shown fake social proof on a live product page.
    // Removed; a real "no reviews yet" empty state is rendered below instead.
    let list = [...reviews];

    // Filtering
    if (reviewFilter === 'verified') {
      list = list.filter(r => r.isVerified);
    } else if (reviewFilter === 'fiveStar') {
      list = list.filter(r => r.rating === 5);
    } else if (reviewFilter === 'withImages') {
      list = list.filter(r => r.hasImage);
    }

    // Sorting
    if (reviewSort === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (reviewSort === 'lowest') {
      list.sort((a, b) => a.rating - b.rating);
    } else {
      // recent/default
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return list;
  }, [reviews, reviewFilter, reviewSort]);

  if (!product) {
    return (
      <>
        {!loading && <SEO title="Product Not Found" noindex />}
        <div className="min-h-screen flex items-center justify-center bg-bg-cream">
          <p className="text-sm text-slate-655">{loading ? 'Loading product...' : error || 'Product not found'}</p>
        </div>
      </>
    );
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length ? product.images : [product.image].filter(Boolean),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    ...(product.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.price).replace(/,/g, ''),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/product-detail?id=${product.id}`,
    },
  };

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || undefined}
        path={`/product-detail?id=${product.id}`}
        image={product.image}
        type="product"
      />
      <JsonLd data={productJsonLd} />
      <div className={`min-h-screen pb-28 font-sans text-slate-800 transition-colors duration-300 relative ${
      isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-bg-cream'
    }`}>

      {/* Boutique Header */}
      <div className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.01)] transition-colors duration-300 relative z-10 ${
        isFreshGroceryFlow ? 'bg-[#D9A21B] text-white' : 'bg-[#FCF7EE]/90 border-[#F3E3CD]/60 backdrop-blur-md'
      }`}>
        <button onClick={() => navigate(-1)} className={`p-1.5 rounded-full transition-colors active:scale-90 ${
          isFreshGroceryFlow ? 'text-white hover:bg-white/5' : 'text-slate-800 hover:bg-gray-50'
        }`}>
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className={`text-[12px] font-black tracking-[0.25em] ${isFreshGroceryFlow ? 'text-white' : primaryText} uppercase pl-4`}>
          Mithilakart
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/vendor/search')} 
            className={`p-1.5 rounded-full transition-colors active:scale-90 ${
              isFreshGroceryFlow ? 'text-white hover:bg-white/5' : 'text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Search size={20} />
          </button>
          <div 
            onClick={() => navigate('/cart')} 
            className={`relative p-1.5 rounded-full transition-colors active:scale-95 cursor-pointer ${
              isFreshGroceryFlow ? 'text-white hover:bg-white/5' : 'text-slate-800 hover:bg-gray-50'
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
        
        {/* Left Column: Image Galleries */}
        <div className="flex flex-col">
          <div className="px-4 pt-4 pb-2 relative">
            <div 
              onTouchStart={handleTouchStartImg}
              onTouchEnd={handleTouchEndImg}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full aspect-[4/5] bg-white rounded-[28px] overflow-hidden shadow-[0_12px_32px_rgba(8,66,36,0.06)] border border-slate-100 group cursor-zoom-in"
            >
              {activeMedia.type === 'video' ? (
                <video 
                  src={activeMedia.url} 
                  controls 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover transition-all duration-500 ease-out" 
                />
              ) : (
                <img 
                  src={getImageUrl(activeMedia.url)} 
                  alt={product.name} 
                  onError={handleImageError}
                  style={zoomPos.isZooming ? {
                    transform: 'scale(2)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                  } : undefined}
                  className="w-full h-full object-cover transition-transform duration-100 ease-out" 
                />
              )}

              {/* Lightbox Trigger */}
              <button
                onClick={() => setIsFullscreenOpen(true)}
                className="absolute bottom-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-white/50 hover:bg-white transition-all scale-0 group-hover:scale-100 duration-200"
              >
                <Maximize2 size={16} className="text-slate-700" />
              </button>

              {/* Floating Widgets */}
              <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-10">
                <button 
                  onClick={toggleWishlist}
                  className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border border-white/50 hover:bg-white"
                >
                  <Heart size={16} className={isWishlisted ? "text-red-500 fill-red-500 transition-all scale-110" : "text-slate-700"} />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border border-white/50 hover:bg-white"
                >
                  <Share2 size={15} className="text-slate-700" />
                </button>
              </div>

              {/* Rating & Trending Badge */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
                <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-100 flex items-center gap-1 shadow-sm">
                  <span className="text-[11px] font-black text-slate-800">{avgRating}</span>
                  <Star size={10} fill="#e2a750" className="text-amber-500" />
                  <div className="w-[1px] h-2.5 bg-gray-200 mx-0.5" />
                  <span className="text-[9.5px] font-bold text-slate-500">{reviews.length || product.ratingCount || 120} ratings</span>
                </div>
              </div>
            </div>

            {/* Custom active thumbnail list */}
            <div className="flex justify-center flex-wrap gap-2.5 mt-4 pb-1">
              {mediaList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`relative w-12 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    currentSlide === idx 
                      ? `${primaryBorder} scale-105 shadow-md opacity-100` 
                      : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">▶</span>
                      </div>
                    </div>
                  ) : (
                    <img src={getImageUrl(item.url)} onError={handleImageError} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Premium Details */}
        <div className="flex flex-col">
          
          {/* Brand & Name Header */}
          <div className="px-4 py-2 mt-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100">
                <Flame size={10} /> BESTSELLER
              </span>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                <Award size={10} /> TRENDING
              </span>
            </div>
            
            <span className={`text-[11px] font-black tracking-[0.25em] ${primaryText} uppercase block mb-1`}>
              {product.brand || 'Mithilakart Premium'}
            </span>
            <h1 className="text-[22px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">
              {product.name}
            </h1>
            
            {/* High-end Pricing Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-[#FFD633] text-slate-900 text-[20px] font-black px-5 py-0.5 rounded-[4px] relative flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] select-none mr-1">
                    {/* Coupon style side cutouts */}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-r border-slate-100"></div>
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-l border-slate-100"></div>
                    {formatPrice(unitPrice)}
                  </div>
                  {effectiveOldPrice > unitPrice && (
                    <span className="text-sm text-slate-400 line-through">MRP {formatPrice(effectiveOldPrice)}</span>
                  )}
                  {unitSavings > 0 && (
                    <span className="text-emerald-600 text-sm font-bold">({product.discount || `${Math.round((unitSavings / effectiveOldPrice) * 100)}% OFF`})</span>
                  )}
                </div>
                <div className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-extrabold">
                  Inclusive of GST
                </div>
              </div>
              
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                {unitSavings > 0 ? (
                  <div>You save <span className="text-slate-800 font-bold">{formatPrice(unitSavings)}</span> on this purchase</div>
                ) : (
                  <div className="text-emerald-700 font-semibold">Direct Artisan & Verified Seller Deal</div>
                )}
                <div className="text-red-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Offer ends soon!
                </div>
              </div>
            </div>
          </div>

          {/* Available Offers Carousel/Grid */}
          <div className="px-4 py-3 mt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
              Best Offers For You
            </span>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              <div className="min-w-[200px] bg-slate-900 text-white rounded-2xl p-3 flex flex-col justify-between border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/5 rounded-full"></div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#FFD633] mb-1">Mithilakart Special</div>
                  <div className="text-xs font-bold leading-tight">Flat ₹200 Cashback</div>
                </div>
                <div className="text-[9px] text-slate-300 mt-3">On orders above ₹999</div>
              </div>
              <div className="min-w-[200px] bg-white rounded-2xl p-3 flex flex-col justify-between border border-slate-200 shadow-sm">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Bank Offer</div>
                  <div className="text-xs font-bold text-slate-800 leading-tight">10% Instant Discount</div>
                </div>
                <div className="text-[9px] text-slate-500 mt-3">Using HDFC Bank Debit/Credit Cards</div>
              </div>
              <div className="min-w-[200px] bg-white rounded-2xl p-3 flex flex-col justify-between border border-slate-200 shadow-sm">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-1">Free Delivery</div>
                  <div className="text-xs font-bold text-slate-800 leading-tight">Free Express Shipping</div>
                </div>
                <div className="text-[9px] text-slate-500 mt-3">Valid for elite members</div>
              </div>
            </div>
          </div>

          {/* Copyable Coupon Code blocks */}
          {availableCoupons.length > 0 && (
            <div className="px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Apply Coupons
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {availableCoupons.map((coupon) => (
                  <div key={coupon.code} className="bg-white border border-dashed border-gray-300 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-slate-400 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 font-extrabold text-[11px] px-2 py-0.5 rounded-md border border-amber-200">
                          {coupon.code}
                        </span>
                        {copiedCoupon === coupon.code && (
                          <span className="text-emerald-600 text-[10px] font-black flex items-center gap-0.5">
                            <Check size={10} /> Copied
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-semibold mt-1">{coupon.description}</p>
                    </div>
                    <button 
                      onClick={() => handleCopyCoupon(coupon.code)}
                      className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
                    >
                      <Copy size={14} className="text-slate-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size Variant Selector */}
          {availableSizes.length > 0 && (
            <div className="px-4 py-3 mt-1">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t('product.selectSize') || 'Select Size'}
                </span>
                <span className="text-[10px] text-slate-500 font-extrabold underline cursor-pointer hover:text-slate-800">
                  Size Chart Helper
                </span>
              </div>
              <div className="flex gap-3">
                {availableSizes.map((size) => {
                  const variant = product?.variants?.find((v) => v.size === size);
                  const isOutOfStock = variant ? (variant.stock <= 0) : false;
                  const isLowStock = variant ? (variant.stock > 0 && variant.stock <= 3) : false;
                  
                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(size)}
                      className={`relative w-11 h-11 rounded-full text-[11px] font-black transition-all flex flex-col items-center justify-center border ${
                        isOutOfStock
                          ? 'bg-slate-50 text-slate-350 border-slate-200 cursor-not-allowed line-through opacity-50'
                          : selectedSize === size
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                          : 'bg-white text-slate-850 border-gray-250 hover:border-slate-300'
                      }`}
                    >
                      <span>{size}</span>
                      {isLowStock && !isOutOfStock && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[7px] px-1 rounded-full font-black scale-90 whitespace-nowrap">
                          {variant?.stock} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop Quantity & Action Buttons */}
          <div className="hidden md:block px-4 py-3 mt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
              Quantity
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-2.5 py-1">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuantity(q => Math.max(1, q - 1));
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} className="stroke-[2.5]" />
                </button>
                <span className="w-10 text-center text-sm font-black text-slate-800 select-none">{quantity}</span>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuantity(q => q + 1);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="flex flex-1 gap-3">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border-2 border-slate-900 text-slate-900 font-extrabold py-3 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[13px] hover:bg-slate-50 cursor-pointer"
                >
                  {t('cart.addToCart')}
                </button>
                <button 
                  onClick={handleBuyNow}
                  className={`flex-1 ${primaryBg} text-white font-black py-3 rounded-full active:scale-[0.98] transition-all flex items-center justify-center text-[13px] ${shadowColor} ${primaryBgHover} cursor-pointer`}
                >
                  {t('cart.buyNow')}
                </button>
              </div>
            </div>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="px-4 py-3 mt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
              Delivery Details
            </span>
            <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-[#3E5A44] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">Deliver to Home</p>
                  <p className="text-[12px] text-slate-500 font-medium truncate mt-1">{deliverTo.label}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              
              <div className="h-[1px] bg-slate-100" />

              {/* Pin checker */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setPincodeStatus(null);
                  }}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-900"
                />
                <button 
                  onClick={handlePincodeCheck}
                  className={`px-4 py-2 text-xs font-black rounded-xl text-white ${primaryBg} hover:opacity-90 active:scale-95 transition-all`}
                >
                  Check
                </button>
              </div>

              {pincodeStatus === 'loading' && <p className="text-[10px] text-slate-500 font-bold">Verifying availability...</p>}
              {pincodeStatus === 'invalid' && <p className="text-[10px] text-red-500 font-bold">Please enter a valid 6-digit Pincode.</p>}
              {pincodeStatus === 'unavailable' && <p className="text-[10px] text-red-500 font-bold">Sorry, delivery is not available to this pincode.</p>}
              {pincodeStatus === 'available' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-800 space-y-1">
                  <p className="font-extrabold flex items-center gap-1"><Check size={12} /> Delivery Available to this location</p>
                  <p className="text-[11px] font-medium text-emerald-700">Estimated Delivery: {product?.deliveryEtaText ? product.deliveryEtaText : (isQuickProduct ? '15-30 mins' : '2-4 business days')}</p>
                  <p className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded w-fit">Serviceable</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Truck size={18} className="text-[#3E5A44]" />
                <div>
                  <p className="text-[12px] font-black text-slate-800">
                    {product?.attributes?.deliveryEstimate
                      ? `Estimated Delivery: ${product.attributes.deliveryEstimate}`
                      : product?.deliveryEtaText
                      ? `Delivery in ${product.deliveryEtaText}`
                      : isQuickProduct
                      ? '⚡ Quick Delivery (15-30 mins)'
                      : 'Standard Delivery (2-4 business days)'}
                  </p>
                  {(product?.deliveryEtaText || isQuickProduct) && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">⚡ Fast delivery available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info & Policies (Returns, Payments, Support) */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2.5">
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

          {/* Trust assurances section */}
          <div className="px-4 py-2 mt-1">
            <div className="bg-slate-900 text-white rounded-3xl p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#FFD633]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">100% Original</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#FFD633]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Verified Seller</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#FFD633]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Product Highlights Accordion */}
          {detailsData.highlights.length > 0 && (
          <div className="px-4 py-1.5 mt-2">
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs">
              <div
                onClick={() => setIsHighlightsOpen(!isHighlightsOpen)}
                className="flex justify-between items-center cursor-pointer"
              >
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Product Highlights</h3>
                <ChevronRight
                  size={16}
                  className={`text-gray-400 transition-transform duration-300 ${isHighlightsOpen ? 'rotate-90' : ''}`}
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
          )}

          {/* Specifications with Inline Search Filter */}
          <div className="px-4 py-1.5 mt-1">
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs">
              <div 
                onClick={() => setIsAllDetailsOpen(!isAllDetailsOpen)}
                className="flex justify-between items-center cursor-pointer"
              >
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Specifications & Info</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5 font-sans">Details, Description and Origin</p>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-300 ${isAllDetailsOpen ? 'rotate-90' : ''}`} 
                />
              </div>
              
              {isAllDetailsOpen && (
                <div className="mt-4 pt-4 border-t border-slate-50 animate-in fade-in duration-350">
                  {/* Search Specs Bar */}
                  <div className="mb-4">
                    <input 
                      type="text" 
                      value={specSearchQuery}
                      onChange={(e) => setSpecSearchQuery(e.target.value)}
                      placeholder="Search specifications..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                    {['Specifications', 'Description'].map(tab => (
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
                      {filteredSpecs.length > 0 ? (
                        filteredSpecs.map((item, idx) => (
                          <div key={idx} className="pb-0.5 border-b border-slate-50">
                            <p className="text-[9.5px] font-bold text-gray-400 mb-0.5">{item.label}</p>
                            <p className="text-[12px] font-black text-slate-800">{item.value}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 col-span-2">No matching specifications found</p>
                      )}
                    </div>
                  )}

                  {activeDetailTab === 'Description' && (
                    <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                      {product.description || 'No description available for this product.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

      {/* Reviews, Ratings Breakdown & Writing Reviews */}
      <div className="mt-4 px-4 md:max-w-6xl md:mx-auto md:w-full space-y-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-900 mb-4">Customer Reviews</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-6 border-b border-slate-100 mb-4">
            <div className="md:col-span-4 text-center">
              <span className="text-[44px] font-black text-slate-900 leading-none">{avgRating}</span>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= Math.round(parseFloat(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold mt-1.5 uppercase">Based on verified purchases</p>
            </div>

            {/* Progress Bars */}
            <div className="md:col-span-8 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3 text-xs font-bold text-slate-650">
                  <span className="w-3 text-right">{stars}★</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${primaryBg} rounded-full`}
                      style={{ width: `${ratingDistribution[stars]}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-400 text-[10px]">{ratingDistribution[stars]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtering & Sorting Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Filter size={13} className="text-slate-400" />
              {['all', 'verified', 'fiveStar', 'withImages'].map(f => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap transition-all ${
                    reviewFilter === f
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100'
                  }`}
                >
                  {f === 'all' && 'All Reviews'}
                  {f === 'verified' && 'Verified Purchases'}
                  {f === 'fiveStar' && '5 Stars'}
                  {f === 'withImages' && 'With Photos'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Sort</span>
              <select 
                value={reviewSort} 
                onChange={(e) => setReviewSort(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            {processedReviews.length === 0 && (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">
                No reviews yet — be the first to share your experience.
              </p>
            )}
            {processedReviews.map((review) => (
              <div key={review.id} className="border-b border-slate-50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={10} className={n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-2 font-bold">{review.userName} · {review.date}</span>
                  </div>
                  {review.isVerified && (
                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Verified Purchase
                    </span>
                  )}
                </div>
                
                <p className="text-[12px] text-slate-700 leading-relaxed font-medium">{review.comment}</p>
                
                {/* Dynamically display uploaded review images & videos */}
                {(review.hasImage || review.hasVideo || review.images?.length > 0 || review.videos?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {/* Render Images */}
                    {review.images?.map((url, imgIdx) => (
                      <div 
                        key={`img-${imgIdx}`} 
                        onClick={() => setPreviewReviewMedia({ type: 'image', url })}
                        className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-150 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-2xs flex-shrink-0"
                      >
                        <img src={url} className="w-full h-full object-cover" alt={`review-img-${imgIdx}`} />
                      </div>
                    ))}

                    {/* Render Videos */}
                    {review.videos?.map((url, vidIdx) => (
                      <div 
                        key={`vid-${vidIdx}`}
                        onClick={() => setPreviewReviewMedia({ type: 'video', url })}
                        className="relative w-16 h-16 bg-black rounded-xl overflow-hidden border border-slate-150 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-2xs flex-shrink-0 flex items-center justify-center"
                      >
                        <video src={url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Film size={16} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2.5">
                  <button 
                    onClick={() => handleHelpfulReview(review.id)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <ThumbsUp size={11} />
                    <span>Helpful ({helpfulReviews[review.id] || 0})</span>
                  </button>
                  <span className="text-[10px] text-slate-350">|</span>
                  <span className="text-[10px] text-slate-400 font-bold">Report abuse</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-slate-50 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Write a review</p>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-slate-800"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} Stars</option>
              ))}
            </select>
            <textarea
              value={reviewForm.body}
              onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Share your experience..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-slate-800"
              disabled={engagementLoading}
            />
            
            {/* Media Upload (Images/Videos) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Upload Photos or Videos</label>
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 bg-slate-50 cursor-pointer transition-all active:scale-[0.98]">
                <Upload size={18} className="text-gray-400 mb-0.5" />
                <span className="text-[10px] font-extrabold uppercase text-slate-700">Choose Files</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={engagementLoading}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReviewFiles(prev => [...prev, ...files]);
                  }}
                />
              </label>

              {reviewFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {reviewFiles.map((file, idx) => {
                    const isVideo = file.type.startsWith('video/');
                    const previewUrl = URL.createObjectURL(file);
                    return (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        {isVideo ? (
                          <div className="relative w-full h-full bg-black flex items-center justify-center">
                            <video src={previewUrl} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Film size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                        )}
                        <button 
                          type="button"
                          disabled={engagementLoading}
                          onClick={() => setReviewFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-650 active:scale-90 transition-all z-10"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={engagementLoading}
              className={`w-full py-3 rounded-xl text-white text-[12px] font-black uppercase tracking-wider ${primaryBg} disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-1.5`}
            >
              {engagementLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting Review...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </div>

        {/* Questions & Answers Section */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-900 mb-4">Questions & Answers</h3>
          
          <div className="space-y-4.5 mb-5">
            {questions.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs font-medium">No questions asked yet for this item.</p>
                <p className="text-[11px] text-slate-400/80 mt-1">Have a query? Ask the artisan/seller below!</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="border-b border-slate-50 pb-3 last:border-0">
                  <div className="flex items-start justify-between">
                    <p className="text-[12px] font-bold text-slate-800">Q: {q.question}</p>
                    <button 
                      onClick={() => handleLikeQuestion(q.id)}
                      className={`flex items-center gap-1 text-[10px] font-extrabold ${likedQuestions[q.id] ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      <ThumbsUp size={10} />
                      <span>{(q.likes || 0) + (likedQuestions[q.id] ? 1 : 0)}</span>
                    </button>
                  </div>
                  {q.answer && (
                    <div className="mt-1.5 pl-3 border-l-2 border-slate-200">
                      <p className="text-[12px] text-slate-600">A: {q.answer}</p>
                      {q.isSellerAnswered && (
                        <span className="text-[8px] bg-slate-900 text-white font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1">
                          Seller Answer
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-50 pt-4">
            <input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ask about this product..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slate-850"
            />
            <button
              onClick={handleAskQuestion}
              disabled={engagementLoading}
              className={`px-4 py-2.5 rounded-xl text-white ${primaryBg} disabled:opacity-60 active:scale-95 transition-all`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Similar Products — real products from the same category */}
      {similarProducts.length > 0 && (
        <div className="mt-4 py-4 bg-white border-y border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] md:max-w-6xl md:mx-auto md:w-full md:rounded-3xl md:border md:my-6 md:p-6">
          <div className="flex justify-between items-center px-4 mb-3 md:px-0">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-900">Similar Products</h3>
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2 md:justify-center md:gap-6 md:px-0 md:overflow-x-visible">
            {similarProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/product-detail', { state: { product: item } })}
                className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer hover:shadow-md"
              >
                <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/55 flex items-center justify-center">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} loading="lazy" />
                  {item.rating > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-gray-100 shadow-2xs">
                      <span className="text-[9px] font-black text-slate-800">{item.rating}</span>
                      <Star size={7} fill="#e2a750" className="text-[#e2a750]" />
                    </div>
                  )}
                </div>
                <div className="px-2.5 pb-2.5 pt-0.5">
                  <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{item.name}</h4>
                  {item.off && (
                    <div className="text-[9px] font-black text-[#e47911] border border-[#e47911] px-1.5 py-0.5 rounded-full w-fit mt-1 uppercase">
                      {item.off}
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                    <span className="text-[13px] font-black text-slate-900">{formatPrice(item.price)}</span>
                    {item.oldPrice && (
                      <span className="text-[9.5px] text-gray-400 line-through">MRP {formatPrice(item.oldPrice)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activePaymentTab === 'COD' ? 'text-[#3E5A44]' : 'text-gray-400'}`}
              >
                <IndianRupee size={22} className={activePaymentTab === 'COD' ? 'text-[#3E5A44]' : 'text-gray-400'} />
                <span className="text-[13px] font-bold">COD</span>
                {activePaymentTab === 'COD' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3E5A44]" />}
              </button>
              <button 
                onClick={() => setActivePaymentTab('UPI')}
                className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activePaymentTab === 'UPI' ? 'text-[#3E5A44]' : 'text-gray-400'}`}
              >
                <div className="w-5 h-7 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[13px] font-bold">UPI</span>
                {activePaymentTab === 'UPI' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3E5A44]" />}
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

      {/* Sticky Bottom Action Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-2px_15px_rgba(0,0,0,0.08)] md:hidden">
        {/* Unit and Price Details */}
        <div className="flex flex-col justify-center select-none">
          <span className="text-[10px] font-extrabold text-slate-500 leading-none mb-1">
            {product.pack || `${quantity} unit${quantity > 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 text-[18px] font-black">
              {formatPrice(totalPrice)}
            </span>
            {totalOldPrice > totalPrice && (
              <span className="text-[11px] text-slate-400 line-through leading-none">
                {formatPrice(totalOldPrice)}
              </span>
            )}
          </div>
          {totalSavings > 0 ? (
            <span className="text-[9px] text-emerald-600 font-bold mt-0.5 leading-none">
              You save {formatPrice(totalSavings)}
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-none">
              Inclusive of GST
            </span>
          )}
        </div>

        {/* Quantity selector & Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 gap-1">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuantity(q => Math.max(1, q - 1));
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 active:scale-90 transition-all text-slate-700 shadow-xs cursor-pointer select-none"
              aria-label="Decrease quantity"
            >
              <Minus size={14} className="text-slate-700 stroke-[2.5]" />
            </button>
            <span className="min-w-[24px] text-center text-xs font-black text-slate-900 select-none">
              {quantity}
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuantity(q => q + 1);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 active:scale-90 transition-all text-slate-700 shadow-xs cursor-pointer select-none"
              aria-label="Increase quantity"
            >
              <Plus size={14} className="text-slate-700 stroke-[2.5]" />
            </button>
          </div>

          <button 
            type="button"
            onClick={handleAddToCart}
            className={`${primaryBg} ${primaryBgHover} text-white font-extrabold px-5 py-2.5 rounded-[12px] active:scale-95 transition-all text-[12px] flex items-center justify-center cursor-pointer shadow-sm`}
          >
            {t('cart.addToCart') || 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Preview modal */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 bg-black z-[2000] flex flex-col justify-between items-center py-6">
          <div className="w-full flex justify-between items-center px-6">
            <span className="text-white text-xs font-bold">{currentSlide + 1} / {mediaList.length}</span>
            <button 
              onClick={() => setIsFullscreenOpen(false)}
              className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full max-w-lg aspect-square flex items-center justify-center p-4">
            <img 
              src={activeMedia.url} 
              alt="fullscreen-preview" 
              className="max-h-[70vh] max-w-full object-contain rounded-2xl"
            />
          </div>

          {/* Bottom Thumbnails */}
          <div className="flex gap-2 justify-center">
            {mediaList.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-10 h-12 rounded-lg overflow-hidden border-2 ${currentSlide === idx ? 'border-white scale-105' : 'border-transparent opacity-50'}`}
              >
                <img src={item.url} className="w-full h-full object-cover" alt="lightbox-thumb" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Review Media Preview modal */}
      {previewReviewMedia && (
        <div className="fixed inset-0 bg-black z-[2000] flex flex-col justify-between items-center py-6">
          <div className="w-full flex justify-end px-6">
            <button 
              onClick={() => setPreviewReviewMedia(null)}
              className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full max-w-lg aspect-square flex items-center justify-center p-4">
            {previewReviewMedia.type === 'video' ? (
              <video 
                src={previewReviewMedia.url} 
                controls 
                autoPlay 
                className="max-h-[70vh] max-w-full object-contain rounded-2xl"
              />
            ) : (
              <img 
                src={previewReviewMedia.url} 
                alt="review-preview" 
                className="max-h-[70vh] max-w-full object-contain rounded-2xl"
              />
            )}
          </div>
          <div /> {/* spacing */}
        </div>
      )}

      {/* Toast Notification with View Cart Action */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full text-[13px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border border-white/10">
          <span>{toastMessage}</span>
          <button 
            onClick={() => navigate('/cart')}
            className="bg-[#E25822] text-white text-[11px] font-black px-3 py-1 rounded-full active:scale-95 transition-transform cursor-pointer shadow-xs hover:bg-[#d04a16]"
          >
            View Cart →
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default ProductDetail;
