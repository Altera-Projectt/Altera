const fs = require('fs');
const file = 'BE/src/controllers/designer.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Fix getMarketplace
content = content.replace(
/    const pipeline = \[([\s\S]*?)    \];/m,
`    const pipeline = [
      { $match: match },
      { $project: { productId: 1, createdAt: 1, likesCount: 1, salesCount: 1, price: 1 } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: '_baseProduct' } },
      { $match: { '_baseProduct.isActive': true } },
      ...pageStages,
      { $lookup: { from: 'marketplacedesigns', localField: '_id', foreignField: '_id', as: 'fullDesign' } },
      { $unwind: '$fullDesign' },
      { $replaceRoot: { newRoot: '$fullDesign' } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: '_baseProduct' } },
      { $lookup: { from: 'designerprofiles', localField: 'designerId', foreignField: '_id', as: 'designerId' } },
      { $unwind: '$designerId' },
      { $unwind: '$_baseProduct' },
      { $addFields: { productId: '$_baseProduct' } },
      { $project: { _likes: 0, _sales: 0, _baseProduct: 0, 'designerId.userId': 0, 'designerId.__v': 0, 'productId.__v': 0, frontDesign: 0, backDesign: 0 } },
    ];`
);

fs.writeFileSync(file, content);
