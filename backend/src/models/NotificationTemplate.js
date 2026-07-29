const mongoose = require('mongoose');
const { NOTIFICATION_CHANNEL_VALUES, SUPPORTED_LOCALES } = require('../constants/admin');

const notificationTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    channel: { type: String, enum: NOTIFICATION_CHANNEL_VALUES, required: true },
    locale: { type: String, enum: SUPPORTED_LOCALES, default: 'en' },
    subject: { type: String, default: null },
    body: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'notification_templates' }
);

notificationTemplateSchema.index({ key: 1, locale: 1 }, { unique: true });

module.exports = mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', notificationTemplateSchema);
