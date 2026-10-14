const MarketplaceDesign = require('../models/MarketplaceDesign');

const incrementPaidOrderDesignSales = async (order, session) => {
  const quantitiesByDesign = new Map();
  for (const item of order.items || []) {
    if (!item.marketplaceDesignId) continue;
    const id = String(item.marketplaceDesignId);
    quantitiesByDesign.set(id, (quantitiesByDesign.get(id) || 0) + Number(item.quantity || 0));
  }
  const operations = [...quantitiesByDesign].filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({
    updateOne: { filter: { _id: id }, update: { $inc: { salesCount: quantity } } },
  }));
  if (operations.length) await MarketplaceDesign.bulkWrite(operations, { ordered: false, session });
};

module.exports = { incrementPaidOrderDesignSales };