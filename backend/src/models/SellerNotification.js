const mongoose = require('mongoose');

const sellerNotificationSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'seller_notifications',
  }
);

sellerNotificationSchema.index({ sellerId: 1, isRead: 1, createdAt: -1 });

module.exports =
  mongoose.models.SellerNotification ||
  mongoose.model('SellerNotification', sellerNotificationSchema);
