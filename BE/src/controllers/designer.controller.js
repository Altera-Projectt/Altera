const mongoose = require('mongoose');
const DesignerProfile = require('../models/DesignerProfile');
const DesignerCollection = require('../models/DesignerCollection');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const DesignerFollow = require('../models/DesignerFollow');
const DesignerLike = require('../models/DesignerLike');
const CustomDesignDraft = require('../models/CustomDesignDraft');
const Order = require('../models/Order');
const User = require('../models/User');
const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fail = (status, message) => Object.assign(new Error(message), { statusCode: status });
const profileForUser = async (userId) => {
  let profile = await DesignerProfile.findOne({ userId });
  if (!profile) {
    const user = await User.findById(userId).select('fullName avatar');
    profile = await DesignerProfile.create({ userId, username: `designer-${String(userId).slice(-8)}`, displayName: user?.fullName || 'Designer', avatar: user?.avatar || null });
  }
  return profile;
};
const ownedProfile = (userId) => DesignerProfile.findOne({ userId });

exports.getSummary = async (req, res, next) => {
  try {
    const profile = await profileForUser(req.user._id);
    const [totalDesigns, publishedDesigns, revenue] = await Promise.all([
      MarketplaceDesign.countDocuments({ designerId: profile._id }),
      MarketplaceDesign.countDocuments({ designerId: profile._id, status: 'PUBLISHED' }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } }, { $unwind: '$items' }, { $match: { 'items.designerId': profile._id } },
        { $group: { _id: null, grossSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, totalSales: { $sum: '$items.quantity' }, orderIds: { $addToSet: '$_id' } } },
        { $project: { _id: 0, grossSales: 1, totalSales: 1, totalOrders: { $size: '$orderIds' } } },
      ]),
    ]);
    const grossSales = revenue[0]?.grossSales || 0;
    const configuredRate = process.env.DESIGNER_COMMISSION_RATE;
    const parsedRate = configuredRate === undefined || configuredRate.trim() === '' ? null : Number(configuredRate);
    const commissionRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 1 ? parsedRate : null;
    const platformFee = commissionRate === null ? null : Math.round(grossSales * commissionRate);
    res.json({ success: true, data: {
      totalDesigns, publishedDesigns, grossSales, totalSales: revenue[0]?.totalSales || 0,
      paidOrders: revenue[0]?.totalOrders || 0, commissionConfigured: commissionRate !== null,
      commissionRate, platformFee, designerEarnings: platformFee === null ? null : grossSales - platformFee,
    } });
  } catch (error) { next(error); }
};
exports.getMyProfile = async (req, res, next) => {
  try { res.json({ success: true, data: { profile: await profileForUser(req.user._id) } }); }
  catch (error) { next(error); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await DesignerProfile.findOne({ username: req.params.username.toLowerCase() }).populate('userId', 'fullName avatar');
    if (!profile) throw fail(404, 'Designer not found');
    const owner = Boolean(req.user && String(req.user._id) === String(profile.userId._id));
    const match = { designerId: profile._id, status: 'PUBLISHED' };
    if (owner && ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'].includes(req.query.status)) match.status = req.query.status;
    if (req.query.search) match.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { tags: { $regex: req.query.search, $options: 'i' } }, { category: { $regex: req.query.search, $options: 'i' } }];
    if (req.query.category) match.category = req.query.category;
    if (req.query.collection && mongoose.Types.ObjectId.isValid(req.query.collection)) match.collectionId = new mongoose.Types.ObjectId(req.query.collection);
    if (req.query.minPrice || req.query.maxPrice) match.price = { ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}), ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}) };
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(40, Math.max(1, Number(req.query.limit) || 16));
    const sort = { Newest: { createdAt: -1 }, Popular: { likesCount: -1, createdAt: -1 }, 'Best Selling': { salesCount: -1, createdAt: -1 }, 'Price Low → High': { price: 1 }, 'Price High → Low': { price: -1 } }[req.query.sort] || { createdAt: -1 };
    const pipeline = [
      { $match: match },
      { $lookup: { from: 'designerlikes', localField: '_id', foreignField: 'designId', as: '_likes' } },
      { $addFields: { likesCount: { $size: '$_likes' } } },
      { $lookup: { from: 'orders', let: { designId: '$_id' }, pipeline: [ { $match: { paymentStatus: 'PAID' } }, { $unwind: '$items' }, { $match: { $expr: { $eq: ['$items.marketplaceDesignId', '$$designId'] } } }, { $group: { _id: null, count: { $sum: '$items.quantity' } } } ], as: '_sales' } },
      { $addFields: { salesCount: { $ifNull: [{ $arrayElemAt: ['$_sales.count', 0] }, 0] } } },
      { $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _likes: 0, _sales: 0 } },
    ];
    const [designs, total, collections, followersCount, followingCount, isFollowing] = await Promise.all([
      MarketplaceDesign.aggregate(pipeline), MarketplaceDesign.countDocuments(match), DesignerCollection.find({ designerId: profile._id }).sort({ name: 1 }).lean(),
      DesignerFollow.countDocuments({ designerId: profile._id }), DesignerFollow.countDocuments({ followerId: profile.userId._id }),
      req.user ? DesignerFollow.exists({ followerId: req.user._id, designerId: profile._id }) : null,
    ]);
    const ids = designs.map((design) => design._id);
    const likedIds = req.user ? await DesignerLike.find({ userId: req.user._id, designId: { $in: ids } }).distinct('designId') : [];
    const liked = new Set(likedIds.map(String));
    res.json({ success: true, data: { profile, designs: designs.map((design) => ({ ...design, isLiked: liked.has(String(design._id)) })), collections, followersCount, followingCount, isFollowing: Boolean(isFollowing), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, owner } });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await profileForUser(req.user._id);
    for (const key of ['displayName', 'bio', 'avatar', 'coverImage']) if (req.body[key] !== undefined) profile[key] = req.body[key];
    if (req.body.username !== undefined) { const username = slugify(String(req.body.username)); if (!username || username.length > 40) throw fail(400, 'Username must contain 1 to 40 letters, numbers, or hyphens'); profile.username = username; }
    await profile.save(); res.json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

