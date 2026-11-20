const mongoose = require('mongoose');
const { nextCustomerId } = require('../utils/customerId');

const userSchema = new mongoose.Schema(
  {
    // Permanent, unique, human-readable id (MK000123). Assigned once when the
    // customer is created and never changed, so the exact customer can always be
    // found in the database, in orders and in support.
    customerId: { type: String, trim: true, unique: true, sparse: true, immutable: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    phone: { type: String, trim: true, sparse: true },
    countryCode: { type: String, trim: true, default: '+91' },
    gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
    dob: { type: Date, default: null },
    avatarUrl: { type: String, default: null },
    authProvider: { type: String, enum: ['phone', 'email'], required: true },
    isVerified: { type: Boolean, default: false },
    // AUTH-2: registration verifies both identities.
    phoneVerifiedAt: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
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
      systemUpdates: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
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

// Every creation path (register, scripts, tests) gets an id.
userSchema.pre('validate', async function assignCustomerId() {
  if (this.isNew && !this.customerId) this.customerId = await nextCustomerId();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
