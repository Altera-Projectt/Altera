const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const DesignerProfile = require('../models/DesignerProfile');

const pagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildRevenueChart = (paymentsByDay, days, now = new Date()) => {
  const byDate = new Map(
    paymentsByDay.map((item) => [
      item._id,
      {
        revenue: Number(item.revenue || 0),
        apparelRevenue: Number(item.apparelRevenue || 0),
        membershipRevenue: Number(item.membershipRevenue || 0),
        transactions: Number(item.transactions || 0),
      },
    ])
  );

  if (days > 30) {
    const monthMap = new Map();
    for (let offset = 2; offset >= 0; offset -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      const ym = d.toISOString().slice(0, 7);
      const mm = ym.slice(5, 7);
      const yyyy = ym.slice(0, 4);
      monthMap.set(ym, {
        _id: ym,
        label: `Tháng ${mm}/${yyyy}`,
        revenue: 0,
        apparelRevenue: 0,
        membershipRevenue: 0,
        transactions: 0,
      });
    }
    for (const [dateStr, values] of byDate.entries()) {
      const ym = String(dateStr).slice(0, 7);
      if (!monthMap.has(ym)) {
        const mm = ym.slice(5, 7);
        const yyyy = ym.slice(0, 4);
        monthMap.set(ym, {
          _id: ym,
          label: `Tháng ${mm}/${yyyy}`,
          revenue: 0,
          apparelRevenue: 0,
          membershipRevenue: 0,
          transactions: 0,
        });
      }
      const bucket = monthMap.get(ym);
      bucket.revenue += values.revenue;
      bucket.apparelRevenue += values.apparelRevenue;
      bucket.membershipRevenue += values.membershipRevenue;
      bucket.transactions += values.transactions;
    }
    return [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, item]) => item);
  }

  const daily = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const dateKey = d.toISOString().slice(0, 10);
    const [, mm, dd] = dateKey.split('-');
    const found = byDate.get(dateKey);
    daily.push({
      _id: dateKey,
      label: `${dd}/${mm}`,
      revenue: found ? found.revenue : 0,
      apparelRevenue: found ? found.apparelRevenue : 0,
      membershipRevenue: found ? found.membershipRevenue : 0,
      transactions: found ? found.transactions : 0,
    });
  }
  return daily;
};

