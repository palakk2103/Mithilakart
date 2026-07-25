import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryCard from '../components/vendor/CategoryCard';

// Import Assets (aligned with categories)
import SamsungS24 from '../../../assets/products/product01.jpg';
import EarbudsDeal from '../../../assets/products/product02.jpg';
import LorealShampoo from '../../../assets/products/product03.jpg';
import LipGloss from '../../../assets/products/product05.jpg';
import JewelleryImg from '../../../assets/products/product06.jpg';
import FashionHero from '../../../assets/products/product07.jpg';
import ElectronicsHero from '../../../assets/products/product08.jpg';
import MakeupHero from '../../../assets/products/product09.jpg';
import FashionTabProduct from '../../../assets/products/product10.jpg';
import BeautyTab from '../../../assets/products/product12.jpg';
import ToysTab from '../../../assets/products/product13.jpg';
import StationeryTab from '../../../assets/products/product14.jpg';
import prod4 from '../../../assets/products/product04.jpg';
import ClothesImg from '../../../assets/products/product15.webp';

// Isolated Mithila Assets
import MithilaFestival from '../../../assets/mithila/product01.png';
import MithilaParidhan from '../../../assets/mithila/product02.png';
import MithilaCuisines from '../../../assets/mithila/product03.png';
import MithilaBangles from '../../../assets/mithila/product04.png';
import MithilaDecor from '../../../assets/mithila/product05.png';
import MithilaPooja from '../../../assets/mithila/product06.png';
import MithilaBooks from '../../../assets/mithila/product07.png';
import MithilaAchaar from '../../../assets/mithila/product08.png';

// Import premium category illustrations to repeat on this page
import beautyCareImg from '../../../assets/categories/beauty_red_blossom.png';
import giftsHampersImg from '../../../assets/categories/gifts_green_package.png';
import smartGadgetsImg from '../../../assets/categories/smart_gadgets.png';
import artJewelleryImg from '../../../assets/categories/art_jewellery.png';
import toysGamesImg from '../../../assets/categories/toys_games.png';
import officeBooksImg from '../../../assets/products/product14.jpg';
import trendyFashionImg from '../../../assets/products/product10.jpg';
import electricalsImg from '../../../assets/products/product08.jpg';

const SECTIONS = [
  {
    title: 'Beauty & Grooming',
    items: [
      { name: 'Cosmetics', img: beautyCareImg, path: '/category-products?category=Beauty' },
      { name: 'Skin Care', img: beautyCareImg, path: '/category-products?category=Beauty' },
      { name: 'Hair Care', img: beautyCareImg, path: '/category-products?category=Beauty' },
      { name: 'Fragrances', img: beautyCareImg, path: '/category-products?category=Beauty' },
    ]
  },
  {
    title: 'Fashion & Jewellery',
    items: [
      { name: 'Ethnic Wear', img: trendyFashionImg, path: '/category-products?category=Fashion' },
      { name: 'Modern Wear', img: trendyFashionImg, path: '/category-products?category=Fashion' },
      { name: 'Art. Jewellery', img: artJewelleryImg, path: '/category-products?category=Jewellery' },
      { name: 'Bags & Wallets', img: trendyFashionImg, path: '/category-products?category=Fashion' },
    ]
  },
  {
    title: 'Kids & Play',
    items: [
      { name: 'Soft Toys', img: toysGamesImg, path: '/toys' },
      { name: 'Board Games', img: toysGamesImg, path: '/toys' },
      { name: 'Learning', img: toysGamesImg, path: '/toys' },
      { name: 'Kids Wear', img: toysGamesImg, path: '/toys' },
    ]
  },
  {
    title: 'Home & Stationery',
    items: [
      { name: 'Notebooks', img: officeBooksImg, path: '/category-products?category=Stationery' },
      { name: 'Art & Craft', img: officeBooksImg, path: '/category-products?category=Stationery' },
      { name: 'Office Supply', img: officeBooksImg, path: '/category-products?category=Stationery' },
      { name: 'Gifts', img: giftsHampersImg, path: '/category-products?category=Gifting' },
    ]
  },
  {
    title: 'Electronics & Gadgets',
    items: [
      { name: 'Smart Phones', img: smartGadgetsImg, path: '/category-products?category=Electronics' },
      { name: 'Earbuds', img: smartGadgetsImg, path: '/category-products?category=Electronics' },
      { name: 'Appliances', img: electricalsImg, path: '/category-products?category=Electronics' },
      { name: 'Smart Watches', img: smartGadgetsImg, path: '/category-products?category=Electronics' },
    ]
  }
];

