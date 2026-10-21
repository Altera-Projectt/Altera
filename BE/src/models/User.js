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
    membershipTier: {
      type: String,
      enum: ['FREE', 'PREMIUM', 'PRO'],
      default: 'FREE',
    },
    membershipStartedAt: { type: Date, default: null },
    membershipExpiresAt: { type: Date, default: null },
    isLifetimeMembership: { type: Boolean, default: false },
    membershipPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
    membershipStatus: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'], default: 'ACTIVE' },
    membershipStartDate: { type: Date, default: null },
    membershipEndDate: { type: Date, default: null },
    membershipAutoRenew: { type: Boolean, default: false },
    isActive: {
      type: Boolean,
      default: true,
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

const getEffectiveTier = (user) => {
  if (!user) return 'FREE';
  if (String(user.role || '').toUpperCase() === 'ADMIN' || user.isLifetimeMembership === true) {
    return 'PRO';
  }
  const tier = user.membershipTier || 'FREE';
  if (tier !== 'FREE') {
    const expiresAt = user.membershipExpiresAt || user.membershipEndDate;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return 'FREE';
    }
    return tier;
  }
  return 'FREE';
};

const getDaysRemaining = (user) => {
  if (!user) return 0;
  if (String(user.role || '').toUpperCase() === 'ADMIN' || user.isLifetimeMembership === true) {
    return null;
  }
  const effective = getEffectiveTier(user);
  if (effective === 'FREE') return 0;
  const expiresAt = user.membershipExpiresAt || user.membershipEndDate;
  if (!expiresAt) return 30;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
};

UserSchema.statics.getEffectiveTier = getEffectiveTier;
UserSchema.statics.getDaysRemaining = getDaysRemaining;

// Remove sensitive fields from JSON output and enrich membership fields
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  obj.effectiveTier = getEffectiveTier(obj);
  obj.daysRemaining = getDaysRemaining(obj);
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
