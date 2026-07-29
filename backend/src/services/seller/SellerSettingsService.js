const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class SellerSettingsService extends BaseService {
  constructor({ sellerRepository, passwordService }) {
    super();
    this.sellerRepository = sellerRepository;
    this.passwordService = passwordService;
  }

  async getProfile(sellerId) {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) throw AppError.notFound('Seller not found');
    return this._serializeProfile(seller);
  }

  async updateProfile(sellerId, data) {
    const seller = await this.sellerRepository.updateById(sellerId, data);
    return this._serializeProfile(seller);
  }

  async updateBank(sellerId, data) {
    const update = {
      bankDetails: {
        accountHolder: data.accountHolder,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc,
        bankName: data.bankName,
      },
      documents: {
        pan: data.pan || null,
        gstin: data.gstin || null,
      },
    };
    const seller = await this.sellerRepository.updateById(sellerId, update);
    return { bankDetails: seller.bankDetails, documents: seller.documents };
  }

  async updatePassword(sellerId, { currentPassword, newPassword }) {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) throw AppError.notFound('Seller not found');

    const valid = await this.passwordService.compare(currentPassword, seller.passwordHash);
    if (!valid) throw AppError.unauthorized('Current password is incorrect');

    this.passwordService.validateStrength(newPassword);
    const passwordHash = await this.passwordService.hash(newPassword);
    await this.sellerRepository.updateById(sellerId, { passwordHash });
    return { updated: true };
  }

  async updateNotifications(sellerId, prefs) {
    const seller = await this.sellerRepository.updateById(sellerId, {
      notificationPreferences: prefs,
    });
    return seller.notificationPreferences;
  }

  _serializeProfile(seller) {
    return {
      id: seller._id,
      name: seller.name,
      email: seller.email,
      storeName: seller.storeName,
      phone: seller.phone,
      status: seller.status,
      kycStatus: seller.kycStatus,
      bankDetails: seller.bankDetails,
      documents: seller.documents,
      notificationPreferences: seller.notificationPreferences,
    };
  }
}

module.exports = { SellerSettingsService };
