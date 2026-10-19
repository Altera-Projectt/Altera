const test = require('node:test');
const assert = require('node:assert/strict');
const cloudinary = require('cloudinary').v2;
const { uploadImage, getImageHash, ensureCloudinaryUrl } = require('../src/utils/cloudinary');

test('Cloudinary deduplication generates identical MD5 hash for matching image contents', () => {
  const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const dataUri = `data:image/png;base64,${base64Pixel}`;
  const buffer = Buffer.from(base64Pixel, 'base64');

  const hashFromUri = getImageHash(dataUri);
  const hashFromRaw = getImageHash(base64Pixel);
  const hashFromBuf = getImageHash(buffer);

  assert.equal(typeof hashFromUri, 'string');
  assert.equal(hashFromUri.length, 32); // MD5 hex length
  assert.equal(hashFromUri, hashFromRaw);
  assert.equal(hashFromUri, hashFromBuf);
});

test('uploadImage passes content hash as public_id with overwrite: true and unique_filename: false', async () => {
  const originalUpload = cloudinary.uploader.upload;
  const calls = [];

  cloudinary.uploader.upload = async (filePath, options) => {
    calls.push({ filePath, options });
    return {
      secure_url: `https://res.cloudinary.com/test/image/upload/${options.folder}/${options.public_id}.png`,
      public_id: `${options.folder}/${options.public_id}`,
    };
  };

  try {
    const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const dataUri = `data:image/png;base64,${base64Pixel}`;
    const expectedHash = getImageHash(dataUri);

    // Upload lần 1
    const res1 = await uploadImage(dataUri, 'altera/designs/uploads');
    // Upload lần 2 với cùng ảnh
    const res2 = await uploadImage(dataUri, 'altera/designs/uploads');

    assert.equal(calls.length, 2);
    // Cả 2 lần đều dùng cùng public_id là MD5 hash
    assert.equal(calls[0].options.public_id, expectedHash);
    assert.equal(calls[1].options.public_id, expectedHash);
    // Cả 2 lần đều bật overwrite: true và unique_filename: false
    assert.equal(calls[0].options.overwrite, true);
    assert.equal(calls[0].options.unique_filename, false);
    assert.equal(calls[1].options.overwrite, true);
    assert.equal(calls[1].options.unique_filename, false);

    // URL và public_id trả về giống hệt nhau
    assert.equal(res1.url, res2.url);
    assert.equal(res1.publicId, res2.publicId);
  } finally {
    cloudinary.uploader.upload = originalUpload;
  }
});

test('ensureCloudinaryUrl uses deduplicated hash when uploading base64 data URIs', async () => {
  const originalUpload = cloudinary.uploader.upload;
  let capturedOptions = null;

  cloudinary.uploader.upload = async (filePath, options) => {
    capturedOptions = options;
    return {
      secure_url: `https://res.cloudinary.com/test/image/upload/${options.public_id}.png`,
      public_id: options.public_id,
    };
  };

  try {
    const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const dataUri = `data:image/png;base64,${base64Pixel}`;
    const expectedHash = getImageHash(dataUri);

    const url = await ensureCloudinaryUrl(dataUri, 'altera/designs');
    assert.equal(capturedOptions.public_id, expectedHash);
    assert.equal(capturedOptions.overwrite, true);
    assert.equal(url, `https://res.cloudinary.com/test/image/upload/${expectedHash}.png`);
  } finally {
    cloudinary.uploader.upload = originalUpload;
  }
});

test('uploadImage passes background_removal option to cloudinary', async () => {
  const originalUpload = cloudinary.uploader.upload;
  let capturedOptions = null;

  cloudinary.uploader.upload = async (filePath, options) => {
    capturedOptions = options;
    return {
      secure_url: 'https://res.cloudinary.com/test/image/upload/sample.png',
      public_id: options.public_id,
      info: { background_removal: { pixelz: { status: 'pending' } } },
    };
  };

  try {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await uploadImage(dataUri, 'altera/designs/generated', { background_removal: 'pixelz' });
    assert.equal(capturedOptions.background_removal, 'pixelz');
    assert.equal(res.info.background_removal.pixelz.status, 'pending');
  } finally {
    cloudinary.uploader.upload = originalUpload;
  }
});
