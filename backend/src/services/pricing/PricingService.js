const { BaseService } = require('../../core/BaseService');
const { CART } = require('../../constants/commerce');
const { PRICING } = require('../../constants/pricing');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../constants/platformSettings');
const { AppError } = require('../../utils/AppError');

const MAX_TIP = 500;

class PricingService extends BaseService {
  constructor({ couponService = null, platformConfigService = null } = {}) {
    super();
    this.couponService = couponService;
    this.platformConfigService = platformConfigService;
  }

  async computeDeliveryCharge(subtotal, { pincode = null } = {}) {
    if (this.platformConfigService) {
      return this.platformConfigService.computeDeliveryChargeAsync(subtotal, { pincode });
    }
    return subtotal >= CART.FREE_SHIPPING_THRESHOLD ? 0 : CART.SHIPPING_FEE;
  }

  computeTax(subtotal, taxRate = PRICING.DEFAULT_TAX_RATE) {
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  async computeCouponDiscount({ couponCode, subtotal, userId = null, sellerId = null }) {
    if (!couponCode || !this.couponService) {
      return { couponDiscount: 0, coupon: null };
    }

    const result = await this.couponService.calculateDiscount({
      code: couponCode,
      subtotal,
      userId,
      sellerId,
    });

    return {
      couponDiscount: result.discount,
      coupon: result.coupon,
    };
  }

  async calculateTotals({
    items = [],
    couponCode = null,
    userId = null,
    taxRate = PRICING.DEFAULT_TAX_RATE,
    pincode = null,
    paymentMethod = null,
    enforceMinOrder = false,
    marketplaceTab = null,
    now = new Date(),
    tipAmount = 0,
  }) {
    // CART-2 delivery tip: whole rupees, 0–500, passed in full to the delivery partner.
    const tip = Math.round(Number(tipAmount) || 0);
    if (tip < 0 || tip > MAX_TIP) throw AppError.validation(`Tip must be between ₹0 and ₹${MAX_TIP}`);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );

    const config = this.platformConfigService
      ? await this.platformConfigService.getConfig()
      : DEFAULT_PLATFORM_SETTINGS;

    const minOrderAmount = Number(config.minOrderAmount) || 0;
    if (enforceMinOrder && minOrderAmount > 0 && subtotal < minOrderAmount) {
      throw AppError.validation(`Minimum order value is ₹${minOrderAmount}`, [
        { field: 'subtotal', message: `Minimum order is ₹${minOrderAmount}` },
      ]);
    }

    const { couponDiscount } = await this.computeCouponDiscount({
      couponCode,
      subtotal,
      userId,
    });

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const delivery = this.platformConfigService
      ? this.platformConfigService.describeDelivery(config, discountedSubtotal, pincode)
      : {
        baseCharge: CART.SHIPPING_FEE,
        freeAbove: CART.FREE_SHIPPING_THRESHOLD,
        charge: discountedSubtotal >= CART.FREE_SHIPPING_THRESHOLD ? 0 : CART.SHIPPING_FEE,
        amountToFree: Math.max(0, CART.FREE_SHIPPING_THRESHOLD - discountedSubtotal),
      };
    const deliveryCharge = delivery.charge;
    const handling = this.platformConfigService
      ? this.platformConfigService.computeHandlingFee(config, discountedSubtotal)
      : { original: 0, discountPercent: 0, fee: 0, appliedTier: null, nextTier: null };
    // An empty cart owes nothing; the fees only apply once there is something to deliver.
    const hasItems = items.length > 0 && subtotal > 0;
    const handlingFee = hasItems ? handling.fee : 0;
    // FEE-3: surge on quick-commerce tabs while the cart value is below the threshold.
    const surge = this.platformConfigService?.computeSurge
      ? this.platformConfigService.computeSurge(config, { cartValue: subtotal, marketplaceTab, hasItems, now })
      : { charge: 0, applies: false, active: false, amount: 0, threshold: 0, amountToAvoid: 0, label: '', note: '' };
    const surgeCharge = surge.charge;
    const platformFee = Number(config.platformFee) || 0;
    const packagingFee = Number(config.packagingFee) || 0;
    let codHandlingFee = 0;

    if (paymentMethod === 'cod' && config.codEnabled === false) {
      throw AppError.validation('Cash on Delivery is currently unavailable', [
        { field: 'paymentMethod', message: 'COD is disabled by admin' },
      ]);
    }

    if (paymentMethod === 'cod') {
      codHandlingFee = Number(config.codHandlingFee) || 0;
    }

    const resolvedTaxRate = (taxRate != null && taxRate !== PRICING.DEFAULT_TAX_RATE)
      ? taxRate
      : (Number(config.taxRate) || (Number(config.gst) ? Number(config.gst) / 100 : 0));

    const tax = this.computeTax(discountedSubtotal, resolvedTaxRate);
    const total = Math.round(
      (discountedSubtotal + (hasItems ? deliveryCharge : 0) + platformFee + packagingFee + handlingFee + surgeCharge + (hasItems ? tip : 0) + codHandlingFee + tax) * 100
    ) / 100;

    const mrpTotal = items.reduce(
      (sum, item) => sum + Math.max(Number(item.mrp) || 0, Number(item.unitPrice) || 0) * (item.quantity || 0),
      0
    );
    const productDiscount = Math.max(0, mrpTotal - subtotal);

    return {
      subtotal,
      mrpTotal,
      productDiscount,
      couponDiscount,
      discount: couponDiscount,
      deliveryCharge: hasItems ? deliveryCharge : 0,
      shippingFee: hasItems ? deliveryCharge : 0,
      deliveryChargeOriginal: delivery.baseCharge,
      freeDeliveryThreshold: delivery.freeAbove,
      amountToFreeDelivery: hasItems ? delivery.amountToFree : 0,
      handlingFee,
      handlingFeeOriginal: handling.original,
      handlingFeeDiscountPercent: handling.discountPercent,
      handlingFeeTier: handling.appliedTier || null,
      handlingFeeNextTier: handling.nextTier,
      tipAmount: hasItems ? tip : 0,
      surgeCharge,
      surge: {
        applies: surge.applies,
        active: surge.active,
        amount: surge.amount,
        threshold: surge.threshold,
        amountToAvoid: surge.amountToAvoid,
        label: surge.label,
        note: surge.note,
      },
      platformFee,
      packagingFee,
      codHandlingFee,
      tax,
      taxRate: resolvedTaxRate,
      total,
      minOrderAmount,
    };
  }

  buildSellerSubOrders(items = [], orderStatus = 'pending') {
    const sellerMap = new Map();

    items.forEach((item) => {
      const sellerKey = String(item.sellerId);
      if (!sellerMap.has(sellerKey)) {
        sellerMap.set(sellerKey, {
          sellerId: item.sellerId,
          items: [],
          subtotal: 0,
          status: orderStatus,
        });
      }

      const entry = sellerMap.get(sellerKey);
      const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
      entry.items.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
      });
      entry.subtotal += lineTotal;
    });

    return Array.from(sellerMap.values());
  }
}

module.exports = {
  PricingService,
};
