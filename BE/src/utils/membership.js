const User = require('../models/User');
const Design = require('../models/Design');
const MarketplaceDesign = require('../models/MarketplaceDesign');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const MEMBERSHIP_LIMITS = {
  FREE: { ai: 15, publish: 5, price: 0 },
  PREMIUM: { ai: 50, publish: 15, price: 18000 },
  PRO: { ai: 100, publish: 20, price: 36000 },
};

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

const getMonthlyUsage = async (userId) => {
  if (!userId) return { monthlyAiUsed: 0, monthlyPublishedUsed: 0 };
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const [monthlyAiUsed, monthlyPublishedUsed] = await Promise.all([
    Design.countDocuments({
      userId,
      prompt: { $nin: [null, ''] },
      createdAt: { $gte: thirtyDaysAgo },
    }),
    MarketplaceDesign.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
  ]);
  return { monthlyAiUsed, monthlyPublishedUsed };
};

const enrichUserResponse = async (userDoc) => {
  if (!userDoc) return null;
  await checkAndExpireUserMembership(userDoc);
  const obj = typeof userDoc.toJSON === 'function' ? userDoc.toJSON() : { ...userDoc };
  delete obj.password;
  delete obj.__v;
  obj.effectiveTier = getEffectiveTier(obj);
  obj.daysRemaining = getDaysRemaining(obj);
  const userId = obj._id || obj.id;
  const [{ weeklyAiUsed, weeklyPublishedUsed }, { monthlyAiUsed, monthlyPublishedUsed }] = await Promise.all([
    getWeeklyUsage(userId),
    getMonthlyUsage(userId),
  ]);
  obj.monthlyAiUsed = monthlyAiUsed;
  obj.monthlyPublishedUsed = monthlyPublishedUsed;
  obj.monthlyUsage = {
    aiGenerationsUsed: monthlyAiUsed,
    publishedProductsUsed: monthlyPublishedUsed,
  };
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
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  if (isAdmin) return;

  const effectiveTier = getEffectiveTier(user);
  const limit = MEMBERSHIP_LIMITS[effectiveTier]?.ai ?? MEMBERSHIP_LIMITS.FREE.ai;
  const { monthlyAiUsed } = await getMonthlyUsage(user._id);

  if (monthlyAiUsed >= limit) {
    const err = new Error(
      effectiveTier === 'FREE'
        ? `Tài khoản Miễn phí giới hạn tối đa ${limit} lượt tạo ảnh AI mỗi tháng (Đã dùng ${monthlyAiUsed}/${limit}). Vui lòng nâng cấp gói Premium (18k/Tháng) hoặc Pro (36k/Tháng) để tiếp tục sáng tạo!`
        : effectiveTier === 'PREMIUM'
        ? `Gói Premium giới hạn tối đa ${limit} lượt tạo ảnh AI mỗi tháng (Đã dùng ${monthlyAiUsed}/${limit}). Vui lòng nâng cấp lên gói Pro (36k/Tháng) để mở rộng lên 100 lượt/tháng!`
        : `Bạn đã dùng hết ${monthlyAiUsed}/${limit} lượt tạo ảnh AI của gói Pro trong tháng này.`
    );
    err.statusCode = 403;
    throw err;
  }
};

const enforceStudioAccess = async (user) => {
  await checkAndExpireUserMembership(user);
};

const enforcePublishQuota = async (user) => {
  await checkAndExpireUserMembership(user);
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  if (isAdmin) return;

  const effectiveTier = getEffectiveTier(user);
  const limit = MEMBERSHIP_LIMITS[effectiveTier]?.publish ?? MEMBERSHIP_LIMITS.FREE.publish;
  const { monthlyPublishedUsed } = await getMonthlyUsage(user._id);

  if (monthlyPublishedUsed >= limit) {
    const err = new Error(
      effectiveTier === 'FREE'
        ? `Gói Miễn phí giới hạn đăng bán tối đa ${limit} sản phẩm mỗi tháng (Đã dùng ${monthlyPublishedUsed}/${limit}). Vui lòng nâng cấp gói Premium (18k/Tháng) hoặc Pro (36k/Tháng) để đăng bán thêm!`
        : effectiveTier === 'PREMIUM'
        ? `Gói Premium giới hạn đăng bán tối đa ${limit} sản phẩm mỗi tháng (Đã dùng ${monthlyPublishedUsed}/${limit}). Hãy nâng cấp lên gói PRO (36k/Tháng) để mở rộng hạn mức!`
        : `Gói Pro đã dùng hết ${monthlyPublishedUsed}/${limit} lượt đăng bán trong tháng này.`
    );
    err.statusCode = 403;
    throw err;
  }
};

module.exports = {
  MEMBERSHIP_LIMITS,
  getEffectiveTier,
  getDaysRemaining,
  checkAndExpireUserMembership,
  getWeeklyUsage,
  getMonthlyUsage,
  enrichUserResponse,
  enforceAiQuota,
  enforceStudioAccess,
  enforcePublishQuota,
};
