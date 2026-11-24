import React from 'react';
import { Heart } from 'lucide-react';
import useWishlistToggle from '../../hooks/useWishlistToggle';

/** Heart in a product card's top-right corner; the card must be `relative`. */
const WishlistHeart = ({ product, className = 'absolute top-1 right-1 z-10' }) => {
  const { isWishlisted, toggle } = useWishlistToggle();
  const saved = isWishlisted(product);
  return (
    <button
      type="button"
      data-testid="wishlist-heart"
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(product); }}
      className={`${className} w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center active:scale-90 transition-transform`}
    >
      <Heart size={16} className={saved ? 'text-rose-600 fill-rose-600' : 'text-slate-500'} />
    </button>
  );
};

export default WishlistHeart;
