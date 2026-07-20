const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PasswordService } = require('../PasswordService');

class AdminPromotionService extends BaseService {
  constructor({
    couponRepository,
    promotionService,
    flashSaleRepository,
    flashSaleProductRepository,
    featuredProductRepository,
    productRepository,
  }) {
    super();
    this.couponRepository = couponRepository;
    this.promotionService = promotionService;
    this.flashSaleRepository = flashSaleRepository;
    this.flashSaleProductRepository = flashSaleProductRepository;
    this.featuredProductRepository = featuredProductRepository;
    this.productRepository = productRepository;
  }

  async listCoupons(query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter = { scope: 'platform', deletedAt: null };
    const [items, total] = await Promise.all([
      this.couponRepository.find(filter, { skip, limit, sort: '-createdAt' }),
      this.couponRepository.count(filter),
    ]);
    return { items, total, page, limit };
  }

  async createCoupon(data) {
    return this.couponRepository.create({
      ...data,
      code: String(data.code).toUpperCase().trim(),
      scope: 'platform',
      sellerId: null,
    });
  }

  async updateCoupon(id, data) {
    const coupon = await this.couponRepository.findOne({ _id: id, scope: 'platform', deletedAt: null });
    if (!coupon) throw AppError.notFound('Coupon not found');
    const update = { ...data };
    if (update.code) update.code = String(update.code).toUpperCase().trim();
    return this.couponRepository.updateById(id, update);
  }

  async deleteCoupon(id) {
    const coupon = await this.couponRepository.findOne({ _id: id, scope: 'platform', deletedAt: null });
    if (!coupon) throw AppError.notFound('Coupon not found');
    return this.couponRepository.updateById(id, { deletedAt: new Date(), isActive: false });
  }

  async listFlashSales() {
    return this.flashSaleRepository.find({ deletedAt: null }, { sort: { startsAt: -1 } });
  }

  async createFlashSale(data) {
    return this.promotionService.createFlashSale(data);
  }

  async updateFlashSale(id, data) {
    const sale = await this.flashSaleRepository.findById(id);
    if (!sale || sale.deletedAt) throw AppError.notFound('Flash sale not found');
    return this.flashSaleRepository.updateById(id, data);
  }

  async deleteFlashSale(id) {
    return this.flashSaleRepository.updateById(id, { deletedAt: new Date(), isActive: false });
  }

  async addFlashSaleProduct(flashSaleId, productId, salePrice) {
    return this.promotionService.addFlashSaleProduct(flashSaleId, productId, salePrice);
  }

  async listFeaturedProducts() {
    const featured = await this.featuredProductRepository.findActive({ limit: 100 });
    const productIds = featured.map((f) => f.productId);
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds }, deletedAt: null })
      : [];
    return { featured, products };
  }

  async setFeaturedProduct(productId, sortOrder = 0) {
    return this.promotionService.setFeaturedProduct(productId, sortOrder);
  }

  async removeFeaturedProduct(id) {
    const row = await this.featuredProductRepository.findById(id);
    if (!row) throw AppError.notFound('Featured product not found');
    return this.featuredProductRepository.updateById(id, { isActive: false, deletedAt: new Date() });
  }
}

class AdminSubAdminService extends BaseService {
  constructor({ adminUserRepository, roleRepository, passwordService = new PasswordService() }) {
    super();
    this.adminUserRepository = adminUserRepository;
    this.roleRepository = roleRepository;
    this.passwordService = passwordService;
  }

  _serialize(admin) {
    return {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      roleId: admin.roleId?._id || admin.roleId,
      roleName: admin.roleId?.name || null,
      isSuperAdmin: admin.isSuperAdmin,
      createdAt: admin.createdAt,
    };
  }

  async list(query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter = { deletedAt: null, isSuperAdmin: false };
    const [items, total] = await Promise.all([
      this.adminUserRepository.model.find(filter).populate('roleId').skip(skip).limit(limit).sort('-createdAt').exec(),
      this.adminUserRepository.count(filter),
    ]);
    return { items: items.map((a) => this._serialize(a)), total, page, limit };
  }

  async create(data) {
    const role = await this.roleRepository.findById(data.roleId);
    if (!role) throw AppError.notFound('Role not found');

    const existing = await this.adminUserRepository.findByEmail(data.email);
    if (existing) throw AppError.conflict('Admin email already exists');

    this.passwordService.validateStrength(data.password);
    const passwordHash = await this.passwordService.hash(data.password);

    const created = await this.adminUserRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      roleId: data.roleId,
      status: data.status || 'active',
      isSuperAdmin: false,
    });

    const populated = await this.adminUserRepository.findByEmailWithRole(created.email);
    return this._serialize(populated);
  }

  async update(id, data) {
    const admin = await this.adminUserRepository.findById(id);
    if (!admin || admin.deletedAt || admin.isSuperAdmin) {
      throw AppError.notFound('Sub-admin not found');
    }

    const update = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.roleId !== undefined) update.roleId = data.roleId;
    if (data.status !== undefined) update.status = data.status;
    if (data.password) {
      this.passwordService.validateStrength(data.password);
      update.passwordHash = await this.passwordService.hash(data.password);
    }

    await this.adminUserRepository.updateById(id, update);
    const populated = await this.adminUserRepository.model.findById(id).populate('roleId').exec();
    return this._serialize(populated);
  }

  async remove(id) {
    const admin = await this.adminUserRepository.findById(id);
    if (!admin || admin.deletedAt || admin.isSuperAdmin) {
      throw AppError.notFound('Sub-admin not found');
    }
    return this.adminUserRepository.updateById(id, { deletedAt: new Date(), status: 'inactive' });
  }
}

module.exports = { AdminPromotionService, AdminSubAdminService };
