require('dotenv').config({ path: require('path').resolve(__dirname, '../../Altera.env') });
const mongoose = require('mongoose');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const DesignerLike = require('../models/DesignerLike');
const Order = require('../models/Order');
const { MONGODB_URI } = require('../config/env');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB. Syncing counts...');
  
  const designs = await MarketplaceDesign.find({}).select('_id');
  let i = 0;
  for (const d of designs) {
    const likesCount = await DesignerLike.countDocuments({ designId: d._id });
    const sales = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      { $match: { 'items.marketplaceDesignId': d._id } },
      { $group: { _id: null, count: { $sum: '$items.quantity' } } }
    ]);
    const salesCount = sales[0]?.count || 0;
    
    await MarketplaceDesign.updateOne({ _id: d._id }, { $set: { likesCount, salesCount } });
    i++;
    if (i % 10 === 0) console.log(`Synced ${i}/${designs.length}`);
  }
  
  console.log('Done.');
  process.exit(0);
}
run();