exports.dashboard = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 30, 1), 90);
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
    const [totalCustomers, totalUsers, activeUsers, designerProfiles, designs, pendingDesigns, approvedDesigns,
      totalOrders, pendingOrders, activeProducts, paidPayments, membershipPayments, pendingPayments, failedPayments,
      recentOrders, recentDesigns, paymentsByDay] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      DesignerProfile.countDocuments(),
      MarketplaceDesign.countDocuments(),
      MarketplaceDesign.countDocuments({ status: 'PENDING_REVIEW' }),
      MarketplaceDesign.countDocuments({ status: 'PUBLISHED' }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'SHIPPING'] } }),
      Product.countDocuments({ isActive: true }),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, orderId: { $ne: null }, $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] } },
        { $group: { _id: '$orderId', amount: { $max: '$amount' }, paidAt: { $max: { $ifNull: ['$paidAt', '$createdAt'] } } } },
      ]),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, $or: [{ membershipOrderId: { $ne: null } }, { membershipPlanId: { $ne: null } }], $and: [{ $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] }] } },
        { $group: { _id: { $ifNull: ['$membershipOrderId', '$_id'] }, amount: { $max: '$amount' } } },
      ]),
      Payment.countDocuments({ paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }),
      Payment.countDocuments({ paymentStatus: 'FAILED' }),
      Order.find().select('_id createdAt totalPrice status paymentStatus userId').populate('userId', 'fullName email').sort({ createdAt: -1 }).limit(6).lean(),
      MarketplaceDesign.find({ status: 'PENDING_REVIEW' }).select('_id name thumbnail thumbnailUrl category price status createdAt designerId').populate('designerId', 'displayName username').sort({ createdAt: 1 }).limit(6).lean(),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, $or: [{ orderId: { $ne: null } }, { membershipOrderId: { $ne: null } }, { membershipPlanId: { $ne: null } }], $and: [{ $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] }] } },
        { $group: { _id: { type: { $cond: [{ $ne: ['$orderId', null] }, 'ORDER', 'MEMBERSHIP'] }, entityId: { $ifNull: ['$orderId', { $ifNull: ['$membershipOrderId', '$_id'] }] } }, amount: { $max: '$amount' }, paidAt: { $max: { $ifNull: ['$paidAt', '$createdAt'] } } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            revenue: { $sum: '$amount' },
            apparelRevenue: { $sum: { $cond: [{ $eq: ['$_id.type', 'ORDER'] }, '$amount', 0] } },
            membershipRevenue: { $sum: { $cond: [{ $eq: ['$_id.type', 'MEMBERSHIP'] }, '$amount', 0] } },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const apparelRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const membershipRevenue = membershipPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenue = apparelRevenue + membershipRevenue;
    const revenueChart = buildRevenueChart(paymentsByDay, days, now);

    const configuredRate = process.env.DESIGNER_COMMISSION_RATE;
    const parsedRate = configuredRate === undefined || configuredRate.trim() === '' ? null : Number(configuredRate);
    const commissionRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 1 ? parsedRate : 0.05;

    const paidOrderIdsInRange = paidPayments.map((p) => p._id).filter(Boolean);
    const [orderSellerStatsInRange, orderSellerStatsAllTime, allDesignerProfiles, allMarketplaceDesigns] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            $or: [
              { _id: { $in: paidOrderIdsInRange } },
              { paymentStatus: 'PAID', createdAt: { $gte: since } },
            ],
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.designerId': { $ne: null } } },
        {
          $group: {
            _id: '$items.designerId',
            grossSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            itemsSold: { $sum: '$items.quantity' },
            orderIds: { $addToSet: '$_id' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $match: { 'items.designerId': { $ne: null } } },
        {
          $group: {
            _id: '$items.designerId',
            grossSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            itemsSold: { $sum: '$items.quantity' },
            orderIds: { $addToSet: '$_id' },
          },
        },
      ]),
      DesignerProfile.find()
        .populate('userId', 'fullName email avatar membershipTier isLifetimeMembership')
        .lean(),
      MarketplaceDesign.find()
        .select('_id designerId name thumbnail thumbnailUrl category price status salesCount likesCount')
        .lean(),
    ]);

    const rangeStatsByDesigner = new Map(
      orderSellerStatsInRange.map((row) => [
        String(row._id),
        {
          grossSales: Number(row.grossSales || 0),
          itemsSold: Number(row.itemsSold || 0),
          ordersCount: Array.isArray(row.orderIds) ? row.orderIds.length : 0,
        },
      ])
    );

    const allTimeStatsByDesigner = new Map(
      orderSellerStatsAllTime.map((row) => [
        String(row._id),
        {
          grossSales: Number(row.grossSales || 0),
          itemsSold: Number(row.itemsSold || 0),
          ordersCount: Array.isArray(row.orderIds) ? row.orderIds.length : 0,
        },
      ])
    );

    const designsByDesigner = new Map();
    for (const d of allMarketplaceDesigns) {
      if (!d.designerId) continue;
      const key = String(d.designerId);
      if (!designsByDesigner.has(key)) {
        designsByDesigner.set(key, []);
      }
      designsByDesigner.get(key).push(d);
    }

    const topSellers = allDesignerProfiles
      .map((profile) => {
        const key = String(profile._id);
        const designerDesigns = designsByDesigner.get(key) || [];
        const publishedList = designerDesigns.filter((d) => d.status === 'PUBLISHED');
        const catalogItemsSold = publishedList.reduce((sum, d) => sum + Number(d.salesCount || 0), 0);
        const catalogGrossSales = publishedList.reduce(
          (sum, d) => sum + Number(d.price || 0) * Number(d.salesCount || 0),
          0
        );
        const totalLikes = publishedList.reduce((sum, d) => sum + Number(d.likesCount || 0), 0);

        const rangeStat = rangeStatsByDesigner.get(key);
        const allTimeStat = allTimeStatsByDesigner.get(key);

        const effectiveItemsSold = Math.max(
          rangeStat?.itemsSold || 0,
          allTimeStat?.itemsSold || 0,
          catalogItemsSold
        );
        const effectiveGrossSales = Math.max(
          rangeStat?.grossSales || 0,
          allTimeStat?.grossSales || 0,
          catalogGrossSales
        );
        const effectiveOrdersCount = Math.max(
          rangeStat?.ordersCount || 0,
          allTimeStat?.ordersCount || 0,
          effectiveItemsSold > 0 ? Math.ceil(effectiveItemsSold / 2) : 0
        );

        const sellerEarnings = Math.round(effectiveGrossSales * commissionRate);
        const platformFee = Math.max(0, effectiveGrossSales - sellerEarnings);

        const sortedDesigns = [...publishedList].sort(
          (a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0)
        );
        const bestDesign = sortedDesigns[0] || designerDesigns[0] || null;

        const userObj = profile.userId && typeof profile.userId === 'object' ? profile.userId : null;

        return {
          designerId: String(profile._id),
          userId: userObj?._id ? String(userObj._id) : null,
          displayName: profile.displayName || userObj?.fullName || 'Nhà thiết kế ALTERA',
          username: profile.username || 'creator',
          email: userObj?.email || '',
          avatar: profile.avatarUrl || userObj?.avatar || '',
          membershipTier: userObj?.isLifetimeMembership
            ? 'PRO'
            : String(userObj?.membershipTier || 'FREE').toUpperCase(),
          totalDesigns: designerDesigns.length,
          publishedDesigns: publishedList.length,
          totalLikes,
          ordersCount: effectiveOrdersCount,
          itemsSold: effectiveItemsSold,
          grossSales: effectiveGrossSales,
          sellerEarnings,
          platformFee,
          commissionRate,
          topDesign: bestDesign
            ? {
                _id: String(bestDesign._id),
                name: bestDesign.name,
                thumbnail: bestDesign.thumbnailUrl || bestDesign.thumbnail || '',
                price: Number(bestDesign.price || 0),
                salesCount: Number(bestDesign.salesCount || 0),
              }
            : null,
        };
      })
      .sort((a, b) => {
        if (b.grossSales !== a.grossSales) return b.grossSales - a.grossSales;
        if (b.itemsSold !== a.itemsSold) return b.itemsSold - a.itemsSold;
        return b.publishedDesigns - a.publishedDesigns;
      })
      .slice(0, 10);

    const rangeMarketplaceGross = orderSellerStatsInRange.reduce(
      (sum, row) => sum + Number(row.grossSales || 0),
      0
    );
    const leaderboardGrossTotal = topSellers.reduce((sum, s) => sum + s.grossSales, 0);
    const marketplaceGrossSales =
      rangeMarketplaceGross > 0
        ? rangeMarketplaceGross
        : Math.min(apparelRevenue > 0 ? apparelRevenue : leaderboardGrossTotal, leaderboardGrossTotal);
    const sellerRoyaltyPayout = Math.round(marketplaceGrossSales * commissionRate);
    const platformCommissionFromMarketplace = Math.max(0, marketplaceGrossSales - sellerRoyaltyPayout);
    const directStudioRevenue = Math.max(0, apparelRevenue - marketplaceGrossSales);
    const netPlatformRevenue = Math.max(0, revenue - sellerRoyaltyPayout);

    const revenueBreakdown = {
      totalGmv: revenue,
      apparelRevenue,
      membershipRevenue,
      marketplaceGrossSales,
      directStudioRevenue,
      commissionRate,
      sellerRoyaltyPayout,
      platformCommissionFromMarketplace,
      netPlatformRevenue,
      leaderboardGrossTotal,
    };

    res.json({ success: true, data: {
      totalCustomers, totalUsers, activeUsers,
      designerProfiles, designs, pendingDesigns, approvedDesigns, totalOrders,
      pendingOrders, activeProducts, paidTransactions: paidPayments.length + membershipPayments.length,
      pendingPayments, failedPayments, revenue, apparelRevenue, membershipRevenue,
      revenueBreakdown, topSellers,
      recentOrders, recentDesigns, revenueByDay: paymentsByDay, revenueChart,
      filters: { days, since: since.toISOString() },
    } });
  } catch (error) { next(error); }
};

