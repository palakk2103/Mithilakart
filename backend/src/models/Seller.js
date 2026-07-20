const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    storeName: { type: String, trim: true },
    phone: { type: String, trim: true },
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
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'sellers',
  }
);

sellerSchema.index({ status: 1, kycStatus: 1 });

module.exports = mongoose.models.Seller || mongoose.model('Seller', sellerSchema);
