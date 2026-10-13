const fs = require('fs');
const file = 'BE/src/controllers/designer.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Replace getMarketplace implementation
content = content.replace(
/exports\.getMarketplace = async \(req, res, next\) => {[\s\S]*?    res\.json\({ success: true, data: { designs, pagination: { page, limit, total, totalPages: Math\.ceil\(total \/ limit\) } } }\);\s*\} catch \(error\) { next\(error\); }\s*};/m,
`exports.getMarketplace = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 16));
    const match = { status: 'PUBLISHED' };
    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      if (search) {
        const creators = await require('../models/DesignerProfile').find({ $or: [{ username: { $regex: search, $options: 'i' } }, { displayName: { $regex: search, $options: 'i' } }] }).select('_id').lean();
        match.$or = [{ name: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }, { designerId: { $in: creators.map((creator) => creator._id) } }];
      }
    }
    if (req.query.category) match.category = String(req.query.category).slice(0, 80);
    if (req.query.color) match['color.name'] = String(req.query.color).slice(0, 80);
    if (req.query.size) match.size = String(req.query.size).slice(0, 20);
    if (req.query.collection && require('mongoose').Types.ObjectId.isValid(req.query.collection)) match.collectionId = new require('mongoose').Types.ObjectId(req.query.collection);
    if (req.query.designer) {
      const designerParam = String(req.query.designer).toLowerCase();
      let profile;
      if (require('mongoose').Types.ObjectId.isValid(designerParam)) {
        profile = await require('../models/DesignerProfile').findOne({ $or: [{ userId: designerParam }, { username: designerParam }] }).select('_id');
      } else {
        profile = await require('../models/DesignerProfile').findOne({ username: designerParam }).select('_id');
      }
      
      if (!profile) return res.json({ success: true, data: { designs: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
      match.designerId = profile._id;
    }
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      const price = {};
      if (req.query.minPrice !== undefined && Number.isFinite(Number(req.query.minPrice))) price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice !== undefined && Number.isFinite(Number(req.query.maxPrice))) price.$lte = Number(req.query.maxPrice);
      if (Object.keys(price).length) match.price = price;
    }

    const sortOptions = { Newest: { createdAt: -1 }, Popular: { likesCount: -1, createdAt: -1 }, 'Best Selling': { salesCount: -1, createdAt: -1 }, 'Price Low → High': { price: 1, createdAt: -1 }, 'Price High → Low': { price: -1, createdAt: -1 } };
    const sort = sortOptions[req.query.sort] || { createdAt: -1 };

    // Get active products to filter
    const activeProducts = await require('../models/Product').find({ isActive: true }).distinct('_id');
    match.productId = { $in: activeProducts };

    const MarketplaceDesign = require('../models/MarketplaceDesign');
    const [designs, total] = await Promise.all([
      MarketplaceDesign.find(match)
        .select('-frontDesign -backDesign')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('designerId', 'username displayName avatar coverImage')
        .populate('productId', 'name imageUrl price discountPrice isActive')
        .lean(),
      MarketplaceDesign.countDocuments(match)
    ]);

    if (req.user && designs.length) {
      const DesignerLike = require('../models/DesignerLike');
      const liked = new Set((await DesignerLike.find({ userId: req.user._id, designId: { $in: designs.map((item) => item._id) } }).distinct('designId')).map(String));
      designs.forEach((item) => { item.isLiked = liked.has(String(item._id)); });
    } else designs.forEach((item) => { item.isLiked = false; });

    res.json({ success: true, data: { designs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};`
);

fs.writeFileSync(file, content);
