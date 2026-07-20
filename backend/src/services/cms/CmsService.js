const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { HOME_SECTION_KEYS } = require('../../constants/catalog');

class CmsService extends BaseService {
  constructor({
    bannerRepository,
    categoryChipRepository,
    homeSectionRepository,
    legalPageRepository,
    cmsPageRepository,
    cacheService,
  }) {
    super();
    this.bannerRepository = bannerRepository;
    this.categoryChipRepository = categoryChipRepository;
    this.homeSectionRepository = homeSectionRepository;
    this.legalPageRepository = legalPageRepository;
    this.cmsPageRepository = cmsPageRepository;
    this.cacheService = cacheService;
  }

  async getCmsPage(slug) {
    const page = await this.cmsPageRepository.findPublishedBySlug(slug);
    if (!page) {
      throw AppError.notFound('CMS page not found');
    }

    return this._serializeCmsPage(page);
  }

  async getLegalPage(type) {
    const page = await this.legalPageRepository.findByType(type);
    if (!page) {
      throw AppError.notFound('Legal page not found');
    }

    return this._serializeLegalPage(page);
  }

  async listBanners() {
    return this.bannerRepository.find({ deletedAt: null }, { sort: { sortOrder: 1 } });
  }

  async createBanner(data) {
    const banner = await this.bannerRepository.create(data);
    await this._invalidateStorefrontCache(data.commerceFlow);
    return banner;
  }

  async updateBanner(id, data) {
    const banner = await this.bannerRepository.updateById(id, data);
    await this._invalidateStorefrontCache(banner.commerceFlow);
    return banner;
  }

  async deleteBanner(id) {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) throw AppError.notFound('Banner not found');
    await this.bannerRepository.softDelete(id);
    await this._invalidateStorefrontCache(banner.commerceFlow);
  }

  async listChips() {
    return this.categoryChipRepository.find({ deletedAt: null }, { sort: { sortOrder: 1 } });
  }

  async createChip(data) {
    const chip = await this.categoryChipRepository.create(data);
    await this._invalidateStorefrontCache(data.commerceFlow);
    return chip;
  }

  async updateChip(id, data) {
    const chip = await this.categoryChipRepository.updateById(id, data);
    await this._invalidateStorefrontCache(chip.commerceFlow);
    return chip;
  }

  async deleteChip(id) {
    const chip = await this.categoryChipRepository.findById(id);
    if (!chip) throw AppError.notFound('Category chip not found');
    await this.categoryChipRepository.softDelete(id);
    await this._invalidateStorefrontCache(chip.commerceFlow);
  }

  async listSections(commerceFlow) {
    return this.homeSectionRepository.findByFlow(commerceFlow);
  }

  async updateSection(sectionKey, commerceFlow, data) {
    if (!HOME_SECTION_KEYS.includes(sectionKey)) {
      throw AppError.validation('Invalid section key');
    }

    const section = await this.homeSectionRepository.findByKey(sectionKey, commerceFlow);

    if (!section) {
      const created = await this.homeSectionRepository.create({
        sectionKey,
        commerceFlow,
        title: data.title,
        productIds: data.productIds || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
      });
      await this._invalidateStorefrontCache(commerceFlow);
      return created;
    }

    const updated = await this.homeSectionRepository.updateById(section._id, data);
    await this._invalidateStorefrontCache(commerceFlow);
    return updated;
  }

  async reorderSections(commerceFlow, orderedKeys = []) {
    const sections = await this.homeSectionRepository.findByFlow(commerceFlow);

    await Promise.all(
      orderedKeys.map((sectionKey, index) => {
        const section = sections.find((entry) => entry.sectionKey === sectionKey);
        if (!section) return null;
        return this.homeSectionRepository.updateById(section._id, { sortOrder: index });
      })
    );

    await this._invalidateStorefrontCache(commerceFlow);
    return this.homeSectionRepository.findByFlow(commerceFlow);
  }

  async getAdminCmsPage(slug) {
    const page = await this.cmsPageRepository.findBySlug(slug);
    if (!page) throw AppError.notFound('CMS page not found');
    return this._serializeCmsPage(page);
  }

  async upsertCmsPage(slug, data, adminId) {
    const existing = await this.cmsPageRepository.findBySlug(slug);

    if (!existing) {
      return this.cmsPageRepository.create({
        slug: slug.toLowerCase(),
        title: data.title,
        content: data.content,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        updatedBy: adminId,
      });
    }

    return this.cmsPageRepository.updateById(existing._id, {
      title: data.title,
      content: data.content,
      isPublished: data.isPublished !== undefined ? data.isPublished : existing.isPublished,
      version: existing.version + 1,
      updatedBy: adminId,
    });
  }

  async upsertLegalPage(type, data, adminId) {
    const existing = await this.legalPageRepository.findByType(type);

    if (!existing) {
      return this.legalPageRepository.create({
        type,
        title: data.title,
        content: data.content,
        updatedBy: adminId,
      });
    }

    return this.legalPageRepository.updateById(existing._id, {
      title: data.title,
      content: data.content,
      version: existing.version + 1,
      updatedBy: adminId,
    });
  }

  _serializeCmsPage(page) {
    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      version: page.version,
      isPublished: page.isPublished,
      updatedAt: page.updatedAt,
    };
  }

  _serializeLegalPage(page) {
    return {
      type: page.type,
      title: page.title,
      content: page.content,
      version: page.version,
      updatedAt: page.updatedAt,
    };
  }

  async _invalidateStorefrontCache(commerceFlow = 'standard') {
    await this.cacheService.del(`cache:storefront:home:${commerceFlow}`);
  }
}

module.exports = {
  CmsService,
};
