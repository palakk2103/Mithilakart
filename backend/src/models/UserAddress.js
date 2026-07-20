const mongoose = require('mongoose');

const userAddressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['HOME', 'WORK', 'OTHER'], default: 'HOME' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    placeId: { type: String, default: null, trim: true },
    isDefault: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'user_addresses',
  }
);

userAddressSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.models.UserAddress || mongoose.model('UserAddress', userAddressSchema);
