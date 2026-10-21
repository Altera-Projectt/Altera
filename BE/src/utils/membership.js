const User = require('../models/User');
const Design = require('../models/Design');
const MarketplaceDesign = require('../models/MarketplaceDesign');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getEffectiveTier = (user) => {
  return User.getEffectiveTier(user);
};

const getDaysRemaining = (user) => {
  return User.getDaysRemaining(user);
};

const VIP_LIFETIME_EMAILS = new Set(['uyentam689@gmail.com', 'anhkhoilongan@gmail.com']);

const checkAndExpireUserMembership = async (user) => {
  if (!user) return user;
  const emailLower = String(user.email || '').toLowerCase();
  if (VIP_LIFETIME_EMAILS.has(emailLower) && (!user.isLifetimeMembership || user.membershipTier !== 'PRO' || user.role !== 'ADMIN')) {
    user.role = 'ADMIN';
    user.membershipTier = 'PRO';
    user.isLifetimeMembership = true;
    user.membershipExpiresAt = null;
    user.membershipStatus = 'ACTIVE';
    await User.updateOne(
      { _id: user._id },
      { $set: { role: 'ADMIN', membershipTier: 'PRO', isLifetimeMembership: true, membershipExpiresAt: null, membershipStatus: 'ACTIVE' } }
    );
    return user;
  }
  const isAdmin = String(user.role || '').toUpperCase() === 'ADMIN';
  if (isAdmin || user.isLifetimeMembership) return user;

  const expiresAt = user.membershipExpiresAt || user.membershipEndDate;
  if (user.membershipTier && user.membershipTier !== 'FREE' && expiresAt && new Date() > new Date(expiresAt)) {
    user.membershipTier = 'FREE';
    user.membershipStatus = 'EXPIRED';
    await User.updateOne(
      { _id: user._id },
      { $set: { membershipTier: 'FREE', membershipStatus: 'EXPIRED' } }
    );
  }
  return user;
};

const getWeeklyUsage = async (userId) => {
  if (!userId) return { weeklyAiUsed: 0, weeklyPublishedUsed: 0 };
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const [weeklyAiUsed, weeklyPublishedUsed] = await Promise.all([
    Design.countDocuments({
      userId,
      prompt: { $nin: [null, ''] },
      createdAt: { $gte: sevenDaysAgo },
    }),
    MarketplaceDesign.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    }),
  ]);
  return { weeklyAiUsed, weeklyPublishedUsed };
};

const enrichUserResponse = async (userDoc) => {
  if (!userDoc) return null;
  await checkAndExpireUserMembership(userDoc);
  const obj = typeof userDoc.toJSON === 'function' ? userDoc.toJSON() : { ...userDoc };
  delete obj.password;
  delete obj.__v;
  obj.effectiveTier = getEffectiveTier(obj);
  obj.daysRemaining = getDaysRemaining(obj);
  const { weeklyAiUsed, weeklyPublishedUsed } = await getWeeklyUsage(obj._id || obj.id);
  obj.weeklyAiUsed = weeklyAiUsed;
  obj.weeklyPublishedUsed = weeklyPublishedUsed;
  obj.weeklyUsage = {
    aiGenerationsUsed: weeklyAiUsed,
    publishedProductsUsed: weeklyPublishedUsed,
  };
  return obj;
};

const enforceAiQuota = async (user) => {
  await checkAndExpireUserMembership(user);
  const effectiveTier = getEffectiveTier(user);
  if (effectiveTier === 'PRO' || effectiveTier === 'PREMIUM') {
    return;
  }
  const { weeklyAiUsed } = await getWeeklyUsage(user._id);
  if (weeklyAiUsed >= 1) {
    const err = new Error(
      'Tài khoản Miễn phí chỉ được tạo tối đa 1 ảnh AI mỗi tuần. Vui lòng nâng cấp gói Premium hoặc Pro để sáng tạo không giới hạn!'
    );
    err.statusCode = 403;
    throw err;
  }
};

const enforceStudioAccess = async (user) => {
  await checkAndExpireUserMembership(user);
  const effectiveTier = getEffectiveTier(user);
  if (effectiveTier === 'FREE') {
    const err = new Error(
      'Tính năng Thiết kế 3D & Đăng bán lên sàn chỉ dành cho hội viên Premium và Pro. Vui lòng nâng cấp tài khoản!'
    );
    err.statusCode = 403;
    throw err;
  }
};

const enforcePublishQuota = async (user) => {
  await checkAndExpireUserMembership(user);
  const effectiveTier = getEffectiveTier(user);
  if (effectiveTier === 'FREE') {
    const err = new Error(
      'Tính năng Thiết kế 3D & Đăng bán lên sàn chỉ dành cho hội viên Premium và Pro. Vui lòng nâng cấp tài khoản!'
    );
    err.statusCode = 403;
    throw err;
  }
  if (effectiveTier === 'PREMIUM') {
    const { weeklyPublishedUsed } = await getWeeklyUsage(user._id);
    if (weeklyPublishedUsed >= 3) {
      const err = new Error(
        `Gói Premium giới hạn đăng tối đa 3 sản phẩm mỗi tuần (Bạn đã dùng ${weeklyPublishedUsed}/3). Hãy nâng cấp lên gói PRO để đăng bán không giới hạn!`
      );
      err.statusCode = 403;
      throw err;
    }
  }
};

module.exports = {
  getEffectiveTier,
  getDaysRemaining,
  checkAndExpireUserMembership,
  getWeeklyUsage,
  enrichUserResponse,
  enforceAiQuota,
  enforceStudioAccess,
  enforcePublishQuota,
};
