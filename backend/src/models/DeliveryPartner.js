const mongoose = require('mongoose');
const { VEHICLE_TYPES } = require('../constants/auth');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91', trim: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    documents: {
      aadharNumber: { type: String, default: null },
      drivingLicenseNumber: { type: String, default: null },
      vehicleRegistrationNumber: { type: String, default: null },
    },
    addressLine: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    isOnline: { type: Boolean, default: false, index: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    placeId: { type: String, default: null, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    lastLocationAt: { type: Date, default: null },
    balance: { type: Number, default: 0, min: 0 },
    codDuesBalance: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: 0.10, min: 0, max: 1 },
    totalCodCollected: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'delivery_partners',
  }
);

deliveryPartnerSchema.index({ phone: 1, countryCode: 1 }, { unique: true });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.DeliveryPartner || mongoose.model('DeliveryPartner', deliveryPartnerSchema);
