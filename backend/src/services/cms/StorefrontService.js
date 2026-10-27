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
    translationService = null,
  }) {
    super();
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
      this.bannerRepository.findActive({ commerceFlow }, { sort: { sortOrder: 1 } }),
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
            sortOrder: section.sortOrder,
            products: await this._resolveSectionProducts(section.productIds, lang),
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

  async _resolveSectionProducts(productIds = [], lang = 'en') {
    if (!productIds.length) return [];

    const products = await this.productRepository.find(
      { _id: { $in: productIds }, deletedAt: null },
      { limit: productIds.length }
    );

    const isLocalized = lang && lang !== 'en';
    const orderMap = new Map(productIds.map((id, index) => [String(id), index]));
    return products
      .sort((a, b) => (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999))
      .map((product) => {
        const localizedTitle = (isLocalized && product.translations?.[lang]?.title) || product.title;
        return {
          id: product._id,
          title: localizedTitle,
          originalTitle: product.title,
          translations: product.translations || {},
          price: product.price,
          mrp: product.mrp,
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
