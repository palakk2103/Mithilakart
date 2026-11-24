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
    surgeCharge: Number(cart.surgeCharge) || 0,
    surge: cart.surge || null,
    tipAmount: Number(cart.tipAmount) || 0,
    tax: Number(cart.tax) || 0,
    total: Number(cart.total) || 0,
    grossTotal: Number(cart.grossTotal ?? cart.total) || 0,
    cashback: cart.cashback || null,
    giftCard: cart.giftCard || null,
    giftCardAmount: Number(cart.giftCardAmount) || 0,
    walletEnabled: Boolean(cart.walletEnabled),
    walletBalance: Number(cart.walletBalance) || 0,
    walletAmount: Number(cart.walletAmount) || 0,
    minOrderAmount: Number(cart.minOrderAmount) || 0,
  };
};

/**
 * Mirror of the server's fee rules for the one screen that has no server cart
 * (Buy Now). Same inputs as PricingService: public config + the lines. The order
 * itself is always re-priced by the server when it is placed.
 */
export const estimateBill = (lines, config = {}, couponDiscount = 0, marketplaceTab = null, tipAmount = 0) => {
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

  // FEE-3: same rule as the server — on an active tab while the cart value is below the threshold.
  const surgeCfg = config.surge || {};
  const surgeOn = Boolean(surgeCfg.enabled && marketplaceTab && (surgeCfg.activeTabs || []).includes(marketplaceTab));
  const surgeThreshold = Number(surgeCfg.threshold) || 0;
  const surgeCharge = surgeOn && subtotal > 0 && subtotal < surgeThreshold ? Number(surgeCfg.amount) || 0 : 0;

  return {
    itemCount: lines.length,
    tipAmount: Math.max(0, Math.round(Number(tipAmount) || 0)),
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
    surgeCharge,
    surge: surgeCharge
      ? { applies: true, amount: surgeCharge, threshold: surgeThreshold, amountToAvoid: round2(surgeThreshold - subtotal), label: surgeCfg.billLabel || 'Surge charge', note: `High demand right now. Add ₹${round2(surgeThreshold - subtotal)} more to remove it.` }
      : null,
    tax,
    total: round2(payable + deliveryCharge + handlingFee + platformFee + packagingFee + surgeCharge + Math.max(0, Math.round(Number(tipAmount) || 0)) + tax),
    minOrderAmount: Number(config.minOrderAmount) || 0,
  };
};
