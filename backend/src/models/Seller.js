const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    storeName: { type: String, trim: true },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true, default: '+91' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'inactive',
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    bankDetails: {
      accountHolder: { type: String, default: null },
      accountNumber: { type: String, default: null },
      ifsc: { type: String, default: null },
      bankName: { type: String, default: null },
    },
    documents: {
      gstin: { type: String, default: null },
      pan: { type: String, default: null },
    },
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      inventoryAlerts: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
    },
    balance: { type: Number, default: 0, min: 0 },
    mithilakEligible: { type: Boolean, default: false },
    quickCommerceEligible: { type: Boolean, default: false },
    groceryEligible: { type: Boolean, default: false },
    addressLine: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, trim: true, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    placeId: { type: String, trim: true, default: null },
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
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'sellers',
  }
);

sellerSchema.pre('save', function preSaveSyncLocation(next) {
  if (this.isModified('latitude') || this.isModified('longitude')) {
    if (this.latitude != null && this.longitude != null) {
      this.location = {
        type: 'Point',
        coordinates: [this.longitude, this.latitude],
      };
    } else {
      this.location = undefined;
    }
  }
  next();
});

sellerSchema.index({ status: 1, kycStatus: 1 });
sellerSchema.index({ phone: 1, countryCode: 1 });
sellerSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Seller || mongoose.model('Seller', sellerSchema);
