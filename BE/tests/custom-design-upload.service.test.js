const test = require('node:test');
const assert = require('node:assert/strict');
const { validateImageFile, sanitizeFilename, MAX_IMAGE_BYTES } = require('../src/services/custom-design-upload.service');

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const jpeg = Buffer.from([255, 216, 255, 224, 0, 16]);
const webp = Buffer.from('RIFF0000WEBP', 'ascii');
const file = (name, mimetype, buffer, size = buffer.length) => ({ originalname: name, mimetype, buffer, size });

test('accepts PNG, JPG, JPEG, and WEBP with matching signatures', () => {
  assert.equal(validateImageFile(file('art.png', 'image/png', png)).mimeType, 'image/png');
  assert.equal(validateImageFile(file('art.jpg', 'image/jpeg', jpeg)).mimeType, 'image/jpeg');
  assert.equal(validateImageFile(file('art.jpeg', 'image/jpeg', jpeg)).mimeType, 'image/jpeg');
  assert.equal(validateImageFile(file('art.webp', 'image/webp', webp)).mimeType, 'image/webp');
});

test('rejects oversized files with the requested message', () => {
  assert.throws(() => validateImageFile(file('large.png', 'image/png', png, MAX_IMAGE_BYTES + 1)), /Image size exceeds the 10MB limit\./);
});

test('rejects unsupported extensions and MIME or content mismatches', () => {
  assert.throws(() => validateImageFile(file('payload.exe', 'application/octet-stream', png)), /Only valid PNG/);
  assert.throws(() => validateImageFile(file('vector.svg', 'image/svg+xml', Buffer.from('<svg/>'))), /Only valid PNG/);
  assert.throws(() => validateImageFile(file('spoof.png', 'image/png', Buffer.from('not an image'))), /Only valid PNG/);
  assert.throws(() => validateImageFile(file('spoof.png', 'image/jpeg', png)), /Only valid PNG/);
});

test('sanitizes uploaded filenames to a safe basename', () => {
  assert.equal(sanitizeFilename('../../my design.png'), 'my_design.png');
});
