const Product = require('../models/Product');

const getStylistProducts = async ({ style, gender, season, budget, keyPieces, limit = 6 } = {}) => {
  const normalizedBudget = budget ? Number(budget) : null;
  const query = {
    isActive: true,
    category: { $in: ['SHIRT', 'PANTS', 'SHOES', 'ACCESSORY'] },
    ...(normalizedBudget ? { price: { $lte: normalizedBudget } } : {}),
    stock: { $gt: 0 },
  };

  const styleKeywordsMap = {
    'Streetwear': ['oversize', 'baggy', 'hoodie', 'street', 'chunky', 'rộng', 'box', 'skate', 'cargo', 'jacket', 'thun', 'phông'],
    'Minimalist': ['basic', 'trơn', 'suông', 'tối giản', 'minimal', 'polo', 'classic', 'sơ mi'],
    'Smart Casual': ['sơ mi', 'chinos', 'polo', 'tây', 'blazer', 'lịch sự', 'nhã nhặn', 'âu'],
    'Vintage': ['denim', 'jeans', 'corduroy', 'nhung', 'retro', 'cổ điển', 'wash', 'khoác'],
    'Sporty': ['thể thao', 'jogger', 'dry', 'cool', 'năng động', 'thoáng', 'gym', 'nỉ'],
    'Korean Casual': ['cardigan', 'ống rộng', 'len', 'hàn', 'korean', 'rũ', 'mỏng'],
    'Y2K': ['croptop', 'baby tee', 'cạp trễ', 'y2k', 'ống loe', 'ngắn'],
    'Elegant': ['lụa', 'blouse', 'midi', 'thanh lịch', 'sang trọng', 'đầm', 'váy', 'tây'],
    'Workwear': ['utility', 'cargo', 'bụi', 'boots', 'túi hộp', 'khoác', 'kaki', 'jean']
  };

  const rawKeywords = [
    ...(styleKeywordsMap[style] || []),
    style,
    gender,
    season,
    ...(Array.isArray(keyPieces) ? keyPieces.flatMap(p => p.split(/\s+/)) : [])
  ];

  // Filter out overly generic words like 'áo', 'quần', 'giày' which ruin the matching if used alone
  const ignoreWords = ['áo', 'quần', 'giày', 'dép', 'phụ', 'kiện', 'màu', 'đen', 'trắng', 'của', 'và', 'hoặc', 'có', 'thể', 'cơ', 'bản'];
  const searchTerms = [...new Set(rawKeywords
    .filter(Boolean)
    .map(k => String(k).trim().toLowerCase())
    .filter(k => k.length > 2 && !ignoreWords.includes(k))
  )];

  if (searchTerms.length > 0) {
    query.$or = [
      { name: { $regex: searchTerms.join('|'), $options: 'i' } },
      { description: { $regex: searchTerms.join('|'), $options: 'i' } },
      { category: { $regex: searchTerms.join('|'), $options: 'i' } }
    ];
  }

  // Fetch more items than limit to diversify categories
  let rawProducts = await Product.find(query).sort({ price: 1 }).limit(Number(limit) * 3).lean();
  
  // Try to pick unique categories to form a complete outfit (Shirt, Pants, Shoes)
  const selectedProducts = [];
  const seenCategories = new Set();
  
  // Pass 1: 1 item per category
  for (const product of rawProducts) {
    if (!seenCategories.has(product.category) && selectedProducts.length < limit) {
      selectedProducts.push(product);
      seenCategories.add(product.category);
    }
  }
  // Pass 2: fill the rest if we still need more to meet limit
  for (const product of rawProducts) {
    if (selectedProducts.length < limit && !selectedProducts.find(p => p._id.toString() === product._id.toString())) {
      selectedProducts.push(product);
    }
  }

  let products = selectedProducts;

  // Fallback if we still don't have enough products
  if (products.length < Number(limit)) {
    const excludeIds = products.map((product) => product._id);
    const fallbackQuery = {
      isActive: true,
      stock: { $gt: 0 },
      ...(normalizedBudget ? { price: { $lte: normalizedBudget } } : {}),
      ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
    };

    // Sort by createdAt instead of category/price to randomize slightly if we just fetch fallback
    const fallbackProducts = await Product.find(fallbackQuery)
      .sort({ createdAt: -1 })
      .limit(Number(limit) - products.length)
      .lean();

    products = [...products, ...fallbackProducts];
  }

  return products;
};

module.exports = { getStylistProducts };
