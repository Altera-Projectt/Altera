const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema({
  code: { type: String, enum: ['BASIC', 'PREMIUM', 'PRO_STUDIO'], required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'VND' },
  billingCycle: { type: String, enum: ['FREE', 'MONTHLY', 'YEARLY'], required: true },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
