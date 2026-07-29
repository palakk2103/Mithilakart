const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    channel: { type: String, default: 'in_app' },
    referenceType: { type: String, default: null },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'user_notifications' }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.UserNotification || mongoose.model('UserNotification', userNotificationSchema);
