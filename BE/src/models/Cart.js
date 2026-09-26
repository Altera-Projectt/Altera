const mongoose = require('mongoose');

const DesignSideSchema = new mongoose.Schema({
  layers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  background: { type: String, default: null },
}, { _id: false });
const CustomizationSchema = new mongoose.Schema({
  color: { name: { type: String, required: true }, hex: { type: String, required: true } },
  size: { type: String, required: true },
  printSide: { type: String, enum: ['FRONT', 'BACK', 'BOTH'], required: true },
  printingTechnique: { type: String, required: true },
  frontDesign: { type: DesignSideSchema, default: () => ({}) },
  backDesign: { type: DesignSideSchema, default: () => ({}) },
}, { _id: false });

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    customization: { type: CustomizationSchema, default: undefined },
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart per user
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total price
CartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual: total items count
CartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', CartSchema);
