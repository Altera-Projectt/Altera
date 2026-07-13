const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    measurements: {
      height: { type: Number, min: [1, 'Height must be greater than 0'], default: null },
      weight: { type: Number, min: [1, 'Weight must be greater than 0'], default: null },
      shirtSize: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', null],
        default: null,
      },
      shoeSize: { type: String, trim: true, maxlength: 20, default: null },
    },
    preferences: {
      styles: { type: [String], default: [] },
      favoriteColors: { type: [String], default: [] },
      avoidColors: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
