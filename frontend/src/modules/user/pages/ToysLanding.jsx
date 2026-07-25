import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Camera, ShoppingCart, 
  MapPin, ChevronDown, Bell, Star, LayoutGrid,
  Zap, Heart, Share2, Scan
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import local assets
import ToysBanner from '../../../assets/TopBanner/ImageBanner1.jpg';
import ElectricRideon from '../../../assets/products/product13.jpg';
import BabyBlanket from '../../../assets/products/product12.jpg';
import LearningTablet from '../../../assets/products/product11.webp';
import ToysTab from '../../../assets/products/product13.jpg';
import BeautyTab from '../../../assets/products/product12.jpg';
import Balloons from '../../../assets/products/product11.webp';

// Banner Assets
import ImageBanner1 from '../../../assets/TopBanner/ImageBanner1.jpg';
import ImageBanner2 from '../../../assets/TopBanner/ImageBanner2.jpg';
import ImageBanner3 from '../../../assets/TopBanner/ImageBanner3.webp';
import ImageBanner4 from '../../../assets/TopBanner/ImageBanner4.jpg';

import BannerCarousel from '../components/vendor/BannerCarousel';

const ToysLanding = () => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('Toys, baby..');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
      setCartCount(cart.reduce((acc, item) => acc + (item.qty || 1), 0));
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  const subNav = [
    { label: 'Home', icon: <LayoutGrid size={18} /> },
    { label: 'Appliances', icon: <Zap size={18} /> },
    { label: 'Toys, baby..', icon: <div className="w-5 h-5 bg-primary-green/20 rounded-full flex items-center justify-center"><img src={ToysTab} className="w-4 h-4 object-contain" /></div> },
    { label: 'Food & He..', icon: <Bell size={18} /> },
    { label: 'Auto Acce..', icon: <Scan size={18} /> }
  ];

  const savingsCards = [
    { title: 'Electric ride-ons...', badge: 'Min. 50% Off', img: ElectricRideon },
    { title: 'Baby blankets', badge: 'Under ₹499', img: BabyBlanket },
    { title: 'Body washes', badge: 'From ₹99', img: BeautyTab },
    { title: 'Learning toys', badge: 'From ₹119', img: LearningTablet }
  ];

  const irresistibleDeals = [
    { title: 'Diapers', badge: 'Up to 60% Off', img: BabyBlanket },
    { title: 'Tricycles', badge: 'Extra 10% Off', img: Balloons }
  ];

  return (
    <div className="bg-white min-h-screen pb-24 font-sans text-slate-900">

      {/* Banner Carousel */}
      <div className="bg-white pb-2">
        <BannerCarousel banners={[
          { id: 1, image: ImageBanner1, title: 'Summer Sale' },
          { id: 2, image: ImageBanner2, title: 'New Arrivals' },
          { id: 3, image: ImageBanner3, title: 'Electronics Deal' },
          { id: 4, image: ImageBanner4, title: 'Grocery Offers' }
        ]} />
      </div>

      {/* Section: Great Savings Start Here */}
      <div className="px-4 py-6 md:max-w-[900px] md:mx-auto w-full">
         <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <h2 className="text-[18px] font-black text-slate-800 tracking-tight">Great savings start here</h2>
            <div className="h-[1px] flex-1 bg-gray-100" />
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {savingsCards.map((card, idx) => (
               <div key={idx} className="flex flex-col gap-3 group">
                  <div className="aspect-square bg-[#fff0f5] rounded-[32px] overflow-hidden relative flex items-center justify-center p-4 transition-transform group-active:scale-95">
                     {/* Circular Glow Effect */}
                     <div className="absolute inset-4 rounded-full bg-white/40 blur-xl" />
                     <img src={card.img} className="w-full h-full object-contain relative z-10 mix-blend-multiply" alt={card.title} />
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-[14px] font-black text-slate-800 line-clamp-1">{card.title}</p>
                     <div className="bg-black text-white px-3 py-2.5 rounded-2xl w-fit">
                        <span className="text-[11px] font-black uppercase tracking-wider">{card.badge}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Irresistible Deals */}
      <div className="bg-gray-50 px-4 py-8">
         <h2 className="text-[20px] font-black text-slate-900 mb-6 tracking-tight">Irresistible deals</h2>
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {irresistibleDeals.map((deal, idx) => (
               <div key={idx} className="flex-shrink-0 w-[200px] bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#fff0f5] p-4">
                     <img src={deal.img} className="w-full h-full object-contain mix-blend-multiply" alt={deal.title} />
                  </div>
                  <p className="text-[14px] font-black text-slate-800">{deal.title}</p>
                  <p className="text-[12px] font-bold text-green-600 mt-0.5">{deal.badge}</p>
               </div>
            ))}
         </div>
      </div>

      {/* Sticky Bottom CTA for Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between z-50">
         <div className="flex flex-col">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Selected Items</span>
            <span className="text-[18px] font-black text-slate-900">{cartCount} Products</span>
         </div>
         <button 
           onClick={() => navigate('/cart')}
           className="bg-[#6FAE4A] text-white px-8 py-3.5 rounded-xl font-black text-[13px] uppercase tracking-wider shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
         >
            Go to Cart
         </button>
      </div>
    </div>
  );
};

export default ToysLanding;


