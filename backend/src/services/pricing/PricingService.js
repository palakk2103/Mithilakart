const { BaseService } = require('../../core/BaseService');
const { CART } = require('../../constants/commerce');
const { PRICING } = require('../../constants/pricing');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../constants/platformSettings');
const { AppError } = require('../../utils/AppError');

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
  }) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );

    const config = this.platformConfigService
      ? await this.platformConfigService.getConfig()
      : DEFAULT_PLATFORM_SETTINGS;

    const minOrderAmount = Number(config.minOrderAmount) || 0;
    if (minOrderAmount > 0 && subtotal < minOrderAmount) {
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
    const deliveryCharge = await this.computeDeliveryCharge(discountedSubtotal, { pincode });
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

    const tax = this.computeTax(discountedSubtotal, taxRate);
    const total = Math.round(
      (discountedSubtotal + deliveryCharge + platformFee + packagingFee + codHandlingFee + tax) * 100
    ) / 100;

    return {
      subtotal,
      couponDiscount,
      discount: couponDiscount,
      deliveryCharge,
      shippingFee: deliveryCharge,
      platformFee,
      packagingFee,
      codHandlingFee,
      tax,
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
