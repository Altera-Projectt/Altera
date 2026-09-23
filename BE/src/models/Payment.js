const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  paymentMethod: { type: String, enum: ['COD', 'BANK_TRANSFER', 'MOMO'], required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'], default: 'PENDING', required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentReference: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['INTERNAL', 'VIETQR', 'MOMO'], required: true },
  transactionId: { type: String, default: null },
  providerOrderId: { type: String, default: null },
  providerResponse: { type: mongoose.Schema.Types.Mixed, select: false },
  failureReason: { type: String, default: null },
  paidAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

PaymentSchema.index({ orderId: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true, partialFilterExpression: { transactionId: { $type: 'string' } } });
PaymentSchema.index({ providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: 'string' } } });
module.exports = mongoose.model('Payment', PaymentSchema);
