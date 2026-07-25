import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Heart, ShoppingCart } from 'lucide-react';

const HeaderTop = ({ cartCount = 0 }) => {
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const badgeBg = isMithilakFlow 
    ? 'bg-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522]' 
        : 'bg-[#6FAE4A]';

  return (
    <div className="px-3 py-1 flex items-center justify-between">
      {/* ── Logo ── */}
      <Link to="/home" className="flex items-center flex-shrink-0">
        <motion.img
          src="/mthibg.png"
          alt="Mithilakart"
          className="h-10 w-28 object-contain object-left"
          whileTap={{ scale: 0.95 }}
        />
      </Link>

      {/* ── Action Icons ── */}
      <div className="flex items-center gap-0 flex-shrink-0">
        <motion.div whileTap={{ scale: 0.82 }}>
          <Link to="/notifications" aria-label="Notifications" className="p-1.5 block">
            <Bell size={20} strokeWidth={1.8} className="text-primary-dark" />
          </Link>
        </motion.div>

        <motion.div whileTap={{ scale: 0.82 }}>
          <Link to="/wishlist" aria-label="Wishlist" className="p-1.5 block">
            <Heart size={20} strokeWidth={1.8} className="text-primary-dark" />
          </Link>
        </motion.div>

        <motion.div whileTap={{ scale: 0.82 }}>
          <Link to="/cart" aria-label="Cart" className="relative p-1.5 block">
            <ShoppingCart size={20} strokeWidth={1.8} className="text-primary-dark" />
            {cartCount > 0 && (
              <span className={`absolute top-1 right-1 text-[8px] font-black min-w-[14px] h-3.5 rounded-full ${badgeBg} text-white flex items-center justify-center shadow-sm`}>
                {cartCount}
              </span>
            )}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HeaderTop;
