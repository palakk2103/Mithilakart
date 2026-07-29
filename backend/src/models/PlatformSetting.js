const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'platform_settings' }
);

module.exports = mongoose.models.PlatformSetting || mongoose.model('PlatformSetting', platformSettingSchema);
