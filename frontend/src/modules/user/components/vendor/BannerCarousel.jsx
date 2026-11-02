import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { tName } from '../../../../shared/utils/translateName';

const FALLBACK_IMAGE = '/hero_banner.png';

// Offset of a slide relative to the active one: 0 = visible, -1 = just left, 1 = waiting on the right.
const slideClasses = (idx, currentIndex, prevIndex, leftShift, rightShift) => {
  const base = 'absolute inset-0 transition-[opacity,transform] ease-in-out will-change-[opacity,transform]';
  if (idx === currentIndex) return `${base} opacity-100 translate-x-0 z-[2]`;
  if (idx === prevIndex) return `${base} opacity-0 ${leftShift} z-[1]`;
  return `${base} opacity-0 pointer-events-none ${rightShift} z-0 !duration-0`;
};

const BannerCarousel = ({ banners = [] }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [isHovered, setIsHovered] = useState(false);
  const loadedRef = useRef(new Set());
  const imagesRef = useRef([]);

  const totalBanners = banners ? banners.length : 0;

  const goTo = useCallback((next) => {
    if (next === currentIndex) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(next);
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
      setPrevIndex(-1);
    }
  }, [totalBanners, currentIndex]);

  // Preload and decode every banner up front so slides never wait on the network.
  useEffect(() => {
    loadedRef.current = new Set();
    imagesRef.current = [];
    if (!banners || !banners.length) return undefined;
    let cancelled = false;
    banners.forEach((banner) => {
      const src = banner?.image;
      if (!src) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      imagesRef.current.push(img); // keep a reference so the decoded bitmap stays cached
      const markLoaded = () => { if (!cancelled) loadedRef.current.add(src); };
      if (typeof img.decode === 'function') {
        img.decode().then(markLoaded).catch(markLoaded);
      } else {
        img.onload = markLoaded;
        img.onerror = markLoaded;
      }
    });
    return () => { cancelled = true; };
  }, [banners]);

  const nextSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    goTo((currentIndex + 1) % totalBanners);
  }, [totalBanners, currentIndex, goTo]);

  useEffect(() => {
    if (totalBanners <= 1 || isHovered) return undefined;
    const interval = setInterval(() => {
      // Only advance once the next image is ready, otherwise wait for the next tick.
      const nextSrc = banners[(currentIndex + 1) % totalBanners]?.image;
      if (nextSrc && !loadedRef.current.has(nextSrc)) return;
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [nextSlide, totalBanners, isHovered, banners, currentIndex]);

  if (!banners || totalBanners === 0) return null;

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
        {banners.map((banner, idx) => (
          <div
            key={banner?.id || idx}
            className={slideClasses(idx, currentIndex, prevIndex, '-translate-x-5', 'translate-x-5')}
            style={{ transitionDuration: '400ms' }}
            aria-hidden={idx !== currentIndex}
          >
            <img
              src={banner?.image || FALLBACK_IMAGE}
              alt={banner?.title || t('home.heroBanner')}
              className="h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
              <span className="text-[#e2a750] font-bold text-[10px] uppercase tracking-widest mb-0.5">{t('home.specialCollection')}</span>
              <h3 className="text-white text-base font-black tracking-tight drop-shadow-md">
                {tName(banner?.title) || t('home.specialDeals')}
              </h3>
            </div>
          </div>
        ))}

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); goTo(idx); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop view - Premium Hero Section (Carousel + Sidebar Stack) */}
      <div className="hidden md:grid md:grid-cols-10 md:gap-6 md:max-w-[1600px] md:mx-auto">
        <div className="md:col-span-7 relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-lg bg-gray-50 group border border-[#EADCC9]/50">
          {banners.map((banner, idx) => (
            <div
              key={banner?.id || idx}
              className={slideClasses(idx, currentIndex, prevIndex, '-translate-x-[30px]', 'translate-x-[30px]')}
              style={{ transitionDuration: '500ms' }}
              aria-hidden={idx !== currentIndex}
            >
              <img
                src={banner?.image || FALLBACK_IMAGE}
                alt={banner?.title || t('home.heroBanner')}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                <span className="text-[#e2a750] font-bold text-sm uppercase tracking-widest mb-1 animate-pulse">{t('home.exclusiveCollection')}</span>
                <h3 className="text-white text-3xl font-black tracking-tight drop-shadow-md mb-2">
                  {tName(banner?.title) || t('home.specialDeals')}
                </h3>
                <p className="text-white/90 text-sm font-medium max-w-md drop-shadow-xs">
                  {t('auto.discoverAuthenticHandcraftedTreasure')}
                </p>
              </div>
            </div>
          ))}

          <div className="absolute bottom-4 right-8 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(idx);
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
                onClick={() => goTo(idx)}
                className="relative flex-1 aspect-[16/7] w-full overflow-hidden rounded-2xl shadow-md bg-gray-50 cursor-pointer group hover:shadow-xl transition-all duration-300 border border-[#EADCC9]/40"
              >
                <img
                  src={sideBanner.image || '/hero_banner.png'}
                  alt={sideBanner.title || t('home.promoBanner')}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/hero_banner.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white text-sm font-black tracking-tight leading-tight line-clamp-1">
                    {tName(sideBanner.title) || t('home.trendingPromo')}
                  </h4>
                  <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider mt-1 flex items-center gap-1 group-hover:text-[#e2a750] transition-colors">
                    {t('x.exploreNow')} <span className="text-xs">&rarr;</span>
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

