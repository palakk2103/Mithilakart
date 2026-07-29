const mongoose = require('mongoose');
const { SUPPORT_TICKET_STATUS_VALUES } = require('../constants/admin');

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: SUPPORT_TICKET_STATUS_VALUES, default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    replies: [{
      authorType: { type: String, enum: ['customer', 'admin'], required: true },
      authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    closedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'support_tickets' }
);

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
