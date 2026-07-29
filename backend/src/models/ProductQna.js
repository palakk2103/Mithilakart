const mongoose = require('mongoose');
const { QNA_STATUS_VALUES } = require('../constants/engagement');

const productQnaSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: null, trim: true },
    answeredBy: { type: String, enum: ['seller', 'admin', null], default: null },
    answeredById: { type: mongoose.Schema.Types.ObjectId, default: null },
    answeredAt: { type: Date, default: null },
    status: { type: String, enum: QNA_STATUS_VALUES, default: 'pending', index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'product_qna',
  }
);

productQnaSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.models.ProductQna || mongoose.model('ProductQna', productQnaSchema);