exports.createCollection = async (req, res, next) => {
  try { const profile = await profileForUser(req.user._id), name = String(req.body.name || '').trim(); if (!name) throw fail(400, 'Collection name is required'); const collection = await DesignerCollection.create({ designerId: profile._id, name, slug: slugify(name) }); res.status(201).json({ success: true, data: { collection } }); }
  catch (error) { next(error); }
};
exports.updateCollection = async (req, res, next) => {
  try { const profile = await profileForUser(req.user._id), name = String(req.body.name || '').trim(); if (!name) throw fail(400, 'Collection name is required'); const collection = await DesignerCollection.findOne({ _id: req.params.id, designerId: profile._id }); if (!collection) throw fail(404, 'Collection not found'); collection.name = name; collection.slug = slugify(name); await collection.save(); res.json({ success: true, data: { collection } }); }
  catch (error) { next(error); }
};
exports.deleteCollection = async (req, res, next) => {
  try { const profile = await profileForUser(req.user._id), collection = await DesignerCollection.findOneAndDelete({ _id: req.params.id, designerId: profile._id }); if (!collection) throw fail(404, 'Collection not found'); await MarketplaceDesign.updateMany({ collectionId: collection._id }, { $unset: { collectionId: 1 } }); res.json({ success: true }); }
  catch (error) { next(error); }
};

