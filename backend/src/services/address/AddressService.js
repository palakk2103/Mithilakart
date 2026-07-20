const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');

const MAX_ADDRESSES = 10;

class AddressService extends BaseService {
  constructor({ userAddressRepository }) {
    super();
    this.userAddressRepository = userAddressRepository;
  }

  _serialize(address) {
    return {
      id: address._id,
      type: address.type,
      name: address.name,
      phone: address.phone,
      address: address.addressLine,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
    };
  }

  async list(userId) {
    const items = await this.userAddressRepository.findByUser(userId);
    return items.map((item) => this._serialize(item));
  }

  async create(userId, data) {
    const count = await this.userAddressRepository.countByUser(userId);
    if (count >= MAX_ADDRESSES) {
      throw AppError.validation(`Maximum ${MAX_ADDRESSES} addresses allowed`);
    }

    return withTransaction(async (session) => {
      const isDefault = data.isDefault || count === 0;
      if (isDefault) {
        await this.userAddressRepository.clearDefaultForUser(userId, session);
      }

      const created = await this.userAddressRepository.create(
        {
          userId,
          type: data.type || 'HOME',
          name: data.name,
          phone: data.phone,
          addressLine: data.addressLine,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode,
          isDefault,
        },
        session
      );

      return this._serialize(created);
    });
  }

  async update(userId, addressId, data) {
    const address = await this.userAddressRepository.findOne({
      _id: addressId,
      userId,
      deletedAt: null,
    });
    if (!address) throw AppError.notFound('Address not found');

    return withTransaction(async (session) => {
      if (data.isDefault) {
        await this.userAddressRepository.clearDefaultForUser(userId, session);
      }

      const updated = await this.userAddressRepository.updateById(
        addressId,
        {
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.addressLine !== undefined ? { addressLine: data.addressLine } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.state !== undefined ? { state: data.state } : {}),
          ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
        session
      );

      return this._serialize(updated);
    });
  }

  async remove(userId, addressId) {
    const address = await this.userAddressRepository.findOne({
      _id: addressId,
      userId,
      deletedAt: null,
    });
    if (!address) throw AppError.notFound('Address not found');

    await this.userAddressRepository.updateById(addressId, { deletedAt: new Date() });
    return { success: true };
  }

  async setDefault(userId, addressId) {
    const address = await this.userAddressRepository.findOne({
      _id: addressId,
      userId,
      deletedAt: null,
    });
    if (!address) throw AppError.notFound('Address not found');

    return withTransaction(async (session) => {
      await this.userAddressRepository.clearDefaultForUser(userId, session);
      const updated = await this.userAddressRepository.updateById(
        addressId,
        { isDefault: true },
        session
      );
      return this._serialize(updated);
    });
  }
}

module.exports = { AddressService };
