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
    categoryRepository = null,
  }) {
    super();
    this.categoryRepository = categoryRepository;
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

  async listBanners(categoryId = null) {
    const filter = { deletedAt: null };
    if (categoryId) filter.categoryId = categoryId;
    return this.bannerRepository.find(filter, { sort: { sortOrder: 1 } });
  }

  /** Normalises the optional category link (category banners are matched by categoryId, not by flow). */
  async _prepareBannerPayload(data) {
    const payload = { ...data };
    if ('categoryId' in payload) {
      payload.categoryId = payload.categoryId && String(payload.categoryId).trim() !== '' ? payload.categoryId : null;
      if (payload.categoryId) {
        if (!/^[a-f0-9]{24}$/i.test(String(payload.categoryId))) throw AppError.validation('Banner category id is invalid');
        const category = this.categoryRepository ? await this.categoryRepository.findById(payload.categoryId) : null;
        if (!category || category.deletedAt) throw AppError.validation('Banner category does not exist');
        if ((category.parentIds && category.parentIds.length) || category.parentId) {
          throw AppError.validation('Banners can only be assigned to main categories');
        }
      }
    }
    if ('mobileImageUrl' in payload && !payload.mobileImageUrl) payload.mobileImageUrl = null;
    return payload;
  }

  async createBanner(data) {
    const payload = await this._prepareBannerPayload(data);
    const banner = await this.bannerRepository.create(payload);
    await this._invalidateStorefrontCache(payload.commerceFlow);
    return banner;
  }

  async updateBanner(id, data) {
    const payload = await this._prepareBannerPayload(data);
    const banner = await this.bannerRepository.updateById(id, payload);
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
    const payload = {
      ...data,
      iconKey: data.iconKey || null,
      categoryId: (data.categoryId && String(data.categoryId).trim() !== '') ? data.categoryId : null,
    };
    const chip = await this.categoryChipRepository.create(payload);
    await this._invalidateStorefrontCache(payload.commerceFlow);
    return chip;
  }

  async updateChip(id, data) {
    const payload = { ...data };
    if ('categoryId' in data) {
      payload.categoryId = (data.categoryId && String(data.categoryId).trim() !== '') ? data.categoryId : null;
    }
    if ('iconKey' in payload) {
      payload.iconKey = payload.iconKey || null;
    }
    const chip = await this.categoryChipRepository.updateById(id, payload);
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
        viewAllLink: data.viewAllLink || '',
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
    const flows = commerceFlow
      ? [commerceFlow]
      : ['standard', 'mithilak', 'quick_shop', 'fresh_grocery'];
    await this.cacheService.delByPattern('cache:storefront:landing:*');
    await Promise.all(
      // Cache keys carry a language suffix (cache:storefront:home:<flow>:<lang>)
      flows.map((flow) => this.cacheService.delByPattern(`cache:storefront:home:${flow}:*`))
    );
  }
}

module.exports = {
  CmsService,
};
