const { BaseService } = require('../../core/BaseService');
const { CART } = require('../../constants/commerce');
const { PRICING } = require('../../constants/pricing');

class PricingService extends BaseService {
  constructor({ couponService = null } = {}) {
    super();
    this.couponService = couponService;
  }

  computeDeliveryCharge(subtotal) {
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
  }) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );

    const { couponDiscount } = await this.computeCouponDiscount({
      couponCode,
      subtotal,
      userId,
    });

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const deliveryCharge = this.computeDeliveryCharge(discountedSubtotal);
    const tax = this.computeTax(discountedSubtotal, taxRate);
    const total = Math.round((discountedSubtotal + deliveryCharge + tax) * 100) / 100;

    return {
      subtotal,
      couponDiscount,
      discount: couponDiscount,
      deliveryCharge,
      shippingFee: deliveryCharge,
      tax,
      total,
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