exports.listDesigns = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    const statuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
    if (req.query.status && !statuses.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid design status.' });
    if (req.query.status) query.status = req.query.status;
    if (req.query.userId && !validId(req.query.userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const profiles = await DesignerProfile.find({ displayName: { $regex: search, $options: 'i' } }).select('_id');
      const users = await User.find({ fullName: { $regex: search, $options: 'i' } }).select('_id');
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { designerId: { $in: profiles.map((profile) => profile._id) } },
        { userId: { $in: users.map((user) => user._id) } },
      ];
    }
    const [designs, total] = await Promise.all([
      MarketplaceDesign.find(query).populate('designerId', 'displayName username').populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MarketplaceDesign.countDocuments(query),
    ]);
    res.json({ success: true, data: { designs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { getEffectiveTier, getDaysRemaining, checkAndExpireUserMembership } = require('../utils/membership');
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.role && ['USER', 'ADMIN'].includes(req.query.role)) query.role = req.query.role;
    if (req.query.tier && ['FREE', 'PREMIUM', 'PRO'].includes(String(req.query.tier).toUpperCase())) {
      query.membershipTier = String(req.query.tier).toUpperCase();
    }
    if (req.query.status === 'active') query.isActive = { $ne: false };
    if (req.query.status === 'inactive') query.isActive = false;
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }
    const [rawUsers, total] = await Promise.all([
      User.find(query)
        .select('fullName email phone role isActive avatar createdAt membershipTier membershipStartedAt membershipExpiresAt isLifetimeMembership membershipStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const users = await Promise.all(
      rawUsers.map(async (u) => {
        await checkAndExpireUserMembership(u);
        const doc = typeof u.toObject === 'function' ? u.toObject() : { ...u };
        const effectiveTier = getEffectiveTier(doc);
        const daysRemaining = getDaysRemaining(doc);
        return {
          ...doc,
          effectiveTier,
          daysRemaining,
        };
      })
    );

    res.json({ success: true, data: { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.getUser = async (req, res, next) => {
  try {
    const { getEffectiveTier, getDaysRemaining, checkAndExpireUserMembership } = require('../utils/membership');
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await checkAndExpireUserMembership(user);
    const doc = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    doc.effectiveTier = getEffectiveTier(doc);
    doc.daysRemaining = getDaysRemaining(doc);
    res.json({ success: true, data: { user: doc } });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { getEffectiveTier, getDaysRemaining } = require('../utils/membership');
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'ADMIN' && (req.body.role === 'USER' || req.body.isActive === false)) return res.status(403).json({ success: false, message: 'Admin accounts cannot be demoted or deactivated here.' });
    if (String(user._id) === String(req.user._id) && req.body.isActive === false) return res.status(403).json({ success: false, message: 'You cannot deactivate your own account.' });
    if (user.role === 'ADMIN' && req.body.isActive === false && await User.countDocuments({ role: 'ADMIN', isActive: { $ne: false } }) <= 1) return res.status(409).json({ success: false, message: 'The last active admin cannot be deactivated.' });
    const allowed = ['fullName', 'phone', 'isActive'];
    if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    if (req.body.fullName !== undefined && (typeof req.body.fullName !== 'string' || req.body.fullName.trim().length < 1 || req.body.fullName.length > 120)) return res.status(400).json({ success: false, message: 'fullName must be between 1 and 120 characters.' });
    for (const field of allowed) if (req.body[field] !== undefined) user[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];

    // Membership tier manual update by admin
    if (req.body.isLifetimeMembership === true) {
      user.isLifetimeMembership = true;
      user.membershipTier = 'PRO';
      user.membershipExpiresAt = null;
      user.membershipStatus = 'ACTIVE';
    } else if (req.body.isLifetimeMembership === false) {
      user.isLifetimeMembership = false;
    }

    if (req.body.membershipTier && ['FREE', 'PREMIUM', 'PRO'].includes(String(req.body.membershipTier).toUpperCase())) {
      const targetTier = String(req.body.membershipTier).toUpperCase();
      user.membershipTier = targetTier;
      if (targetTier === 'FREE') {
        user.isLifetimeMembership = false;
        user.membershipExpiresAt = null;
        user.membershipStatus = 'ACTIVE';
      } else {
        const days = Number(req.body.durationDays) || 30;
        user.membershipStartedAt = new Date();
        user.membershipExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        user.membershipStatus = 'ACTIVE';
      }
    }

    await user.save();
    const doc = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    doc.effectiveTier = getEffectiveTier(doc);
    doc.daysRemaining = getDaysRemaining(doc);
    res.json({ success: true, data: { user: doc } });
  } catch (error) { next(error); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.search) query.name = { $regex: String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;
    const [products, total] = await Promise.all([Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit), Product.countDocuments(query)]);
    res.json({ success: true, data: { products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};
