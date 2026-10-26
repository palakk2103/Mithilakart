import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronRight, Search, ListFilter, Star, 
  Edit3, ShoppingBag, X, Check, Calendar, Package, Filter, MessageSquare,
  Upload, Loader2, Image, Film, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useAccountStore from '../../../../store/useAccountStore';
import SearchInput from '../../../../shared/components/SearchInput';
import { getOrders } from '../../services/ordersApi';
import { addCartItem } from '../../services/cartApi';
import { createProductReview } from '../../services/catalogApi';
import { uploadReviewMedia } from '../../../../shared/services/uploadService';
import { extractList, mapOrderForList } from '../../utils/mappers';
import { getDispatchSlaInfo } from '../../../../shared/utils/dispatchDelayUtils';
import { getSocket } from '../../../../shared/services/socket';

// Real Images from Assets
// Real Images from Assets
import ImageBanner1 from '../../../../assets/TopBanner/ImageBanner1.jpg';
import ImageBanner2 from '../../../../assets/TopBanner/ImageBanner2.jpg';
import ImageBanner3 from '../../../../assets/TopBanner/ImageBanner3.webp';
import ImageBanner4 from '../../../../assets/TopBanner/ImageBanner4.jpg';

const BannerCarousel = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isBannerLoaded, setIsBannerLoaded] = useState(false);

  const banners = [
    {
      image: '/Gemini_Generated_Image_pxcb6vpxcb6vpxcb.png',
      title: "Mithila Splendor",
      desc: "Beautiful Handcrafted Products",
      label: "SPECIAL"
    },
    {
      image: '/Gemini_Generated_Image_rhy76srhy76srhy7.png',
      title: "Cultural Heritage",
      desc: "Authentic Masterpieces",
      label: "HERITAGE"
    },
    {
      image: '/Gemini_Generated_Image_unwuxnunwuxnunwu.png',
      title: "Festive Handlooms",
      desc: "Premium Traditional Attire",
      label: "FESTIVE"
    },
    {
      image: '/Gemini_Generated_Image_xaqtwqxaqtwqxaqt.png',
      title: "Exclusive Masterpieces",
      desc: "Directly from Local Vendors",
      label: "EXCLUSIVE"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsBannerLoaded(false);
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="p-4">
      <div className="rounded-2xl relative overflow-hidden h-44 shadow-lg group bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: isBannerLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={banners[currentBanner].image} 
              className="w-full h-full object-cover" 
              alt="banner" 
              onLoad={() => setIsBannerLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {!isBannerLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {isBannerLoaded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 px-8 h-full flex flex-col justify-center"
            >
              <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-2"
              >
                  <div className="bg-[#ffc107] text-slate-900 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{banners[currentBanner].label}</div>
              </motion.div>
              <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white text-[24px] font-black leading-tight drop-shadow-lg"
                >
                  {banners[currentBanner].title}
                </motion.h2>
              <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/90 text-[15px] font-medium mt-1 drop-shadow-md"
                >
                  {banners[currentBanner].desc}
                </motion.p>
              <button className="mt-5 w-fit bg-white text-slate-900 px-8 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                Shop Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-5 right-8 flex gap-2.5">
          {banners.map((_, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (i !== currentBanner) {
                  setIsBannerLoaded(false);
                  setCurrentBanner(i);
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(null); 
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReviewSubmit = async () => {
    const orderId = showReviewModal;
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder || !currentOrder.items || !currentOrder.items[0]) {
      toast.error('Order details not found');
      return;
    }
    const mainItem = currentOrder.items[0];
    const productId = mainItem.productId || mainItem.id;

    const currentRating = ratings[orderId]?.rating || 0;
    const currentReviewBody = ratings[orderId]?.review || '';

    if (currentRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!currentReviewBody.trim()) {
      toast.error('Please write a review message');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedImages = [];
      const uploadedVideos = [];

      for (const file of selectedFiles) {
        const url = await uploadReviewMedia(file);
        if (file.type.startsWith('video/')) {
          uploadedVideos.push(url);
        } else {
          uploadedImages.push(url);
        }
      }

      await createProductReview(productId, {
        orderId: currentOrder.mongoId || currentOrder.id,
        rating: currentRating,
        body: currentReviewBody.trim(),
        images: uploadedImages,
        videos: uploadedVideos,
      });

      toast.success('Review submitted successfully!');
      setShowReviewModal(null);
      setSelectedFiles([]);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrders();
        if (!cancelled) {
          setOrders(extractList(data).map(mapOrderForList));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [setOrders]); 

  // Real-time socket updates for order status changes
  useEffect(() => {
    const socket = getSocket('customer');
    if (!socket) return undefined;

    const handleStatusUpdate = (payload) => {
      if (!payload?.orderId && !payload?.orderNumber) return;
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          const isMatch =
            String(o.mongoId || o.id) === String(payload.orderId) ||
            String(o.orderNumber || o.id) === String(payload.orderNumber) ||
            String(o.id) === String(payload.orderId);
          if (isMatch && payload.status) {
            const formatted = payload.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return { ...o, status: formatted, rawStatus: payload.status };
          }
          return o;
        })
      );
      getOrders().then((data) => {
        setOrders(extractList(data).map(mapOrderForList));
      }).catch(() => {});
    };

    socket.on('status_update', handleStatusUpdate);
    return () => {
      socket.off('status_update', handleStatusUpdate);
    };
  }, [setOrders]);

  // Resilient silent background polling if any active order is in progress
  useEffect(() => {
    const hasActiveOrders = orders.some((o) => {
      const st = (o.rawStatus || o.status || '').toLowerCase().replace(/\s+/g, '_');
      return ['pending', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(st);
    });
    if (!hasActiveOrders) return undefined;

    const interval = setInterval(async () => {
      try {
        const data = await getOrders();
        setOrders(extractList(data).map(mapOrderForList));
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, setOrders]);
  
  const [activeFilters, setActiveFilters] = useState({
    status: 'All',
    time: 'Anytime'
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = activeFilters.status === 'All' || order.status.toLowerCase() === activeFilters.status.toLowerCase();
    const matchesTime = activeFilters.time === 'Anytime' || true; 

    return matchesSearch && matchesStatus && matchesTime;
  });

  const statusOptions = ['All', 'Delivered', 'Cancelled', 'Confirmed', 'Shipped', 'Returned'];
  const timeOptions = ['Anytime', 'Last 30 days', '2026', '2025', 'Older'];

  const OrderCard = ({ order }) => {
    const mainItem = order.items[0];
    const sla = getDispatchSlaInfo(order);
    const isDelayed = sla.isPending && (sla.dispatchState === 'delayed' || sla.dispatchState === 'escalated');
    const statusColor = isDelayed ? 'text-amber-600 font-bold' : order.status === 'Delivered' ? 'text-green-600' : order.status === 'Cancelled' ? 'text-red-600' : 'text-primary-dark';
    const currentOrderRating = ratings[order.id] || { rating: 0, review: '' };

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white mx-3 my-2 rounded-xl shadow-sm border border-gray-100 p-3 active:bg-gray-50 transition-all cursor-pointer group"
      >
        <div className="flex gap-3" onClick={() => navigate(`/profile/orders/${order.id}`)}>
          {/* Compact Image */}
          <div className="w-16 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 border border-gray-100">
            <img src={mainItem.image} alt={mainItem.name} className="w-full h-full object-contain mix-blend-multiply" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <p className={`text-[13px] font-bold mb-0.5 ${statusColor}`}>
                  {isDelayed ? 'Shipment Delayed' : order.status} {order.date ? `· ${order.date}` : ''}
                </p>
                <h3 className="text-[12px] text-gray-500 line-clamp-1 leading-tight font-medium">
                  {mainItem.name}
                </h3>
              </div>
              <ChevronRight size={16} className="text-gray-300 mt-0.5 flex-shrink-0 group-hover:text-primary-dark group-hover:translate-x-1 transition-all" />
            </div>

            {/* Compact Bottom Section */}
            <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  {currentOrderRating.rating > 0 ? 'Your Rating' : 'Rate & Review'}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      onClick={() => setRatings(prev => ({ ...prev, [order.id]: { ...currentOrderRating, rating: star } }))}
                      className={`cursor-pointer transition-colors ${star <= currentOrderRating.rating ? 'text-green-600 fill-green-600' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {order.status === 'Delivered' && (
                  <button 
                    onClick={() => setShowReviewModal(order.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-primary-green/30 bg-primary-light/50 rounded-lg text-primary-dark text-[10px] font-black uppercase tracking-tight active:scale-95 transition-transform"
                  >
                    <Edit3 size={11} />
                    Review
                  </button>
                )}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      for (const item of (order.items || [])) {
                        const pId = item.productId || item.id;
                        if (pId) {
                          await addCartItem({ productId: pId, quantity: item.quantity || 1 }).catch(() => {});
                        }
                      }
                      toast.success('Items added to bag!');
                      navigate('/cart');
                    } catch {
                      toast.error('Could not reorder items');
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-tight active:scale-95 transition-transform cursor-pointer"
                  title="Reorder items into cart"
                >
                  <RotateCcw size={11} />
                  Reorder
                </button>
              </div>
            </div>
            {currentOrderRating.review && (
              <p className="mt-1.5 text-[11px] text-gray-500 italic line-clamp-1 border-l-2 border-green-500 pl-2">
                "{currentOrderRating.review}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');
  const filterBg = isMithilakFlow ? 'bg-[#e0f2f1]/80' : isFreshGroceryFlow ? 'bg-[#FFFDF3]/80' : (isQuickShopFlow ? 'bg-[#fff5f7]/80' : 'bg-bg-cream/80');

  const primaryBg = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c08f16]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d64f19]' 
        : 'bg-[#6FAE4A] hover:bg-[#5b953d]';

  const primaryShadow = isMithilakFlow
    ? 'shadow-teal-100'
    : isFreshGroceryFlow
      ? 'shadow-yellow-100'
      : isQuickShopFlow
        ? 'shadow-orange-100'
        : 'shadow-emerald-100';

  return (
    <div className={`min-h-screen font-nunito pb-20 relative transition-colors duration-300 ${pageBg}`}>
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
      <div className={`sticky top-0 z-50 px-4 py-4 flex items-center gap-4 shadow-sm relative z-10 transition-colors duration-300 ${headerBg}`}>
        <button onClick={() => navigate(-1)} className={`p-1 -ml-1 active:scale-90 transition-transform ${headerTextColor}`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-[18px] font-bold font-montserrat ${headerTextColor}`}>My Orders</h1>
      </div>

      <div className="w-full mx-auto relative z-10">
        {/* Working Banner Carousel - Optimized for Performance */}
        <BannerCarousel />

        {/* Search & Filters */}
        <div className={`px-4 pb-4 sticky top-[68px] z-40 backdrop-blur-md transition-colors ${filterBg}`}>
           <div className="flex gap-3">
              <SearchInput
                type="text" 
                placeholder="Search your order here" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rightElement={
                  searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  )
                }
              />
              <button 
                onClick={() => setShowFilterSheet(true)}
                className={`bg-white border border-gray-200 rounded-xl px-4 flex items-center gap-2 shadow-sm active:scale-95 transition-all ${activeFilters.status !== 'All' ? 'border-blue-500 bg-primary-light' : ''}`}
              >
                 <ListFilter size={18} className={activeFilters.status !== 'All' ? 'text-primary-dark' : 'text-gray-600'} />
                 <span className={`text-[13px] font-bold ${activeFilters.status !== 'All' ? 'text-primary-dark' : 'text-gray-700'}`}>Filters</span>
                 {activeFilters.status !== 'All' && <div className="w-2 h-2 bg-primary-dark rounded-full" />}
              </button>
           </div>
        </div>

        {/* Orders List */}
        <div className="bg-white shadow-sm mt-2 border-t border-gray-100">
           <AnimatePresence mode="popLayout">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 px-10 text-center bg-white"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-8">
                    <ShoppingBag size={48} />
                  </div>
                  <h3 className="text-[20px] font-black text-slate-800 uppercase tracking-tight">No Orders Found</h3>
                  <p className="text-[14px] text-gray-400 mt-3 max-w-[240px] mx-auto font-medium leading-relaxed">
                    {searchQuery ? "We couldn't find anything matching your search." : "Looks like you haven't placed any orders recently."}
                  </p>
                  <button 
                    onClick={() => navigate('/home')}
                    className={`mt-10 ${primaryBg} text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl ${primaryShadow} active:scale-95 transition-transform`}
                  >
                    Start Shopping
                  </button>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !isSubmitting && setShowReviewModal(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl p-6"
             >
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight">Write a Review</h3>
                    <button onClick={() => !isSubmitting && setShowReviewModal(null)} className="p-2 bg-gray-100 rounded-full" disabled={isSubmitting}>
                       <X size={18} className="text-gray-500" />
                    </button>
                 </div>
                 
                 <div className="flex flex-col items-center mb-8">
                    <div className="flex gap-2 mb-3">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <Star 
                           key={star} 
                           size={32} 
                           onClick={() => !isSubmitting && setRatings(prev => ({ ...prev, [showReviewModal]: { ...prev[showReviewModal], rating: star } }))}
                           className={`cursor-pointer transition-all active:scale-125 ${star <= (ratings[showReviewModal]?.rating || 0) ? 'text-green-600 fill-green-600 shadow-sm' : 'text-gray-200'}`} 
                         />
                       ))}
                    </div>
                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                      {(ratings[showReviewModal]?.rating === 5 && 'Excellent!') || 
                       (ratings[showReviewModal]?.rating === 4 && 'Very Good!') || 
                       (ratings[showReviewModal]?.rating === 3 && 'Good') || 
                       (ratings[showReviewModal]?.rating === 2 && 'Fair') || 
                       (ratings[showReviewModal]?.rating === 1 && 'Bad') || 'Select Rating'}
                    </p>
                 </div>

                 <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                    <textarea 
                     placeholder="Share your experience with this product..."
                     className="w-full bg-transparent border-none outline-none text-[14px] text-slate-800 placeholder:text-gray-400 min-h-[120px] resize-none"
                     value={ratings[showReviewModal]?.review || ''}
                     onChange={(e) => setRatings(prev => ({ ...prev, [showReviewModal]: { ...prev[showReviewModal], review: e.target.value } }))}
                     disabled={isSubmitting}
                    />
                 </div>

                 {/* Upload Media Section */}
                 <div className="mb-6">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Upload Photo or Video</label>
                    <div className="flex gap-2.5">
                       <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-250 hover:border-slate-400 rounded-2xl p-4 bg-gray-50 cursor-pointer transition-all active:scale-[0.98]">
                          <Upload size={20} className="text-gray-400 mb-1" />
                          <span className="text-[10px] font-extrabold uppercase text-slate-700 tracking-tight">Choose Files</span>
                          <input 
                             type="file" 
                             multiple 
                             accept="image/*,video/*"
                             className="hidden"
                             disabled={isSubmitting}
                             onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setSelectedFiles(prev => [...prev, ...files]);
                             }}
                          />
                       </label>
                    </div>

                    {/* Previews */}
                    {selectedFiles.length > 0 && (
                       <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
                          {selectedFiles.map((file, idx) => {
                             const isVideo = file.type.startsWith('video/');
                             const previewUrl = URL.createObjectURL(file);
                             return (
                                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                                   {isVideo ? (
                                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                                         <video src={previewUrl} className="w-full h-full object-cover" muted />
                                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Film size={14} className="text-white" />
                                         </div>
                                      </div>
                                   ) : (
                                      <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                                   )}
                                   <button 
                                      type="button"
                                      disabled={isSubmitting}
                                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-650 active:scale-90 transition-all z-10"
                                   >
                                      <X size={10} />
                                   </button>
                                </div>
                             );
                          })}
                       </div>
                    )}
                 </div>

                 <button 
                   onClick={handleReviewSubmit}
                   disabled={isSubmitting}
                   className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                 >
                    {isSubmitting ? (
                       <>
                          <Loader2 size={18} className="animate-spin" />
                          Submitting Review...
                       </>
                    ) : (
                       <>
                          <MessageSquare size={18} />
                          Submit Review
                       </>
                    )}
                 </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilterSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowFilterSheet(false)}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="relative w-full w-full bg-white rounded-t-[32px] overflow-hidden shadow-2xl"
             >
                <div className="p-6">
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                            <Filter size={20} className="text-primary-dark" />
                         </div>
                         <h2 className="text-[20px] font-black text-slate-900 uppercase tracking-tight">Filter Orders</h2>
                      </div>
                      <button onClick={() => setShowFilterSheet(false)} className="bg-gray-100 p-2 rounded-full active:scale-90 transition-transform">
                         <X size={20} className="text-gray-500" />
                      </button>
                   </div>

                   <div className="mb-8">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package size={14} /> Order Status
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                         {statusOptions.map(opt => (
                            <button 
                              key={opt}
                              onClick={() => setActiveFilters(prev => ({ ...prev, status: opt }))}
                              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                 activeFilters.status === opt 
                                 ? `${primaryBg} text-white shadow-lg ${primaryShadow} scale-105` 
                                 : 'bg-gray-50 text-slate-600 border border-gray-100'
                               }`}
                            >
                               {opt}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="mb-10">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar size={14} /> Timeframe
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                         {timeOptions.map(opt => (
                            <button 
                              key={opt}
                              onClick={() => setActiveFilters(prev => ({ ...prev, time: opt }))}
                              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                 activeFilters.time === opt 
                                 ? `${primaryBg} text-white shadow-lg ${primaryShadow} scale-105` 
                                 : 'bg-gray-50 text-slate-600 border border-gray-100'
                               }`}
                            >
                               {opt}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setActiveFilters({ status: 'All', time: 'Anytime' });
                          setShowFilterSheet(false);
                        }}
                        className="flex-1 py-4 border border-gray-200 rounded-2xl text-[13px] font-black uppercase tracking-widest text-slate-500 active:bg-gray-50 transition-colors"
                      >
                         Clear All
                      </button>
                      <button 
                        onClick={() => setShowFilterSheet(false)}
                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-transform"
                      >
                         Apply Filters
                      </button>
                   </div>
                </div>
                <div className="h-6" />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrders;


