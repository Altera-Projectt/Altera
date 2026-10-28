const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Design = require('../src/models/Design');
const MarketplaceDesign = require('../src/models/MarketplaceDesign');
const membershipService = require('../src/services/membership.service');
const {
  getEffectiveTier,
  getDaysRemaining,
  checkAndExpireUserMembership,
  enforceAiQuota,
  enforceStudioAccess,
  enforcePublishQuota,
} = require('../src/utils/membership');

describe('Membership Tiers, Weekly Quotas, Expiration & VIP Lifetime Flow', () => {
  it('1. VIP Lifetime emails (anhkhoilongan@gmail.com & uyentam689@gmail.com) are permanently ADMIN + PRO without expiration', async () => {
    const userDoc = {
      _id: new mongoose.Types.ObjectId(),
      email: 'anhkhoilongan@gmail.com',
      role: 'USER',
      membershipTier: 'FREE',
      isLifetimeMembership: false,
      membershipExpiresAt: null,
    };

    const updateOneMock = mock.method(User, 'updateOne', async () => ({ modifiedCount: 1 }));

    await checkAndExpireUserMembership(userDoc);

    assert.equal(userDoc.role, 'ADMIN');
    assert.equal(userDoc.membershipTier, 'PRO');
    assert.equal(userDoc.isLifetimeMembership, true);
    assert.equal(getEffectiveTier(userDoc), 'PRO');
    assert.equal(getDaysRemaining(userDoc), null);

    updateOneMock.mock.restore();
  });

  it('2. Auto-downgrades expired PREMIUM/PRO membership back to FREE', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const expiredUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'regular@example.com',
      role: 'USER',
      membershipTier: 'PREMIUM',
      isLifetimeMembership: false,
      membershipExpiresAt: expiredDate,
    };

    const updateOneMock = mock.method(User, 'updateOne', async () => ({ modifiedCount: 1 }));

    assert.equal(getEffectiveTier(expiredUser), 'FREE');
    await checkAndExpireUserMembership(expiredUser);
    assert.equal(expiredUser.membershipTier, 'FREE');

    updateOneMock.mock.restore();
  });

  it('3. Enforces FREE tier quotas (max 1 AI image/week, blocks 3D Studio & Marketplace publishing)', async () => {
    const freeUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'freeuser@example.com',
      role: 'USER',
      membershipTier: 'FREE',
      isLifetimeMembership: false,
    };

    let aiCount = 0;
    const designCountMock = mock.method(Design, 'countDocuments', async () => aiCount);
    const mpCountMock = mock.method(MarketplaceDesign, 'countDocuments', async () => 0);

    // 0 AI images used -> allowed
    await assert.doesNotReject(() => enforceAiQuota(freeUser));

    // 1 AI image used -> blocked with 403
    aiCount = 1;
    await assert.rejects(
      () => enforceAiQuota(freeUser),
      /Tài khoản Miễn phí chỉ được tạo tối đa 1 ảnh AI mỗi tuần/
    );

    // 3D Studio access -> blocked with 403
    await assert.rejects(
      () => enforceStudioAccess(freeUser),
      /chỉ dành cho hội viên Premium và Pro/
    );

    // Marketplace publishing -> blocked with 403
    await assert.rejects(
      () => enforcePublishQuota(freeUser),
      /chỉ dành cho hội viên Premium và Pro/
    );

    designCountMock.mock.restore();
    mpCountMock.mock.restore();
  });

  it('4. Enforces PREMIUM tier quotas (unlimited AI & 3D Studio, max 3 Marketplace publications/week)', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const premiumUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'premiumuser@example.com',
      role: 'USER',
      membershipTier: 'PREMIUM',
      isLifetimeMembership: false,
      membershipExpiresAt: futureDate,
    };

    assert.equal(getEffectiveTier(premiumUser), 'PREMIUM');
    assert.equal(getDaysRemaining(premiumUser), 30);

    let publishedCount = 2;
    const designCountMock = mock.method(Design, 'countDocuments', async () => 50);
    const mpCountMock = mock.method(MarketplaceDesign, 'countDocuments', async () => publishedCount);

    await assert.doesNotReject(() => enforceAiQuota(premiumUser));
    await assert.doesNotReject(() => enforceStudioAccess(premiumUser));

    // 2 published this week -> allowed
    await assert.doesNotReject(() => enforcePublishQuota(premiumUser));

    // 3 published this week -> blocked with 403
    publishedCount = 3;
    await assert.rejects(
      () => enforcePublishQuota(premiumUser),
      /Gói Premium giới hạn đăng tối đa 3 sản phẩm mỗi tuần/
    );

    designCountMock.mock.restore();
    mpCountMock.mock.restore();
  });

  it('5. Upgrade endpoint activates 30-day membership and returns enriched user', async () => {
    const userId = new mongoose.Types.ObjectId();
    let savedCalled = false;
    const mockUserDoc = {
      _id: userId,
      email: 'upgrader@example.com',
      role: 'USER',
      membershipTier: 'FREE',
      isLifetimeMembership: false,
      membershipStartedAt: null,
      membershipExpiresAt: null,
      async save() {
        savedCalled = true;
        return this;
      },
      toJSON() {
        return {
          _id: this._id,
          email: this.email,
          role: this.role,
          membershipTier: this.membershipTier,
          isLifetimeMembership: this.isLifetimeMembership,
          membershipStartedAt: this.membershipStartedAt,
          membershipExpiresAt: this.membershipExpiresAt,
        };
      },
    };

    const MembershipPlan = require('../src/models/MembershipPlan');
    const findByIdMock = mock.method(User, 'findById', async () => mockUserDoc);
    const planUpdateMock = mock.method(MembershipPlan, 'updateOne', async () => ({}));
    const planFindMock = mock.method(MembershipPlan, 'find', () => ({ sort: () => ({ lean: async () => [] }) }));
    const planFindOneMock = mock.method(MembershipPlan, 'findOne', async () => null);
    const designCountMock = mock.method(Design, 'countDocuments', async () => 0);
    const mpCountMock = mock.method(MarketplaceDesign, 'countDocuments', async () => 0);

    const result = await membershipService.upgrade(userId, { tier: 'PRO' });

    assert.equal(savedCalled, true);
    assert.equal(result.user.membershipTier, 'PRO');
    assert.equal(result.user.effectiveTier, 'PRO');
    assert.equal(result.user.daysRemaining, 30);

    findByIdMock.mock.restore();
    planUpdateMock.mock.restore();
    planFindMock.mock.restore();
    planFindOneMock.mock.restore();
    designCountMock.mock.restore();
    mpCountMock.mock.restore();
  });
});
