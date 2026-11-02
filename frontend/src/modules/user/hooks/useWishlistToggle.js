import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/userApi';
import { extractList, mapWishlistItem } from '../utils/mappers';
import { isAuthenticated } from '../../../shared/api/tokenStorage';

let loadPromise = null;

// Resolve the real product ObjectId. Some cards use composite ids like
// "<productId>:<variantId>" (Already Bought) or nest the source under `raw`.
const idOf = (p) => {
  const raw = p?.raw?.productId || p?.productId || p?.id || p?._id || '';
  return String(raw).split(':')[0];
};

const loadWishlistOnce = (setWishlist) => {
  if (!isAuthenticated('customer')) return;
  if (loadPromise) return;
  loadPromise = getWishlist()
    .then((data) => setWishlist(extractList(data).map((p) => mapWishlistItem(p))))
    .catch(() => {
      loadPromise = null;
    });
};

/**
 * Shared wishlist state for heart buttons. The server is the source of truth;
 * the zustand store mirrors it so every card shows the same red/unred state,
 * including after a page refresh.
 */
const useWishlistToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wishlist = useAccountStore((s) => s.wishlist);
  const setWishlist = useAccountStore((s) => s.setWishlist);

  useEffect(() => {
    loadWishlistOnce(setWishlist);
  }, [setWishlist]);

  const isWishlisted = useCallback(
    (product) => {
      const id = idOf(product);
      return !!id && Array.isArray(wishlist) && wishlist.some((i) => idOf(i) === id);
    },
    [wishlist]
  );

  const toggle = useCallback(
    async (product) => {
      const id = idOf(product);
      if (!id) return;
      if (!isAuthenticated('customer')) {
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      const { wishlist: current, setWishlist: set } = useAccountStore.getState();
      const list = Array.isArray(current) ? current : [];
      const exists = list.some((i) => idOf(i) === id);
      // optimistic update
      set(exists ? list.filter((i) => idOf(i) !== id) : [...list, { ...mapWishlistItem(product), id, productId: id }]);
      try {
        if (exists) await removeFromWishlist(id);
        else await addToWishlist(id);
        toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist');
      } catch (err) {
        set(list); // rollback
        console.error('Wishlist update failed', err);
        toast.error(err?.message || 'Could not update wishlist');
      }
    },
    [navigate, location.pathname]
  );

  return { isWishlisted, toggle };
};

export default useWishlistToggle;
