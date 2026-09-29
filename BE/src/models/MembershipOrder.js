const mongoose = require('mongoose');

const MembershipOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  membershipPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'VND' },
  paymentMethod: { type: String, enum: ['VNPAY', 'MOMO', 'BANK_TRANSFER'], required: true },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'], default: 'PENDING' },
  paymentReference: { type: String, unique: true, required: true },
  transactionId: { type: String, default: null },
  providerTransactionId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
MembershipOrderSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('MembershipOrder', MembershipOrderSchema);
