import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mic, Scan, Star, Heart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import SearchInput from '../../../shared/components/SearchInput';

const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[14px] md:h-[14px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#6FAE4A" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#6FAE4A" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#6FAE4A" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#6FAE4A" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#6FAE4A" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#6FAE4A" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

const DealsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionTitle = location.state?.title || 'Deals for you';
  
  const [wishlisted, setWishlisted] = useState({});

  const dealsData = {
    'Deals for you': [
      { id: 101, name: 'Samsung Galaxy S24 Ultra (Titanium Gray)', brand: 'SAMSUNG', price: '1,29,999', mrp: '1,34,999', discount: '52% off', rating: '4.8', reviews: '12k', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', label: 'Limited time deal' },
      { id: 102, name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'SONY', price: '29,990', mrp: '34,990', discount: '15% off', rating: '4.9', reviews: '8k', image: 'https://images.unsplash.com/photo-1670057037305-64d84711833d?w=400', label: 'Limited time deal' },
      { id: 103, name: 'Apple iPhone 15 Pro (Natural Titanium)', brand: 'APPLE', price: '1,27,990', mrp: '1,34,900', discount: '5% off', rating: '4.7', reviews: '15k', image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400', label: 'Limited time deal' },
      { id: 104, name: 'Dell XPS 13 Plus Laptop', brand: 'DELL', price: '1,45,990', mrp: '1,58,000', discount: '8% off', rating: '4.6', reviews: '2k', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400', label: 'Limited time deal' },
      { id: 105, name: 'Apple Watch Ultra 2 (GPS + Cellular)', brand: 'APPLE', price: '89,900', mrp: '94,900', discount: '5% off', rating: '4.8', reviews: '1.5k', image: 'https://images.unsplash.com/photo-1695213601569-8088019316d3?w=400', label: 'Limited time deal' },
      { id: 106, name: 'Nikon Z8 Mirrorless Camera Body', brand: 'NIKON', price: '3,43,995', mrp: '3,65,000', discount: '6% off', rating: '4.9', reviews: '500', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', label: 'Limited time deal' },
    ],
    'Shoes & Handbags': [
      { id: 201, name: 'Nike Air Max Alpha Trainers', brand: 'NIKE', price: '7,495', mrp: '9,995', discount: '25% off', rating: '4.5', reviews: '3k', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', label: 'Limited time deal' },
      { id: 202, name: 'Adidas Ultraboost Light Shoes', brand: 'ADIDAS', price: '14,999', mrp: '18,999', discount: '21% off', rating: '4.7', reviews: '5k', image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400', label: 'Limited time deal' },
      { id: 203, name: 'Puma RS-X Reinvent Sneakers', brand: 'PUMA', price: '6,499', mrp: '8,999', discount: '27% off', rating: '4.4', reviews: '2k', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400', label: 'Limited time deal' },
      { id: 204, name: 'Premium Leather Tote Bag', brand: 'LAVIE', price: '2,499', mrp: '4,999', discount: '50% off', rating: '4.3', reviews: '1k', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', label: 'Limited time deal' },
    ],
    'Recommended': [
      { id: 301, name: 'Logitech MX Master 3S Mouse', brand: 'LOGITECH', price: '9,495', mrp: '10,995', discount: '14% off', rating: '4.9', reviews: '1k', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400', label: 'Limited time deal' },
      { id: 302, name: 'Kindle Paperwhite (16 GB)', brand: 'AMAZON', price: '13,999', mrp: '14,999', discount: '7% off', rating: '4.8', reviews: '4k', image: 'https://images.unsplash.com/photo-1594980596277-536e4b966ab0?w=400', label: 'Limited time deal' },
      { id: 305, name: 'AirPods Pro (2nd Gen) with MagSafe', brand: 'APPLE', price: '24,900', mrp: '26,900', discount: '7% off', rating: '4.8', reviews: '45k', image: 'https://images.unsplash.com/photo-1588423770619-81bc09312a32?w=400', label: 'Limited time deal' },
    ],
    'Must-haves': [
      { id: 401, name: 'Samsung S24 Ultra', brand: 'SAMSUNG', price: '69,999', mrp: '79,999', discount: '12% off', rating: '4.7', reviews: '1.2k', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', label: 'Top Pick' },
      { id: 402, name: 'Asus Vivobook Laptop', brand: 'ASUS', price: '45,990', mrp: '55,000', discount: '16% off', rating: '4.5', reviews: '1k', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400', label: 'Top Pick' },
      { id: 404, name: 'Gold Finish Pendant', brand: 'MITHILAKART', price: '3,499', mrp: '4,999', discount: '30% off', rating: '4.9', reviews: '800', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', label: 'Top Pick' },
      { id: 407, name: 'Noise Buds Wireless', brand: 'NOISE', price: '1,999', mrp: '2,999', discount: '33% off', rating: '4.4', reviews: '2k', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', label: 'Top Pick' },
    ]
  };

  const products = dealsData[sectionTitle] || dealsData['Deals for you'];

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1, price: product.price, image: product.image });
    }
    localStorage.setItem('userCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Added to cart');
  };

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlisted(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success(wishlisted[id] ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pb-20 bg-gray-50 text-slate-900 font-sans transition-colors duration-300"
    >
      {/* Premium Mithilakart Styled Header - Now aligned to active green #6FAE4A */}
      <div className="sticky top-0 z-[100] bg-[#6FAE4A] text-white shadow-xs p-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white p-1 hover:scale-95 transition-transform">
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <SearchInput
              type="text"
              placeholder="Search items, brands, categories..."
              rightElement={
                <div className="flex items-center gap-3 text-slate-400">
                  <Camera 
                    size={18} 
                    className="cursor-pointer hover:text-slate-650 transition-colors" 
                    onClick={() => {
                      toast.loading("Analyzing image search...", { id: "deals-img" });
                      setTimeout(() => {
                        toast.dismiss("deals-img");
                        toast.success("Image search completed!");
                        navigate('/search?q=Handicraft');
                      }, 1500);
                    }}
                  />
                  <Mic size={18} className="cursor-pointer hover:text-slate-650" />
                  <Scan 
                    size={18} 
                    className="cursor-pointer hover:text-slate-650 transition-colors"
                    onClick={() => {
                      toast.loading("Simulating barcode scanner...", { id: "deals-scan" });
                      setTimeout(() => {
                        toast.dismiss("deals-scan");
                        toast.success("Barcode recognized successfully!");
                        navigate('/search?q=Painting');
                      }, 1500);
                    }}
                  />
                </div>
              }
            />
          </div>
        </div>

        {/* Header Title */}
        <div className="mt-3 px-1 flex items-center justify-between">
           <h1 className="text-md font-black uppercase tracking-[1.5px] text-white">{sectionTitle}</h1>
        </div>
      </div>

      {/* Product List - Mithilakart Cream Grid */}
      <div className="p-3 md:p-6 grid grid-cols-2 gap-3 md:gap-5">
         {products.map((product) => (
           <div 
             key={product.id} 
             onClick={() => navigate('/product-detail', { state: { product } })}
             className="flex flex-col cursor-pointer group w-full relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-2 md:p-3.5 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#6FAE4A]/35 transition-all duration-300 transform select-none"
           >
              {/* Inner Decorative Dashed Border */}
              <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#D35400]/20 rounded-[15px] md:rounded-[20px]" />

              {/* Corner Ornaments */}
              <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><CornerFlower /></div>
              <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><CornerFlower /></div>
              <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><CornerFlower /></div>
              <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><CornerFlower /></div>

              {/* Image Section */}
              <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-1">
                 <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-[11px] md:rounded-[15px] group-hover:scale-[1.03] transition-transform duration-500" />
                 
                 {/* Wishlist Button */}
                 <button 
                   onClick={(e) => toggleWishlist(product.id, e)}
                   className="absolute top-1 right-1 md:top-2 md:right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-[0_2px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
                 >
                    <Heart size={12} className={`transition-colors ${wishlisted[product.id] ? "fill-red-500 stroke-red-500 text-red-500" : "stroke-[#3F2A20] fill-none"}`} />
                 </button>

                 {/* Quick Add Button */}
                 <button 
                   onClick={(e) => handleAddToCart(product, e)}
                   className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-7 h-7 rounded-full flex items-center justify-center bg-[#6FAE4A] text-white shadow-md active:scale-90 transition-all hover:scale-105 z-10"
                 >
                    <Plus size={16} className="text-white" />
                 </button>

                 {/* Rating Badge */}
                 <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 md:gap-1 bg-white/95 backdrop-blur-xs px-1 py-0.2 md:px-1.5 md:py-0.5 rounded-[4px] md:rounded-[6px] shadow-xs border border-[#EADCC9]/30">
                    <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{product.rating}</span>
                    <Star size={7.5} fill="currentColor" className="text-[#6FAE4A] stroke-none" />
                    <div className="w-[1px] h-2 bg-gray-300 mx-0.5" />
                    <span className="text-[7.5px] md:text-[8.5px] font-semibold text-gray-500">({product.reviews})</span>
                 </div>
              </div>

              {/* Details Section */}
              <div className="pt-2 pb-0.5 px-0.5 relative z-10 flex flex-col justify-between flex-1">
                 <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                       <span className="bg-[#cc0c39] text-white text-[7.5px] md:text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">{product.discount}</span>
                       <span className="text-[7.5px] md:text-[8px] font-black uppercase tracking-widest text-[#6FAE4A]">{product.label}</span>
                    </div>

                    <h3 className="text-[10.5px] md:text-[12px] font-black text-[#3F2A20] line-clamp-2 leading-tight tracking-tight mt-1.5 min-h-[30px] md:min-h-[34px]">
                       <span className="font-extrabold text-[#3F2A20]">{product.brand}</span> {product.name}
                    </h3>

                    <div className="mt-2 flex flex-col gap-0.5">
                       <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
                          <span className="text-[11.5px] md:text-[14px] font-black text-slate-900">₹{product.price}</span>
                          <span className="text-[8.5px] md:text-[10px] text-gray-400 line-through font-semibold">MRP ₹{product.mrp}</span>
                          <span className="border border-[#F26522]/45 text-[#F26522] bg-[#F26522]/5 text-[7px] md:text-[8px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-tight">
                             {product.discount}
                          </span>
                       </div>
                       <p className="text-[8.5px] md:text-[9.5px] font-extrabold text-[#6FAE4A] tracking-tight mt-0.5">
                          ₹{Math.round(parseFloat(product.price.replace(/,/g, '')) * 0.9)} with UPI offer + more
                       </p>
                    </div>
                 </div>

                 {/* Bottom divider motif */}
                 <CardBottomDivider />
              </div>
           </div>
         ))}
      </div>
    </motion.div>
  );
};

export default DealsPage;
