const { BaseService } = require('../../core/BaseService');
const { CACHE_KEYS, CACHE_TTL, COMMERCE_FLOWS } = require('../../constants/catalog');

class StorefrontService extends BaseService {
  constructor({
    bannerRepository,
    categoryChipRepository,
    homeSectionRepository,
    productRepository,
    categoryService,
    cacheService,
    platformConfigService = null,
  }) {
    super();
    this.bannerRepository = bannerRepository;
    this.categoryChipRepository = categoryChipRepository;
    this.homeSectionRepository = homeSectionRepository;
    this.productRepository = productRepository;
    this.categoryService = categoryService;
    this.cacheService = cacheService;
    this.platformConfigService = platformConfigService;
  }

  async getHome(commerceFlow = COMMERCE_FLOWS.STANDARD) {
    const cacheKey = CACHE_KEYS.homeSections(commerceFlow);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const [banners, chips, categories, sections] = await Promise.all([
      this.bannerRepository.findActive({ commerceFlow }, { sort: { sortOrder: 1 } }),
      this.categoryChipRepository.findActive({ commerceFlow }, { sort: { sortOrder: 1 } }),
      this.categoryService.listPublicTree(commerceFlow),
      this.homeSectionRepository.findByFlow(commerceFlow),
    ]);

    const sectionPayload = await Promise.all(
      sections.map(async (section) => ({
        key: section.sectionKey,
        title: section.title,
        sortOrder: section.sortOrder,
        products: await this._resolveSectionProducts(section.productIds),
      }))
    );

    const payload = {
      commerceFlow,
      banners: banners.map(this._serializeBanner),
      chips: chips.map(this._serializeChip),
      categories,
      sections: sectionPayload,
    };

    await this.cacheService.set(cacheKey, payload, CACHE_TTL.HOME_SECTIONS);
    return payload;
  }

  async getBanners(commerceFlow = COMMERCE_FLOWS.STANDARD) {
    const banners = await this.bannerRepository.findActive(
      { commerceFlow },
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
      categoryId: chip.categoryId,
      commerceFlow: chip.commerceFlow,
      sortOrder: chip.sortOrder,
    };
  }

  async _resolveSectionProducts(productIds = []) {
    if (!productIds.length) return [];

    const products = await this.productRepository.find(
      { _id: { $in: productIds }, deletedAt: null },
      { limit: productIds.length }
    );

    const orderMap = new Map(productIds.map((id, index) => [String(id), index]));
    return products
      .sort((a, b) => (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999))
      .map((product) => ({
        id: product._id,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        images: product.images,
        rating: product.rating,
        brand: product.brand,
      }));
  }
}

module.exports = {
  StorefrontService,
};
