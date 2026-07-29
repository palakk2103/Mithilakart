const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    portal: {
      type: String,
      enum: ['customer', 'seller', 'admin', 'delivery'],
      required: true,
    },
    deviceId: { type: String, required: true },
    platform: { type: String, default: 'web' },
    fcmToken: { type: String, default: null, index: true, sparse: true },
    userAgent: { type: String, default: null },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'user_devices',
  }
);

userDeviceSchema.index({ userId: 1, portal: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.models.UserDevice || mongoose.model('UserDevice', userDeviceSchema);
