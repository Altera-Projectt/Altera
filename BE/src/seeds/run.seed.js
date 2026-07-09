const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');
const Product = require('../models/Product');
const products = require('./products.seed');

const runSeed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  console.log('Cleared old products');

  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
