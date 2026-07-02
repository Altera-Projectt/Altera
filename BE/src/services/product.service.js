const Product = require('../models/Product');

const getStylistProducts = async ({ style, gender, season, budget, limit = 6 } = {}) => {
  const normalizedBudget = budget ? Number(budget) : null;
  const query = {
    isActive: true,
    category: { $in: ['SHIRT', 'PANTS', 'SHOES', 'ACCESSORY'] },
    ...(normalizedBudget ? { price: { $lte: normalizedBudget } } : {}),
    stock: { $gt: 0 },
  };

  const keywords = [style, gender, season].filter(Boolean).join(' ');
  if (keywords.trim()) {
    query.$or = [
      { name: { $regex: keywords.trim().split(/\s+/).join('|'), $options: 'i' } },
      { description: { $regex: keywords.trim().split(/\s+/).join('|'), $options: 'i' } },
    ];
  }

  let products = await Product.find(query).sort({ price: 1 }).limit(Number(limit)).lean();

  if (products.length < Number(limit)) {
    const excludeIds = products.map((product) => product._id);
    const fallbackQuery = {
      isActive: true,
      stock: { $gt: 0 },
      ...(normalizedBudget ? { price: { $lte: normalizedBudget } } : {}),
      ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
    };

    const fallbackProducts = await Product.find(fallbackQuery)
      .sort({ category: 1, price: 1 })
      .limit(Number(limit) - products.length)
      .lean();

    products = [...products, ...fallbackProducts];
  }

  return products;
};

module.exports = { getStylistProducts };
