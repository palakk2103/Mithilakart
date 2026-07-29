const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class UserProfileService extends BaseService {
  constructor({ userRepository }) {
    super();
    this.userRepository = userRepository;
  }

  _serialize(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      gender: user.gender,
      dob: user.dob,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      status: user.status,
      notificationPreferences: user.notificationPreferences,
    };
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user || user.deletedAt) throw AppError.notFound('User not found');
    return this._serialize(user);
  }

  async updateProfile(userId, data) {
    const user = await this.userRepository.findById(userId);
    if (!user || user.deletedAt) throw AppError.notFound('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing && String(existing._id) !== String(userId)) {
        throw AppError.conflict('Email is already in use');
      }
    }

    const updated = await this.userRepository.updateById(userId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.dob !== undefined ? { dob: data.dob } : {}),
      ...(data.locale !== undefined ? { locale: data.locale } : {}),
    });

    return this._serialize(updated);
  }
}

module.exports = { UserProfileService };