exports.createDesign = async (req, res, next) => {
  try {
    const profile = await profileForUser(req.user._id), draft = await CustomDesignDraft.findOne({ _id: req.body.draftId, userId: req.user._id });
    if (!draft) throw fail(404, 'Owned design draft not found');
    const name = String(req.body.name || '').trim(), price = Number(req.body.price), hasFront = Boolean(draft.frontDesign?.layers?.length), hasBack = Boolean(draft.backDesign?.layers?.length);
    const hasRequiredLayers = draft.printSide === 'BACK' ? hasBack : draft.printSide === 'BOTH' ? hasFront && hasBack : hasFront;
    if (!name || !draft.productId || !draft.color || !draft.size || !hasRequiredLayers || !draft.thumbnail || !Number.isFinite(price) || price <= 0) throw fail(400, 'Design name, product, color, size, design layer, preview, and valid price are required');
    if (req.body.collectionId && !await DesignerCollection.exists({ _id: req.body.collectionId, designerId: profile._id })) throw fail(400, 'Collection does not belong to this designer');
    const design = await MarketplaceDesign.create({ designerId: profile._id, userId: req.user._id, draftId: draft._id, name, slug: `${slugify(name) || 'design'}-${Date.now().toString(36)}`, description: req.body.description || '', thumbnail: draft.thumbnail, productId: draft.productId, color: draft.color, size: draft.size, printSide: draft.printSide, printingTechnique: draft.printingTechnique, frontDesign: draft.frontDesign, backDesign: draft.backDesign, price, category: req.body.category || '', tags: Array.isArray(req.body.tags) ? req.body.tags.slice(0, 20) : [], collectionId: req.body.collectionId || null, status: 'PENDING_REVIEW' });
    res.status(201).json({ success: true, data: { design } });
  } catch (error) { next(error); }
};
exports.updateDesign = async (req, res, next) => {
  try {
    const profile = await ownedProfile(req.user._id), design = await MarketplaceDesign.findOne({ _id: req.params.id, designerId: profile?._id });
    if (!design) throw fail(404, 'Design not found');
    if (design.status === 'PUBLISHED') throw fail(409, 'Duplicate a published design to make a new version');
    for (const key of ['name', 'description', 'category']) if (req.body[key] !== undefined) design[key] = req.body[key];
    if (req.body.price !== undefined) { const price = Number(req.body.price); if (!Number.isFinite(price) || price <= 0) throw fail(400, 'Price must be greater than zero'); design.price = price; }
    if (req.body.tags !== undefined) design.tags = Array.isArray(req.body.tags) ? req.body.tags.slice(0, 20) : [];
    if (req.body.collectionId !== undefined) { if (req.body.collectionId && !await DesignerCollection.exists({ _id: req.body.collectionId, designerId: profile._id })) throw fail(400, 'Collection does not belong to this designer'); design.collectionId = req.body.collectionId || null; }
    if (design.status === 'REJECTED' || design.status === 'DRAFT') design.status = 'PENDING_REVIEW';
    await design.save(); res.json({ success: true, data: { design } });
  } catch (error) { next(error); }
};
exports.duplicateDesign = async (req, res, next) => {
  try { const profile = await ownedProfile(req.user._id), source = await MarketplaceDesign.findOne({ _id: req.params.id, designerId: profile?._id }); if (!source) throw fail(404, 'Design not found'); const copy = source.toObject(); delete copy._id; delete copy.createdAt; delete copy.updatedAt; copy.name = `${source.name} copy`; copy.slug = `${slugify(copy.name)}-${Date.now().toString(36)}`; copy.status = 'DRAFT'; copy.rejectionReason = ''; const design = await MarketplaceDesign.create(copy); res.status(201).json({ success: true, data: { design } }); }
  catch (error) { next(error); }
};
exports.deleteDesign = async (req, res, next) => {
  try { const profile = await ownedProfile(req.user._id), design = await MarketplaceDesign.findOne({ _id: req.params.id, designerId: profile?._id }); if (!design) throw fail(404, 'Design not found'); const hasOrders = await Order.exists({ 'items.marketplaceDesignId': design._id }); if (hasOrders) { design.status = 'ARCHIVED'; await design.save(); return res.json({ success: true, data: { archived: true } }); } await Promise.all([DesignerLike.deleteMany({ designId: design._id }), design.deleteOne()]); res.json({ success: true, data: { archived: false } }); }
  catch (error) { next(error); }
};
exports.likeDesign = async (req, res, next) => {
  try { const design = await MarketplaceDesign.findOne({ _id: req.params.id, status: 'PUBLISHED' }); if (!design) throw fail(404, 'Design not found'); await DesignerLike.updateOne({ userId: req.user._id, designId: design._id }, { $setOnInsert: { userId: req.user._id, designId: design._id } }, { upsert: true }); res.json({ success: true, data: { likesCount: await DesignerLike.countDocuments({ designId: design._id }) } }); }
  catch (error) { next(error); }
};
exports.unlikeDesign = async (req, res, next) => {
  try { await DesignerLike.deleteOne({ userId: req.user._id, designId: req.params.id }); res.json({ success: true }); }
  catch (error) { next(error); }
};
exports.follow = async (req, res, next) => {
  try { const profile = await DesignerProfile.findById(req.params.id); if (!profile) throw fail(404, 'Designer not found'); if (String(profile.userId) === String(req.user._id)) throw fail(400, 'You cannot follow yourself'); await DesignerFollow.updateOne({ followerId: req.user._id, designerId: profile._id }, { $setOnInsert: { followerId: req.user._id, designerId: profile._id } }, { upsert: true }); res.json({ success: true }); }
  catch (error) { next(error); }
};
exports.unfollow = async (req, res, next) => { try { await DesignerFollow.deleteOne({ followerId: req.user._id, designerId: req.params.id }); res.json({ success: true }); } catch (error) { next(error); } };
exports.getDesign = async (req, res, next) => {
  try { const design = await MarketplaceDesign.findOne({ slug: req.params.slug, status: 'PUBLISHED' }).populate('designerId', 'username displayName avatar').populate('productId', 'name imageUrl price sizes colors printingTechniques'); if (!design) throw fail(404, 'Design not found'); const [likes, sales, isLiked] = await Promise.all([DesignerLike.countDocuments({ designId: design._id }), Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $unwind: '$items' }, { $match: { 'items.marketplaceDesignId': design._id } }, { $group: { _id: null, count: { $sum: '$items.quantity' } } }]), req.user ? DesignerLike.exists({ userId: req.user._id, designId: design._id }) : null]); res.json({ success: true, data: { design: design.toObject(), likesCount: likes, salesCount: sales[0]?.count || 0, isLiked: Boolean(isLiked) } }); }
  catch (error) { next(error); }
};
exports.moderate = async (req, res, next) => { try { const status = req.body.status; if (!['PUBLISHED', 'REJECTED', 'ARCHIVED'].includes(status)) throw fail(400, 'Invalid moderation status'); const design = await MarketplaceDesign.findByIdAndUpdate(req.params.id, { status, rejectionReason: status === 'REJECTED' ? String(req.body.rejectionReason || '').slice(0, 1000) : '' }, { new: true }); if (!design) throw fail(404, 'Design not found'); res.json({ success: true, data: { design } }); } catch (error) { next(error); } };

