const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const MarketplaceDesign = require('../src/models/MarketplaceDesign');
const DesignerLike = require('../src/models/DesignerLike');
const DesignerProfile = require('../src/models/DesignerProfile');
const Order = require('../src/models/Order');
const designerController = require('../src/controllers/designer.controller');

test('marketplace feed scopes to published designs, escapes search, and sorts popularity', async () => {
  const originalAggregate = MarketplaceDesign.aggregate;
  const originalCount = MarketplaceDesign.countDocuments;
  const originalCreatorFind = DesignerProfile.find;
  const id = new mongoose.Types.ObjectId();
  let pipeline;
  try {
    MarketplaceDesign.aggregate = async (value) => { if (value.some((stage) => stage.$count)) return [{ total: 1 }]; pipeline = value; return [{ _id: id }]; };
    MarketplaceDesign.countDocuments = async () => 1;
    DesignerProfile.find = () => ({ select: () => ({ lean: async () => [] }) });
    let response;
    await designerController.getMarketplace(
      { query: { search: 'angel.*', sort: 'Popular', page: '2', limit: '12' } },
      { json: (value) => { response = value; } },
      (error) => { throw error; },
    );
    assert.equal(pipeline[0].$match.status, 'PUBLISHED');
    assert.equal(pipeline[0].$match.$or[0].name.$regex, 'angel\\.\\*');
    assert.deepEqual(pipeline.find((stage) => stage.$sort)?.$sort, { likesCount: -1, createdAt: -1 });
    assert.equal(pipeline.find((stage) => stage.$skip)?.$skip, 12);
    assert.equal(response.data.designs[0].isLiked, false);
    assert.equal(response.data.pagination.total, 1);
  } finally {
    MarketplaceDesign.aggregate = originalAggregate;
    MarketplaceDesign.countDocuments = originalCount;
    DesignerProfile.find = originalCreatorFind;
  }
});

test('marketplace feed marks favorites for the authenticated user', async () => {
  const originalAggregate = MarketplaceDesign.aggregate;
  const originalCount = MarketplaceDesign.countDocuments;
  const originalFind = DesignerLike.find;
  const id = new mongoose.Types.ObjectId();
  try {
    MarketplaceDesign.aggregate = async (value) => value.some((stage) => stage.$count) ? [{ total: 1 }] : [{ _id: id }];
    MarketplaceDesign.countDocuments = async () => 1;
    DesignerLike.find = () => ({ distinct: async () => [id] });
    let response;
    await designerController.getMarketplace(
      { query: {}, user: { _id: new mongoose.Types.ObjectId() } },
      { json: (value) => { response = value; } },
      (error) => { throw error; },
    );
    assert.equal(response.data.designs[0].isLiked, true);
  } finally {
    MarketplaceDesign.aggregate = originalAggregate;
    MarketplaceDesign.countDocuments = originalCount;
    DesignerLike.find = originalFind;
  }
});

test('creator orders only return this creator’s paid listing items', async () => {
  const originalProfileFind = DesignerProfile.findOne;
  const originalOrderFind = Order.find;
  const originalOrderCount = Order.countDocuments;
  const profileId = new mongoose.Types.ObjectId();
  const otherProfileId = new mongoose.Types.ObjectId();
  let filter;
  try {
    DesignerProfile.findOne = async () => ({ _id: profileId });
    Order.find = (query) => {
      filter = query;
      return { select: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [{
        _id: new mongoose.Types.ObjectId(), status: 'SHIPPING', createdAt: new Date(),
        items: [
          { designerId: profileId, name: 'Creator Tee', quantity: 2, price: 299000 },
          { designerId: otherProfileId, name: 'Another creator tee', quantity: 1, price: 199000 },
        ],
      }] }) }) }) }) };
    };
    Order.countDocuments = async () => 1;
    let response;
    await designerController.getDesignerOrders(
      { user: { _id: new mongoose.Types.ObjectId() }, query: { page: '1', limit: '6' } },
      { json: (value) => { response = value; } },
      (error) => { throw error; },
    );
    assert.deepEqual(filter, { 'items.designerId': profileId, paymentStatus: 'PAID' });
    assert.equal(response.data.orders[0].items.length, 1);
    assert.equal(response.data.orders[0].items[0].name, 'Creator Tee');
  } finally {
    DesignerProfile.findOne = originalProfileFind;
    Order.find = originalOrderFind;
    Order.countDocuments = originalOrderCount;
  }
});

test('featured creator feed ranks profiles with published work by sales then followers', async () => {
  const originalAggregate = DesignerProfile.aggregate;
  let pipeline;
  try {
    DesignerProfile.aggregate = async (value) => { pipeline = value; return [{ username: 'maker' }]; };
    let response;
    await designerController.getFeaturedDesigners({ query: { limit: '4' } }, { json: (value) => { response = value; } }, (error) => { throw error; });
    assert.deepEqual(pipeline.find((stage) => stage.$sort)?.$sort, { salesCount: -1, followersCount: -1, publishedDesigns: -1 });
    assert.equal(pipeline.find((stage) => stage.$match)?.$match.publishedDesigns.$gt, 0);
    assert.equal(pipeline.find((stage) => stage.$limit)?.$limit, 4);
    assert.equal(response.data.designers[0].username, 'maker');
  } finally { DesignerProfile.aggregate = originalAggregate; }
});
