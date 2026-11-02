import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import saleAnimation from '../../../../assets/sale-animation.json';
import useVendorStore from '../../../../store/useVendorStore';
import { useTranslation } from 'react-i18next';

const SaleBanner = () => {
  const { t } = useTranslation();
  const { selectedCategory } = useVendorStore();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = React.useRef(0);
  const scrollTimer = React.useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Throttle scroll events to 60fps (approx 16ms)
      if (scrollTimer.current) return;
      
      scrollTimer.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY < 10) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current) {
          // Scrolling down
          setIsVisible(prev => prev ? false : prev);
        } else if (currentScrollY < lastScrollY.current - 10) { 
          // Scrolling up (added threshold to avoid jitter)
          setIsVisible(prev => prev ? prev : true);
        }
        
        lastScrollY.current = currentScrollY;
        scrollTimer.current = null;
      }, 16);
    };

    if (selectedCategory === 'Home') {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [selectedCategory]);

  if (selectedCategory !== 'Home') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isVisible ? 'auto' : 0, opacity: isVisible ? 1 : 0 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-[#6FAE4A] rounded-xl mx-3 my-2 shadow-sm overflow-hidden z-40 sticky top-[184px]"
        >
          <div className="mx-2 bg-transparent border-b border-white/10 overflow-hidden relative min-h-[140px] flex items-center justify-between px-2">
            
            {/* Left Section: Lottie Animation */}
            <div className="w-1/3 flex items-center justify-center -ml-2">
              <Lottie 
                animationData={saleAnimation} 
                loop={true} 
                autoplay={true}
                className="w-full h-full scale-[1.3]" 
              />
            </div>

            {/* Center Section: Sale Info */}
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 z-10">
              <div className="flex flex-col items-center">
                <h2 className="text-yellow-400 font-black text-[22px] uppercase leading-none tracking-tight">
                  {t('auto.starts9thMay')}
                </h2>
                <p className="text-white font-bold text-[11px] mt-1 leading-tight max-w-[150px]">
                  24hrs Early Access for PLUS & BLACK Members
                </p>
              </div>
              
              <button className="mt-3 bg-white rounded-full w-14 h-7 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <ChevronRight size={20} strokeWidth={3} className="text-[#6FAE4A]" />
              </button>
            </div>

            {/* Right Section: Mascot Placeholder */}
            <div className="w-1/4 flex items-center justify-end relative h-full">
              <div className="absolute right-0 bottom-0 w-32 h-32 opacity-20">
                 <div className="w-full h-full bg-white/20 rounded-full blur-3xl"></div>
              </div>
              <div className="z-10 text-[40px] animate-bounce">🕺</div>
            </div>

            {/* Decorative Stars/Dots */}
            <div className="absolute left-10 top-5 text-white/40 text-xs">✨</div>
            <div className="absolute right-20 bottom-5 text-yellow-400/40 text-sm">✦</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaleBanner;

