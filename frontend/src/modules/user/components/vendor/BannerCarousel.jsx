import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BannerCarousel = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const totalBanners = banners ? banners.length : 0;

  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
    }
  }, [totalBanners, currentIndex]);

  useEffect(() => {
    if (!banners || !banners.length) return;
    banners.forEach((banner) => {
      if (banner?.image) {
        const img = new Image();
        img.src = banner.image;
      }
    });
  }, [banners]);

  const nextSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const prevSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalBanners - 1 : prev - 1));
  }, [totalBanners]);

  useEffect(() => {
    if (totalBanners <= 1 || isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [nextSlide, totalBanners, isHovered]);

  if (!banners || totalBanners === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];

  return (
    <div 
      className="relative w-full select-none rounded-2xl overflow-hidden shadow-sm"
      style={{
        borderWidth: '8px',
        borderStyle: 'solid',
        borderImageSource: "url('/border_1-removebg-preview.png')",
        borderImageSlice: '24',
        borderImageRepeat: 'round',
        padding: '6px',
        backgroundColor: '#FFF8EE'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mobile view - Single Banner */}
      <div className="md:hidden relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-md bg-gray-50 border border-[#EADCC9]/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner?.id || currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={currentBanner?.image || '/hero_banner.png'}
              alt={currentBanner?.title || "Hero Banner"}
              className="h-full w-full object-cover"
              loading="eager"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/hero_banner.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
              <span className="text-[#e2a750] font-bold text-[10px] uppercase tracking-widest mb-0.5">Special Collection</span>
              <h3 className="text-white text-base font-black tracking-tight drop-shadow-md">
                {currentBanner?.title || "Mithilakart Special Deals"}
              </h3>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop view - Premium Hero Section (Carousel + Sidebar Stack) */}
      <div className="hidden md:grid md:grid-cols-10 md:gap-6 md:max-w-[1600px] md:mx-auto">
        <div className="md:col-span-7 relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-lg bg-gray-50 group border border-[#EADCC9]/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner?.id || currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={currentBanner?.image || '/hero_banner.png'}
                alt={currentBanner?.title || "Hero Banner"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/hero_banner.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                <span className="text-[#e2a750] font-bold text-sm uppercase tracking-widest mb-1 animate-pulse">Exclusive Collection</span>
                <h3 className="text-white text-3xl font-black tracking-tight drop-shadow-md mb-2">
                  {currentBanner?.title || "Mithilakart Special Deals"}
                </h3>
                <p className="text-white/90 text-sm font-medium max-w-md drop-shadow-xs">
                  Discover authentic handcrafted treasures and deals directly from finest artisans.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 right-8 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-4 justify-between">
          {[1, 2].map((offset) => {
            const idx = (currentIndex + offset) % totalBanners;
            const sideBanner = banners[idx];
            if (!sideBanner) return null;
            return (
              <div 
                key={offset} 
                onClick={() => setCurrentIndex(idx)}
                className="relative flex-1 aspect-[16/7] w-full overflow-hidden rounded-2xl shadow-md bg-gray-50 cursor-pointer group hover:shadow-xl transition-all duration-300 border border-[#EADCC9]/40"
              >
                <img
                  src={sideBanner.image || '/hero_banner.png'}
                  alt={sideBanner.title || "Promo Banner"}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/hero_banner.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white text-sm font-black tracking-tight leading-tight line-clamp-1">
                    {sideBanner.title || "Trending Promo"}
                  </h4>
                  <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider mt-1 flex items-center gap-1 group-hover:text-[#e2a750] transition-colors">
                    Explore Now <span className="text-xs">&rarr;</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;

