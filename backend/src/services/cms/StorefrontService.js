const { BaseService } = require('../../core/BaseService');
const { CACHE_KEYS, CACHE_TTL, COMMERCE_FLOWS } = require('../../constants/catalog');
const { resolveTabFromQuery } = require('../../utils/marketplaceTab');

class StorefrontService extends BaseService {
  constructor({
    bannerRepository,
    categoryChipRepository,
    homeSectionRepository,
    productRepository,
    categoryService,
    cacheService,
    platformConfigService = null,
    translationService = null,
    marketplaceListingRepository = null,
  }) {
    super();
    this.marketplaceListingRepository = marketplaceListingRepository;
    this.bannerRepository = bannerRepository;
    this.categoryChipRepository = categoryChipRepository;
    this.homeSectionRepository = homeSectionRepository;
    this.productRepository = productRepository;
    this.categoryService = categoryService;
    this.cacheService = cacheService;
    this.platformConfigService = platformConfigService;
    this.translationService = translationService;
  }

  async getHome(commerceFlow = COMMERCE_FLOWS.STANDARD, lang = 'en') {
    const cacheKey = CACHE_KEYS.homeSections(commerceFlow, lang);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const [banners, chips, categories, sections] = await Promise.all([
      this.bannerRepository.findActive({ commerceFlow, categoryId: null, placement: { $ne: 'cart' } }, { sort: { sortOrder: 1 } }),
      this.categoryChipRepository.findActive({ commerceFlow }, { sort: { sortOrder: 1 } }),
      this.categoryService.listPublicTree(commerceFlow, null, lang),
      this.homeSectionRepository.findByFlow(commerceFlow),
    ]);

    // Build category lookup map for chip label translation
    const categoryMap = new Map();
    const indexCategories = (list) => {
      if (!Array.isArray(list)) return;
      for (const cat of list) {
        if (cat.id || cat._id) categoryMap.set(String(cat.id || cat._id), cat);
        if (cat.children?.length) indexCategories(cat.children);
      }
    };
    indexCategories(categories);

    const isLocalized = lang && lang !== 'en';

    const [serializedBanners, serializedChips, sectionPayload] = await Promise.all([
      Promise.all(
        banners.map(async (banner) => {
          let localizedTitle = banner.title;
          if (isLocalized && banner.title && this.translationService) {
            localizedTitle = await this.translationService.translateText(banner.title, lang, 'en');
          }
          return {
            id: banner._id,
            title: localizedTitle,
            originalTitle: banner.title,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl,
            commerceFlow: banner.commerceFlow,
            sortOrder: banner.sortOrder,
          };
        })
      ),
      Promise.all(
        chips.map(async (chip) => {
          let label = chip.label;
          if (isLocalized) {
            if (chip.label === 'You Buy') {
              label = lang === 'mai' ? 'सभ' : 'सभी';
            } else if (chip.categoryId && categoryMap.has(String(chip.categoryId))) {
              label = categoryMap.get(String(chip.categoryId)).name;
            } else if (this.translationService) {
              label = await this.translationService.translateText(chip.label, lang, 'en');
            }
          }
          return {
            id: chip._id,
            label,
            rawLabel: chip.label,
            imageUrl: chip.imageUrl,
            iconKey: chip.iconKey || null,
            categoryId: chip.categoryId,
            commerceFlow: chip.commerceFlow,
            sortOrder: chip.sortOrder,
          };
        })
      ),
      Promise.all(
        sections.map(async (section) => {
          let localizedTitle = section.title;
          if (isLocalized && this.translationService) {
            localizedTitle = await this.translationService.translateText(section.title, lang, 'en');
          }
          return {
            key: section.sectionKey,
            title: localizedTitle,
            originalTitle: section.title,
            viewAllLink: section.viewAllLink || '',
            sortOrder: section.sortOrder,
            products: await this._resolveSectionProducts(section.productIds, lang, commerceFlow),
          };
        })
      ),
    ]);

    const payload = {
      commerceFlow,
      banners: serializedBanners,
      chips: serializedChips,
      categories,
      sections: sectionPayload,
    };

    await this.cacheService.set(cacheKey, payload, CACHE_TTL.HOME_SECTIONS);
    return payload;
  }

  async getBanners(commerceFlow = COMMERCE_FLOWS.STANDARD, placement = 'home') {
    const banners = await this.bannerRepository.findActive(
      { commerceFlow, categoryId: null, placement: placement === 'cart' ? 'cart' : { $ne: 'cart' } },
      { sort: { sortOrder: 1 } }
    );

    return banners.map(this._serializeBanner);
  }

  async getPublicConfig() {
    if (!this.platformConfigService) {
      return {};
    }
    return this.platformConfigService.getPublicConfig();
  }

  async getYouPopup() {
    if (!this.platformConfigService) return { items: [] };
    return this.platformConfigService.getYouPopup();
  }

  async getHelpCenter() {
    if (!this.platformConfigService) return null;
    return this.platformConfigService.getHelpCenter();
  }

  async getHeaderTabs() {
    if (!this.platformConfigService) {
      return null;
    }
    return this.platformConfigService.getHeaderTabs();
  }

  _serializeBanner(banner) {
    return {
      id: banner._id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      commerceFlow: banner.commerceFlow,
      sortOrder: banner.sortOrder,
    };
  }

  _serializeChip(chip) {
    return {
      id: chip._id,
      label: chip.label,
      imageUrl: chip.imageUrl,
      iconKey: chip.iconKey || null,
      categoryId: chip.categoryId,
      commerceFlow: chip.commerceFlow,
      sortOrder: chip.sortOrder,
    };
  }

  /**
   * Only products a customer can actually buy: approved and with a live
   * listing. Pending/rejected products used to show here (Brands Spotlight)
   * and their page answered "Add" with "Listing not found or not available".
   * Each card carries its listing so Add goes to the right one.
   */
  async _resolveSectionProducts(productIds = [], lang = 'en', commerceFlow = null) {
    if (!productIds.length) return [];

    let products = await this.productRepository.findPublic(
      { _id: { $in: productIds } },
      { limit: productIds.length }
    );

    const listingOf = new Map();
    if (this.marketplaceListingRepository && products.length) {
      const tab = resolveTabFromQuery({ commerceFlow });
      const listings = await this.marketplaceListingRepository.findPublic({ productId: { $in: products.map((p) => p._id) } });
      for (const listing of listings) {
        const key = String(listing.productId);
        const current = listingOf.get(key);
        if (!current || (listing.marketplaceTab === tab && current.marketplaceTab !== tab)) listingOf.set(key, listing);
      }
      products = products.filter((p) => listingOf.has(String(p._id)));
    }

    const isLocalized = lang && lang !== 'en';
    const orderMap = new Map(productIds.map((id, index) => [String(id), index]));
    return products
      .sort((a, b) => (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999))
      .map((product) => {
        const localizedTitle = (isLocalized && product.translations?.[lang]?.title) || product.title;
        const listing = listingOf.get(String(product._id));
        return {
          id: product._id,
          productId: product._id,
          listingId: listing ? String(listing._id) : null,
          marketplaceTab: listing?.marketplaceTab || null,
          title: localizedTitle,
          originalTitle: product.title,
          translations: product.translations || {},
          price: listing?.price ?? product.price,
          mrp: listing?.mrp ?? product.mrp,
          images: product.images,
          rating: product.rating,
          brand: product.brand,
        };
      });
  }
}

module.exports = {
  StorefrontService,
};
