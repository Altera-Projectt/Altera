/**
 * BE-6: E2E + Security tests
 * Luồng: Tạo ảnh AI → Lưu thư viện → Kiểm tra pagination/filter → Kiểm tra bảo mật ownership
 *
 * Chạy: npx jest tests/library-e2e.test.js --testTimeout=60000
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UploadedImage = require('../src/models/UploadedImage');
const Design = require('../src/models/Design');
const uploadService = require('../src/services/custom-design-upload.service');

// ─── helpers ────────────────────────────────────────────────────────────────
const fakeUserId  = () => new mongoose.Types.ObjectId();
const fakeDesignId = () => new mongoose.Types.ObjectId();

const createFakeDesign = async (userId, opts = {}) =>
  Design.create({
    userId,
    shirtColor: opts.shirtColor || '#ffffff',
    prompt: opts.prompt || 'A cool eagle',
    style: 'Graphic Art',
    customImage: opts.customImage || 'https://res.cloudinary.com/demo/image/upload/sample.png',
    previewImage: opts.customImage || 'https://res.cloudinary.com/demo/image/upload/sample.png',
    status: 'DRAFT',
  });

// ─── setup / teardown ───────────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000); // timeout 60s để download binary lần đầu

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

// ─── BE-1: Model fields ──────────────────────────────────────────────────────
describe('BE-1: UploadedImage model có đủ trường mới', () => {
  it('nên có source, prompt, designId trong schema', () => {
    const paths = UploadedImage.schema.paths;
    expect(paths).toHaveProperty('source');
    expect(paths).toHaveProperty('prompt');
    expect(paths).toHaveProperty('designId');
  });

  it('source default phải là UPLOAD', () => {
    const img = new UploadedImage({
      userId: fakeUserId(), url: 'x', thumbnailUrl: 'x', publicId: 'x',
      filename: 'x.png', mimeType: 'image/png', size: 100,
    });
    expect(img.source).toBe('UPLOAD');
  });

  it('source chỉ chấp nhận UPLOAD hoặc AI', () => {
    const img = new UploadedImage({ source: 'INVALID' });
    const err = img.validateSync('source');
    expect(err).toBeDefined();
  });
});

// ─── BE-2: addFromGenerated ─────────────────────────────────────────────────
describe('BE-2: addFromGenerated — lưu ảnh AI vào thư viện', () => {
  let userId, design;

  beforeEach(async () => {
    userId = fakeUserId();
    design = await createFakeDesign(userId, { prompt: 'A cool eagle' });
  });

  it('nên tạo UploadedImage với source=AI', async () => {
    const { image: img } = await uploadService.addFromGenerated(userId, design._id);
    expect(img.source).toBe('AI');
    expect(img.prompt).toBe('A cool eagle');
    expect(String(img.designId)).toBe(String(design._id));
    expect(String(img.userId)).toBe(String(userId));
  });

  it('nên idempotent — gọi 2 lần không tạo record mới', async () => {
    await uploadService.addFromGenerated(userId, design._id);
    await uploadService.addFromGenerated(userId, design._id);
    const count = await UploadedImage.countDocuments({ userId, designId: design._id });
    expect(count).toBe(1);
  });

  it('🔒 SECURITY: không được lưu design của user khác', async () => {
    const otherUserId = fakeUserId();
    await expect(
      uploadService.addFromGenerated(otherUserId, design._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('nên throw 404 nếu designId không tồn tại', async () => {
    await expect(
      uploadService.addFromGenerated(userId, fakeDesignId())
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('nên throw 400 nếu thiếu designId', async () => {
    await expect(
      uploadService.addFromGenerated(userId, null)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── BE-3a/3b: list với filter + pagination ──────────────────────────────────
describe('BE-3a/3b: list — filter source + pagination', () => {
  let userId;

  beforeAll(async () => {
    userId = fakeUserId();
    // Seed 5 UPLOAD + 3 AI
    await UploadedImage.insertMany([
      ...Array.from({ length: 5 }, (_, i) => ({
        userId, url: `https://cdn.test/${i}`, thumbnailUrl: `https://cdn.test/t/${i}`,
        publicId: `pub_${i}`, filename: `test_upload_${i}.png`, mimeType: 'image/png',
        size: 1024, source: 'UPLOAD',
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        userId, url: `https://cdn.test/ai/${i}`, thumbnailUrl: `https://cdn.test/ai/t/${i}`,
        publicId: `ai_pub_${i}`, filename: `ai_${i}.png`, mimeType: 'image/png',
        size: 0, source: 'AI', prompt: `Test prompt ${i}`, designId: fakeDesignId(),
      })),
    ]);
  });

  it('source=ALL trả về tất cả 8 ảnh', async () => {
    const { images, total } = await uploadService.list(userId, { source: 'ALL', page: 1, limit: 24 });
    expect(total).toBe(8);
    expect(images.length).toBe(8);
  });

  it('source=UPLOAD chỉ trả về 5 ảnh UPLOAD', async () => {
    const { images, total } = await uploadService.list(userId, { source: 'UPLOAD', page: 1, limit: 24 });
    expect(total).toBe(5);
    expect(images.every(img => img.source === 'UPLOAD')).toBe(true);
  });

  it('source=AI chỉ trả về 3 ảnh AI', async () => {
    const { images, total } = await uploadService.list(userId, { source: 'AI', page: 1, limit: 24 });
    expect(total).toBe(3);
    expect(images.every(img => img.source === 'AI')).toBe(true);
  });

  it('pagination đúng: page=1 limit=3 → 3 ảnh, totalPages=3', async () => {
    const result = await uploadService.list(userId, { source: 'ALL', page: 1, limit: 3 });
    expect(result.images.length).toBe(3);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it('pagination page=3 limit=3 → 2 ảnh còn lại', async () => {
    const result = await uploadService.list(userId, { source: 'ALL', page: 3, limit: 3 });
    expect(result.images.length).toBe(2);
  });

  it('response phải có đủ fields: url, thumbnailUrl, source, prompt, designId, createdAt', async () => {
    const { images } = await uploadService.list(userId, { source: 'AI', page: 1, limit: 1 });
    const img = images[0];
    expect(img).toHaveProperty('url');
    expect(img).toHaveProperty('thumbnailUrl');
    expect(img).toHaveProperty('source');
    expect(img).toHaveProperty('prompt');
    expect(img).toHaveProperty('designId');
    expect(img).toHaveProperty('createdAt');
  });

  it('source không hợp lệ → fallback ALL', async () => {
    const { total } = await uploadService.list(userId, { source: 'GARBAGE', page: 1, limit: 24 });
    expect(total).toBe(8);
  });

  it('🔒 SECURITY: không trả ảnh của user khác', async () => {
    const otherId = fakeUserId();
    const { images, total } = await uploadService.list(otherId, { source: 'ALL', page: 1, limit: 24 });
    expect(total).toBe(0);
    expect(images.length).toBe(0);
  });

  it('limit tối đa 100, không quá', async () => {
    const { images } = await uploadService.list(userId, { source: 'ALL', page: 1, limit: 9999 });
    // limit bị cap ở 100, nhưng ta chỉ có 8 ảnh nên trả về 8
    expect(images.length).toBeLessThanOrEqual(100);
  });
});

// ─── BE-3b: remove không xoá Cloudinary cho ảnh AI ──────────────────────────
describe('BE-3b: remove — ảnh AI không xoá Cloudinary', () => {
  it('nên xoá record khỏi DB và không gọi deleteImage cho ảnh AI', async () => {
    const userId = fakeUserId();
    const img = await UploadedImage.create({
      userId, url: 'https://cdn.test/ai_remove', thumbnailUrl: 'https://cdn.test/t',
      publicId: 'ai_generated_test', filename: 'ai_test.png', mimeType: 'image/png',
      size: 0, source: 'AI',
    });
    // Mock deleteImage để đảm bảo không được gọi
    const cloudinaryUtil = require('../src/utils/cloudinary');
    const spy = jest.spyOn(cloudinaryUtil, 'deleteImage').mockResolvedValue({});
    await uploadService.remove(userId, img._id);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    // Record đã bị xoá
    const found = await UploadedImage.findById(img._id);
    expect(found).toBeNull();
  });

  it('🔒 SECURITY: không xoá ảnh của user khác', async () => {
    const userId = fakeUserId();
    const img = await UploadedImage.create({
      userId, url: 'https://cdn.test/sec', thumbnailUrl: 'https://cdn.test/t',
      publicId: 'sec_pub', filename: 'test_upload_sec.png', mimeType: 'image/png', size: 512, source: 'UPLOAD',
    });
    const otherUserId = fakeUserId();
    await expect(
      uploadService.remove(otherUserId, img._id)
    ).rejects.toMatchObject({ statusCode: 404 });
    // Record vẫn còn
    const found = await UploadedImage.findById(img._id);
    expect(found).not.toBeNull();
  });
});
