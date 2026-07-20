const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isSuperAdmin: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordHistory: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'admin_users',
  }
);

adminUserSchema.index({ roleId: 1 });

module.exports = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
