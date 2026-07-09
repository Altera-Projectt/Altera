const mongoose = require('mongoose');

const CATEGORIES = ['T-Shirt', 'Hoodie', 'Pants', 'Shorts', 'Jacket', 'Accessory', 'Shoes'];
const STYLES = ['Oversize', 'Boxy', 'Slim', 'Regular', 'Crop', 'Baby Tee', 'Polo', 'Henley'];
const FITS = ['Oversized', 'Boxy', 'Regular', 'Slim', 'Relaxed'];
const GENDERS = ['Men', 'Women', 'Unisex'];

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    style: {
      type: String,
      enum: STYLES,
    },
    fit: {
      type: String,
      enum: FITS,
    },
    material: {
      type: String,
    },
    brand: {
      type: String,
      default: 'ALTERA',
    },
    gender: {
      type: String,
      enum: GENDERS,
      default: 'Unisex',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    images: [{ type: String }],
    colors: [
      {
        name: { type: String },
        hex: { type: String },
        imageUrl: { type: String },
        stock: { type: Number, default: 0 },
      },
    ],
    sizes: [
      {
        label: { type: String },
        stock: { type: Number, default: 0 },
        measurements: {
          chest: { type: Number },
          length: { type: Number },
          shoulder: { type: Number },
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    tags: [{ type: String }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    sold: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ style: 1, gender: 1 });
ProductSchema.index({ price: 1 });

module.exports = mongoose.model('Product', ProductSchema);
