import { parsePrice } from '../../../shared/utils/priceFormatter';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Normalises a server-priced cart (GET /cart) into the shape the bill UI reads.
 * The server is the source of truth for every figure; nothing here re-prices.
 */
export const billFromCart = (cart, itemCount = 0) => {
  if (!cart) return null;
  const subtotal = Number(cart.subtotal) || 0;
  return {
    itemCount,
    mrpTotal: Number(cart.mrpTotal) || subtotal,
    subtotal,
    productDiscount: Number(cart.productDiscount) || 0,
    couponDiscount: Number(cart.couponDiscount) || 0,
    handlingFee: Number(cart.handlingFee) || 0,
    handlingFeeOriginal: Number(cart.handlingFeeOriginal) || 0,
    handlingFeeDiscountPercent: Number(cart.handlingFeeDiscountPercent) || 0,
    handlingFeeTier: cart.handlingFeeTier || null,
    handlingFeeNextTier: cart.handlingFeeNextTier || null,
    deliveryCharge: Number(cart.deliveryCharge) || 0,
    deliveryChargeOriginal: Number(cart.deliveryChargeOriginal) || 0,
    freeDeliveryThreshold: Number(cart.freeDeliveryThreshold) || 0,
    amountToFreeDelivery: Number(cart.amountToFreeDelivery) || 0,
    platformFee: Number(cart.platformFee) || 0,
    packagingFee: Number(cart.packagingFee) || 0,
    codHandlingFee: Number(cart.codHandlingFee) || 0,
    tax: Number(cart.tax) || 0,
    total: Number(cart.total) || 0,
    minOrderAmount: Number(cart.minOrderAmount) || 0,
  };
};

/**
 * Mirror of the server's fee rules for the one screen that has no server cart
 * (Buy Now). Same inputs as PricingService: public config + the lines. The order
 * itself is always re-priced by the server when it is placed.
 */
export const estimateBill = (lines, config = {}, couponDiscount = 0) => {
  const subtotal = lines.reduce((sum, l) => sum + parsePrice(l.price) * (Number(l.qty || l.quantity) || 1), 0);
  const mrpTotal = lines.reduce(
    (sum, l) => sum + Math.max(parsePrice(l.oldPrice), parsePrice(l.price)) * (Number(l.qty || l.quantity) || 1),
    0
  );
  const payable = Math.max(0, subtotal - couponDiscount);

  const freeAbove = Number.isFinite(Number(config.freeShippingThreshold)) ? Number(config.freeShippingThreshold) : 150;
  const baseDelivery = Number.isFinite(Number(config.defaultDeliveryCharge)) ? Number(config.defaultDeliveryCharge) : 25;
  const deliveryCharge = freeAbove > 0 && payable >= freeAbove ? 0 : baseDelivery;

  const baseHandling = Number(config.handlingFee) || 0;
  const tiers = (Array.isArray(config.handlingFeeTiers) ? config.handlingFeeTiers : [])
    .map((t) => ({ minSubtotal: Number(t.minSubtotal), discountPercent: Number(t.discountPercent) }))
    .filter((t) => Number.isFinite(t.minSubtotal) && Number.isFinite(t.discountPercent))
    .sort((a, b) => a.minSubtotal - b.minSubtotal);
  let tier = null;
  tiers.forEach((t) => { if (payable >= t.minSubtotal) tier = t; });
  const pct = tier ? Math.min(100, Math.max(0, tier.discountPercent)) : 0;
  const handlingFee = round2(baseHandling * (1 - pct / 100));
  const platformFee = Number(config.platformFee) || 0;
  const packagingFee = Number(config.packagingFee) || 0;
  const tax = round2(payable * (Number(config.taxRate) || 0));

  return {
    itemCount: lines.reduce((n, l) => n + (Number(l.qty || l.quantity) || 1), 0),
    mrpTotal,
    subtotal,
    productDiscount: Math.max(0, mrpTotal - subtotal),
    couponDiscount,
    handlingFee,
    handlingFeeOriginal: baseHandling,
    handlingFeeDiscountPercent: pct,
    handlingFeeTier: tier ? { minSubtotal: tier.minSubtotal, discountPercent: pct } : null,
    handlingFeeNextTier: tiers.find((t) => t.minSubtotal > payable) || null,
    deliveryCharge,
    deliveryChargeOriginal: baseDelivery,
    freeDeliveryThreshold: freeAbove,
    amountToFreeDelivery: freeAbove > 0 && payable < freeAbove ? round2(freeAbove - payable) : 0,
    platformFee,
    packagingFee,
    codHandlingFee: 0,
    tax,
    total: round2(payable + deliveryCharge + handlingFee + platformFee + packagingFee + tax),
    minOrderAmount: Number(config.minOrderAmount) || 0,
  };
};
