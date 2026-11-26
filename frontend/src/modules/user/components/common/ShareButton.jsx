import React from 'react';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const idOf = (p) => String(p?.productId || p?.raw?.productId || p?.id || p?._id || '').split(':')[0];

/** A link that opens this product for anyone (the product page reads the id from the URL). */
export const productUrl = (product) => `${window.location.origin}/product-detail/${idOf(product)}`;

/** Phone share sheet (WhatsApp, SMS…) or, on desktop, copy the link. */
export const shareProduct = async (product) => {
  const name = product?.title || product?.name || 'this product';
  const price = product?.price ? ` for ₹${product.price}` : '';
  const url = productUrl(product);
  try {
    if (navigator.share) await navigator.share({ title: name, text: `Check out ${name}${price} on Mithilakart`, url });
    else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
  } catch (err) {
    if (err?.name !== 'AbortError') toast.error('Could not share this product');
  }
};

/** Small round share icon for product cards; the card must be `relative`. */
const ShareButton = ({ product, className = 'absolute top-1 right-10 z-10', size = 14 }) => (
  <button
    type="button"
    data-testid="share-product"
    aria-label={`Share ${product?.title || product?.name || 'product'}`}
    onClick={(e) => { e.stopPropagation(); e.preventDefault(); shareProduct(product); }}
    className={`${className} w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-transform`}
  >
    <Share2 size={size} />
  </button>
);

export default ShareButton;
