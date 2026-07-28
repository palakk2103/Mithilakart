const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { parseLocationFields } = require('../../utils/geoHelper');

const MAX_ADDRESSES = 10;

class AddressService extends BaseService {
  constructor({ userAddressRepository, geocodingService }) {
    super();
    this.userAddressRepository = userAddressRepository;
    this.geocodingService = geocodingService;
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
      placeId: address.placeId,
      isDefault: address.isDefault,
    };
  }

  async _resolveLocation(data) {
    let latitude = data.latitude ?? null;
    let longitude = data.longitude ?? null;
    let placeId = data.placeId ?? null;
    let city = data.city || null;
    let state = data.state || null;
    let addressLine = data.addressLine;

    if ((latitude == null || longitude == null) && this.geocodingService?.isEnabled()) {
      const geocoded = await this.geocodingService.geocodeAddress({
        addressLine,
        city,
        state,
        pincode: data.pincode,
      });
      if (geocoded) {
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
        placeId = geocoded.placeId;
        city = city || geocoded.formattedAddress?.split(',')[0] || null;
      }
    }

    const geo = parseLocationFields({ latitude, longitude });
    return {
      addressLine,
      city,
      state,
      pincode: data.pincode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      placeId,
      location: geo.location,
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

      const locationFields = await this._resolveLocation(data);

      const created = await this.userAddressRepository.create(
        {
          userId,
          type: data.type || 'HOME',
          name: data.name,
          phone: data.phone,
          ...locationFields,
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

      const merged = {
        addressLine: data.addressLine ?? address.addressLine,
        city: data.city ?? address.city,
        state: data.state ?? address.state,
        pincode: data.pincode ?? address.pincode,
        latitude: data.latitude ?? address.latitude,
        longitude: data.longitude ?? address.longitude,
        placeId: data.placeId ?? address.placeId,
      };
      const locationFields = await this._resolveLocation(merged);

      const updated = await this.userAddressRepository.updateById(
        addressId,
        {
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...locationFields,
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