const QUICK_SHOP_CATEGORIES = [
  {
    title: 'Grocery',
    items: [
      { name: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&auto=format&fit=crop&q=60' },
      { name: 'Atta, Rice & Dal', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=60' },
      { name: 'Oil, Ghee & Masala', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=60' },
      { name: 'Dairy, Bread & Eggs', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60' },
      { name: 'Cereals & Dry Fruits', img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=150&auto=format&fit=crop&q=60' },
      { name: 'Chicken, Meat & Fish', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=150&auto=format&fit=crop&q=60' },
      { name: 'Instant & Frozen Food', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60' },
    ]
  },
  {
    title: 'Snacks & Drinks',
    items: [
      { name: 'Chips & Namkeens', img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=60' },
      { name: 'Ice Creams', img: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=150&auto=format&fit=crop&q=60' },
      { name: 'Drinks & Juices', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=60' },
      { name: 'Sweets & Chocolates', img: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=150&auto=format&fit=crop&q=60' },
      { name: 'Tea, Coffee & Milk Drinks', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=150&auto=format&fit=crop&q=60' },
      { name: 'Bakery & Biscuits', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=60' },
      { name: 'Sauces & Spreads', img: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=150&auto=format&fit=crop&q=60' },
    ]
  },
  {
    title: 'Beauty & Personal Care',
    items: [
      { name: 'Bath, Body & Grooming', img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=150&auto=format&fit=crop&q=60' },
      { name: 'Baby Care', img: 'https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=150&auto=format&fit=crop&q=60' },
      { name: 'Hair Care', img: 'https://images.unsplash.com/photo-1527799881376-127bb49c3038?w=150&auto=format&fit=crop&q=60' },
      { name: 'Healthcare & Pharma', img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150&auto=format&fit=crop&q=60' },
      { name: 'Wellness & Hygiene', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=60' },
      { name: 'Beauty & Fragrances', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=150&auto=format&fit=crop&q=60' },
    ]
  },
  {
    title: 'Household, Stationery & Lifestyle',
    items: [
      { name: 'Cleaning Essentials', img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=150&auto=format&fit=crop&q=60' },
      { name: 'Stationery Supplies', img: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=150&auto=format&fit=crop&q=60' },
      { name: 'Toys & Games', img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=150&auto=format&fit=crop&q=60' },
      { name: 'Sports & Fitness', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=60' },
      { name: 'Home & Kitchen', img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=60' },
      { name: 'Electricals & Tools', img: 'https://images.unsplash.com/photo-1524294078988-0f34149ed411?w=150&auto=format&fit=crop&q=60' },
      { name: 'Fashion Accessories', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&auto=format&fit=crop&q=60' },
      { name: 'Pet Supplies', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&auto=format&fit=crop&q=60' },
    ]
  },
  {
    title: 'Mobiles & Electronics',
    items: [
      { name: 'Mobiles', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=60' },
      { name: 'Electronics & Gadgets', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=60' },
      { name: 'Audio & Smart Watches', img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=150&auto=format&fit=crop&q=60' },
    ]
  }
];

const MITHILA_CATEGORIES = [
  {
    title: 'Mithila Specialities',
    items: [
      { name: 'Mithila Festival & Cultural', img: MithilaFestival },
      { name: 'Mithila Paridhan', img: MithilaParidhan },
      { name: 'Mithila Special Cuisines', img: MithilaCuisines },
      { name: 'Mithila Lac Bangles', img: MithilaBangles },
      { name: 'Mithila Handcrafted Items', img: MithilaDecor },
      { name: 'Mithila Pooja Needs', img: MithilaPooja },
      { name: 'Mithila Books & Panchang', img: MithilaBooks },
      { name: 'Mithila Achaar', img: MithilaAchaar }
    ]
  }
];


const Categories = () => {
  const navigate = useNavigate();
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const sectionsList = isMithilakFlow ? MITHILA_CATEGORIES : (isQuickShopFlow ? QUICK_SHOP_CATEGORIES : SECTIONS);
  const pageBg = isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-[#6FAE4A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) ? 'text-white' : 'text-[#3C2415]';
  const textPrimary = isMithilakFlow ? 'text-[#6FAE4A]' : isFreshGroceryFlow ? 'text-[#3F2A20]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]');

  const [activeSectionIndex, setActiveSectionIndex] = React.useState(0);

  return (
    <div className={`${pageBg} min-h-screen flex flex-col font-sans text-slate-800 relative`}>
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
      <div className={`sticky top-0 z-50 ${headerBg} px-4 py-3.5 flex items-center justify-between shadow-sm transition-colors`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={`p-0.5 active:scale-95 transition-transform ${headerTextColor}`}>
            <ArrowLeft size={22} />
          </button>
          <h1 className={`text-[19px] font-black tracking-tight ${headerTextColor}`}>Categories</h1>
        </div>
        <button onClick={() => navigate('/search')} className={`p-1 active:scale-95 transition-transform ${headerTextColor}`}>
          <Search size={22} />
        </button>
      </div>

      {/* Split-pane Layout (Mobile View) */}
      <div className="flex md:hidden relative z-10 flex-1 h-[calc(100vh-60px)] overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[95px] flex-shrink-0 bg-slate-50 border-r border-slate-200/80 overflow-y-auto no-scrollbar pb-24">
          {sectionsList.map((section, sIdx) => {
            const isActive = activeSectionIndex === sIdx;
            const sectionImg = section.items[0]?.img;
            return (
              <button
                key={sIdx}
                onClick={() => setActiveSectionIndex(sIdx)}
                className={`w-full py-4 px-1.5 flex flex-col items-center gap-1.5 border-b border-slate-100 relative transition-all duration-200 ${
                  isActive 
                    ? 'bg-white font-black' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {/* Active Indicator Bar on the left */}
                {isActive && (
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-r ${
                    isMithilakFlow ? 'bg-[#6FAE4A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]'
                  }`} />
                )}
                
                {/* Category Thumbnail */}
                {sectionImg && (
                  <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/50 p-0.5 shadow-sm">
                    <img src={sectionImg} alt={section.title} className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
                
                <span className={`text-[9.5px] text-center leading-tight tracking-tight break-words w-full ${
                  isActive 
                    ? (isMithilakFlow ? 'text-[#6FAE4A] font-extrabold' : isFreshGroceryFlow ? 'text-[#3F2A20] font-extrabold' : isQuickShopFlow ? 'text-[#F26522] font-extrabold' : 'text-[#6FAE4A] font-extrabold') 
                    : 'text-slate-600 font-medium'
                }`}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white overflow-y-auto pb-24 p-4">
          {sectionsList[activeSectionIndex] && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[13px] font-black text-slate-800 tracking-tight mb-4 uppercase">
                  {sectionsList[activeSectionIndex].title}
                </h2>
                
                {/* 3-Column Grid of Subcategories */}
                <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                  {sectionsList[activeSectionIndex].items.map((item, idx) => {
                    const onClickHandler = () => {
                      if (isMithilakFlow) {
                        localStorage.setItem('isMithilakFlow', 'true');
                        localStorage.setItem('isQuickShopFlow', 'false');
                        navigate('/mithilak/category', { state: { category: item.name } });
                      } else if (isQuickShopFlow) {
                        localStorage.setItem('isQuickShopFlow', 'true');
                        localStorage.setItem('isMithilakFlow', 'false');
                        navigate(isFreshGroceryFlow ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name } });
                      } else {
                        navigate(item.path);
                      }
                    };

                    return (
                      <div 
                        key={idx}
                        onClick={onClickHandler}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 relative shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
                          <img 
                            src={item.img} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-700 text-center leading-tight tracking-tight line-clamp-2">
                          {item.name.replace('Mithila ', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra banner or explore section for premium look */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Explore More</h3>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3 border border-amber-100/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-amber-900">Trending in {sectionsList[activeSectionIndex].title}</p>
                    <p className="text-[9px] text-amber-700/80">Check out the newest arrivals</p>
                  </div>
                  <button 
                    onClick={() => {
                      const firstItem = sectionsList[activeSectionIndex].items[0];
                      if (firstItem) {
                        if (isMithilakFlow) {
                          navigate('/mithilak/category', { state: { category: firstItem.name } });
                        } else if (isQuickShopFlow) {
                          navigate(isFreshGroceryFlow ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: firstItem.name } });
                        } else {
                          navigate(firstItem.path);
                        }
                      }
                    }}
                    className="px-2.5 py-1 text-[9px] font-black bg-amber-600 text-white rounded-lg shadow-sm active:scale-95 transition-transform"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop view (Copying the banner + white panel structure) */}
      <div className="hidden md:block md:max-w-6xl md:mx-auto md:px-4 md:py-8 space-y-10 relative z-10">
        {sectionsList.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col">
            {/* Header Banner */}
            <div className={`px-6 py-4 rounded-t-3xl flex items-center justify-between shadow-sm border-x border-t transition-colors ${
              (isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow)
                ? `text-white ${headerBg} border-transparent`
                : 'bg-[#FCF7EE] text-[#3C2415] border-[#F3E3CD]/60 font-montserrat'
            }`}>
              <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-wider">
                {section.title}
              </h2>
            </div>

            {/* White container panel with rounded-b corners containing the cards */}
            <div className="bg-white border-x border-b border-slate-100 rounded-b-3xl p-6 shadow-md">
              <div className="grid grid-cols-4 gap-6">
                {section.items.map((item, idx) => {
                  const onClickHandler = () => {
                    if (isMithilakFlow) {
                      localStorage.setItem('isMithilakFlow', 'true');
                      localStorage.setItem('isQuickShopFlow', 'false');
                      navigate('/mithilak/category', { state: { category: item.name } });
                    } else if (isQuickShopFlow) {
                      localStorage.setItem('isQuickShopFlow', 'true');
                      localStorage.setItem('isMithilakFlow', 'false');
                      navigate(isFreshGroceryFlow ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name } });
                    } else {
                      navigate(item.path);
                    }
                  };

                  if (isMithilakFlow) {
                    return (
                      <div
                        key={idx}
                        onClick={onClickHandler}
                        className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-transform w-[180px] mx-auto"
                      >
                        <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-white border border-[#EADCC9]/55 flex items-center justify-center group-hover:bg-slate-50 transition-colors duration-300 shadow-sm">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-[82%] h-[82%] object-contain z-10 group-hover:scale-[1.08] transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 rounded-full border-[8px] border-white z-20 pointer-events-none" />
                        </div>
                        <div className="px-1 text-center">
                          <h3 className={`text-[13px] font-black text-[#3F2A20] leading-tight group-hover:${textPrimary} transition-colors line-clamp-2`}>
                            {item.name.replace('Mithila ', '')}
                          </h3>
                          <p className="text-[11px] font-black text-[#6FAE4A] mt-1 uppercase tracking-wider">View Collection</p>
                        </div>
                      </div>
                    );
                  }

                  if (isQuickShopFlow) {
                    return (
                      <div
                        key={idx}
                        onClick={onClickHandler}
                        className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-transform w-[180px] mx-auto"
                      >
                        <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100/60 flex items-center justify-center p-5 group-hover:bg-slate-100/65 transition-colors duration-300">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-1 text-center">
                          <h3 className={`text-[13px] font-black text-slate-800 leading-tight group-hover:${textPrimary} transition-colors line-clamp-2`}>
                            {item.name}
                          </h3>
                          <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-wider">View Collection</p>
                        </div>
                      </div>
                    );
                  }

                  // Standard user flow: Arched cards matching home page style
                  return (
                    <div
                      key={idx}
                      onClick={onClickHandler}
                      className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform w-[160px] mx-auto"
                    >
                      <div className="w-full aspect-[1/1.12] bg-white border border-[#EADCC9]/70 rounded-t-full rounded-b-[24px] overflow-hidden flex flex-col items-center justify-between p-3 shadow-[0_4px_10px_rgba(61,35,20,0.02)] group-hover:shadow-[0_8px_20px_rgba(61,35,20,0.08)] group-hover:border-[#6FAE4A]/40 transition-all duration-300">
                        <span className="text-[12px] md:text-sm font-black text-[#3F2A20] text-center mt-2.5 px-0.5 leading-tight tracking-tight h-[22px] flex items-center justify-center">
                          {item.name}
                        </span>
                        <div className="w-[82%] aspect-square rounded-[16px] overflow-hidden bg-[#FFFDFB] border border-slate-100 flex items-center justify-center p-1 mb-1.5 relative">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl group-hover:scale-[1.04] transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;

