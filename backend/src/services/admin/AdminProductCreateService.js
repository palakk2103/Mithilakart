const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { LEGACY_FLOW_TO_TAB, QUICK_COMMERCE_TABS, DELIVERY_PROMISE_MINUTES } = require('../../constants/marketplace');

const TAB_LABELS = {
  mithilakart: 'Mithilakart',
  mithilak: 'Mithilak',
  quick_shop: 'Quick Shop',
  groceries_fresh: 'Groceries & Fresh',
};

/** Seller flag that must be on for the storefront to show the seller in a tab. */
const TAB_ELIGIBILITY = {
  mithilak: 'mithilakEligible',
  quick_shop: 'quickCommerceEligible',
  groceries_fresh: 'groceryEligible',
};

/**
 * Admin "Add Product": creates a product on behalf of a seller.
 *
 * The admin screen used to be a mock — "Publish to Catalog" saved nothing, so
 * products the admin added never reached any category. It now goes through the
 * seller product flow (SKU, approval status, listings per tab) after checking
 * the things that would otherwise leave the product invisible: an inactive
 * seller, a seller not enabled for the tab, or a category not shown in the tab.
 */
class AdminProductCreateService extends BaseService {
  constructor({ sellerProductService, sellerRepository, categoryRepository, categoryService }) {
    super();
    this.sellerProductService = sellerProductService;
    this.sellerRepository = sellerRepository;
    this.categoryRepository = categoryRepository;
    this.categoryService = categoryService;
  }

  async create({ sellerId, deliveryPromiseMinutes, ...data }) {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller || seller.deletedAt) throw AppError.notFound('Seller not found');
    if (seller.status !== 'active' || seller.kycStatus !== 'approved') {
      throw AppError.validation('Choose an approved, active seller — products of other sellers are not shown to customers');
    }

    const flows = Array.isArray(data.commerceFlows) && data.commerceFlows.length ? data.commerceFlows : ['standard'];
    const tabs = [...new Set(flows.map((flow) => LEGACY_FLOW_TO_TAB[flow] || flow))];

    const categories = await this.categoryRepository.findActive();
    const category = categories.find((c) => String(c._id) === String(data.categoryId));
    if (!category) throw AppError.notFound('Category not found');
    if (category.isActive === false) throw AppError.validation(`Category "${category.name}" is inactive`);

    const effective = this.categoryService.effectiveTabsMap(categories).get(String(category._id)) || [];
    const hiddenIn = tabs.filter((tab) => !effective.includes(tab));
    if (hiddenIn.length) {
      throw AppError.validation(
        `Category "${category.name}" is not shown in ${hiddenIn.map((t) => TAB_LABELS[t] || t).join(', ')}. `
        + 'Pick a different tab or enable the tab for this category in Category Manager.'
      );
    }

    const notEligible = tabs.filter((tab) => TAB_ELIGIBILITY[tab] && !seller[TAB_ELIGIBILITY[tab]]);
    if (notEligible.length) {
      throw AppError.validation(
        `${seller.storeName || seller.name} is not enabled for ${notEligible.map((t) => TAB_LABELS[t]).join(', ')}. `
        + 'Turn it on in Vendors → seller → Marketplace Tabs.'
      );
    }

    const quick = tabs.some((tab) => QUICK_COMMERCE_TABS.has(tab));
    const promise = Number(deliveryPromiseMinutes) || 30;
    if (quick && !DELIVERY_PROMISE_MINUTES.includes(promise)) {
      throw AppError.validation(`Delivery promise must be one of ${DELIVERY_PROMISE_MINUTES.join(', ')} minutes`);
    }

    return this.sellerProductService.create(
      String(seller._id),
      { ...data, commerceFlows: flows },
      quick ? { deliveryPromiseMinutes: promise } : {}
    );
  }
}

module.exports = { AdminProductCreateService };
