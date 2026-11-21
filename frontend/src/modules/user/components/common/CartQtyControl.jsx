import React, { useEffect, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import useTabTheme from '../../../../shared/hooks/useTabTheme';
import { isAuthenticated } from '../../../../shared/api/tokenStorage';
import AddToCartButton from './AddToCartButton';
import {
  fetchCartItems,
  getMarketplaceTab,
  updateCartItemQuantity,
  removeCartItemById,
} from '../../utils/cartUtils';

/*
 * One cart snapshot per tab shared by every card on screen, so a section of
 * nine cards makes one cart request, not nine. Refreshed on 'cartUpdated'.
 */
const snapshots = new Map(); // tab -> { items, promise }
const listeners = new Set();

const loadCart = (tab, force = false) => {
  const current = snapshots.get(tab);
  if (current && !force) return current.promise;
  const promise = fetchCartItems(tab).then(({ items }) => {
    snapshots.set(tab, { items, promise });
    listeners.forEach((fn) => fn());
    return items;
  });
  snapshots.set(tab, { items: current?.items || [], promise });
  return promise;
};

if (typeof window !== 'undefined') {
  window.addEventListener('cartUpdated', () => {
    [...snapshots.keys()].forEach((tab) => loadCart(tab, true));
  });
}

const matches = (item, product) => {
  if (product.listingId && item.listingId) return String(item.listingId) === String(product.listingId);
  return String(item.productId) === String(product.productId || product.id);
};

/**
 * "Add" when the product is not in the cart, otherwise − qty +.
 * `product` needs productId (or id) and, ideally, listingId + marketplaceTab.
 */
const CartQtyControl = ({ product, className = '' }) => {
  const { primaryHex } = useTabTheme();
  const tab = product?.marketplaceTab || getMarketplaceTab();
  const loggedIn = isAuthenticated('customer');
  const [, rerender] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return undefined;
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    loadCart(tab);
    return () => listeners.delete(fn);
  }, [tab, loggedIn]);

  const item = loggedIn ? (snapshots.get(tab)?.items || []).find((i) => matches(i, product)) : null;
  const qty = item ? Number(item.qty || item.quantity || 1) : 0;

  const change = useCallback(async (e, delta) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy || !item) return;
    setBusy(true);
    try {
      if (delta < 0 && qty <= 1) await removeCartItemById(item, tab);
      else await updateCartItemQuantity({ ...item, marketplaceTab: tab }, delta);
    } catch (err) {
      toast.error(err?.message || 'Could not update the cart');
    } finally {
      setBusy(false);
    }
  }, [busy, item, qty, tab]);

  if (!qty) return <AddToCartButton product={product} className={className} />;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      className={`w-full h-8 flex items-center justify-between rounded-lg text-white font-bold text-[12px] md:text-[13px] ${busy ? 'opacity-70' : ''} ${className}`}
      style={{ backgroundColor: primaryHex }}
    >
      <button type="button" aria-label="Decrease quantity" disabled={busy} onClick={(e) => change(e, -1)} className="h-full px-2 flex items-center">
        <Minus size={14} strokeWidth={3} />
      </button>
      <span aria-live="polite">{qty}</span>
      <button type="button" aria-label="Increase quantity" disabled={busy} onClick={(e) => change(e, 1)} className="h-full px-2 flex items-center">
        <Plus size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

export default React.memo(CartQtyControl);
