const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    phone: { type: String, trim: true, sparse: true },
    countryCode: { type: String, trim: true, default: '+91' },
    gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
    dob: { type: Date, default: null },
    avatarUrl: { type: String, default: null },
    authProvider: { type: String, enum: ['phone', 'email'], required: true },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'blocked', 'suspended'],
      default: 'active',
    },
    commerceFlowPreference: { type: String, default: null },
    locale: { type: String, enum: ['en', 'hi', 'bn', 'mai'], default: 'en' },
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ phone: 1, countryCode: 1 }, { unique: true, sparse: true });
userSchema.index({ status: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
